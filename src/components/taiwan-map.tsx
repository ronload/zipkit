"use client";

import { useEffect, useRef, useState } from "react";
import type { FeatureCollection } from "geojson";
import type { Topology } from "topojson-specification";
import type { GeoJSONSource } from "maplibre-gl";
import type { City, District } from "@/lib/types";
import { Map, useMap, MapControls } from "@/components/custom/map";
import {
  loadCountiesGeoJSON,
  loadTownsTopology,
  getTownsForCounty,
} from "@/lib/map-data-loader";
import { computeBounds, normalizeCityName } from "@/lib/map-utils";

interface TaiwanMapProps {
  city: City | null;
  district: District | null;
}

const TAIWAN_CENTER: [number, number] = [121.0, 23.5];
const TAIWAN_ZOOM = 7;
const FIT_PADDING = 60;

const COUNTIES_SOURCE = "counties";
const COUNTIES_LINE = "counties-line";
const COUNTY_HIGHLIGHT = "county-highlight";
const TOWNS_SOURCE = "towns";
const TOWNS_LINE = "towns-line";
const TOWN_HIGHLIGHT = "town-highlight";

type Theme = "light" | "dark";

const themeColors = {
  dark: {
    countyLine: "rgba(255, 255, 255, 0.15)",
    countyFill: "rgba(255, 255, 255, 0.08)",
    countyOutline: "rgba(255, 255, 255, 0.4)",
    townLine: "rgba(255, 255, 255, 0.20)",
    townFill: "rgba(255, 255, 255, 0.15)",
    townOutline: "rgba(255, 255, 255, 0.5)",
  },
  light: {
    countyLine: "rgba(0, 0, 0, 0.15)",
    countyFill: "rgba(0, 0, 0, 0.06)",
    countyOutline: "rgba(0, 0, 0, 0.3)",
    townLine: "rgba(0, 0, 0, 0.20)",
    townFill: "rgba(0, 0, 0, 0.10)",
    townOutline: "rgba(0, 0, 0, 0.4)",
  },
};

function hideMapLabels(map: maplibregl.Map) {
  const { layers } = map.getStyle();

  for (const layer of layers) {
    if (layer.type !== "symbol") continue;
    map.setLayoutProperty(layer.id, "visibility", "none");
  }
}

function applyLayerColors(map: maplibregl.Map, theme: Theme) {
  const colors = themeColors[theme];
  if (map.getLayer(COUNTIES_LINE)) {
    map.setPaintProperty(COUNTIES_LINE, "line-color", colors.countyLine);
  }
  if (map.getLayer(COUNTY_HIGHLIGHT)) {
    map.setPaintProperty(COUNTY_HIGHLIGHT, "fill-color", colors.countyFill);
    map.setPaintProperty(
      COUNTY_HIGHLIGHT,
      "fill-outline-color",
      colors.countyOutline,
    );
  }
  if (map.getLayer(TOWNS_LINE)) {
    map.setPaintProperty(TOWNS_LINE, "line-color", colors.townLine);
  }
  if (map.getLayer(TOWN_HIGHLIGHT)) {
    map.setPaintProperty(TOWN_HIGHLIGHT, "fill-color", colors.townFill);
    map.setPaintProperty(
      TOWN_HIGHLIGHT,
      "fill-outline-color",
      colors.townOutline,
    );
  }
}

function ensureCountyLayers(
  map: maplibregl.Map,
  data: FeatureCollection,
  theme: Theme,
) {
  const colors = themeColors[theme];
  if (map.getSource(COUNTIES_SOURCE)) return;
  map.addSource(COUNTIES_SOURCE, { type: "geojson", data });
  map.addLayer({
    id: COUNTIES_LINE,
    type: "line",
    source: COUNTIES_SOURCE,
    paint: { "line-color": colors.countyLine, "line-width": 0.8 },
  });
  map.addLayer({
    id: COUNTY_HIGHLIGHT,
    type: "fill",
    source: COUNTIES_SOURCE,
    paint: {
      "fill-color": colors.countyFill,
      "fill-outline-color": colors.countyOutline,
    },
    filter: ["==", ["get", "COUNTYNAME"], ""],
  });
}

function ensureTownLayers(
  map: maplibregl.Map,
  data: FeatureCollection,
  theme: Theme,
) {
  const colors = themeColors[theme];
  const existingSource = map.getSource(TOWNS_SOURCE);
  if (existingSource) {
    (existingSource as GeoJSONSource).setData(data);
  } else {
    map.addSource(TOWNS_SOURCE, { type: "geojson", data });
    map.addLayer({
      id: TOWNS_LINE,
      type: "line",
      source: TOWNS_SOURCE,
      paint: {
        "line-color": colors.townLine,
        "line-width": 0.5,
      },
    });
    map.addLayer({
      id: TOWN_HIGHLIGHT,
      type: "fill",
      source: TOWNS_SOURCE,
      paint: {
        "fill-color": colors.townFill,
        "fill-outline-color": colors.townOutline,
      },
      filter: ["==", ["get", "TOWNNAME"], ""],
    });
  }
}

