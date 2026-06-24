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
