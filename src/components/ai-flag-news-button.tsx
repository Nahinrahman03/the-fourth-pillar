"use client";

import { useState } from "react";

type AiFlagNewsButtonProps = {
  newsId: string;
  isLoggedIn: boolean;
};

export function AiFlagNewsButton({ newsId, isLoggedIn }: AiFlagNewsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flagged, setFlagged] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="flag-box">
        <a className="flag-btn flag-signin-hint" href="/signin">
          Sign in to flag
        </a>
      </div>
    );
  }

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
      const response = await fetch(`/api/ai-intelligence/news/${newsId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not flag this item.");
      }

      setMessage(payload.message ?? "Flagged for review.");
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
