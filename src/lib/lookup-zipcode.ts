import type { ZipRange } from "./types";

/**
 * Look up the 3+3 (6-digit) postal code for an address.
 * Returns the zip6 code or null if no match is found.
 */
export function lookupZip6(
  ranges: ZipRange[],
  roadName: string,
  lane: number,
  alley: number,
  number: number,
  numberSub: number,
  floor: number
): string | null {
  // Filter ranges for this road
  const roadRanges = ranges.filter((r) => r.road === roadName);
  if (roadRanges.length === 0) return null;

  // Sort by specificity: more constraints = more specific = higher priority
  const sorted = [...roadRanges].sort((a, b) => {
    const specA = specificity(a);
    const specB = specificity(b);
    return specB - specA;
  });

  for (const range of sorted) {
    if (matchesRange(range, lane, alley, number, numberSub, floor)) {
      return range.zip6;
    }
  }

  return null;
}

function specificity(range: ZipRange): number {
  let score = 0;
  if (range.lane > 0) score += 100;
  if (range.alley > 0) score += 50;
  if (range.numStart > 0 && range.numEnd > 0 && range.numEnd < 9999) score += 20;
  if (range.even > 0) score += 10;
  if (range.floorStart > 0 || range.floorEnd > 0) score += 5;
  return score;
}

function matchesRange(
  range: ZipRange,
  lane: number,
  alley: number,
  number: number,
  numberSub: number,
  floor: number
): boolean {
  // Lane constraint
  if (range.lane > 0) {
    if (range.lane1 > 0) {
      if (lane < range.lane || lane > range.lane1) return false;
    } else {
      if (lane !== range.lane) return false;
    }
  } else if (lane > 0) {
    // Range is for main road (no lane), but user specified a lane
    return false;
  }

  // Alley constraint
  if (range.alley > 0) {
    if (range.alley1 > 0) {
      if (alley < range.alley || alley > range.alley1) return false;
    } else {
      if (alley !== range.alley) return false;
    }
  } else if (alley > 0) {
    return false;
  }

  // Even/odd constraint
  if (number > 0) {
    if (range.even === 1 && number % 2 === 0) return false;
    if (range.even === 2 && number % 2 === 1) return false;
  }

  // Number range
  if (range.numStart > 0 || range.numEnd > 0) {
    if (number <= 0) return false;
    const numValue = number + numberSub / 10000;
    const startValue = range.numStart + range.numStart1 / 10000;
    const endValue =
      range.numEnd > 0 ? range.numEnd + range.numEnd1 / 10000 : Infinity;

    if (startValue > 0 && numValue < startValue) return false;
    if (range.numEnd > 0 && range.numEnd < 9999 && numValue > endValue)
      return false;
  }

  // Floor constraint
  if (range.floorStart > 0 || range.floorEnd > 0) {
    if (floor > 0) {
      if (range.floorStart > 0 && floor < range.floorStart) return false;
      if (range.floorEnd > 0 && floor > range.floorEnd) return false;
    }
  }

  return true;
}
