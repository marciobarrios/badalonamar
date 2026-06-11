import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn-bdncom.watchity.net"
      },
      {
        protocol: "https",
        hostname: "ajuntament-badalona.cat"
      }
    ]
  }
};

export default nextConfig;
