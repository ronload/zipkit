import type { Feature, Position, Polygon, MultiPolygon } from "geojson";
import type { LngLatBoundsLike } from "maplibre-gl";

/**
 * Compute the centroid of a GeoJSON Polygon or MultiPolygon feature
 * by averaging all coordinates in the outer ring(s).
 */
export function computeCentroid(feature: Feature): [number, number] {
  const geometry = feature.geometry as Polygon | MultiPolygon;
  const coords: Position[] = [];

  if (geometry.type === "Polygon") {
    coords.push(...geometry.coordinates[0]);
  } else {
    for (const polygon of geometry.coordinates) {
      coords.push(...polygon[0]);
    }
  }

  if (coords.length === 0) return [121.0, 23.5];

  let sumLng = 0;
  let sumLat = 0;
  for (const [lng, lat] of coords) {
    sumLng += lng;
    sumLat += lat;
  }
  return [sumLng / coords.length, sumLat / coords.length];
}

/**
 * Compute the bounding box of a set of GeoJSON features.
 */
export function computeBounds(features: Feature[]): LngLatBoundsLike {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const feature of features) {
    const geometry = feature.geometry as Polygon | MultiPolygon;
    const rings: Position[][] = [];

    if (geometry.type === "Polygon") {
      rings.push(geometry.coordinates[0]);
    } else {
      for (const polygon of geometry.coordinates) {
        rings.push(polygon[0]);
      }
    }

    for (const ring of rings) {
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng;
        if (lat < minLat) minLat = lat;
        if (lng > maxLng) maxLng = lng;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/**
 * Normalize "臺" to "台" for matching against taiwan-atlas data.
 */
export function normalizeCityName(name: string): string {
  return name.replace(/臺/g, "台");
}
