import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/map-styles/:path*",
        destination: "https://basemaps.cartocdn.com/gl/:path*",
      },
    ];
  },
};

export default nextConfig;
