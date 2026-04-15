import type { Road, ZipRange } from "./types";

const roadsCache = new Map<string, Road[]>();
const zipRangesCache = new Map<string, ZipRange[]>();

export async function loadRoads(zip3: string): Promise<Road[]> {
  const cached = roadsCache.get(zip3);
  if (cached) return cached;

  const res = await fetch(`/data/roads/${zip3}.json`);
  if (!res.ok) throw new Error(`Failed to load roads for ${zip3}`);
  const data = (await res.json()) as { roads: Road[] };
  roadsCache.set(zip3, data.roads);
  return data.roads;
}

export async function loadZipRanges(zip3: string): Promise<ZipRange[]> {
  const cached = zipRangesCache.get(zip3);
  if (cached) return cached;

  const res = await fetch(`/data/zip-ranges/${zip3}.json`);
  if (!res.ok) throw new Error(`Failed to load zip ranges for ${zip3}`);
  const data = (await res.json()) as { ranges: ZipRange[] };
  zipRangesCache.set(zip3, data.ranges);
  return data.ranges;
}
