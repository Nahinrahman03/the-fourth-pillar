import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await prisma.newsItem.findMany({
      where: {
        OR: [
          { headline: { contains: q } },
          { category: { contains: q } },
          { summaryPoints: { contains: q } },
          { details: { contains: q } }
        ]
      },
      orderBy: {
        publishedAt: "desc"
      },
      take: 12,
      select: {
        id: true,
        headline: true,
        category: true,
        publishedAt: true,
        sourceUrl: true,
        summaryPoints: true,
        slug: true
      }
    });

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "Search failed." }, { status: 500 });
  }
}
