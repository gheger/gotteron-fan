import type { FeatureCollection, Point, Polygon } from "geojson";

export type Locality = {
  id: string;
  name: string;
  canton: string;
  coordinates: [number, number];
  polygon: [number, number][];
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

export const placeholderLocalities: Locality[] = [
  {
    id: "fribourg",
    name: "Fribourg",
    canton: "FR",
    coordinates: [7.16197, 46.80648],
    polygon: [
      [7.1105, 46.8395],
      [7.2205, 46.8395],
      [7.2205, 46.7715],
      [7.1105, 46.7715],
      [7.1105, 46.8395],
    ],
    fanCount: 184,
    blurb: "A dense supporter pocket around the city and university quarter.",
    latestPseudo: "Bichette74",
  },
  {
    id: "bulle",
    name: "Bulle",
    canton: "FR",
    coordinates: [7.05722, 46.61996],
    polygon: [
      [7.006, 46.654],
      [7.113, 46.654],
      [7.113, 46.583],
      [7.006, 46.583],
      [7.006, 46.654],
    ],
    fanCount: 121,
    blurb: "Strong Gruyere turnout with regular away-trip chatter.",
    latestPseudo: "LaGruyereRouge",
  },
  {
    id: "morat",
    name: "Morat",
    canton: "FR",
    coordinates: [7.11783, 46.92827],
    polygon: [
      [7.062, 46.963],
      [7.169, 46.963],
      [7.169, 46.889],
      [7.062, 46.889],
      [7.062, 46.963],
    ],
    fanCount: 67,
    blurb: "A smaller cluster, but active and consistently present.",
    latestPseudo: "SeeFan",
  },
  {
    id: "romont",
    name: "Romont",
    canton: "FR",
    coordinates: [6.91181, 46.69709],
    polygon: [
      [6.859, 46.732],
      [6.969, 46.732],
      [6.969, 46.661],
      [6.859, 46.661],
      [6.859, 46.732],
    ],
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
): FeatureCollection<Polygon, LocalityFeatureProperties> {
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
        type: "Polygon",
        coordinates: [locality.polygon],
      },
    })),
  };
}

export const placeholderLocalityCenterCollection = buildLocalityCenterCollection(
  placeholderLocalities,
);

export const placeholderLocalityPolygonCollection = buildLocalityPolygonCollection(
  placeholderLocalities,
);