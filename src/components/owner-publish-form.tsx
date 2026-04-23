"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { NEWS_SCOPE_OPTIONS } from "@/lib/news-scope";

const initialPoints = ["", "", "", "", ""];

export function OwnerPublishForm() {
  const router = useRouter();
  const [headline, setHeadline] = useState("");
  const [category, setCategory] = useState("");
  const [scope, setScope] = useState("INDIA");
  const [sourceUrl, setSourceUrl] = useState("");
  const [details, setDetails] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [points, setPoints] = useState(initialPoints);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function publish() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/news/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          headline,
          category,
          scope,
          sourceUrl,
          details,
          publishedAt,
          summaryText: points.filter(Boolean).join("\n")
        })
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not publish the news brief.");
      }

      setHeadline("");
      setCategory("");
      setScope("INDIA");
      setSourceUrl("");
      setDetails("");
      setPublishedAt("");
      setPoints(initialPoints);
      setMessage(payload.message ?? "Published.");
      router.refresh();
    } catch (cause) {
      const nextError = cause instanceof Error ? cause.message : "Could not publish the news brief.";
      setError(nextError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="editor-form stack"
      onSubmit={(event) => {
        event.preventDefault();
        void publish();
      }}
    >
      <div className="field">
        <label htmlFor="owner-headline">News headline</label>
        <input
          className="input"
          id="owner-headline"
          onChange={(event) => setHeadline(event.target.value)}
          placeholder="The core statement of the investigation..."
          value={headline}
        />
      </div>

      <div className="form-grid two">
        <div className="field">
          <label htmlFor="owner-category">Category</label>
          <input
            className="input"
            id="owner-category"
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Policy, Design, Technology..."
            value={category}
          />
        </div>
        <div className="field">
          <label htmlFor="owner-scope">News scope</label>
          <select
            className="select"
            id="owner-scope"
            onChange={(event) => setScope(event.target.value)}
            value={scope}
          >
            {NEWS_SCOPE_OPTIONS.map((option) => (
              <option key={option.scope} value={option.scope}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-grid two">
        <div className="field">
          <label htmlFor="owner-published-at">Publish time</label>
          <input
            className="input"
            id="owner-published-at"
            onChange={(event) => setPublishedAt(event.target.value)}
            placeholder="2026-04-11T14:30"
            type="datetime-local"
            value={publishedAt}
          />
        </div>
        <div className="field">
          <label htmlFor="owner-source-url">Source URL</label>
          <input
            className="input"
            id="owner-source-url"
            onChange={(event) => setSourceUrl(event.target.value)}
            placeholder="https://..."
            value={sourceUrl}
          />
        </div>
      </div>

      <div className="field-group">
        <div className="section-heading">
          <div>
            <p className="section-label">Supporting data points</p>
          </div>
          <p className="section-meta">Min 2 - Max 5</p>
        </div>

        {points.map((point, index) => (
          <div className="indexed-field" key={`owner-point-${index}`}>
            <span>{`${index + 1}`.padStart(2, "0")}.</span>
            <textarea
              className="textarea"
              onChange={(event) =>
                setPoints((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
              }
              placeholder={index < 2 ? "Critical observation..." : "Optional additional bullet..."}
              value={point}
            />
          </div>
        ))}
      </div>

      <div className="field">
        <label htmlFor="owner-details">Internal details</label>
        <textarea
          className="textarea"
          id="owner-details"
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Owner-only notes, editorial summary, linked context, or investigation detail."
          value={details}
        />
      </div>

      <div className="action-row">
        <button className="button" disabled={loading} type="submit">
          {loading ? "Publishing..." : "Publish brief"}
        </button>
      </div>

      {message ? <p className="status-message success">{message}</p> : null}
      {error ? <p className="status-message error">{error}</p> : null}
    </form>
  );
}
