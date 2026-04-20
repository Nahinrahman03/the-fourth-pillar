"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FlagReviewActionsProps = {
  flagId: string;
};

export function FlagReviewActions({ flagId }: FlagReviewActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"APPROVE" | "REMOVE" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reviewFlag(action: "APPROVE" | "REMOVE") {
    setLoading(action);
    setError(null);

    try {
      const response = await fetch(`/api/admin/news/flags/${flagId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not review this flag.");
      }

      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not review this flag.");
      setLoading(null);
    }
  }

  return (
    <div className="flag-review-actions">
      <button
        className="button-secondary"
        disabled={loading !== null}
        onClick={() => void reviewFlag("APPROVE")}
        type="button"
      >
        {loading === "APPROVE" ? "Approving..." : "Approve"}
      </button>
      <button
        className="button"
        disabled={loading !== null}
        onClick={() => void reviewFlag("REMOVE")}
        type="button"
      >
        {loading === "REMOVE" ? "Removing..." : "Remove"}
      </button>
      {error ? <span className="flag-feedback error">{error}</span> : null}
    </div>
  );
}
