"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { formatDate, summaryPointsFromUnknown } from "@/lib/utils";

type SearchResult = {
  id: string;
  headline: string;
  category: string;
  publishedAt: string;
  sourceUrl: string | null;
  summaryPoints: string;
  slug: string;
};

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = (await res.json()) as { results: SearchResult[] };
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length >= 2) {
      setOpen(false);
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function selectResult(result: SearchResult) {
    setOpen(false);
    setQuery("");
    // Scroll to the page top and push the query so home refreshes
    router.push(`/?q=${encodeURIComponent(result.headline)}`);
  }

  return (
    <div className="search-wrap" ref={wrapRef}>
      <form className="search-form" onSubmit={handleSubmit} role="search">
        <div className="search-field">
          <span className="search-icon" aria-hidden="true">
            <svg fill="none" height="14" viewBox="0 0 14 14" width="14">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 10L13 13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
            </svg>
          </span>
          <input
            ref={inputRef}
            aria-autocomplete="list"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-label="Search archives"
            autoComplete="off"
            className="search-input"
            id="site-search"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search archives..."
            role="combobox"
            type="search"
            value={query}
          />
          {loading ? <span className="search-spinner" aria-hidden="true" /> : null}
        </div>
      </form>

      {open && (
        <div className="search-dropdown" role="listbox" aria-label="Search results">
          {results.length > 0 ? (
            <>
              <p className="search-dropdown-label">
                {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
              </p>
              <ul className="search-results-list">
                {results.map((result) => {
                  const points = summaryPointsFromUnknown(result.summaryPoints);
                  return (
                    <li key={result.id}>
                      <button
                        className="search-result-item"
                        onClick={() => selectResult(result)}
                        role="option"
                        type="button"
                      >
                        <div className="search-result-meta">
                          <span className="mono-chip">{result.category}</span>
                          <span className="section-meta">{formatDate(result.publishedAt)}</span>
                        </div>
                        <p className="search-result-headline">{result.headline}</p>
                        {points[0] ? (
                          <p className="search-result-point">{points[0]}</p>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="search-empty">No results for &ldquo;{query}&rdquo;</p>
          )}
        </div>
      )}
    </div>
  );
}
