import { NotificationType, SubmissionStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { getCurrentUser, isElevatedRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getScopeMeta } from "@/lib/news-scope";
import { calculateContributionPoints, createUniqueSlug } from "@/lib/news";
import { broadcastNotification } from "@/lib/notifications";
import { checkRateLimit } from "@/lib/rate-limit";
import { reviewSubmissionSchema } from "@/lib/validators";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const reviewer = await getCurrentUser();

    if (!reviewer) {
      return NextResponse.json(
        {
          error: "You must be signed in to review submissions."
        },
        { status: 401 }
      );
    }

    if (!isElevatedRole(reviewer.role)) {
      return NextResponse.json(
        {
          error: "You do not have access to the review queue."
        },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = reviewSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid moderation request."
        },
        { status: 400 }
      );
    }

    const limit = checkRateLimit(`review:${reviewer.id}`, {
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

    const submission = await prisma.submission.findUnique({
      where: {
        id
      }
    });

    if (!submission || submission.status !== SubmissionStatus.PENDING) {
      return NextResponse.json(
        {
          error: "This submission is no longer pending review."
        },
        { status: 404 }
      );
    }

    if (parsed.data.decision === "APPROVE") {
      const slug = await createUniqueSlug(submission.headline);
      const awardedPoints = calculateContributionPoints({
        summaryPoints: submission.summaryPoints,
        sourceUrl: submission.sourceUrl
      });

      await prisma.$transaction(async (tx) => {
        await tx.submission.update({
          where: {
            id: submission.id
          },
          data: {
            status: SubmissionStatus.APPROVED,
            moderatedById: reviewer.id,
            moderationNotes: parsed.data.moderationNotes || null,
            awardedPoints
          }
        });

        await tx.newsItem.create({
          data: {
            headline: submission.headline,
            slug,
            category: submission.category,
            scope: submission.scope,
            sourceUrl: submission.sourceUrl,
            details: submission.details,
            summaryPoints: submission.summaryPoints,
            submissionId: submission.id,
            createdById: submission.contributorId,
            approvedById: reviewer.id
          }
        });

        await tx.profile.update({
          where: {
            userId: submission.contributorId
          },
          data: {
            points: {
              increment: awardedPoints
            }
          }
        });

        await tx.notification.create({
          data: {
            userId: submission.contributorId,
            type: NotificationType.SUBMISSION_APPROVED,
            title: "Submission approved",
            body: `Your brief was approved and published. ${awardedPoints} private points were added to your profile.`,
            href: "/dashboard/contribute"
          }
        });
      });

      await broadcastNotification({
        title: "New verified brief published",
        body: `${submission.headline} is now live in ${getScopeMeta(submission.scope).label} news.`,
        href: getScopeMeta(submission.scope).href
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.submission.update({
          where: {
            id: submission.id
          },
          data: {
            status: SubmissionStatus.REJECTED,
            moderatedById: reviewer.id,
            moderationNotes: parsed.data.moderationNotes || "Please revise the brief and resubmit."
          }
        });

        await tx.notification.create({
          data: {
            userId: submission.contributorId,
            type: NotificationType.SUBMISSION_REJECTED,
            title: "Submission rejected",
            body: parsed.data.moderationNotes || "Your brief needs revision before it can be published.",
            href: "/dashboard/contribute"
          }
        });
      });
    }

    return NextResponse.json({
      success: true
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Could not complete moderation.";

    return NextResponse.json(
      {
        error: message
      },
      { status: 400 }
    );
  }
}
