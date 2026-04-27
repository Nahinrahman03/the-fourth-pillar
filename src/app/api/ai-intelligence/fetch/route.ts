import { NextResponse } from "next/server";
import { getCurrentUser, isElevatedRole } from "@/lib/auth";
import { runIntelligenceFetch, seedDefaultProviders } from "@/lib/ai-intelligence";

/**
 * POST /api/ai-intelligence/fetch
 *
 * Triggers a full AI intelligence fetch from all enabled providers.
 * Protected: Admin only OR valid cron secret.
 *
 * Headers:
 *   Authorization: Bearer <CRON_SECRET>   — for automated cron jobs
 *   OR: valid admin session cookie
 */
export async function POST(request: Request) {
  try {
    // Auth: allow valid admin session OR cron secret
    const cronSecret = process.env.AI_CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    const isCronCall =
      cronSecret &&
      authHeader === `Bearer ${cronSecret}`;

    if (!isCronCall) {
      const user = await getCurrentUser();
      if (!user || !isElevatedRole(user.role)) {
        return NextResponse.json(
          { error: "Unauthorized. Admin session or cron secret required." },
          { status: 401 }
        );
      }
    }

    // Ensure default providers exist in DB on first run
    await seedDefaultProviders();

    const result = await runIntelligenceFetch();

    return NextResponse.json({
      success: true,
      saved: result.saved,
      errors: result.errors,
      providers: result.providerResults.map((r) => ({
        slug: r.slug,
        itemsFetched: r.items.length,
        error: r.error ?? null,
      })),
      triggeredAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
