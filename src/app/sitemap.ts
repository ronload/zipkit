import type { MetadataRoute } from "next";
import { toSlug } from "@/lib/slug";
import type { City } from "@/lib/types";
import baseData from "../../public/data/base.json";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const cities = baseData.cities as City[];
  const generatedAt =
    (baseData as { generatedAt?: string }).generatedAt ??
    new Date().toISOString();
  const lastModified = new Date(generatedAt);

  const entries: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];

  for (const city of cities) {
    for (const district of city.districts) {
      entries.push({
        url: `${siteUrl}/tw/${toSlug(city.en)}/${toSlug(district.en)}`,
        lastModified,
        changeFrequency: "yearly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
