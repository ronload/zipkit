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

// Layer and source IDs
const COUNTIES_SOURCE = "counties";
const COUNTIES_LINE = "counties-line";
const COUNTY_HIGHLIGHT = "county-highlight";
const TOWNS_SOURCE = "towns";
const TOWNS_LINE = "towns-line";
const TOWN_HIGHLIGHT = "town-highlight";

function MapLayers({
  city,
  district,
}: {
  city: City | null;
  district: District | null;
}) {
  const { map, isLoaded } = useMap();
  const countiesRef = useRef<FeatureCollection | null>(null);
  const townsTopologyRef = useRef<Topology | null>(null);
  const layersInitializedRef = useRef(false);

  // Initialize county layers on map load
  useEffect(() => {
    if (!map || !isLoaded) return;

    let cancelled = false;

    void loadCountiesGeoJSON().then((geojson) => {
      if (cancelled) return;
      countiesRef.current = geojson;

      if (map.getSource(COUNTIES_SOURCE)) return;

      map.addSource(COUNTIES_SOURCE, {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: COUNTIES_LINE,
        type: "line",
        source: COUNTIES_SOURCE,
        paint: {
          "line-color": "rgba(255, 255, 255, 0.15)",
          "line-width": 0.8,
        },
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

      layersInitializedRef.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, [map, isLoaded]);

  // Handle city selection: highlight county + load towns
  useEffect(() => {
    if (!map || !isLoaded || !layersInitializedRef.current) return;

    if (!city) {
      // Reset to full Taiwan view
      map.setFilter(COUNTY_HIGHLIGHT, ["==", ["get", "COUNTYNAME"], ""]);
      if (map.getLayer(TOWN_HIGHLIGHT)) {
        map.setFilter(TOWN_HIGHLIGHT, ["==", ["get", "TOWNNAME"], ""]);
      }
      if (map.getLayer(TOWNS_LINE)) {
        map.setLayoutProperty(TOWNS_LINE, "visibility", "none");
      }
      map.flyTo({ center: TAIWAN_CENTER, zoom: TAIWAN_ZOOM, duration: 800 });
      return;
    }

    const normalizedName = normalizeCityName(city.name);

    // Highlight county
    map.setFilter(COUNTY_HIGHLIGHT, [
      "==",
      ["get", "COUNTYNAME"],
      normalizedName,
    ]);

    // Fit bounds to selected county
    if (countiesRef.current) {
      const countyFeatures = countiesRef.current.features.filter(
        (f) => f.properties?.COUNTYNAME === normalizedName,
      );
      if (countyFeatures.length > 0) {
        map.fitBounds(computeBounds(countyFeatures), {
          padding: FIT_PADDING,
          duration: 800,
        });
      }
    }

    // Load towns for this county
    const cancelRef = { current: false };

    void (async () => {
      townsTopologyRef.current ??= await loadTownsTopology();

      if (cancelRef.current) return;

      const townsGeoJSON = getTownsForCounty(
        townsTopologyRef.current,
        normalizedName,
      );

      const existingSource = map.getSource(TOWNS_SOURCE);
      if (existingSource) {
        (existingSource as GeoJSONSource).setData(townsGeoJSON);
      } else {
        map.addSource(TOWNS_SOURCE, {
          type: "geojson",
          data: townsGeoJSON,
        });

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

      if (map.getLayer(TOWNS_LINE)) {
        map.setLayoutProperty(TOWNS_LINE, "visibility", "visible");
      }
    })();

    return () => {
      cancelRef.current = true;
    };
  }, [map, isLoaded, city]);

  // Handle district selection: highlight town + fit bounds
  useEffect(() => {
    if (!map || !isLoaded || !city) return;

    if (!district) {
      if (map.getLayer(TOWN_HIGHLIGHT)) {
        map.setFilter(TOWN_HIGHLIGHT, ["==", ["get", "TOWNNAME"], ""]);
      }
      return;
    }

    const normalizedCityName = normalizeCityName(city.name);

    if (map.getLayer(TOWN_HIGHLIGHT)) {
      map.setFilter(TOWN_HIGHLIGHT, [
        "all",
        ["==", ["get", "TOWNNAME"], district.name],
        ["==", ["get", "COUNTYNAME"], normalizedCityName],
      ]);
    }

    // Fit bounds to district
    if (townsTopologyRef.current) {
      const townsGeoJSON = getTownsForCounty(
        townsTopologyRef.current,
        normalizedCityName,
      );
      const districtFeatures = townsGeoJSON.features.filter(
        (f) => f.properties?.TOWNNAME === district.name,
      );
      if (districtFeatures.length > 0) {
        map.fitBounds(computeBounds(districtFeatures), {
          padding: FIT_PADDING,
          duration: 800,
        });
      }
    }
  }, [map, isLoaded, city, district]);

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
