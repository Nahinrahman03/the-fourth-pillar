"use client";

import { useState } from "react";

type FlagNewsButtonProps = {
  newsId: string;
  /** Pass true only when the user is authenticated (resolved server-side) */
  isLoggedIn: boolean;
};

export function FlagNewsButton({ newsId, isLoggedIn }: FlagNewsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flagged, setFlagged] = useState(false);

  // Not logged in → show a static prompt instead
  if (!isLoggedIn) {
    return (
      <div className="flag-box">
        <a className="flag-btn flag-signin-hint" href="/signin">
          Sign in to flag
        </a>
      </div>
    );
  }

  // Already successfully flagged → show confirmation only
  if (flagged) {
    return (
      <div className="flag-box">
        <span className="flag-feedback success">{message ?? "Flagged for review."}</span>
      </div>
    );
  }

  async function flagNews() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/news/${newsId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        remaining?: number;
        rateLimited?: boolean;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not flag this item.");
      }

      const remainingMsg =
        typeof payload.remaining === "number" && payload.remaining > 0
          ? ` (${payload.remaining} flag${payload.remaining !== 1 ? "s" : ""} left today)`
          : payload.remaining === 0
            ? " (no more flags available for now)"
            : "";

      setMessage((payload.message ?? "Flagged for review.") + remainingMsg);
      setFlagged(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not flag this news item.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flag-box">
      <button
        className="flag-btn"
        disabled={loading}
        onClick={() => void flagNews()}
        type="button"
      >
        {loading ? "Flagging…" : "Flag News"}
      </button>
      {error ? <span className="flag-feedback error">{error}</span> : null}
    </div>
  );
}
