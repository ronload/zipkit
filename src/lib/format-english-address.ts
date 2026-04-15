import type { City, District, Road, AddressDetail } from "./types";

/**
 * Parse the "number" field which may contain "之" notation.
 * e.g. "5之1" -> { number: 5, sub: 1 }, "33" -> { number: 33, sub: 0 }
 */
export function parseNumber(input: string): { number: number; sub: number } {
  const trimmed = input.trim();
  const match = /^(\d+)(?:之(\d+))?$/.exec(trimmed);
  if (!match) return { number: 0, sub: 0 };
  return {
    number: parseInt(match[1], 10),
    sub: match[2] ? parseInt(match[2], 10) : 0,
  };
}

/**
 * Format a Taiwan address into standard English format (UPU).
 * Order: [Room], [Floor], No. [Number], [Alley], [Lane], [Road], [District], [City] [Zip], Taiwan (R.O.C.)
 */
export function formatEnglishAddress(
  city: City,
  district: District,
  road: Road,
  detail: AddressDetail,
): string {
  const parts: string[] = [];

  const room = detail.room.trim();
  const floor = detail.floor.trim();
  const number = detail.number.trim();
  const alley = detail.alley.trim();
  const lane = detail.lane.trim();

  if (room) parts.push(`Rm. ${room}`);
  if (floor) parts.push(`${floor}F.`);
  if (number) parts.push(`No. ${number.replace(/之/g, "-")}`);
  if (alley) parts.push(`Aly. ${alley}`);
  if (lane) parts.push(`Ln. ${lane}`);

  parts.push(road.en);
  parts.push(district.en);
  parts.push(`${city.en} ${district.zip3}`);
  parts.push("Taiwan (R.O.C.)");

  return parts.join(", ");
}
