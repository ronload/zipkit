import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

export interface ZipRange {
  road: string;
  zip6: string;
  even: number;
  lane: number;
  lane1: number;
  alley: number;
  alley1: number;
  numStart: number;
  numStart1: number;
  numEnd: number;
  numEnd1: number;
  floorStart: number;
  floorEnd: number;
}

/**
 * Preprocess a CSV line to fix known formatting issues in rall1.txt.
 * The cmp_lable field (index 9) sometimes has unclosed single quotes
 * like '? instead of '?'. Fix by adding the missing closing quote.
 */
function fixLine(line: string): string {
  // Pattern: after even field (0/1/2), cmp_lable may be '? without closing quote.
  // Fix: ,{0|1|2},'X, -> ,{0|1|2},'X',
  return line.replace(/,([012]),'([^',]),/g, ",$1,'$2',");
}

/**
 * Parse a CSV line that uses single-quoted string fields and unquoted numeric fields.
 */
function parseCSVLine(raw: string): string[] {
  const line = fixLine(raw);
  const fields: string[] = [];
  let i = 0;

  while (i < line.length) {
    if (line[i] === "'") {
      // Quoted field: find the closing quote
      let end = i + 1;
      while (end < line.length && line[end] !== "'") {
        end++;
      }
      fields.push(line.substring(i + 1, end));
      i = end + 1;
      // Skip comma after closing quote
      if (i < line.length && line[i] === ",") i++;
    } else {
      // Unquoted field: read until comma
      let end = i;
      while (end < line.length && line[end] !== ",") {
        end++;
      }
      fields.push(line.substring(i, end));
      i = end + 1;
    }
  }

  return fields;
}

/**
 * Normalize full-width digits to half-width.
 */
function normalizeRoadName(name: string): string {
  return name.replace(/[\uff10-\uff19]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
}

export function parseZipRanges(rawDir: string, outDir: string) {
  const content = readFileSync(join(rawDir, "rall1.txt"), "utf-8");
  const lines = content.split("\n");

  // Skip header line
  const rangesByZip3 = new Map<string, ZipRange[]>();
  let parsed = 0;
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCSVLine(line);
    if (fields.length < 21) {
      skipped++;
      continue;
    }

    const zip3 = fields[1]; // zip3a
    const zip6 = fields[2]; // zipcode (6-digit)
    const road = normalizeRoadName(fields[6]); // road name
    const even = parseInt(fields[8], 10) || 0;
    const lane = parseInt(fields[10], 10) || 0;
    const lane1 = parseInt(fields[11], 10) || 0;
    const alley = parseInt(fields[12], 10) || 0;
    const alley1 = parseInt(fields[13], 10) || 0;
    const numStart = parseInt(fields[14], 10) || 0;
    const numStart1 = parseInt(fields[15], 10) || 0;
    const numEnd = parseInt(fields[16], 10) || 0;
    const numEnd1 = parseInt(fields[17], 10) || 0;
    const floorStart = parseInt(fields[18], 10) || 0;
    const floorEnd = parseInt(fields[19], 10) || 0;

    const range: ZipRange = {
      road,
      zip6,
      even,
      lane,
      lane1,
      alley,
      alley1,
      numStart,
      numStart1,
      numEnd,
      numEnd1,
      floorStart,
      floorEnd,
    };

    let arr = rangesByZip3.get(zip3);
    if (!arr) {
      arr = [];
      rangesByZip3.set(zip3, arr);
    }
    arr.push(range);
    parsed++;
  }

  // Write per-district zip range files
  const zipDir = join(outDir, "zip-ranges");
  mkdirSync(zipDir, { recursive: true });

  let fileCount = 0;
  for (const [zip3, ranges] of rangesByZip3) {
    writeFileSync(
      join(zipDir, `${zip3}.json`),
      JSON.stringify({ ranges })
    );
    fileCount++;
  }

  console.log(
    `zip-ranges/: ${fileCount} files, ${parsed} records parsed, ${skipped} lines skipped`
  );
}
