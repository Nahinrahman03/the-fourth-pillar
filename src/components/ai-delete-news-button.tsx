"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  newsId: string;
  headline: string;
};

export function AiDeleteNewsButton({ newsId, headline }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/ai-intelligence/news/${newsId}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Delete failed.");
      }

      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Delete failed.");
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (error) {
    return (
      <div className="delete-error-row">
        <span className="status-message error">{error}</span>
        <button
          className="delete-btn-cancel"
          onClick={() => setError(null)}
          type="button"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="delete-confirm-row">
        <span className="delete-confirm-text">Delete AI Brief &ldquo;{headline.slice(0, 48)}{headline.length > 48 ? "…" : ""}&rdquo;?</span>
        <div className="delete-confirm-actions">
          <button
            className="delete-btn-confirm"
            disabled={deleting}
            onClick={() => void handleDelete()}
            type="button"
          >
            {deleting ? "Deleting…" : "Yes, delete"}
          </button>
          <button
            className="delete-btn-cancel"
            disabled={deleting}
            onClick={() => setConfirming(false)}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      aria-label={`Delete AI news: ${headline}`}
      className="delete-btn"
      onClick={() => setConfirming(true)}
      type="button"
    >
      <svg aria-hidden="true" fill="none" height="13" viewBox="0 0 13 14" width="13">
        <path d="M1 3h11M4 3V2a1 1 0 011-1h3a1 1 0 011 1v1M5 6v5M8 6v5M2 3l.9 9a1 1 0 001 .9h5.2a1 1 0 001-.9L11 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4"/>
      </svg>
      Delete
    </button>
  );
}
