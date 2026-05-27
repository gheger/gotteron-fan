import type {
  FeatureCollection,
  GeoJsonProperties,
  MultiPolygon,
  Point,
  Polygon,
} from "geojson";

export type LocalityGeometry = Polygon | MultiPolygon;

export type Locality = {
  id: string;
  officialId?: string;
  name: string;
  canton: string;
  coordinates: [number, number];
  geometry: LocalityGeometry | null;
  fanCount: number;
  blurb: string;
  latestPseudo: string;
};

type LocalityFeatureProperties = {
  id: string;
  name: string;
  canton: string;
  fanCount: number;
};

export const fribourgMapCenter: [number, number] = [7.152, 46.7908];

export const officialLocalityFeatureIds = {
  fribourg: "916",
  bulle: "803",
  morat: "1927",
  romont: "867",
} as const;

export const placeholderLocalities: Locality[] = [
  {
    id: "fribourg",
    name: "Fribourg",
    canton: "FR",
    coordinates: [7.16197, 46.80648],
    geometry: null,
    fanCount: 184,
    blurb: "A dense supporter pocket around the city and university quarter.",
    latestPseudo: "Bichette74",
  },
  {
    id: "bulle",
    name: "Bulle",
    canton: "FR",
    coordinates: [7.05722, 46.61996],
    geometry: null,
    fanCount: 121,
    blurb: "Strong Gruyere turnout with regular away-trip chatter.",
    latestPseudo: "LaGruyereRouge",
  },
  {
    id: "morat",
    name: "Morat",
    canton: "FR",
    coordinates: [7.11783, 46.92827],
    geometry: null,
    fanCount: 67,
    blurb: "A smaller cluster, but active and consistently present.",
    latestPseudo: "SeeFan",
  },
  {
    id: "romont",
    name: "Romont",
    canton: "FR",
    coordinates: [6.91181, 46.69709],
    geometry: null,
    fanCount: 53,
    blurb: "Growing fan base along the rail line into Fribourg.",
    latestPseudo: "DragonDuRail",
  },
];

export function buildLocalityCenterCollection(
  localities: Locality[],
): FeatureCollection<Point, LocalityFeatureProperties> {
  return {
    type: "FeatureCollection",
    features: localities.map((locality) => ({
      type: "Feature",
      properties: {
        id: locality.id,
        name: locality.name,
        canton: locality.canton,
        fanCount: locality.fanCount,
      },
      geometry: {
        type: "Point",
        coordinates: locality.coordinates,
      },
    })),
  };
}

export function buildLocalityPolygonCollection(
  localities: Locality[],
): FeatureCollection<LocalityGeometry, LocalityFeatureProperties> {
  return {
    type: "FeatureCollection",
    features: localities.flatMap((locality) => {
      if (!locality.geometry) {
        return [];
      }

      return [
        {
          type: "Feature",
          properties: {
            id: locality.id,
            name: locality.name,
            canton: locality.canton,
            fanCount: locality.fanCount,
          },
          geometry: locality.geometry,
        },
      ];
    }),
  };
}

type OfficialLocalityFeatureResponse = {
  feature: {
    geometry: LocalityGeometry;
    bbox?: [number, number, number, number];
    properties?: GeoJsonProperties;
  };
};

export async function fetchOfficialLocalityGeometry(
  featureId: string,
): Promise<OfficialLocalityFeatureResponse> {
  const response = await fetch(
    `https://api3.geo.admin.ch/rest/services/ech/MapServer/ch.swisstopo-vd.ortschaftenverzeichnis_plz/${featureId}?sr=4326&geometryFormat=geojson`,
    {
      cache: "force-cache",
    },
  );

  if (!response.ok) {
    throw new Error(`Unable to load official locality geometry (${featureId}).`);
  }

  return (await response.json()) as OfficialLocalityFeatureResponse;
}

export async function buildOfficialFallbackLocalities(): Promise<Locality[]> {
  const localityIds = [
    officialLocalityFeatureIds.fribourg,
    officialLocalityFeatureIds.bulle,
    officialLocalityFeatureIds.morat,
    officialLocalityFeatureIds.romont,
  ];
  const officialGeometries = await Promise.all(
    localityIds.map((featureId) => fetchOfficialLocalityGeometry(featureId)),
  );

  return placeholderLocalities.map((locality, index) => ({
    ...locality,
    geometry: officialGeometries[index]?.feature.geometry ?? locality.geometry,
    officialId: localityIds[index],
  }));
}

export const placeholderLocalityCenterCollection = buildLocalityCenterCollection(
  placeholderLocalities,
);

export const placeholderLocalityPolygonCollection = buildLocalityPolygonCollection(
  placeholderLocalities,
);