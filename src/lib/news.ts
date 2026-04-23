import type { Metadata } from "next";
import { NewsScope, SubmissionStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getScopeMeta } from "@/lib/news-scope";
import { summaryPointsFromUnknown } from "@/lib/utils";

export type NewsSort = "latest" | "yesterday" | "trending";

export async function getLatestNews(scope?: NewsScope) {
  try {
    return await prisma.newsItem.findMany({
      where: scope ? { scope } : undefined,
      orderBy: { publishedAt: "desc" },
      take: 24
    });
  } catch {
    return [];
  }
}

export async function getYesterdayNews(scope?: NewsScope) {
  try {
    const now = new Date();
    // yesterday midnight → today midnight (local-ish; UTC is fine for server)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    return await prisma.newsItem.findMany({
      where: {
        ...(scope ? { scope } : {}),
        publishedAt: { gte: yesterdayStart, lt: todayStart }
      },
      orderBy: { publishedAt: "desc" },
      take: 24
    });
  } catch {
    return [];
  }
}

/**
 * "Trending" = most-flagged items in the last 48 hours.
 * Falls back to latest if no flags exist.
 */
export async function getTrendingNews(scope?: NewsScope) {
  try {
    const since = new Date(Date.now() - 48 * 60 * 60_000);

    // Count flags per newsItem in the last 48 h
    const flagCounts = await prisma.newsFlag.groupBy({
      by: ["newsItemId"],
      where: { createdAt: { gte: since } },
      _count: { newsItemId: true },
      orderBy: { _count: { newsItemId: "desc" } },
      take: 24
    });

    if (flagCounts.length === 0) {
      // No flags → fall back to latest
      return getLatestNews(scope);
    }

    const ids = flagCounts.map((f) => f.newsItemId);
    const items = await prisma.newsItem.findMany({
      where: {
        id: { in: ids },
        ...(scope ? { scope } : {})
      }
    });

    // Sort by flag count (descending)
    const countMap = new Map(flagCounts.map((f) => [f.newsItemId, f._count.newsItemId]));
    return items.sort((a, b) => (countMap.get(b.id) ?? 0) - (countMap.get(a.id) ?? 0));
  } catch {
    return [];
  }
}

export async function getNewsBySort(sort: NewsSort, scope?: NewsScope) {
  if (sort === "yesterday") return getYesterdayNews(scope);
  if (sort === "trending") return getTrendingNews(scope);
  return getLatestNews(scope);
}

export async function getUserDashboardData(userId: string) {
  const [submissions, unreadNotifications, totalNotifications] = await Promise.all([
    prisma.submission.findMany({
      where: {
        contributorId: userId
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 5
    }),
    prisma.notification.count({
      where: {
        userId,
        readAt: null
      }
    }),
    prisma.notification.count({
      where: {
        userId
      }
    })
  ]);

  return {
    recentSubmissions: submissions,
    unreadNotifications,
    totalNotifications
  };
}

export async function getReviewQueue() {
  return prisma.submission.findMany({
    where: {
      status: SubmissionStatus.PENDING
    },
    include: {
      contributor: {
        include: {
          profile: true
        }
      }
    },
    orderBy: [
      { priority: "desc" },
      { createdAt: "asc" }
    ]
  });
}

export async function getReviewMetrics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [reviewedToday, totalSubmissions] = await Promise.all([
    prisma.submission.count({
      where: {
        status: { in: [SubmissionStatus.APPROVED, SubmissionStatus.REJECTED] },
        updatedAt: { gte: today }
      }
    }),
    prisma.submission.count()
  ]);

  // Mock average wait time for now but based on real count
  const waitTime = totalSubmissions > 50 ? "42M" : totalSubmissions > 10 ? "14M" : "4M";

  return {
    reviewedToday,
    waitTime
  };
}

export async function getPendingFlagQueue() {
  return prisma.newsFlag.findMany({
    where: {
      status: "PENDING"
    },
    include: {
      newsItem: true,
      reporter: {
        select: {
          email: true,
          phoneNumber: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  });
}

export async function createUniqueSlug(baseHeadline: string) {
  const baseSlug = baseHeadline
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70);

  let slug = baseSlug || "news-update";
  let counter = 1;

  while (await prisma.newsItem.findUnique({ where: { slug } })) {
    counter += 1;
    slug = `${baseSlug || "news-update"}-${counter}`;
  }

  return slug;
}

export function calculateContributionPoints(input: {
  summaryPoints: unknown;
  sourceUrl?: string | null;
}) {
  const points = summaryPointsFromUnknown(input.summaryPoints);

  if (input.sourceUrl && points.length >= 4) {
    return 3;
  }

  if (input.sourceUrl || points.length >= 4) {
    return 2;
  }

  return 1;
}

export function buildArchiveMetadata(input: {
  scope?: NewsScope;
  query?: string;
}): Metadata {
  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000";
  const base = {
    metadataBase: new URL(appUrl),
    applicationName: "The Fourth Pillar",
    authors: [{ name: "The Fourth Pillar" }],
    creator: "The Fourth Pillar",
    publisher: "The Fourth Pillar",
    robots: {
      index: true,
      follow: true
    }
  };

  if (input.query) {
    return {
      ...base,
      title: `Quick News Today Search: ${input.query} | The Fourth Pillar`,
      description: `Search quick news today, news in 5 points, and short verified updates for ${input.query}.`,
      keywords: ["quick news today", "news in 5 points", "short news India", input.query],
      alternates: {
        canonical: `${appUrl}/?q=${encodeURIComponent(input.query)}`
      },
      openGraph: {
        title: `Quick News Today Search: ${input.query} | The Fourth Pillar`,
        description: `Search quick news today, news in 5 points, and short verified updates for ${input.query}.`,
        url: `${appUrl}/?q=${encodeURIComponent(input.query)}`,
        siteName: "The Fourth Pillar",
        type: "website"
      },
      twitter: {
        card: "summary_large_image",
        title: `Quick News Today Search: ${input.query} | The Fourth Pillar`,
        description: `Search quick news today, news in 5 points, and short verified updates for ${input.query}.`
      }
    };
  }

  if (input.scope) {
    const meta = getScopeMeta(input.scope);

    return {
      ...base,
      title: `${meta.title} | The Fourth Pillar`,
      description: meta.description,
      keywords: meta.keywords,
      alternates: {
        canonical: `${appUrl}${meta.href}`
      },
      openGraph: {
        title: `${meta.title} | The Fourth Pillar`,
        description: meta.description,
        url: `${appUrl}${meta.href}`,
        siteName: "The Fourth Pillar",
        type: "website"
      },
      twitter: {
        card: "summary_large_image",
        title: `${meta.title} | The Fourth Pillar`,
        description: meta.description
      }
    };
  }

  return {
    ...base,
    title: "Quick News Today | The Fourth Pillar",
    description:
      "News in 5 points with fast verified headlines across Local, Indian, and World coverage. Read quick news today in a short format.",
    keywords: ["news in 5 points", "quick news today", "short news India"],
    alternates: {
      canonical: `${appUrl}/`
    },
    openGraph: {
      title: "Quick News Today | The Fourth Pillar",
      description:
        "News in 5 points with fast verified headlines across Local, Indian, and World coverage. Read quick news today in a short format.",
      url: `${appUrl}/`,
      siteName: "The Fourth Pillar",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: "Quick News Today | The Fourth Pillar",
      description:
        "News in 5 points with fast verified headlines across Local, Indian, and World coverage. Read quick news today in a short format."
    }
  };
}
