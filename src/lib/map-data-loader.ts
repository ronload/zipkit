import * as topojson from "topojson-client";
import type { Topology } from "topojson-specification";
import type { FeatureCollection } from "geojson";

let countiesCache: FeatureCollection | null = null;
let townsTopologyCache: Topology | null = null;

export async function loadCountiesGeoJSON(): Promise<FeatureCollection> {
  if (countiesCache) return countiesCache;

  const res = await fetch("/data/map/counties-10t.json");
  const topology = (await res.json()) as Topology;
  countiesCache = topojson.feature(
    topology,
    topology.objects.counties,
  ) as FeatureCollection;
  return countiesCache;
}

export async function loadTownsTopology(): Promise<Topology> {
  if (townsTopologyCache) return townsTopologyCache;

  const res = await fetch("/data/map/towns-10t.json");
  townsTopologyCache = (await res.json()) as Topology;
  return townsTopologyCache;
}

export function getTownsForCounty(
  topology: Topology,
  countyName: string,
): FeatureCollection {
  const allTowns = topojson.feature(
    topology,
    topology.objects.towns,
  ) as FeatureCollection;
  return {
    type: "FeatureCollection",
    features: allTowns.features.filter(
      (f) => f.properties?.COUNTYNAME === countyName,
    ),
  };
}
