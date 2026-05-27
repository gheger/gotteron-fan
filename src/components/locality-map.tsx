"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import maplibregl, { type GeoJSONSource, type Map } from "maplibre-gl";
import {
  buildLocalityCenterCollection,
  buildLocalityPolygonCollection,
  fribourgMapCenter,
  type Locality,
} from "@/lib/placeholder-localities";

type LocalityMapProps = {
  localities: Locality[];
  selectedLocalityId: string | null;
  onSelectLocality: (localityId: string) => void;
};

const mapStyle: maplibregl.StyleSpecification = {
  version: 8,
  name: "swisstopo-raster",
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    swisstopo: {
      type: "raster",
      tiles: [
        "https://wmts.geo.admin.ch/1.0.0/ch.swisstopo.pixelkarte-farbe/default/current/3857/{z}/{x}/{y}.jpeg",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.geo.admin.ch/en/general-terms-of-use-fsdi" target="_blank" rel="noopener noreferrer">swisstopo</a>',
      maxzoom: 18,
    },
  },
  layers: [
    {
      id: "swisstopo-base",
      type: "raster",
      source: "swisstopo",
    },
  ],
};

export function LocalityMap({
  localities,
  selectedLocalityId,
  onSelectLocality,
}: LocalityMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const localitiesRef = useRef(localities);
  const selectedLocalityIdRef = useRef(selectedLocalityId);
  const handleSelectLocality = useEffectEvent((localityId: string) => {
    onSelectLocality(localityId);
  });

  useEffect(() => {
    localitiesRef.current = localities;
  }, [localities]);

  useEffect(() => {
    selectedLocalityIdRef.current = selectedLocalityId;
  }, [selectedLocalityId]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyle,
      center: fribourgMapCenter,
      zoom: 8.65,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.setMaxBounds([
        [6.65, 46.45],
        [7.65, 47.1],
      ]);

    map.on("load", () => {
      const initialLocalities = localitiesRef.current;
      const initialSelectedLocalityId = selectedLocalityIdRef.current ?? "";

      map.addSource("locality-polygons", {
        type: "geojson",
        data: buildLocalityPolygonCollection(initialLocalities),
      });

      map.addLayer({
        id: "locality-fill",
        type: "fill",
        source: "locality-polygons",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "id"], initialSelectedLocalityId],
            "rgba(153, 27, 27, 0.82)",
            "rgba(15, 23, 42, 0.48)",
          ],
          "fill-outline-color": "rgba(255,255,255,0.0)",
          "fill-opacity": [
            "case",
            ["==", ["get", "id"], initialSelectedLocalityId],
            0.88,
            0.62,
          ],
        },
      });

      map.addLayer({
        id: "locality-outline",
        type: "line",
        source: "locality-polygons",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "id"], initialSelectedLocalityId],
            "rgba(255,255,255,1)",
            "rgba(255,255,255,0.78)",
          ],
          "line-width": [
            "case",
            ["==", ["get", "id"], initialSelectedLocalityId],
            3.8,
            2.2,
          ],
        },
      });

      map.addSource("locality-centers", {
        type: "geojson",
        data: buildLocalityCenterCollection(initialLocalities),
      });

      map.addLayer({
        id: "locality-count-badges",
        type: "circle",
        source: "locality-centers",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "fanCount"], 40, 10, 200, 18],
          "circle-color": "rgba(15,23,42,0.96)",
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(255,255,255,0.9)",
        },
      });

      map.addLayer({
        id: "locality-count-labels",
        type: "symbol",
        source: "locality-centers",
        layout: {
          "text-field": ["to-string", ["get", "fanCount"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(15,23,42,0.72)",
          "text-halo-width": 0.75,
        },
      });

      map.addLayer({
        id: "locality-labels",
        type: "symbol",
        source: "locality-centers",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 13,
          "text-offset": [0, 1.95],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(15,23,42,0.92)",
          "text-halo-width": 1.6,
        },
      });

      map.on("click", "locality-fill", (event) => {
        const feature = event.features?.[0];
        const localityId = feature?.properties?.id;

        if (typeof localityId === "string") {
          handleSelectLocality(localityId);
        }
      });

      map.on("mouseenter", "locality-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "locality-fill", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const polygonSource = map.getSource("locality-polygons") as GeoJSONSource | undefined;
    const centerSource = map.getSource("locality-centers") as GeoJSONSource | undefined;

    polygonSource?.setData(buildLocalityPolygonCollection(localities));
    centerSource?.setData(buildLocalityCenterCollection(localities));
  }, [localities]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const activeLocalityId = selectedLocalityId ?? "";

    map.setPaintProperty("locality-fill", "fill-color", [
      "case",
      ["==", ["get", "id"], activeLocalityId],
      "rgba(153, 27, 27, 0.82)",
      "rgba(15, 23, 42, 0.48)",
    ]);
    map.setPaintProperty("locality-fill", "fill-opacity", [
      "case",
      ["==", ["get", "id"], activeLocalityId],
      0.88,
      0.62,
    ]);
    map.setPaintProperty("locality-outline", "line-color", [
      "case",
      ["==", ["get", "id"], activeLocalityId],
      "rgba(255,255,255,1)",
      "rgba(255,255,255,0.78)",
    ]);
    map.setPaintProperty("locality-outline", "line-width", [
      "case",
      ["==", ["get", "id"], activeLocalityId],
      3.8,
      2.2,
    ]);
  }, [selectedLocalityId]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const resizeMap = () => map.resize();
    window.addEventListener("resize", resizeMap);

    return () => {
      window.removeEventListener("resize", resizeMap);
    };
  }, []);

  return (
    <div className="relative h-full min-h-[22rem] w-full">
      <div ref={containerRef} className="h-full min-h-[22rem] w-full" />
      <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl border border-white/60 bg-white/78 px-4 py-3 text-sm text-slate-700 shadow-[0_14px_32px_rgba(15,23,42,0.14)] backdrop-blur">
        Official swisstopo locality perimeters are shown from the backend dataset.
        Click a locality area to inspect its supporter count in the side panel.
      </div>
    </div>
  );
}