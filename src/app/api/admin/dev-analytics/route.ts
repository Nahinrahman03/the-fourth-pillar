import { NextResponse } from "next/server";

import { getCurrentUser, isElevatedRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

function windowMs(period: string) {
  if (period === "daily") return 24 * 60 * 60_000;
  if (period === "monthly") return 30 * 24 * 60 * 60_000;
  return 7 * 24 * 60 * 60_000; // weekly default
}

function buildChartBuckets(
  period: string,
  submissions: { createdAt: Date }[],
  approved: { createdAt: Date }[]
) {
  if (period === "daily") {
    const labels = Array.from({ length: 24 }, (_, i) => `${i}h`);
    const subs = Array(24).fill(0);
    const vers = Array(24).fill(0);
    submissions.forEach((s) => { subs[new Date(s.createdAt).getHours()]++; });
    approved.forEach((s) => { vers[new Date(s.createdAt).getHours()]++; });
    // Only show every 4th label to avoid clutter
    return { labels: labels.map((l, i) => (i % 4 === 0 ? l : "")), submissions: subs, verifications: vers };
  }
  if (period === "monthly") {
    const labels = Array.from({ length: 30 }, (_, i) => `${i + 1}`);
    const subs = Array(30).fill(0);
    const vers = Array(30).fill(0);
    const now = new Date();
    submissions.forEach((s) => {
      const dayIdx = 29 - Math.floor((now.getTime() - new Date(s.createdAt).getTime()) / 86_400_000);
      if (dayIdx >= 0 && dayIdx < 30) subs[dayIdx]++;
    });
    approved.forEach((s) => {
      const dayIdx = 29 - Math.floor((now.getTime() - new Date(s.createdAt).getTime()) / 86_400_000);
      if (dayIdx >= 0 && dayIdx < 30) vers[dayIdx]++;
    });
    // Show every 5th day label
    return { labels: labels.map((l, i) => (i % 5 === 0 ? l : "")), submissions: subs, verifications: vers };
  }
  // Weekly: Mon–Sun
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const subs = Array(7).fill(0);
  const vers = Array(7).fill(0);
  submissions.forEach((s) => { subs[(new Date(s.createdAt).getDay() + 6) % 7]++; });
  approved.forEach((s) => { vers[(new Date(s.createdAt).getDay() + 6) % 7]++; });
  return { labels: days, submissions: subs, verifications: vers };
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isElevatedRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "weekly";
  const since = new Date(Date.now() - windowMs(period));
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const t0 = Date.now();

  const [
    totalSubmissions,
    pendingCount,
    approvedCount,
    rejectedCount,
    totalUsers,
    totalNewsItems,
    activeContributorIds,
    pointsToday,
    recentSubmissions,
    periodSubmissions,
    periodApproved,
    authFailures,
    expiredCodes,
    activeSessions,
  ] = await Promise.all([
    prisma.submission.count(),
    prisma.submission.count({ where: { status: "PENDING" } }),
    prisma.submission.count({ where: { status: "APPROVED" } }),
    prisma.submission.count({ where: { status: "REJECTED" } }),
    prisma.user.count(),
    prisma.newsItem.count(),
    prisma.submission.findMany({ distinct: ["contributorId"], select: { contributorId: true } }),
    prisma.submission.aggregate({
      where: { updatedAt: { gte: todayStart }, status: "APPROVED" },
      _sum: { awardedPoints: true }
    }),
    prisma.submission.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { contributor: { select: { email: true, phoneNumber: true } } }
    }),
    prisma.submission.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.submission.findMany({ where: { createdAt: { gte: since }, status: "APPROVED" }, select: { createdAt: true } }),
    prisma.signInCode.count({ where: { attempts: { gte: 3 } } }),
    prisma.signInCode.count({ where: { consumedAt: null, expiresAt: { lt: new Date() } } }),
    prisma.authSession.count({ where: { expiresAt: { gt: new Date() } } }),
  ]);

  const systemResponseMs = Date.now() - t0;
  const velocity = totalSubmissions > 0 ? Math.round((approvedCount / totalSubmissions) * 100) : 0;
  const chart = buildChartBuckets(period, periodSubmissions, periodApproved);

  return NextResponse.json({
    stats: {
      totalSubmissions,
      activeContributors: activeContributorIds.length,
      pointsToday: pointsToday._sum.awardedPoints ?? 0,
      systemResponseMs,
      pendingCount,
      approvedCount,
      rejectedCount,
      totalUsers,
      totalNewsItems,
      velocity,
    },
    chart,
    recentSubmissions: recentSubmissions.map((s) => ({
      id: s.id.slice(-4).toUpperCase(),
      contributor: s.contributor.email ?? s.contributor.phoneNumber ?? "Unknown",
      category: s.category,
      status: s.status,
      points: s.awardedPoints ?? 0,
      createdAt: s.createdAt.toISOString(),
    })),
    security: { authFailures, expiredCodes, activeSessions },
  });
}
