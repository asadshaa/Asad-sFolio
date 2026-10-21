import type { MetadataRoute } from "next";
import { profile, projects } from "@/config/portfolio";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!profile.siteUrl) return [];
  const base = profile.siteUrl.replace(/\/$/, "");
  return [
    { url: base, priority: 1 },
    { url: `${base}/portfolio`, priority: 0.9 },
    ...projects.map((p) => ({ url: `${base}/projects/${p.id}`, priority: 0.7 })),
  ];
}
