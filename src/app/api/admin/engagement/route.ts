import { NextResponse } from "next/server";
import { requireUser, isElevatedRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const user = await requireUser();
  if (!isElevatedRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "all";
  const country = url.searchParams.get("country") || "";

  // Get distinct countries for the filter dropdown
  const countriesData = await prisma.newsEvent.findMany({
    select: { country: true },
    distinct: ['country'],
  });
  const availableCountries = countriesData
    .map(c => c.country)
    .filter(c => c && c !== "Unknown")
    .sort();

  let startDate: Date | undefined;
  const now = new Date();
  if (period === "hour") startDate = new Date(now.getTime() - 60 * 60 * 1000);
  else if (period === "day") startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  else if (period === "month") startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  else if (period === "year") startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());

  const hasFilter = startDate !== undefined || country !== "";

  let totalViews = 0;
  let totalClicks = 0;
  let mostViewed: any[] = [];
  let leastViewed: any[] = [];
  let mostClicked: any[] = [];

  if (!hasFilter) {
    // Unfiltered fallback to maintain backward compatibility
    const aggregations = await prisma.newsItem.aggregate({
      _sum: { views: true, clicks: true },
    });
    totalViews = aggregations._sum.views || 0;
    totalClicks = aggregations._sum.clicks || 0;

    mostViewed = await prisma.newsItem.findMany({
      take: 10,
      orderBy: { views: "desc" },
      select: { id: true, headline: true, views: true, clicks: true, publishedAt: true, category: true },
    });

    leastViewed = await prisma.newsItem.findMany({
      take: 10,
      orderBy: { views: "asc" },
      select: { id: true, headline: true, views: true, clicks: true, publishedAt: true, category: true },
    });

    mostClicked = await prisma.newsItem.findMany({
      take: 5,
      orderBy: { clicks: "desc" },
      select: { id: true, headline: true, views: true, clicks: true, publishedAt: true, category: true },
    });
  } else {
    // Filtered data from NewsEvent table
    const where: any = {};
    if (startDate) where.createdAt = { gte: startDate };
    if (country) where.country = country;

    totalViews = await prisma.newsEvent.count({ where: { ...where, eventType: "VIEW" } });
    totalClicks = await prisma.newsEvent.count({ where: { ...where, eventType: "CLICK" } });

    const viewGroups = await prisma.newsEvent.groupBy({
      by: ['newsItemId'],
      where: { ...where, eventType: "VIEW" },
      _count: { _all: true },
      orderBy: { _count: { newsItemId: 'desc' } },
      take: 10,
    });

    const leastViewGroups = await prisma.newsEvent.groupBy({
      by: ['newsItemId'],
      where: { ...where, eventType: "VIEW" },
      _count: { _all: true },
      orderBy: { _count: { newsItemId: 'asc' } },
      take: 10,
    });

    const clickGroups = await prisma.newsEvent.groupBy({
      by: ['newsItemId'],
      where: { ...where, eventType: "CLICK" },
      _count: { _all: true },
      orderBy: { _count: { newsItemId: 'desc' } },
      take: 5,
    });

    const allIds = Array.from(new Set([
      ...viewGroups.map(g => g.newsItemId),
      ...leastViewGroups.map(g => g.newsItemId),
      ...clickGroups.map(g => g.newsItemId)
    ]));

    const items = await prisma.newsItem.findMany({
      where: { id: { in: allIds } },
      select: { id: true, headline: true, publishedAt: true, category: true },
    });

    const itemMap = new Map(items.map(item => [item.id, item]));

    mostViewed = viewGroups.map(g => ({
      ...itemMap.get(g.newsItemId),
      views: g._count._all,
      clicks: 0 // In filtered view we don't cross-correlate clicks here for brevity
    })).filter(i => i.id);

    leastViewed = leastViewGroups.map(g => ({
      ...itemMap.get(g.newsItemId),
      views: g._count._all,
      clicks: 0
    })).filter(i => i.id);

    mostClicked = clickGroups.map(g => ({
      ...itemMap.get(g.newsItemId),
      views: 0,
      clicks: g._count._all
    })).filter(i => i.id);
  }

  // Generate buckets for chart data
  const buckets: { label: string; start: Date; end: Date }[] = [];
  if (period === "all") {
    // past 5 years
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear() - i, 0, 1);
      const end = new Date(now.getFullYear() - i + 1, 0, 1);
      buckets.push({ label: d.getFullYear().toString(), start: d, end });
    }
  } else if (period === "year") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      buckets.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), start: d, end });
    }
  } else if (period === "month") {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
      buckets.push({ label: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }), start: d, end });
    }
  } else if (period === "day") {
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60 * 60 * 1000);
      d.setMinutes(0, 0, 0);
      const end = new Date(d.getTime() + 60 * 60 * 1000);
      buckets.push({ label: d.toLocaleTimeString('en-US', { hour: 'numeric' }), start: d, end });
    }
  } else if (period === "hour") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 5 * 60 * 1000);
      d.setSeconds(0, 0);
      const m = d.getMinutes();
      d.setMinutes(m - (m % 5));
      const end = new Date(d.getTime() + 5 * 60 * 1000);
      buckets.push({ label: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), start: d, end });
    }
  }

  const chartData = {
    labels: buckets.map(b => b.label),
    views: new Array(buckets.length).fill(0),
    clicks: new Array(buckets.length).fill(0)
  };

  // Single query per event type — bucket in memory instead of N DB round-trips
  if (buckets.length > 0) {
    const rangeStart = buckets[0].start;
    const rangeEnd   = buckets[buckets.length - 1].end;
    const baseWhere: any = { createdAt: { gte: rangeStart, lt: rangeEnd } };
    if (country) baseWhere.country = country;

    const [viewEvents, clickEvents] = await Promise.all([
      prisma.newsEvent.findMany({
        where: { ...baseWhere, eventType: "VIEW" },
        select: { createdAt: true },
      }),
      prisma.newsEvent.findMany({
        where: { ...baseWhere, eventType: "CLICK" },
        select: { createdAt: true },
      }),
    ]);

    for (const ev of viewEvents) {
      const ts = ev.createdAt.getTime();
      for (let i = 0; i < buckets.length; i++) {
        if (ts >= buckets[i].start.getTime() && ts < buckets[i].end.getTime()) {
          chartData.views[i]++;
          break;
        }
      }
    }

    for (const ev of clickEvents) {
      const ts = ev.createdAt.getTime();
      for (let i = 0; i < buckets.length; i++) {
        if (ts >= buckets[i].start.getTime() && ts < buckets[i].end.getTime()) {
          chartData.clicks[i]++;
          break;
        }
      }
    }
  }

  return NextResponse.json({
    totalViews,
    totalClicks,
    mostViewed,
    leastViewed,
    mostClicked,
    availableCountries,
    chartData
  });
}
