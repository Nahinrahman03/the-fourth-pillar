"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { NEWS_SCOPE_OPTIONS } from "@/lib/news-scope";

const STORAGE_KEY = "tfp-submit-draft";
const initialPoints = ["", "", "", "", ""];

function clearFeedback(setMessage: (v: null) => void, setError: (v: null) => void) {
  setMessage(null);
  setError(null);
}

export function SubmitNewsForm() {
  const router = useRouter();
  const [headline, setHeadline] = useState("");
  const [category, setCategory] = useState("");
  const [scope, setScope] = useState("INDIA");
  const [sourceUrl, setSourceUrl] = useState("");
  const [details, setDetails] = useState("");
  const [points, setPoints] = useState(initialPoints);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as {
        headline?: string;
        category?: string;
        scope?: string;
        sourceUrl?: string;
        details?: string;
        points?: string[];
      };

      setHeadline(parsed.headline ?? "");
      setCategory(parsed.category ?? "");
      setScope(parsed.scope ?? "INDIA");
      setSourceUrl(parsed.sourceUrl ?? "");
      setDetails(parsed.details ?? "");
      setPoints(parsed.points?.length ? [...parsed.points, "", "", "", "", ""].slice(0, 5) : initialPoints);
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function saveDraft() {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        headline,
        category,
        scope,
        sourceUrl,
        details,
        points
      })
    );

    setMessage("Draft saved in this browser.");
    setError(null);
    setTimeout(() => setMessage(null), 3000);
  }

  async function submitNews() {
    // Client-side guard: require at least 2 filled bullet points
    const filledPoints = points.filter(Boolean);
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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          headline,
          category,
          scope,
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
      setScope("INDIA");
      setSourceUrl("");
      setDetails("");
      setPoints(initialPoints);
      window.localStorage.removeItem(STORAGE_KEY);
      setMessage(payload.message ?? "Submission sent for review.");
      router.refresh();
    } catch (cause) {
      const nextError = cause instanceof Error ? cause.message : "Submission failed.";
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
        void submitNews();
      }}
    >
      <div className="field">
        <div className="field-label-row">
          <label htmlFor="headline">News headline</label>
          <span className={`char-count${headline.length > 170 ? " char-count-warn" : ""}`}>
            {headline.length}/180
          </span>
        </div>
        <input
          className="input"
          id="headline"
          maxLength={180}
          onChange={(event) => {
            clearFeedback(setMessage, setError);
            setHeadline(event.target.value);
          }}
          placeholder="The core statement of the investigation..."
          value={headline}
        />
      </div>

      <div className="form-grid two">
        <div className="field">
          <div className="field-label-row">
            <label htmlFor="category">Category</label>
            <span className={`char-count${category.length > 30 ? " char-count-warn" : ""}`}>
              {category.length}/40
            </span>
          </div>
          <input
            className="input"
            id="category"
            maxLength={40}
            onChange={(event) => {
              clearFeedback(setMessage, setError);
              setCategory(event.target.value);
            }}
            placeholder="Urban policy, science, design..."
            value={category}
          />
        </div>
        <div className="field">
          <label htmlFor="scope">News scope</label>
          <select
            className="select"
            id="scope"
            onChange={(event) => {
              clearFeedback(setMessage, setError);
              setScope(event.target.value);
            }}
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
          <label htmlFor="sourceUrl">Source URL</label>
          <input
            className="input"
            id="sourceUrl"
            onChange={(event) => {
              clearFeedback(setMessage, setError);
              setSourceUrl(event.target.value);
            }}
            placeholder="https://..."
            value={sourceUrl}
          />
        </div>
        <div />
      </div>

      <div className="field-group">
        <div className="section-heading">
          <div>
            <p className="section-label">Supporting data points</p>
          </div>
          <p className="section-meta">Min 2 - Max 5</p>
        </div>

        {points.map((point, index) => (
          <div className="indexed-field" key={`point-${index}`}>
            <span>{`${index + 1}`.padStart(2, "0")}.</span>
            <textarea
              className="textarea"
              onChange={(event) => {
                clearFeedback(setMessage, setError);
                setPoints((current) =>
                  current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item))
                );
              }}
              placeholder={index < 2 ? "Critical observation..." : "Additional optional bullet..."}
              value={point}
            />
          </div>
        ))}
      </div>

      <div className="field">
        <label htmlFor="details">Submission notes</label>
        <textarea
          className="textarea"
          id="details"
          onChange={(event) => {
            clearFeedback(setMessage, setError);
            setDetails(event.target.value);
          }}
          placeholder="Optional context for the verification team."
          value={details}
        />
      </div>

      <div className="action-row">
        <button className="button" disabled={loading} type="submit">
          {loading ? "Submitting..." : "Submit for review"}
        </button>
        <button className="button-secondary" disabled={loading} onClick={saveDraft} type="button">
          Save draft
        </button>
      </div>

      <p className="helper">
        Approved news becomes public. Rejected submissions stay private and return with moderation notes.
      </p>

      {message ? <p className="status-message success">{message}</p> : null}
      {error ? <p className="status-message error">{error}</p> : null}
    </form>
  );
}
