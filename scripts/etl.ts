import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parseAddressData } from "./parse-address-data";
import { parseZipRanges } from "./parse-zip-ranges";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = join(__dirname, "..");
const RAW_DIR = join(__dirname, "raw");
const OUT_DIR = join(ROOT, "public", "data");

console.log("=== ETL: Processing address data ===");
parseAddressData(RAW_DIR, OUT_DIR);

console.log("\n=== ETL: Processing zip ranges ===");
parseZipRanges(RAW_DIR, OUT_DIR);

console.log("\n=== ETL: Complete ===");
