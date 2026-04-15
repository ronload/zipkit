import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites() {
    return {
      beforeFiles: [
        {
          source: "/map-cdn/basemaps/:path*",
          destination: "https://basemaps.cartocdn.com/:path*",
        },
        {
          source: "/map-cdn/tiles/:path*",
          destination: "https://tiles.basemaps.cartocdn.com/:path*",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
