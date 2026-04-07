import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/_next/:path*",
        destination: "/_next/:path*",
      },
    ];
  },
};

export default nextConfig;
