import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import pg from "pg";
import proj4 from "proj4";
import shapefile from "shapefile";

const execFile = promisify(execFileCallback);
const { Client } = pg;

const LOCALITY_ARCHIVE_URL =
  "https://data.geo.admin.ch/ch.swisstopo-vd.ortschaftenverzeichnis_plz/ortschaftenverzeichnis_plz/ortschaftenverzeichnis_plz_2056.shp.zip";
const LOCALITY_SHP_PATH = "AMTOVZ_SHP_LV95/AMTOVZ_LOCALITY.shp";
const IDENTIFY_URL = "https://api3.geo.admin.ch/rest/services/api/MapServer/identify";
const CANTON_LAYER = "ch.swisstopo.swissboundaries3d-kanton-flaeche.fill";
const IMPORT_CONCURRENCY = 12;
const UPSERT_CHUNK_SIZE = 100;

proj4.defs(
  "EPSG:2056",
  "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 " +
    "+x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs",
);

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const tempDir = await mkdtemp(join(tmpdir(), "gotteron-localities-"));

  try {
    const archivePath = join(tempDir, "official-localities.zip");

    console.log("Downloading official locality archive...");
    await downloadFile(LOCALITY_ARCHIVE_URL, archivePath);

    console.log("Extracting shapefile...");
    await execFile("unzip", ["-q", archivePath, "-d", tempDir]);

    console.log("Parsing official locality records...");
    const features = await readShapefile(join(tempDir, LOCALITY_SHP_PATH));
    console.log(`Loaded ${features.length} official locality features.`);

    console.log("Resolving canton codes from official identify API...");
    const importedLocalities = await mapWithConcurrency(features, IMPORT_CONCURRENCY, async (feature, index) => {
      const geometry = normalizeGeometry(transformGeometry(feature.geometry));
      const cantonCode = await identifyCantonCode(geometry);

      if ((index + 1) % 250 === 0 || index === features.length - 1) {
        console.log(`Resolved canton codes for ${index + 1}/${features.length} localities.`);
      }

      if (!cantonCode) {
        return null;
      }

      return {
        officialId: String(feature.properties.LOCALITYID).trim(),
        name: String(feature.properties.NAME).trim(),
        cantonCode,
        geometry,
      };
    });
    const swissLocalities = importedLocalities.filter((locality) => locality !== null);
    console.log(
      `Resolved ${swissLocalities.length} Swiss localities and skipped ${features.length - swissLocalities.length} non-Swiss entries.`,
    );

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
      console.log("Upserting localities into PostGIS...");
      await client.query("BEGIN");

      for (let start = 0; start < swissLocalities.length; start += UPSERT_CHUNK_SIZE) {
        const batch = swissLocalities.slice(start, start + UPSERT_CHUNK_SIZE);
        const values = [];
        const placeholders = batch.map((locality, batchIndex) => {
          const offset = batchIndex * 4;
          values.push(
            locality.officialId,
            locality.name,
            locality.cantonCode,
            JSON.stringify(locality.geometry),
          );

          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($${offset + 4}), 4326)))`;
        });

        await client.query(
          `
            INSERT INTO localities (official_id, name, canton_code, geom)
            VALUES ${placeholders.join(", ")}
            ON CONFLICT (official_id) DO UPDATE
            SET
              name = EXCLUDED.name,
              canton_code = EXCLUDED.canton_code,
              geom = EXCLUDED.geom,
              updated_at = NOW()
          `,
          values,
        );
      }

      await client.query("COMMIT");
      console.log(`Imported ${swissLocalities.length} official localities.`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      await client.end();
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function downloadFile(url, destinationPath) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unable to download locality archive (${response.status}).`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await writeFile(destinationPath, new Uint8Array(arrayBuffer));
}

async function readShapefile(filePath) {
  const source = await shapefile.open(filePath, undefined, {
    encoding: await getShapefileEncoding(filePath),
  });
  const features = [];

  while (true) {
    const result = await source.read();

    if (result.done) {
      return features;
    }

    features.push(result.value);
  }
}

async function getShapefileEncoding(filePath) {
  const cpgPath = filePath.replace(/\.shp$/i, ".cpg");

  try {
    const codePage = (await readFile(cpgPath, "utf8")).trim();

    if (codePage.length > 0) {
      return codePage.toLowerCase();
    }
  } catch {
    // Fall back to UTF-8 because the official swisstopo archive declares UTF-8.
  }

  return "utf-8";
}

function transformGeometry(geometry) {
  if (geometry.type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: geometry.coordinates.map((ring) =>
        ring.map((coordinate) => proj4("EPSG:2056", "EPSG:4326", coordinate)),
      ),
    };
  }

  if (geometry.type === "MultiPolygon") {
    return {
      type: "MultiPolygon",
      coordinates: geometry.coordinates.map((polygon) =>
        polygon.map((ring) =>
          ring.map((coordinate) => proj4("EPSG:2056", "EPSG:4326", coordinate)),
        ),
      ),
    };
  }

  throw new Error(`Unsupported locality geometry type: ${geometry.type}`);
}

function normalizeGeometry(geometry) {
  if (geometry.type === "MultiPolygon") {
    return geometry;
  }

  return {
    type: "MultiPolygon",
    coordinates: [geometry.coordinates],
  };
}

function getGeometryCenter(geometry) {
  let minLongitude = Infinity;
  let minLatitude = Infinity;
  let maxLongitude = -Infinity;
  let maxLatitude = -Infinity;

  for (const polygon of geometry.coordinates) {
    for (const ring of polygon) {
      for (const [longitude, latitude] of ring) {
        minLongitude = Math.min(minLongitude, longitude);
        minLatitude = Math.min(minLatitude, latitude);
        maxLongitude = Math.max(maxLongitude, longitude);
        maxLatitude = Math.max(maxLatitude, latitude);
      }
    }
  }

  return [(minLongitude + maxLongitude) / 2, (minLatitude + maxLatitude) / 2];
}

async function identifyCantonCode(geometry) {
  const candidatePoints = getIdentifyCandidates(geometry);

  for (const [longitude, latitude] of candidatePoints) {
    const params = new URLSearchParams({
      geometry: `${longitude},${latitude}`,
      geometryType: "esriGeometryPoint",
      sr: "4326",
      layers: `all:${CANTON_LAYER}`,
      returnGeometry: "false",
      tolerance: "0",
    });

    const response = await fetchWithRetry(`${IDENTIFY_URL}?${params.toString()}`);
    const payload = await response.json();
    const cantonCode = payload.results?.[0]?.attributes?.ak;

    if (typeof cantonCode === "string" && cantonCode.length === 2) {
      return cantonCode;
    }
  }

  return null;
}

function getIdentifyCandidates(geometry) {
  const firstRing = geometry.coordinates[0]?.[0] ?? [];
  const middleIndex = Math.floor(firstRing.length / 2);
  const candidates = [
    getGeometryCenter(geometry),
    firstRing[0],
    firstRing[middleIndex],
  ].filter(Boolean);

  return Array.from(
    new Map(candidates.map((point) => [`${point[0].toFixed(6)}:${point[1].toFixed(6)}`, point])).values(),
  );
}

async function fetchWithRetry(url, attempts = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
      }

      return response;
    } catch (error) {
      lastError = error;

      if (attempt === attempts) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, attempt * 300));
    }
  }

  throw lastError;
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (true) {
        const currentIndex = nextIndex;
        nextIndex += 1;

        if (currentIndex >= items.length) {
          return;
        }

        results[currentIndex] = await mapper(items[currentIndex], currentIndex);
      }
    }),
  );

  return results;
}

await main();