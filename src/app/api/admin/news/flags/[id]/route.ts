import { NewsFlagStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { getCurrentUser, isElevatedRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { reviewFlagSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const reviewer = await getCurrentUser();

    if (!reviewer) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    if (!isElevatedRole(reviewer.role)) {
      return NextResponse.json({ error: "Only developers can review flagged news." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = reviewFlagSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid review request." }, { status: 400 });
    }

    const limit = checkRateLimit(`flag-review:${reviewer.id}`, {
      limit: 100,
      windowMs: 60 * 60_000
    });

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Too many review actions. Try again in ${limit.retryAfterSeconds} seconds.`
        },
        { status: 429 }
      );
    }

    const flag = await prisma.newsFlag.findUnique({
      where: { id },
      include: {
        newsItem: true
      }
    });

    if (!flag || flag.status !== NewsFlagStatus.PENDING) {
      return NextResponse.json({ error: "This flag is no longer pending." }, { status: 404 });
    }

    if (parsed.data.action === "REMOVE") {
      await prisma.$transaction(async (tx) => {
        await tx.newsFlag.updateMany({
          where: {
            newsItemId: flag.newsItemId,
            status: NewsFlagStatus.PENDING
          },
          data: {
            status: NewsFlagStatus.REMOVED,
            reviewedAt: new Date(),
            reviewedById: reviewer.id,
            reviewNotes: parsed.data.reviewNotes || "Removed by developer after flag review."
          }
        });

        await tx.newsItem.delete({
          where: { id: flag.newsItemId }
        });
      });
    } else {
      await prisma.newsFlag.update({
        where: { id: flag.id },
        data: {
          status: NewsFlagStatus.APPROVED,
          reviewedAt: new Date(),
          reviewedById: reviewer.id,
          reviewNotes: parsed.data.reviewNotes || "Developer reviewed and kept this news item live."
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not review this flag.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
