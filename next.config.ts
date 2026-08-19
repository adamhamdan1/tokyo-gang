import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "^tokyo-gang\\.com$",
          },
        ],
        destination: "https://www.tokyo-gang.com/",
        permanent: true,
      },
      {
        source: "/:path+",
        has: [
          {
            type: "host",
            value: "^tokyo-gang\\.com$",
          },
        ],
        destination: "https://www.tokyo-gang.com/:path*",
        permanent: true,
      },
    ];
  },
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  outputFileTracingIncludes: {
    "/*": ["./node_modules/pg-cloudflare/dist/**/*", "./node_modules/pg-cloudflare/esm/**/*"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "media.discordapp.net",
      },
    ],
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
