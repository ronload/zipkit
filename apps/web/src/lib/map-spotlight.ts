import * as topojson from "topojson-client";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  MultiPolygon,
  Polygon,
  Position,
} from "geojson";
import type { Topology } from "topojson-specification";
import { computeBounds, normalizeCityName, type Bounds } from "@/lib/map-utils";

type Area = Polygon | MultiPolygon;

interface CountyProperties {
  COUNTYCODE: string;
  COUNTYNAME: string;
}

interface TownProperties extends CountyProperties {
  TOWNCODE: string;
  TOWNNAME: string;
}

export interface SpotlightProperties {
  kind: "outside" | "county" | "town";
  /** Id of the county the feature belongs to; 0 for the outside mask. */
  county: number;
}

export type SpotlightData = FeatureCollection<Area, SpotlightProperties>;

export interface Region {
  /** Feature id in the spotlight source: the numeric county or town code. */
  id: number;
  kind: "county" | "town";
  countyId: number;
  /** Name as spelled in the map data, normalized to 台. */
  name: string;
  bounds: Bounds;
}

export interface Regions {
  data: SpotlightData;
  counties: Region[];
  towns: Region[];
  hasTowns: boolean;
  countyByName: ReadonlyMap<string, Region>;
  townByKey: ReadonlyMap<string, Region>;
}

export type Pace = "tour" | "select";

/** Feature id of the mask that covers everything beyond the coast. */
export const OUTSIDE_ID = 1;

/** The main island and Penghu: the resting view when nothing is focused. */
export const TAIWAN_BOUNDS: Bounds = [
  [119.3, 21.85],
  [122.05, 25.35],
];

const WORLD_RING: Position[] = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];

/** A hop shorter than this reads as a nudge rather than a move. */
const MIN_TOUR_HOP_DEG = 0.8;

/**
 * Islets smaller than this share of a region's largest polygon are left out
 * of its bounds; Kinmen would otherwise be framed all the way out to Wuqiu.
 */
const MIN_ISLET_SHARE = 0.01;

function featuresOf<P extends GeoJsonProperties = GeoJsonProperties>(
  topology: Topology,
  object: Topology["objects"][string],
): Feature<Area, P>[] {
  const collection = topojson.feature(topology, object) as FeatureCollection<
    Area,
    P
  >;
  return collection.features;
}

/**
 * The world with every island of Taiwan cut out of it. Ring winding is left
 * as it comes: maplibre's GeoJSON tiler rewinds rings itself.
 */
function outsideOf(nation: Feature<Area>[]): Polygon {
  const holes: Position[][] = [];
  for (const { geometry } of nation) {
    const polygons =
      geometry.type === "Polygon"
        ? [geometry.coordinates]
        : geometry.coordinates;
    for (const [outer] of polygons) holes.push(outer);
  }
  return { type: "Polygon", coordinates: [WORLD_RING, ...holes] };
}

function ringArea(ring: Position[]): number {
  let sum = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    sum += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return Math.abs(sum / 2);
}

/** The geometry without its outlying islets; only used for framing. */
function withoutIslets(geometry: Area): Area {
  if (geometry.type === "Polygon") return geometry;
  const areas = geometry.coordinates.map(([outer]) => ringArea(outer));
  const min = Math.max(...areas) * MIN_ISLET_SHARE;
  return {
    type: "MultiPolygon",
    coordinates: geometry.coordinates.filter((_, i) => areas[i] >= min),
  };
}

function framingBounds(feature: Feature<Area>): Bounds {
  return computeBounds([
    { ...feature, geometry: withoutIslets(feature.geometry) },
  ]);
}

export function townKey(countyId: number, townName: string): string {
  return `${String(countyId)}/${normalizeCityName(townName)}`;
}

/**
 * Builds the spotlight source and its lookup tables. Accepts either topology;
 * towns are included when the topology has them.
 */
export function buildRegions(topology: Topology): Regions {
  const { objects } = topology;
  const features: Feature<Area, SpotlightProperties>[] = [
    {
      type: "Feature",
      id: OUTSIDE_ID,
      properties: { kind: "outside", county: 0 },
      geometry: outsideOf(featuresOf(topology, objects.nation)),
    },
  ];

  const add = (region: Region, geometry: Area) => {
    features.push({
      type: "Feature",
      id: region.id,
      properties: { kind: region.kind, county: region.countyId },
      geometry,
    });
  };

  const counties: Region[] = [];
  for (const feature of featuresOf<CountyProperties>(
    topology,
    objects.counties,
  )) {
    const id = Number(feature.properties.COUNTYCODE);
    const region: Region = {
      id,
      kind: "county",
      countyId: id,
      name: normalizeCityName(feature.properties.COUNTYNAME),
      bounds: framingBounds(feature),
    };
    counties.push(region);
    add(region, feature.geometry);
  }

  const hasTowns = "towns" in objects;
  const towns: Region[] = [];
  if (hasTowns) {
    for (const feature of featuresOf<TownProperties>(topology, objects.towns)) {
      const region: Region = {
        id: Number(feature.properties.TOWNCODE),
        kind: "town",
        countyId: Number(feature.properties.COUNTYCODE),
        name: normalizeCityName(feature.properties.TOWNNAME),
        bounds: framingBounds(feature),
      };
      towns.push(region);
      add(region, feature.geometry);
    }
  }

  return {
    data: { type: "FeatureCollection", features },
    counties,
    towns,
    hasTowns,
    countyByName: new Map(counties.map((county) => [county.name, county])),
    townByKey: new Map(
      towns.map((town) => [townKey(town.countyId, town.name), town]),
    ),
  };
}

export function center([[west, south], [east, north]]: Bounds): [
  number,
  number,
] {
  return [(west + east) / 2, (south + north) / 2];
}

/** Straight-line distance in degrees; only used to scale animations. */
export function distance(
  a: readonly [number, number],
  b: readonly [number, number],
): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Camera flight time in ms for a move of `deg` degrees. */
export function flightDuration(deg: number, pace: Pace): number {
  return pace === "tour"
    ? clamp(1100 + 450 * deg, 1400, 2600)
    : clamp(700 + 350 * deg, 900, 1800);
}

function shuffle<T>(items: T[], random: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/**
 * Draws the next county for the idle tour. `bag` holds the ids still to visit
 * this round and is refilled, shuffled, once it runs dry, so every county
 * comes up once per round. From the bag it takes the first county that is a
 * real hop away from the current one, or else the farthest.
 */
export function nextTourStop(
  counties: readonly Region[],
  bag: number[],
  currentId: number | null,
  random: () => number = Math.random,
): Region | null {
  const byId = new Map(counties.map((county) => [county.id, county]));
  if (bag.length === 0) {
    const ids = counties
      .filter((county) => county.id !== currentId)
      .map((county) => county.id);
    bag.push(...shuffle(ids, random));
  }
  if (bag.length === 0) return null;

  let pick = 0;
  const current = currentId === null ? undefined : byId.get(currentId);
  if (current) {
    const from = center(current.bounds);
    const hops = bag.map((id) => {
      const region = byId.get(id);
      return region ? distance(from, center(region.bounds)) : -1;
    });
    pick = hops.findIndex((hop) => hop >= MIN_TOUR_HOP_DEG);
    if (pick === -1) pick = hops.indexOf(Math.max(...hops));
  }

  const [id] = bag.splice(pick, 1);
  return byId.get(id) ?? null;
}
