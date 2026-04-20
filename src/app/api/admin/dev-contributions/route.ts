import { NextResponse } from "next/server";

import { getCurrentUser, isElevatedRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isElevatedRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status"); // PENDING | APPROVED | REJECTED | null for all

  const submissions = await prisma.submission.findMany({
    where: statusFilter ? { status: statusFilter as "PENDING" | "APPROVED" | "REJECTED" } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      contributor: { select: { email: true, phoneNumber: true } }
    }
  });

  return NextResponse.json({
    submissions: submissions.map((s) => ({
      id: s.id.slice(-6).toUpperCase(),
      fullId: s.id,
      headline: s.headline,
      category: s.category,
      status: s.status,
      points: s.awardedPoints ?? 0,
      contributor: s.contributor.email ?? s.contributor.phoneNumber ?? "Unknown",
      createdAt: s.createdAt.toISOString(),
      moderationNotes: s.moderationNotes ?? null,
    }))
  });
}
