import { NextResponse } from "next/server";
import { getCurrentUser, isElevatedRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { seedDefaultProviders } from "@/lib/ai-intelligence";

/**
 * POST /api/ai-intelligence/enable-provider
 * 
 * Enables or upserts a specific provider. Used by the dev panel
 * when a key is newly configured.
 * Body: { slug: string, enabled: boolean }
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isElevatedRole(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Re-run seed so OpenRouter gets auto-enabled if key is now present
  await seedDefaultProviders();

  const { slug, enabled } = await request.json().catch(() => ({}));

  if (slug) {
    const updated = await prisma.aiProvider.update({
      where: { slug },
      data: { enabled: enabled ?? true },
    }).catch(() => null);

    return NextResponse.json({ success: true, provider: updated });
  }

  const providers = await prisma.aiProvider.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ success: true, providers });
}
