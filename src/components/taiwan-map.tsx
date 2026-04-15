"use client";

import { useEffect, useRef, useState } from "react";
import type { FeatureCollection } from "geojson";
import type { Topology } from "topojson-specification";
import type { GeoJSONSource } from "maplibre-gl";
import type { City, District } from "@/lib/types";
import {
  Map,
  useMap,
  MapMarker,
  MarkerContent,
  MapControls,
} from "@/components/ui/map";
import {
  loadCountiesGeoJSON,
  loadTownsTopology,
  getTownsForCounty,
} from "@/lib/map-data-loader";
import {
  computeCentroid,
  computeBounds,
  normalizeCityName,
} from "@/lib/map-utils";

interface TaiwanMapProps {
  city: City | null;
  district: District | null;
  zip6: string | null;
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

function ensureCountyLayers(
  map: maplibregl.Map,
  data: FeatureCollection,
) {
  if (map.getSource(COUNTIES_SOURCE)) return;
  map.addSource(COUNTIES_SOURCE, { type: "geojson", data });
  map.addLayer({
    id: COUNTIES_LINE,
    type: "line",
    source: COUNTIES_SOURCE,
    paint: { "line-color": "rgba(255, 255, 255, 0.15)", "line-width": 0.8 },
  });
  map.addLayer({
    id: COUNTY_HIGHLIGHT,
    type: "fill",
    source: COUNTIES_SOURCE,
    paint: {
      "fill-color": "rgba(255, 255, 255, 0.08)",
      "fill-outline-color": "rgba(255, 255, 255, 0.4)",
    },
    filter: ["==", ["get", "COUNTYNAME"], ""],
  });
}

function ensureTownLayers(
  map: maplibregl.Map,
  data: FeatureCollection,
) {
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
        "line-color": "rgba(255, 255, 255, 0.20)",
        "line-width": 0.5,
      },
    });
    map.addLayer({
      id: TOWN_HIGHLIGHT,
      type: "fill",
      source: TOWNS_SOURCE,
      paint: {
        "fill-color": "rgba(255, 255, 255, 0.15)",
        "fill-outline-color": "rgba(255, 255, 255, 0.5)",
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
  const { map, isLoaded } = useMap();
  const [countiesData, setCountiesData] = useState<FeatureCollection | null>(
    null,
  );
  const [townsData, setTownsData] = useState<FeatureCollection | null>(null);
  const townsTopologyRef = useRef<Topology | null>(null);
  const townsLoadedForRef = useRef<string | null>(null);

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
      ensureCountyLayers(map, countiesData);

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
  }, [map, isLoaded, countiesData, city]);

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
      const data = getTownsForCounty(
        townsTopologyRef.current,
        normalizedName,
      );
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
      ensureTownLayers(map, townsData);
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
  }, [map, isLoaded, townsData, city, district]);

  return null;
}

function PulseMarker({ city, district }: { city: City; district: District }) {
  const [center, setCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    const cancelRef = { current: false };
    void (async () => {
      const topology = await loadTownsTopology();
      if (cancelRef.current) return;
      const normalizedCityName = normalizeCityName(city.name);
      const townsGeoJSON = getTownsForCounty(topology, normalizedCityName);
      const feature = townsGeoJSON.features.find(
        (f) => f.properties?.TOWNNAME === district.name,
      );
      if (feature) {
        setCenter(computeCentroid(feature));
      }
    })();
    return () => {
      cancelRef.current = true;
    };
  }, [city, district]);

  if (!center) return null;

  return (
    <MapMarker longitude={center[0]} latitude={center[1]}>
      <MarkerContent>
        <div className="map-pulse-dot" />
      </MarkerContent>
    </MapMarker>
  );
}

export function TaiwanMap({ city, district, zip6 }: TaiwanMapProps) {
  return (
    <div className="border-border/50 h-full w-full overflow-hidden rounded-xl border">
      <Map
        center={TAIWAN_CENTER}
        zoom={TAIWAN_ZOOM}
        className="h-full w-full"
        attributionControl={false}
      >
        <MapLayers city={city} district={district} />
        {city && district && zip6 && (
          <PulseMarker city={city} district={district} />
        )}
        <MapControls />
      </Map>
    </div>
  );
}
