import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.tokyo-gang.com",
      changeFrequency: "daily",
      priority: 1,
      images: ["https://www.tokyo-gang.com/preview.jpg"],
    },
  ];
}
