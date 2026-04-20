import { NextResponse } from "next/server";

import { getCurrentUser, isElevatedRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getScopeMeta } from "@/lib/news-scope";
import { createUniqueSlug } from "@/lib/news";
import { broadcastNotification } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/rate-limit";
import { ownerPublishSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const owner = await getCurrentUser();

    if (!owner) {
      return NextResponse.json(
        {
          error: "You must be signed in to publish directly."
        },
        { status: 401 }
      );
    }

    if (!isElevatedRole(owner.role)) {
      return NextResponse.json(
        {
          error: "You do not have owner access."
        },
        { status: 403 }
      );
    }

    const limit = checkRateLimit(`owner-publish:${owner.id}`, {
      limit: 30,
      windowMs: 60 * 60_000
    });

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Too many publish actions. Try again in ${limit.retryAfterSeconds} seconds.`
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = ownerPublishSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid publish request."
        },
        { status: 400 }
      );
    }

    const slug = await createUniqueSlug(parsed.data.headline);

    await prisma.newsItem.create({
      data: {
        slug,
        headline: parsed.data.headline,
        category: parsed.data.category,
        scope: parsed.data.scope,
        sourceUrl: parsed.data.sourceUrl,
        details: parsed.data.details,
        summaryPoints: JSON.stringify(parsed.data.summaryPoints),
        publishedAt: parsed.data.publishedAt,
        createdById: owner.id,
        approvedById: owner.id
      }
    });

    await broadcastNotification({
      title: "New verified brief published",
      body: `${parsed.data.headline} is now live in ${getScopeMeta(parsed.data.scope).label} news.`,
      href: getScopeMeta(parsed.data.scope).href
    });

    return NextResponse.json({
      message: "News brief published successfully."
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not publish the news brief.";

    return NextResponse.json(
      {
        error: message
      },
      { status: 400 }
    );
  }
}
