import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

interface RawArea {
  ZipCode: string;
  AreaName: string;
  AreaEngName: string;
  RoadList?: { RoadName: string; RoadEngName: string }[];
}

interface RawCity {
  CityName: string;
  CityEngName: string;
  AreaList: RawArea[];
}

// Fictional entries to skip
const SKIP_CITIES = new Set(["釣魚臺", "南海島"]);

export function parseAddressData(rawDir: string, outDir: string) {
  const cityData: RawCity[] = JSON.parse(
    readFileSync(join(rawDir, "CityCountyData.json"), "utf-8")
  );
  const allData: RawCity[] = JSON.parse(
    readFileSync(join(rawDir, "AllData.json"), "utf-8")
  );

  // Build a road lookup from AllData indexed by zip3
  const roadsByZip3 = new Map<
    string,
    { name: string; en: string }[]
  >();

  for (const city of allData) {
    if (SKIP_CITIES.has(city.CityName)) continue;
    for (const area of city.AreaList) {
      if (!area.RoadList) continue;
      const roads = area.RoadList.map((r) => ({
        name: normalizeRoadName(r.RoadName),
        en: r.RoadEngName,
      }));
      roadsByZip3.set(area.ZipCode, roads);
    }
  }

  // Generate base.json
  const base = {
    cities: cityData
      .filter((c) => !SKIP_CITIES.has(c.CityName))
      .map((c) => ({
        name: c.CityName,
        en: c.CityEngName,
        districts: c.AreaList.map((a) => ({
          name: a.AreaName,
          en: a.AreaEngName,
          zip3: a.ZipCode,
        })),
      })),
  };

  writeFileSync(join(outDir, "base.json"), JSON.stringify(base));
  console.log(
    `base.json: ${base.cities.length} cities, ${base.cities.reduce((s, c) => s + c.districts.length, 0)} districts`
  );

  // Generate per-district roads files
  const roadsDir = join(outDir, "roads");
  mkdirSync(roadsDir, { recursive: true });

  let roadsFileCount = 0;
  for (const [zip3, roads] of roadsByZip3) {
    writeFileSync(
      join(roadsDir, `${zip3}.json`),
      JSON.stringify({ roads })
    );
    roadsFileCount++;
  }
  console.log(`roads/: ${roadsFileCount} files generated`);
}

/**
 * Normalize full-width digits to half-width for consistent matching.
 */
function normalizeRoadName(name: string): string {
  return name.replace(/[\uff10-\uff19]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
}
