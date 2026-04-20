import { NextResponse } from "next/server";

import { getCurrentUser, isElevatedRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isElevatedRole(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      phoneNumber: true,
      name: true,
      role: true,
      createdAt: true,
      profile: { select: { points: true, lastSeenAt: true } },
      _count: { select: { submissions: true } }
    }
  });

  return NextResponse.json({ users });
}
