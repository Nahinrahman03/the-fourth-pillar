import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const revalidate = 120; // revalidate every 2 minutes

export async function GET() {
  try {
    /* "Trending" = most views in the last 48 hours */
    const since = new Date(Date.now() - 48 * 60 * 60_000);

    const top = await prisma.newsItem.findMany({
      where: { publishedAt: { gte: since } },
      orderBy: { views: "desc" },
      take: 5,
      select: { headline: true, category: true, slug: true },
    });

    /* Fallback: just take the latest if nothing recent */
    const items =
      top.length > 0
        ? top
        : await prisma.newsItem.findMany({
            orderBy: { publishedAt: "desc" },
            take: 5,
            select: { headline: true, category: true, slug: true },
          });

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
