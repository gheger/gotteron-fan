import { Prisma } from "@prisma/client";
import type { Locality } from "@/lib/placeholder-localities";
import { getPrismaClient } from "@/server/prisma";

type LocalityRow = {
  id: string | bigint;
  officialId: string;
  name: string;
  canton: string;
  longitude: number;
  latitude: number;
  geometryJson: string;
  fanCount: number;
  latestPseudo: string | null;
};

const DEFAULT_BLURB =
  "Supporter totals are aggregated publicly at locality level only.";

export async function listHomeLocalities(cantonCode: string): Promise<Locality[]> {
  const prisma = getPrismaClient();
  const rows = await prisma.$queryRaw<LocalityRow[]>(Prisma.sql`
    SELECT
      l.id::text AS "id",
      l.official_id AS "officialId",
      l.name AS "name",
      l.canton_code AS "canton",
      ST_X(ST_PointOnSurface(l.geom))::float8 AS "longitude",
      ST_Y(ST_PointOnSurface(l.geom))::float8 AS "latitude",
      ST_AsGeoJSON(l.geom) AS "geometryJson",
      COALESCE(lfc.fan_count, 0) AS "fanCount",
      latest.pseudo AS "latestPseudo"
    FROM localities l
    LEFT JOIN locality_fan_counts lfc
      ON lfc.locality_id = l.id
    LEFT JOIN LATERAL (
      SELECT fl.pseudo
      FROM fan_logs fl
      WHERE fl.locality_id = l.id
      ORDER BY fl.created_at DESC
      LIMIT 1
    ) latest ON TRUE
    WHERE l.canton_code = ${cantonCode}
    ORDER BY COALESCE(lfc.fan_count, 0) DESC, l.name ASC
  `);

  return rows.map((row) => ({
    id: String(row.id),
    officialId: row.officialId,
    name: row.name,
    canton: row.canton,
    coordinates: [row.longitude, row.latitude],
    geometry: JSON.parse(row.geometryJson),
    fanCount: Number(row.fanCount),
    blurb: DEFAULT_BLURB,
    latestPseudo: row.latestPseudo ?? "No fan log yet",
  }));
}