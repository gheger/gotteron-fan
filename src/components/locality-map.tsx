"use client";

import { useEffect, useRef } from "react";
import maplibregl, { type Map } from "maplibre-gl";
import {
  placeholderLocalities,
  placeholderLocalityCollection,
} from "@/lib/placeholder-localities";

type LocalityMapProps = {
  selectedLocalityId: string;
  onSelectLocality: (localityId: string) => void;
};

const mapStyle = "https://demotiles.maplibre.org/style.json";

export function LocalityMap({
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
      center: [7.153, 46.792],
      zoom: 9,
      attributionControl: false,
    });

    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.addSource("localities", {
        type: "geojson",
        data: placeholderLocalityCollection,
      });

      map.addLayer({
        id: "locality-glow",
        type: "circle",
        source: "localities",
        paint: {
          "circle-radius": ["+", ["interpolate", ["linear"], ["get", "fanCount"], 40, 12, 200, 18], 10],
          "circle-color": "rgba(185, 28, 28, 0.18)",
          "circle-blur": 0.6,
        },
      });

      map.addLayer({
        id: "locality-bubbles",
        type: "circle",
        source: "localities",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "fanCount"], 40, 8, 200, 16],
          "circle-color": [
            "case",
            ["==", ["get", "id"], selectedLocalityId],
            "#b91c1c",
            "#172554",
          ],
          "circle-stroke-width": ["case", ["==", ["get", "id"], selectedLocalityId], 3, 1.5],
          "circle-stroke-color": "rgba(255,255,255,0.94)",
        },
      });

      map.addLayer({
        id: "locality-labels",
        type: "symbol",
        source: "localities",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans SemiBold"],
          "text-size": 12,
          "text-offset": [0, 1.5],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#0f172a",
          "text-halo-color": "rgba(255,255,255,0.85)",
          "text-halo-width": 1,
        },
      });

      map.on("click", "locality-bubbles", (event) => {
        const feature = event.features?.[0];
        const localityId = feature?.properties?.id;

        if (typeof localityId === "string") {
          onSelectLocality(localityId);
        }
      });

      map.on("mouseenter", "locality-bubbles", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "locality-bubbles", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [onSelectLocality, selectedLocalityId]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    map.setPaintProperty("locality-bubbles", "circle-color", [
      "case",
      ["==", ["get", "id"], selectedLocalityId],
      "#b91c1c",
      "#172554",
    ]);
    map.setPaintProperty("locality-bubbles", "circle-stroke-width", [
      "case",
      ["==", ["get", "id"], selectedLocalityId],
      3,
      1.5,
    ]);

    const selectedLocality = placeholderLocalities.find(
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
        Click a locality bubble to inspect aggregated supporter totals and try the
        placeholder fan log form.
      </div>
    </div>
  );
}