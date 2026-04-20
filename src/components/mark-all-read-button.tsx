"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkAllReadButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function markAllRead() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST"
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not update notifications.");
      }

      router.refresh();
    } catch (cause) {
      const nextError = cause instanceof Error ? cause.message : "Could not update notifications.";
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <button className="button-secondary" disabled={loading} onClick={markAllRead} type="button">
        {loading ? "Updating..." : "Mark all as read"}
      </button>
      {error ? <p className="status-message error">{error}</p> : null}
    </div>
  );
}
