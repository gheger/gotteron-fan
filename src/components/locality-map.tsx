"use client";

import { useEffect, useRef } from "react";
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

const mapStyle = "https://demotiles.maplibre.org/style.json";

export function LocalityMap({
  localities,
  selectedLocalityId,
  onSelectLocality,
}: LocalityMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

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

    map.on("load", () => {
      map.addSource("locality-polygons", {
        type: "geojson",
        data: buildLocalityPolygonCollection(localities),
      });

      map.addLayer({
        id: "locality-fill",
        type: "fill",
        source: "locality-polygons",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "id"], selectedLocalityId ?? ""],
            "rgba(185, 28, 28, 0.62)",
            "rgba(23, 37, 84, 0.28)",
          ],
          "fill-outline-color": "rgba(255,255,255,0.0)",
          "fill-opacity": [
            "case",
            ["==", ["get", "id"], selectedLocalityId ?? ""],
            0.72,
            0.46,
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
            ["==", ["get", "id"], selectedLocalityId ?? ""],
            "rgba(255,255,255,0.96)",
            "rgba(15,23,42,0.55)",
          ],
          "line-width": [
            "case",
            ["==", ["get", "id"], selectedLocalityId ?? ""],
            3,
            1.6,
          ],
        },
      });

      map.addSource("locality-centers", {
        type: "geojson",
        data: buildLocalityCenterCollection(localities),
      });

      map.addLayer({
        id: "locality-count-badges",
        type: "circle",
        source: "locality-centers",
        paint: {
          "circle-radius": 18,
          "circle-color": "rgba(255,255,255,0.92)",
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "rgba(15,23,42,0.14)",
        },
      });

      map.addLayer({
        id: "locality-count-labels",
        type: "symbol",
        source: "locality-centers",
        layout: {
          "text-field": ["to-string", ["get", "fanCount"]],
          "text-font": ["Open Sans Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#0f172a",
        },
      });

      map.addLayer({
        id: "locality-labels",
        type: "symbol",
        source: "locality-centers",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans SemiBold"],
          "text-size": 12,
          "text-offset": [0, 2.1],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#0f172a",
          "text-halo-color": "rgba(255,255,255,0.85)",
          "text-halo-width": 1,
        },
      });

      map.on("click", "locality-fill", (event) => {
        const feature = event.features?.[0];
        const localityId = feature?.properties?.id;

        if (typeof localityId === "string") {
          onSelectLocality(localityId);
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
  }, [localities, onSelectLocality, selectedLocalityId]);

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
      "rgba(185, 28, 28, 0.62)",
      "rgba(23, 37, 84, 0.28)",
    ]);
    map.setPaintProperty("locality-fill", "fill-opacity", [
      "case",
      ["==", ["get", "id"], activeLocalityId],
      0.72,
      0.46,
    ]);
    map.setPaintProperty("locality-outline", "line-color", [
      "case",
      ["==", ["get", "id"], activeLocalityId],
      "rgba(255,255,255,0.96)",
      "rgba(15,23,42,0.55)",
    ]);
    map.setPaintProperty("locality-outline", "line-width", [
      "case",
      ["==", ["get", "id"], activeLocalityId],
      3,
      1.6,
    ]);

    const selectedLocality = localities.find(
      (locality) => locality.id === selectedLocalityId,
    );

    if (!selectedLocality) {
      return;
    }

    map.flyTo({
      center: selectedLocality.coordinates,
      zoom: 10.2,
      duration: 900,
      essential: true,
    });
  }, [localities, selectedLocalityId]);

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
        Click a locality polygon to select it, inspect its placeholder supporter
        count, and open the side panel.
      </div>
    </div>
  );
}