function MapLayers({
  city,
  district,
}: {
  city: City | null;
  district: District | null;
}) {
  const { map, isLoaded, resolvedTheme } = useMap();
  const [countiesData, setCountiesData] = useState<FeatureCollection | null>(
    null,
  );
  const [townsData, setTownsData] = useState<FeatureCollection | null>(null);
  const townsTopologyRef = useRef<Topology | null>(null);
  const townsLoadedForRef = useRef<string | null>(null);

  // Set map labels to local language (Chinese for Taiwan)
  useEffect(() => {
    if (!map || !isLoaded) return;

    const applyLanguage = () => {
      hideMapLabels(map);
    };
    applyLanguage();
    map.on("style.load", applyLanguage);

    return () => {
      map.off("style.load", applyLanguage);
    };
  }, [map, isLoaded]);

  // Load counties data (one-time)
  useEffect(() => {
    const cancelRef = { current: false };
    void loadCountiesGeoJSON().then((data) => {
      if (!cancelRef.current) setCountiesData(data);
    });
    return () => {
      cancelRef.current = true;
    };
  }, []);

  // Manage county layers + highlight (re-runs on data load, city change, or style reload)
  useEffect(() => {
    if (!map || !isLoaded || !countiesData) return;

    const applyCountyState = () => {
      ensureCountyLayers(map, countiesData, resolvedTheme);
      applyLayerColors(map, resolvedTheme);

      if (city) {
        const normalizedName = normalizeCityName(city.name);
        map.setFilter(COUNTY_HIGHLIGHT, [
          "==",
          ["get", "COUNTYNAME"],
          normalizedName,
        ]);
        const countyFeatures = countiesData.features.filter(
          (f) => f.properties?.COUNTYNAME === normalizedName,
        );
        if (countyFeatures.length > 0) {
          map.fitBounds(computeBounds(countyFeatures), {
            padding: FIT_PADDING,
            duration: 800,
          });
        }
      } else {
        map.setFilter(COUNTY_HIGHLIGHT, ["==", ["get", "COUNTYNAME"], ""]);
        if (map.getLayer(TOWN_HIGHLIGHT)) {
          map.setFilter(TOWN_HIGHLIGHT, ["==", ["get", "TOWNNAME"], ""]);
        }
        if (map.getLayer(TOWNS_LINE)) {
          map.setLayoutProperty(TOWNS_LINE, "visibility", "none");
        }
        map.flyTo({ center: TAIWAN_CENTER, zoom: TAIWAN_ZOOM, duration: 800 });
      }
    };

    applyCountyState();
    map.on("style.load", applyCountyState);

    return () => {
      map.off("style.load", applyCountyState);
    };
  }, [map, isLoaded, countiesData, city, resolvedTheme]);

  // Load towns when city changes
  useEffect(() => {
    if (!city) {
      setTownsData(null);
      townsLoadedForRef.current = null;
      return;
    }

    const normalizedName = normalizeCityName(city.name);
    if (townsLoadedForRef.current === normalizedName) return;

    const cancelRef = { current: false };
    void (async () => {
      townsTopologyRef.current ??= await loadTownsTopology();
      if (cancelRef.current) return;
      const data = getTownsForCounty(townsTopologyRef.current, normalizedName);
      townsLoadedForRef.current = normalizedName;
      setTownsData(data);
    })();

    return () => {
      cancelRef.current = true;
    };
  }, [city]);

  // Manage town layers + highlight
  useEffect(() => {
    if (!map || !isLoaded || !townsData) return;

    const applyTownState = () => {
      ensureTownLayers(map, townsData, resolvedTheme);
      applyLayerColors(map, resolvedTheme);
      if (map.getLayer(TOWNS_LINE)) {
        map.setLayoutProperty(TOWNS_LINE, "visibility", "visible");
      }
      if (district && city) {
        const normalizedCityName = normalizeCityName(city.name);
        map.setFilter(TOWN_HIGHLIGHT, [
          "all",
          ["==", ["get", "TOWNNAME"], district.name],
          ["==", ["get", "COUNTYNAME"], normalizedCityName],
        ]);
        const districtFeatures = townsData.features.filter(
          (f) => f.properties?.TOWNNAME === district.name,
        );
        if (districtFeatures.length > 0) {
          map.fitBounds(computeBounds(districtFeatures), {
            padding: FIT_PADDING,
            duration: 800,
          });
        }
      } else if (map.getLayer(TOWN_HIGHLIGHT)) {
        map.setFilter(TOWN_HIGHLIGHT, ["==", ["get", "TOWNNAME"], ""]);
      }
    };

    applyTownState();
    map.on("style.load", applyTownState);

    return () => {
      map.off("style.load", applyTownState);
    };
  }, [map, isLoaded, townsData, city, district, resolvedTheme]);

  return null;
}

export function TaiwanMap({ city, district }: TaiwanMapProps) {
  return (
    <div className="h-full w-full">
      <Map
        center={TAIWAN_CENTER}
        zoom={TAIWAN_ZOOM}
        className="h-full w-full"
        attributionControl={false}
      >
        <MapLayers city={city} district={district} />
        <MapControls />
      </Map>
    </div>
  );
}
