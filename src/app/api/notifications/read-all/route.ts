import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "You must be signed in to update notifications."
        },
        { status: 401 }
      );
    }

    const limit = checkRateLimit(`notifications:${user.id}`, {
      limit: 30,
      windowMs: 60 * 60_000
    });

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Too many updates. Try again in ${limit.retryAfterSeconds} seconds.`
        },
        { status: 429 }
      );
    }

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    return NextResponse.json({
      success: true
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not update notifications.";

    return NextResponse.json(
      {
        error: message
      },
      { status: 400 }
    );
  }
}
