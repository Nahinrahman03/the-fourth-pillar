import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db";
import { NEWS_SCOPE_OPTIONS } from "@/lib/news-scope";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000";

  const latestNews = await prisma.newsItem.findMany({
    select: {
      updatedAt: true
    },
    orderBy: {
      updatedAt: "desc"
    },
    take: 24
  }).catch(() => []);

  const latestChange = latestNews[0]?.updatedAt ?? new Date();

  return [
    {
      url: `${appUrl}/`,
      lastModified: latestChange,
      changeFrequency: "hourly",
      priority: 1
    },
    ...NEWS_SCOPE_OPTIONS.map((option) => ({
      url: `${appUrl}${option.href}`,
      lastModified: latestChange,
      changeFrequency: "hourly" as const,
      priority: 0.9
    }))
  ];
}
