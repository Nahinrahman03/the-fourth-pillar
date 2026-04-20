import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { profilePreferencesSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "You must be signed in to change profile settings."
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = profilePreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid preferences payload."
        },
        { status: 400 }
      );
    }

    const limit = checkRateLimit(`profile:${user.id}`, {
      limit: 20,
      windowMs: 60 * 60_000
    });

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Too many profile updates. Try again in ${limit.retryAfterSeconds} seconds.`
        },
        { status: 429 }
      );
    }

    await prisma.profile.upsert({
      where: {
        userId: user.id
      },
      update: parsed.data,
      create: {
        userId: user.id,
        ...parsed.data
      }
    });

    return NextResponse.json({
      message: "Notification settings saved."
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not update profile.";

    return NextResponse.json(
      {
        error: message
      },
      { status: 400 }
    );
  }
}
