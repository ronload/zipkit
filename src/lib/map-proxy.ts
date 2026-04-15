import type MapLibreGL from "maplibre-gl";

// ── CORS proxy for Carto CDN ────────────────────────────────────────

const cartoTilesRe = /^https:\/\/tiles(?:-[a-d])?\.basemaps\.cartocdn\.com\//;

export function proxyCartoUrl(url: string): string {
  const origin = window.location.origin;
  if (url.startsWith("https://basemaps.cartocdn.com/")) {
    return url.replace(
      "https://basemaps.cartocdn.com/",
      `${origin}/map-cdn/basemaps/`,
    );
  }
  const m = cartoTilesRe.exec(url);
  if (m) {
    return url.replace(m[0], `${origin}/map-cdn/tiles/`);
  }
  return url;
}

// ── Basemap color neutralization ────────────────────────────────────
// Carto dark-matter / positron basemaps carry blue, green, and pink tints
// that clash with the project's achromatic neutral palette.  The helpers
// below strip saturation from every paint-color property and then pin the
// background + water layers to exact project values.

type Theme = "light" | "dark";

const neutralOverrides = {
  dark: { background: "#0a0a0a", water: "#171717" },
  light: { background: "#ffffff", water: "#e5e5e5" },
};

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
  )
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- m[4] is undefined when the optional capture group doesn't match
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
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

export function neutralizeMapColors(map: MapLibreGL.Map, theme: Theme) {
  const style = map.getStyle();
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- defensive guard; getStyle() may return undefined at runtime before style is loaded
  if (!style?.layers) return;
  for (const layer of style.layers) {
    const paint = (layer as Record<string, unknown>).paint as
      | Record<string, unknown>
      | undefined;
    if (!paint) continue;
    for (const key of Object.keys(paint)) {
      if (!key.includes("color")) continue;
      try {
        const cur = map.getPaintProperty(layer.id, key);
        if (cur == null) continue;
        map.setPaintProperty(layer.id, key, neutralizeValue(cur));
      } catch {
        /* skip unreadable properties */
      }
    }
  }
  const ov = neutralOverrides[theme];
  try {
    if (map.getLayer("background"))
      map.setPaintProperty("background", "background-color", ov.background);
    if (map.getLayer("water"))
      map.setPaintProperty("water", "fill-color", ov.water);
  } catch {
    /* skip */
  }
}
