import { mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "public", "data", "styles");

const STYLE_URLS = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
} as const;

const neutralOverrides = {
  dark: { background: "#0a0a0a", water: "#171717" },
  light: { background: "#ffffff", water: "#e5e5e5" },
} as const;

interface StyleSpecification {
  version: number;
  name?: string;
  metadata?: Record<string, unknown>;
  sources?: Record<string, unknown>;
  sprite?: string;
  glyphs?: string;
  layers?: Record<string, unknown>[];
}

function parseColor(
  c: string,
): { r: number; g: number; b: number; a: number } | null {
  if (c === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  let m: RegExpExecArray | null;
  if ((m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(c)))
    return {
      r: parseInt(m[1], 16),
      g: parseInt(m[2], 16),
      b: parseInt(m[3], 16),
      a: 1,
    };
  if ((m = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(c)))
    return {
      r: parseInt(m[1] + m[1], 16),
      g: parseInt(m[2] + m[2], 16),
      b: parseInt(m[3] + m[3], 16),
      a: 1,
    };
  if (
    (m =
      /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/.exec(
        c,
      ))
  ) {
    const alpha = m[4] as string | undefined;
    return {
      r: +m[1],
      g: +m[2],
      b: +m[3],
      a: alpha !== undefined ? +alpha : 1,
    };
  }
  return null;
}

function toNeutral(color: string): string {
  const c = parseColor(color);
  if (!c) return color;
  if (c.a === 0) return "transparent";
  const g = Math.round(0.299 * c.r + 0.587 * c.g + 0.114 * c.b);
  if (c.a < 1)
    return `rgba(${String(g)}, ${String(g)}, ${String(g)}, ${String(c.a)})`;
  const h = g.toString(16).padStart(2, "0");
  return `#${h}${h}${h}`;
}

function neutralizeValue(v: unknown): unknown {
  if (typeof v === "string") return toNeutral(v);
  if (Array.isArray(v)) return v.map(neutralizeValue);
  if (v !== null && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>))
      out[k] = neutralizeValue(val);
    return out;
  }
  return v;
}

function neutralizeStyle(
  style: StyleSpecification,
  theme: "dark" | "light",
): StyleSpecification {
  const neutralized = { ...style };

  if (neutralized.layers) {
    neutralized.layers = neutralized.layers.map((layer) => {
      const neutralizedLayer = { ...layer };
      if (layer.paint) {
        const neutralizedPaint: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(
          layer.paint as Record<string, unknown>,
        )) {
          if (key.includes("color")) {
            neutralizedPaint[key] = neutralizeValue(val);
          } else {
            neutralizedPaint[key] = val;
          }
        }
        neutralizedLayer.paint = neutralizedPaint;
      }
      return neutralizedLayer;
    });
  }

  const ov = neutralOverrides[theme];
  if (neutralized.layers) {
    const bgLayer = neutralized.layers.find((l) => l.id === "background");
    if (bgLayer?.paint) {
      (bgLayer.paint as Record<string, unknown>)["background-color"] =
        ov.background;
    }
    const waterLayer = neutralized.layers.find((l) => l.id === "water");
    if (waterLayer?.paint) {
      (waterLayer.paint as Record<string, unknown>)["fill-color"] = ov.water;
    }
  }

  return neutralized;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function processMapStyles(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });

  for (const [theme, url] of Object.entries(STYLE_URLS)) {
    console.log(`Processing ${theme} style from ${url}...`);

    const style = await fetchJSON<StyleSpecification>(url);
    const neutralized = neutralizeStyle(style, theme as "dark" | "light");

    const filename =
      theme === "dark" ? "dark-matter-neutral.json" : "positron-neutral.json";
    const outPath = join(OUT_DIR, filename);

    writeFileSync(outPath, JSON.stringify(neutralized, null, 2));
    console.log(`Written: ${outPath}`);
  }

  console.log(`\nMap styles processed successfully to ${OUT_DIR}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  processMapStyles().catch(console.error);
}
