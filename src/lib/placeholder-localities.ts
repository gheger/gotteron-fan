import type { FeatureCollection, Point } from "geojson";

export type Locality = {
  id: string;
  name: string;
  canton: string;
  coordinates: [number, number];
  fanCount: number;
  blurb: string;
  latestPseudo: string;
};

export const placeholderLocalities: Locality[] = [
  {
    id: "fribourg",
    name: "Fribourg",
    canton: "FR",
    coordinates: [7.16197, 46.80648],
    fanCount: 184,
    blurb: "A dense supporter pocket around the city and university quarter.",
    latestPseudo: "Bichette74",
  },
  {
    id: "bulle",
    name: "Bulle",
    canton: "FR",
    coordinates: [7.05722, 46.61996],
    fanCount: 121,
    blurb: "Strong Gruyere turnout with regular away-trip chatter.",
    latestPseudo: "LaGruyereRouge",
  },
  {
    id: "morat",
    name: "Morat",
    canton: "FR",
    coordinates: [7.11783, 46.92827],
    fanCount: 67,
    blurb: "A smaller cluster, but active and consistently present.",
    latestPseudo: "SeeFan",
  },
  {
    id: "romont",
    name: "Romont",
    canton: "FR",
    coordinates: [6.91181, 46.69709],
    fanCount: 53,
    blurb: "Growing fan base along the rail line into Fribourg.",
    latestPseudo: "DragonDuRail",
  },
];

export const placeholderLocalityCollection: FeatureCollection<
  Point,
  {
    id: string;
    name: string;
    canton: string;
    fanCount: number;
  }
> = {
  type: "FeatureCollection",
  features: placeholderLocalities.map((locality) => ({
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