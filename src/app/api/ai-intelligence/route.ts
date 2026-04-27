import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/ai-intelligence
 *
 * Public unified API endpoint for AI-fetched news intelligence.
 * Completely separate from the manual news system.
 *
 * Query params:
 *   ?scope=WORLD|INDIA|LOCAL
 *   ?category=Technology|Politics|...
 *   ?limit=20 (default 20, max 100)
 *   ?minCredibility=0 (default 0, range 0–100)
 *   ?page=1
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const scope = searchParams.get("scope")?.toUpperCase() ?? undefined;
    const category = searchParams.get("category") ?? undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
    const minCredibility = parseFloat(searchParams.get("minCredibility") ?? "0");

    const validScopes = ["LOCAL", "INDIA", "WORLD"];
    const scopeFilter = scope && validScopes.includes(scope) ? scope : undefined;

    const [items, total] = await Promise.all([
      prisma.aiNewsItem.findMany({
        where: {
          isActive: true,
          ...(scopeFilter ? { scope: scopeFilter } : {}),
          ...(category ? { category: { contains: category, mode: "insensitive" } } : {}),
          credibilityScore: { gte: minCredibility },
        },
        orderBy: { fetchedAt: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        select: {
          id: true,
          headline: true,
          summaryPoints: true,
          category: true,
          scope: true,
          sourceHint: true,
          credibilityScore: true,
          realProbability: true,
          providerBreakdown: true,
          fetchedAt: true,
        },
      }),
      prisma.aiNewsItem.count({
        where: {
          isActive: true,
          ...(scopeFilter ? { scope: scopeFilter } : {}),
          ...(category ? { category: { contains: category, mode: "insensitive" } } : {}),
          credibilityScore: { gte: minCredibility },
        },
      }),
    ]);

    // Parse JSON fields for cleaner API response
    const formatted = items.map((item) => ({
      ...item,
      summaryPoints: (() => {
        try { return JSON.parse(item.summaryPoints); } catch { return []; }
      })(),
      providerBreakdown: (() => {
        try { return JSON.parse(item.providerBreakdown); } catch { return {}; }
      })(),
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      meta: {
        engine: "The Fourth Pillar — AI Intelligence Engine",
        note: "Credibility scores are AI-computed and may not reflect ground truth.",
        lastUpdated: items[0]?.fetchedAt ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
