import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites() {
    return [
      {
        source: "/map-cdn/basemaps/:path*",
        destination: "https://basemaps.cartocdn.com/:path*",
      },
      {
        source: "/map-cdn/tiles/:path*",
        destination: "https://tiles.basemaps.cartocdn.com/:path*",
      },
    ];
  },
};

export default nextConfig;
