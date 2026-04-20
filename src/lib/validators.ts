import { z } from "zod";

import { isNewsScope } from "@/lib/news-scope";
import { parseSummaryText } from "@/lib/utils";

const channelSchema = z.enum(["EMAIL", "PHONE"]);

function validateDestination(channel: "EMAIL" | "PHONE", destination: string) {
  if (channel === "EMAIL") {
    return z.string().email().safeParse(destination).success;
  }

  return /^\+?\d{8,15}$/.test(destination.replace(/[^\d+]/g, ""));
}

export const requestCodeSchema = z
  .object({
    channel: channelSchema,
    destination: z.string().trim().min(4).max(120)
  })
  .superRefine((input, ctx) => {
    if (!validateDestination(input.channel, input.destination)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destination"],
        message: input.channel === "EMAIL" ? "Enter a valid email address." : "Enter a valid phone number."
      });
    }
  });

export const verifyCodeSchema = z
  .object({
    channel: channelSchema,
    destination: z.string().trim().min(4).max(120),
    code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.")
  })
  .superRefine((input, ctx) => {
    if (!validateDestination(input.channel, input.destination)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["destination"],
        message: input.channel === "EMAIL" ? "Enter a valid email address." : "Enter a valid phone number."
      });
    }
  });

export const submitNewsSchema = z
  .object({
    headline: z
      .string({ required_error: "Headline is required." })
      .trim()
      .min(12, "Headline must be at least 12 characters.")
      .max(180, "Headline must be 180 characters or fewer."),
    category: z
      .string({ required_error: "Category is required." })
      .trim()
      .min(2, "Category must be at least 2 characters.")
      .max(40, "Category must be 40 characters or fewer."),
    scope: z.string({ required_error: "Choose Local, Indian, or World news." }),
    sourceUrl: z.string().trim().optional().or(z.literal("")),
    details: z
      .string()
      .trim()
      .max(1200, "Submission notes must be 1200 characters or fewer.")
      .optional()
      .or(z.literal("")),
    summaryText: z
      .string({ required_error: "At least 2 supporting points are required." })
      .min(10, "Each point must be meaningful - add more detail.")
      .max(1200, "Summary points total must be under 1200 characters.")
  })
  .transform((input, ctx) => {
    const points = parseSummaryText(input.summaryText);

    if (points.length < 2 || points.length > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["summaryText"],
        message: "Write between 2 and 5 short points."
      });

      return z.NEVER;
    }

    if (input.sourceUrl) {
      const urlCheck = z.string().url().safeParse(input.sourceUrl);

      if (!urlCheck.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sourceUrl"],
          message: "Enter a valid source URL."
        });

        return z.NEVER;
      }
    }

    if (!isNewsScope(input.scope)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scope"],
        message: "Choose Local, Indian, or World news."
      });

      return z.NEVER;
    }

    return {
      headline: input.headline,
      category: input.category,
      scope: input.scope,
      sourceUrl: input.sourceUrl || null,
      details: input.details || null,
      summaryPoints: points
    };
  });

export const reviewSubmissionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  moderationNotes: z.string().trim().max(500).optional().or(z.literal(""))
});

export const profilePreferencesSchema = z.object({
  notifyInApp: z.boolean(),
  notifyByEmail: z.boolean()
});

export const ownerPublishSchema = z
  .object({
    headline: z.string().trim().min(12).max(180),
    category: z.string().trim().min(2).max(40),
    scope: z.string({ required_error: "Choose Local, Indian, or World news." }),
    sourceUrl: z.string().trim().optional().or(z.literal("")),
    details: z.string().trim().min(20).max(4000),
    summaryText: z.string().min(10).max(1200),
    publishedAt: z.string().trim().optional().or(z.literal(""))
  })
  .transform((input, ctx) => {
    const points = parseSummaryText(input.summaryText);

    if (points.length < 2 || points.length > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["summaryText"],
        message: "Write between 2 and 5 short points."
      });

      return z.NEVER;
    }

    if (input.sourceUrl) {
      const urlCheck = z.string().url().safeParse(input.sourceUrl);

      if (!urlCheck.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sourceUrl"],
          message: "Enter a valid source URL."
        });

        return z.NEVER;
      }
    }

    if (!isNewsScope(input.scope)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scope"],
        message: "Choose Local, Indian, or World news."
      });

      return z.NEVER;
    }

    if (input.publishedAt) {
      const parsedDate = new Date(input.publishedAt);

      if (Number.isNaN(parsedDate.valueOf())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["publishedAt"],
          message: "Enter a valid publish date."
        });

        return z.NEVER;
      }
    }

    return {
      headline: input.headline,
      category: input.category,
      scope: input.scope,
      sourceUrl: input.sourceUrl || null,
      details: input.details,
      summaryPoints: points,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : new Date()
    };
  });

export const flagNewsSchema = z.object({
  reason: z.string().trim().max(240).optional().or(z.literal(""))
});

export const reviewFlagSchema = z.object({
  action: z.enum(["APPROVE", "REMOVE"]),
  reviewNotes: z.string().trim().max(300).optional().or(z.literal(""))
});
