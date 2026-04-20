"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ReviewSubmissionFormProps = {
  submissionId: string;
};

export function ReviewSubmissionForm({ submissionId }: ReviewSubmissionFormProps) {
  const router = useRouter();
  const [moderationNotes, setModerationNotes] = useState("");
  const [loading, setLoading] = useState<"APPROVE" | "REJECT" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  async function review(decision: "APPROVE" | "REJECT") {
    setLoading(decision);
    setError(null);

    try {
      const response = await fetch(`/api/admin/submissions/${submissionId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          decision,
          moderationNotes
        })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Moderation update failed.");
      }

      setModerationNotes("");
      router.refresh();
    } catch (cause) {
      const nextError = cause instanceof Error ? cause.message : "Moderation update failed.";
      setError(nextError);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="stack">
      <div className="action-row compact">
        <button className="button-secondary" onClick={() => setShowNotes((current) => !current)} type="button">
          {showNotes ? "Hide details" : "Details"}
        </button>
        <button
          className="button"
          disabled={loading !== null}
          onClick={() => review("APPROVE")}
          type="button"
        >
          {loading === "APPROVE" ? "Approving..." : "Approve and publish"}
        </button>
        <button
          className="button-secondary"
          disabled={loading !== null}
          onClick={() => review("REJECT")}
          type="button"
        >
          {loading === "REJECT" ? "Rejecting..." : "Reject"}
        </button>
      </div>

      {showNotes ? (
        <div className="field">
          <label htmlFor={`notes-${submissionId}`}>Moderation notes</label>
          <textarea
            className="textarea"
            id={`notes-${submissionId}`}
            onChange={(event) => setModerationNotes(event.target.value)}
            placeholder="Optional note for the contributor"
            value={moderationNotes}
          />
        </div>
      ) : null}

      {error ? <p className="status-message error">{error}</p> : null}
    </div>
  );
}
