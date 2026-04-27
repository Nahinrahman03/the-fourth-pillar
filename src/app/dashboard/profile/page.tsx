import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileDashboard } from "@/components/profile-dashboard";

export const metadata: Metadata = {
  title: "Intelligence Profile",
  description: "Your personal intelligence agent profile — contribution record, points, and account settings.",
};

/* Build a 12-month activity array from submissions */
function buildActivityByMonth(
  submissions: { createdAt: Date }[]
): { label: string; count: number }[] {
  const now = new Date();
  const result: { label: string; count: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-IN", { month: "short" });
    const year = d.getFullYear();
    const month = d.getMonth();
    const count = submissions.filter((s) => {
      const sd = new Date(s.createdAt);
      return sd.getFullYear() === year && sd.getMonth() === month;
    }).length;
    result.push({ label, count });
  }

  return result;
}

export default async function ProfilePage() {
  const user = await requireUser();

  /* Fetch all submissions (no limit) for stats + activity graph */
  const allSubmissions = await prisma.submission.findMany({
    where: { contributorId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      headline: true,
      category: true,
      status: true,
      awardedPoints: true,
      createdAt: true,
    },
  });

  const approved = allSubmissions.filter((s) => s.status === "APPROVED").length;
  const pending  = allSubmissions.filter((s) => s.status === "PENDING").length;
  const rejected = allSubmissions.filter((s) => s.status === "REJECTED").length;
  const totalPoints =
    user.profile?.points ??
    allSubmissions.reduce((sum, s) => sum + (s.awardedPoints ?? 0), 0);

  const stats = {
    total: allSubmissions.length,
    approved,
    pending,
    rejected,
    totalPoints,
  };

  const activityByMonth = buildActivityByMonth(allSubmissions);

  /* Pass only the last 8 submissions to the table */
  const recentSubmissions = allSubmissions.slice(0, 8).map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }));

  const serialisedUser = {
    id:          user.id,
    name:        user.name,
    email:       user.email ?? null,
    phoneNumber: user.phoneNumber ?? null,
    image:       user.image ?? null,
    role:        user.role as string,
    createdAt:   user.createdAt.toISOString(),
    profile: user.profile
      ? {
          points:        user.profile.points,
          notifyInApp:   user.profile.notifyInApp,
          notifyByEmail: user.profile.notifyByEmail,
          lastSeenAt:    user.profile.lastSeenAt?.toISOString() ?? null,
        }
      : null,
  };

  return (
    <section style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Page header */}
      <div className="page-heading" style={{ marginBottom: "32px" }}>
        <p className="page-kicker">Member archive</p>
        <h1 className="page-title">Agent Profile</h1>
      </div>

      <ProfileDashboard
        user={serialisedUser}
        submissions={recentSubmissions}
        stats={stats}
        activityByMonth={activityByMonth}
      />
    </section>
  );
}
