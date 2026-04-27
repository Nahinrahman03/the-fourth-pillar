import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ContributionsClient } from "@/components/contributions-client";

export const metadata: Metadata = {
  title: "My Contributions",
  description: "Your full contribution archive — every brief you have filed, verified or pending.",
};

export default async function ContributionsPage() {
  const user = await requireUser();

  const allSubmissions = await prisma.submission.findMany({
    where: { contributorId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      headline: true,
      category: true,
      scope: true,
      status: true,
      awardedPoints: true,
      moderationNotes: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const serialised = allSubmissions.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  const stats = {
    total:    serialised.length,
    approved: serialised.filter((s) => s.status === "APPROVED").length,
    pending:  serialised.filter((s) => s.status === "PENDING").length,
    rejected: serialised.filter((s) => s.status === "REJECTED").length,
    points:   serialised.reduce((sum, s) => sum + (s.awardedPoints ?? 0), 0),
  };

  return (
    <section style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div className="page-heading">
          <p className="page-kicker">Contribution archive</p>
          <h1 className="page-title">My Briefs</h1>
        </div>
        <Link
          href="/dashboard/contribute"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 24px",
            background: "var(--primary)",
            color: "#fff",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textDecoration: "none",
            transition: "opacity 140ms ease",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          File New Brief
        </Link>
      </div>

      <ContributionsClient submissions={serialised} stats={stats} />
    </section>
  );
}
