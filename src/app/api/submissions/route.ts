import { NotificationType } from "@prisma/client";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/utils";
import { submitNewsSchema } from "@/lib/validators";

import { analyzeSubmission } from "@/lib/spam-detect";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "You must be signed in to submit news."
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = submitNewsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid submission."
        },
        { status: 400 }
      );
    }

    // 1. Spam Detection
    const spamCheck = analyzeSubmission(parsed.data.headline, parsed.data.details ?? undefined);
    if (spamCheck.isSpam) {
      return NextResponse.json(
        {
          error: `Submission rejected: ${spamCheck.reason}`
        },
        { status: 400 }
      );
    }

    // 2. Rate Limiting (1 per hour)
    const ip = getClientIp(request.headers);
    const limit = checkRateLimit(`submission:${user.id}:${ip}`, {
      limit: 1,
      windowMs: 60 * 60_000
    });

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. You can only submit news once per hour. Try again in ${limit.retryAfterSeconds} seconds.`
        },
        { status: 429 }
      );
    }

    // 3. Admin Priority Queue (Admins get priority 1 by default)
    const priority = user.role === "ADMIN" ? 1 : 0;

    await prisma.submission.create({
      data: {
        contributorId: user.id,
        headline: parsed.data.headline,
        category: parsed.data.category,
        scope: parsed.data.scope,
        sourceUrl: parsed.data.sourceUrl,
        details: parsed.data.details,
        summaryPoints: JSON.stringify(parsed.data.summaryPoints),
        priority
      }
    });

    await createNotification({
      userId: user.id,
      type: NotificationType.SUBMISSION_RECEIVED,
      title: "Submission received",
      body: "Your news brief is now waiting for admin verification.",
      href: "/dashboard/contribute"
    });

    return NextResponse.json({
      message: "Submission sent for verification."
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not create submission.";

    return NextResponse.json(
      {
        error: message
      },
      { status: 400 }
    );
  }
}
