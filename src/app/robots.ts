import type { MetadataRoute } from "next";
import { profile } from "@/config/portfolio";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dev/", "/api/"] },
    ...(profile.siteUrl ? { sitemap: `${profile.siteUrl.replace(/\/$/, "")}/sitemap.xml` } : {}),
  };
}
