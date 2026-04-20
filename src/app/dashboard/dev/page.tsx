import { redirect } from "next/navigation";

import { DevDashboard } from "@/components/dev-dashboard";
import { requireUser, isElevatedRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "Developer Analytics — The Fourth Pillar",
  description: "Admin-only developer analytics console."
};

export default async function DevPage() {
  const user = await requireUser();

  if (!isElevatedRole(user.role)) {
    redirect("/dashboard");
  }

  // Initial weekly data (client will re-fetch on tab change)
  const since = new Date(Date.now() - 7 * 24 * 60 * 60_000);
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
    periodSubs,
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

  // Build weekly chart (Mon–Sun)
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const subsPerDay = Array(7).fill(0);
  const approvedPerDay = Array(7).fill(0);
  periodSubs.forEach((s) => { subsPerDay[(new Date(s.createdAt).getDay() + 6) % 7]++; });
  periodApproved.forEach((s) => { approvedPerDay[(new Date(s.createdAt).getDay() + 6) % 7]++; });

  const initial = {
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
    chart: { labels: days, submissions: subsPerDay, verifications: approvedPerDay },
    recentSubmissions: recentSubmissions.map((s) => ({
      id: s.id.slice(-4).toUpperCase(),
      contributor: s.contributor.email ?? s.contributor.phoneNumber ?? "Unknown",
      category: s.category,
      status: s.status,
      points: s.awardedPoints ?? 0,
      createdAt: s.createdAt.toISOString(),
    })),
    security: { authFailures, expiredCodes, activeSessions },
  };

  return <DevDashboard initial={initial} />;
}
