"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TrendingItem = {
  headline: string;
  category: string;
  slug?: string;
};

export function TrendingAlert() {
  const [items, setItems]       = useState<TrendingItem[]>([]);
  const [current, setCurrent]   = useState(0);
  const [visible, setVisible]   = useState(true);
  const [entering, setEntering] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  /* Fetch trending headlines once on mount */
  useEffect(() => {
    fetch("/api/trending-alert")
      .then((r) => r.json())
      .then((d: { items: TrendingItem[] }) => {
        if (Array.isArray(d.items) && d.items.length > 0) setItems(d.items);
      })
      .catch(() => {});
  }, []);

  /* Rotate every 6 seconds */
  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setEntering(true);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % items.length);
        setEntering(false);
      }, 300);
    }, 6000);
    return () => clearInterval(id);
  }, [items]);

  if (dismissed || items.length === 0) return null;

  const item = items[current];

  return (
    <div
      className="trending-alert-bar"
      role="alert"
      aria-live="polite"
      style={{ display: visible ? "flex" : "none" }}
    >
      {/* Left label */}
      <div className="trending-alert-label">
        <span className="trending-alert-dot" aria-hidden="true" />
        TRENDING
      </div>

      {/* Ticker content */}
      <div className="trending-alert-content">
        <span
          className={`trending-alert-text${entering ? " trending-alert-exit" : ""}`}
        >
          <span className="trending-alert-cat">{item.category}</span>
          {item.headline}
        </span>
      </div>

      {/* Dot pager */}
      {items.length > 1 && (
        <div className="trending-alert-pager">
          {items.map((_, i) => (
            <button
              key={i}
              aria-label={`Trending item ${i + 1}`}
              onClick={() => setCurrent(i)}
              className={`trending-alert-pip${i === current ? " active" : ""}`}
            />
          ))}
        </div>
      )}

      {/* Dismiss */}
      <button
        className="trending-alert-close"
        aria-label="Dismiss trending alert"
        onClick={() => setDismissed(true)}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}
