"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "architect-dev-draft";
const MAX_POINTS = 5;

function computeScore(
  headline: string,
  category: string,
  sourceUrl: string,
  details: string,
  points: string[]
) {
  const filled = points.filter(Boolean).length;
  let score = 0;
  if (headline.trim().length >= 12) score += 25;
  if (category.trim().length >= 2) score += 20;
  if (sourceUrl.trim().length > 5) score += 15;
  if (filled >= 2) score += 25;
  if (filled >= 4) score += 10;
  if (details.trim().length > 10) score += 5;
  return Math.min(score, 100);
}

export function DevSubmitForm() {
  const router = useRouter();
  const [headline, setHeadline] = useState("");
  const [category, setCategory] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [details, setDetails] = useState("");
  const [points, setPoints] = useState(["", ""]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filledPoints = points.filter(Boolean);
  const score = computeScore(headline, category, sourceUrl, details, points);

  const checks = [
    {
      label: "Headline under 80 characters for maximum impact",
      done: headline.trim().length >= 12 && headline.trim().length <= 80
    },
    {
      label: "At least 2 verifiable data points from independent sources",
      done: filledPoints.length >= 2
    },
    {
      label: "Neutral, evidence-led tone — source URL provided",
      done: sourceUrl.trim().length > 5
    }
  ];

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as {
        headline?: string;
        category?: string;
        sourceUrl?: string;
        details?: string;
        points?: string[];
      };
      setHeadline(parsed.headline ?? "");
      setCategory(parsed.category ?? "");
      setSourceUrl(parsed.sourceUrl ?? "");
      setDetails(parsed.details ?? "");
      if (parsed.points?.length) {
        const restored = parsed.points.length >= 2
          ? parsed.points
          : [...parsed.points, ...Array(2 - parsed.points.length).fill("")];
        setPoints(restored);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function clearFeedback() {
    setMessage(null);
    setError(null);
  }

  function saveDraft() {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ headline, category, sourceUrl, details, points })
    );
    setMessage("Draft saved in this browser.");
    setError(null);
  }

  function addPoint() {
    if (points.length < MAX_POINTS) {
      setPoints((current) => [...current, ""]);
    }
  }

  async function submitNews() {
    if (filledPoints.length < 2) {
      setError("Please fill in at least 2 supporting data points.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline,
          category,
          sourceUrl,
          details,
          summaryText: filledPoints.join("\n")
        })
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Submission failed.");
      }

      setHeadline("");
      setCategory("");
      setSourceUrl("");
      setDetails("");
      setPoints(["", ""]);
      window.localStorage.removeItem(STORAGE_KEY);
      setMessage(payload.message ?? "Submission sent for review.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Submission failed.");
    } finally {
      setLoading(false);
    }
  }

  const scoreLabel =
    score >= 90 ? "Excellent" : score >= 60 ? "Pending Analysis" : "Incomplete";

  return (
    <section className="editorial-grid">
      {/* ── LEFT: Form ── */}
      <div className="stack">
        <form
          className="editor-form stack"
          onSubmit={(e) => {
            e.preventDefault();
            void submitNews();
          }}
        >
          <div className="field">
            <div className="field-label-row">
              <label htmlFor="dev-headline">News headline</label>
              <span className={`char-count${headline.length > 70 ? " char-count-warn" : ""}`}>
                {headline.length}/180
              </span>
            </div>
            <input
              className="input"
              id="dev-headline"
              maxLength={180}
              onChange={(e) => { clearFeedback(); setHeadline(e.target.value); }}
              placeholder="The core statement of the investigation..."
              value={headline}
            />
          </div>

          <div className="form-grid two">
            <div className="field">
              <div className="field-label-row">
                <label htmlFor="dev-category">Category</label>
                <span className={`char-count${category.length > 30 ? " char-count-warn" : ""}`}>
                  {category.length}/40
                </span>
              </div>
              <input
                className="input"
                id="dev-category"
                maxLength={40}
                onChange={(e) => { clearFeedback(); setCategory(e.target.value); }}
                placeholder="Urban policy, science, design..."
                value={category}
              />
            </div>
            <div className="field">
              <label htmlFor="dev-sourceUrl">Source URL</label>
              <input
                className="input"
                id="dev-sourceUrl"
                onChange={(e) => { clearFeedback(); setSourceUrl(e.target.value); }}
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
              <p className="section-meta">Min 2 — Max {MAX_POINTS}</p>
            </div>

            {points.map((point, index) => (
              <div className="indexed-field" key={`dev-point-${index}`}>
                <span>{`${index + 1}`.padStart(2, "0")}.</span>
                <textarea
                  className="textarea"
                  onChange={(e) => {
                    clearFeedback();
                    setPoints((current) =>
                      current.map((item, i) => (i === index ? e.target.value : item))
                    );
                  }}
                  placeholder={index < 2 ? "Critical observation..." : "Additional optional bullet..."}
                  value={point}
                />
              </div>
            ))}

            {points.length < MAX_POINTS && (
              <button
                className="dev-add-point"
                onClick={addPoint}
                type="button"
              >
                + Add another point
              </button>
            )}
          </div>

          <div className="field">
            <label htmlFor="dev-details">Submission notes</label>
            <textarea
              className="textarea"
              id="dev-details"
              onChange={(e) => { clearFeedback(); setDetails(e.target.value); }}
              placeholder="Optional context for the verification team."
              value={details}
            />
          </div>

          <div className="action-row">
            <button className="button" disabled={loading} type="submit">
              {loading ? "Submitting..." : "Submit for review ▶"}
            </button>
            <button className="button-secondary" disabled={loading} onClick={saveDraft} type="button">
              Save draft
            </button>
          </div>

          <p className="helper">
            Dev submissions go through the full pipeline — no validation bypassed.
          </p>

          {message ? <p className="status-message success">{message}</p> : null}
          {error ? <p className="status-message error">{error}</p> : null}
        </form>
      </div>

      {/* ── RIGHT: Sidebar ── */}
      <aside className="stack">
        {/* Architect's Checklist — live */}
        <article className="info-panel dark">
          <h2 className="section-title">Architect&apos;s checklist</h2>
          <ul className="dev-checklist">
            {checks.map((check, i) => (
              <li key={i} className={`dev-check-item${check.done ? " done" : ""}`}>
                <span className="dev-check-icon" aria-hidden="true">
                  {check.done ? "✓" : "○"}
                </span>
                <span>{check.label}</span>
              </li>
            ))}
          </ul>
        </article>

        {/* Integrity Score */}
        <article className="info-panel">
          <div className="section-heading">
            <h2 className="section-title">Submission status</h2>
            <span className="section-meta">{scoreLabel}</span>
          </div>
          <div className="dev-score-wrap">
            <div className="dev-score-header">
              <span className="section-label">Integrity score</span>
              <span className="dev-score-num">{score}</span>
            </div>
            <div className="dev-score-track">
              <div
                className={`dev-score-fill${score >= 60 ? " good" : ""}`}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
          <p className="section-meta">
            Automated semantic checks run when you submit the brief.
          </p>
        </article>

        {/* Architectural image panel */}
        <article className="dev-arch-panel">
          <div className="dev-arch-image" aria-hidden="true" />
          <p className="dev-arch-caption">PRECISION IN ARCHITECTURE</p>
        </article>
      </aside>
    </section>
  );
}
