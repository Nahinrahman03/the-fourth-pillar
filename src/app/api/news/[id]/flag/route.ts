import { NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { notifyElevatedUsers } from "@/lib/notifications";
import { flagNewsSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const FLAG_LIMIT = 2;
const FLAG_WINDOW_MS = 5 * 60 * 60_000; // 5 hours

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    // ── Auth guard ────────────────────────────────────────────
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be signed in to flag a news item." },
        { status: 401 }
      );
    }

    // ── Validate body ─────────────────────────────────────────
    const body = await request.json().catch(() => ({}));
    const parsed = flagNewsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid flag request." },
        { status: 400 }
      );
    }

    // ── News item exists? ─────────────────────────────────────
    const newsItem = await prisma.newsItem.findUnique({ where: { id } });
    if (!newsItem) {
      return NextResponse.json({ error: "News item not found." }, { status: 404 });
    }

    // ── DB-backed rate limit: 2 flags per user per 5 hours ────
    const windowStart = new Date(Date.now() - FLAG_WINDOW_MS);
    const recentFlagCount = await prisma.newsFlag.count({
      where: {
        reporterId: currentUser.id,
        createdAt: { gte: windowStart },
      },
    });

    if (recentFlagCount >= FLAG_LIMIT) {
      // Find the oldest flag in the window to compute retry-after
      const oldest = await prisma.newsFlag.findFirst({
        where: {
          reporterId: currentUser.id,
          createdAt: { gte: windowStart },
        },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      });

      const retryAfterMs = oldest
        ? FLAG_WINDOW_MS - (Date.now() - oldest.createdAt.getTime())
        : FLAG_WINDOW_MS;
      const retryAfterMinutes = Math.ceil(retryAfterMs / 60_000);

      return NextResponse.json(
        {
          error: `You can only flag ${FLAG_LIMIT} items every 5 hours. Try again in ${retryAfterMinutes} minute${retryAfterMinutes !== 1 ? "s" : ""}.`,
          rateLimited: true,
        },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
        }
      );
    }

    // ── Create flag ───────────────────────────────────────────
    await prisma.newsFlag.create({
      data: {
        newsItemId: id,
        reporterId: currentUser.id,
        reason: parsed.data.reason || null,
      },
    });

    await notifyElevatedUsers({
      type: NotificationType.NEWS_FLAGGED,
      title: "Flagged news requires review",
      body: newsItem.headline,
      href: "/owner/publish",
    });

    const remaining = FLAG_LIMIT - (recentFlagCount + 1);
    return NextResponse.json({
      message: "Flag submitted for review.",
      remaining,
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not flag this news item.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
