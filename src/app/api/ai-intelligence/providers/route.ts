import { NextResponse } from "next/server";
import { getCurrentUser, isElevatedRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/ai-intelligence/providers
 * Returns all AiProvider records (admin only)
 *
 * PATCH /api/ai-intelligence/providers
 * Updates a provider's enabled status, weight, model
 * Body: { id: string, enabled?: boolean, weight?: number, model?: string }
 */

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isElevatedRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providers = await prisma.aiProvider.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ providers });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isElevatedRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, enabled, weight, model } = body;

  if (!id) {
    return NextResponse.json({ error: "Provider id is required" }, { status: 400 });
  }

  const updated = await prisma.aiProvider.update({
    where: { id },
    data: {
      ...(enabled !== undefined ? { enabled } : {}),
      ...(weight !== undefined ? { weight: parseFloat(weight) } : {}),
      ...(model ? { model } : {}),
    },
  });

  return NextResponse.json({ success: true, provider: updated });
}
