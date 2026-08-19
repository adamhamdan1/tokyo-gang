import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "TOKYO GANG Command Portal",
    short_name: "TOKYO",
    description: "البوابة الرسمية لعصابة TOKYO GANG — القيادة، الأعضاء، العمليات، والتقديم.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#020202",
    theme_color: "#050505",
    lang: "ar",
    dir: "rtl",
    categories: ["social", "entertainment"],
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "التقديم", short_name: "التقديم", url: "/#apply" },
      { name: "قوانين TOKYO", short_name: "القوانين", url: "/#rules" },
      { name: "حالة الطلب", short_name: "حالتي", url: "/status" },
    ],
  };
}
