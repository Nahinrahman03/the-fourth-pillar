"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PreferencesFormProps = {
  notifyInApp: boolean;
  notifyByEmail: boolean;
};

export function PreferencesForm(props: PreferencesFormProps) {
  const router = useRouter();
  const [notifyInApp, setNotifyInApp] = useState(props.notifyInApp);
  const [notifyByEmail, setNotifyByEmail] = useState(props.notifyByEmail);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function savePreferences() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/profile/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          notifyInApp,
          notifyByEmail
        })
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save preferences.");
      }

      setMessage(payload.message ?? "Preferences updated.");
      router.refresh();
    } catch (cause) {
      const nextError = cause instanceof Error ? cause.message : "Could not save preferences.";
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="info-panel stack">
      <div className="section-heading">
        <div>
          <p className="section-label">System alerts</p>
          <h2 className="section-title">Notification matrix</h2>
        </div>
      </div>

      <div className="toggle-list">
        <label className="toggle-row">
          <span>Breaking reports</span>
          <input checked={notifyInApp} onChange={(event) => setNotifyInApp(event.target.checked)} type="checkbox" />
        </label>
        <label className="toggle-row">
          <span>Contribution milestones</span>
          <input
            checked={notifyByEmail}
            onChange={(event) => setNotifyByEmail(event.target.checked)}
            type="checkbox"
          />
        </label>
      </div>

      <button className="button-secondary" disabled={loading} onClick={savePreferences} type="button">
        {loading ? "Saving..." : "Update alerts"}
      </button>

      {message ? <p className="status-message success">{message}</p> : null}
      {error ? <p className="status-message error">{error}</p> : null}
    </div>
  );
}
