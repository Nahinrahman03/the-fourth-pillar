"use client";

import { useEffect, useRef } from "react";

export function NewsTracker({ newsId }: { newsId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current || !ref.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !hasTracked.current) {
        hasTracked.current = true;
        fetch(`/api/news/${newsId}/track`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "view" }),
        }).catch(() => {});
        observer.disconnect();
      }
    }, { threshold: 0.5 });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [newsId]);

  return <div ref={ref} aria-hidden="true" style={{ position: "absolute", top: "50%", height: "1px", width: "1px", pointerEvents: "none" }} />;
}

export function TrackedSourceLink({ newsId, href, children, className }: { newsId: string, href: string, children: React.ReactNode, className?: string }) {
  const handleClick = () => {
    fetch(`/api/news/${newsId}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "click" }),
    }).catch(() => {});
  };

  return (
    <a
      className={className}
      href={href}
      rel="noreferrer"
      target="_blank"
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
