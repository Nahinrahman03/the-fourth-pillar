"use client";

import { useState, useRef, useEffect } from "react";
import { FlagNewsButton } from "./flag-news-button";

type Props = {
  newsId: string;
  headline: string;
  isLoggedIn: boolean;
};

export function NewsCardMenu({ newsId, headline, isLoggedIn }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleShare() {
    const url = window.location.origin + `/?q=${encodeURIComponent(headline)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: headline,
          text: `Check out this news: ${headline}`,
          url: url,
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    }
    setIsOpen(false);
  }

  return (
    <div className="news-menu-container" ref={menuRef} style={{ position: "relative" }}>
      <button 
        className="news-menu-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More options"
        style={{
          background: "transparent",
          border: "none",
          color: "var(--ink-soft)",
          cursor: "pointer",
          padding: "4px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "color 140ms ease",
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink)"}
        onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-soft)"}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="news-menu-dropdown"
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: "4px",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            minWidth: "140px",
            animation: "dropdown-in 120ms ease",
          }}
        >
          <button 
            className="search-result-item" 
            onClick={handleShare}
            style={{ 
              padding: "12px 16px", 
              borderBottom: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--ink)" }}>Share</span>
          </button>
          
          <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
            <FlagNewsButton newsId={newsId} isLoggedIn={isLoggedIn} />
          </div>
        </div>
      )}
    </div>
  );
}
