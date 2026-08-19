import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/complaints", "/leave", "/status", "/rules-internal"],
    },
    sitemap: "https://www.tokyo-gang.com/sitemap.xml",
    host: "https://www.tokyo-gang.com",
  };
}
