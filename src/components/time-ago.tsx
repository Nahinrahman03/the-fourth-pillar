"use client";

import { useEffect, useState } from "react";

type Props = {
  date: Date | string;
};

function getRelativeTime(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return "just now";

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return "just now";
  if (diffMin === 1) return "1 min ago";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr === 1) return "1 hour ago";
  if (diffHr < 24) return `${diffHr} hours ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay} days ago`;
  if (diffWeek === 1) return "1 week ago";
  if (diffWeek < 5) return `${diffWeek} weeks ago`;
  if (diffMonth === 1) return "1 month ago";
  if (diffMonth < 12) return `${diffMonth} months ago`;
  if (diffYear === 1) return "1 year ago";
  return `${diffYear} years ago`;
}

export function TimeAgo({ date }: Props) {
  const [label, setLabel] = useState(() => getRelativeTime(date));

  useEffect(() => {
    setLabel(getRelativeTime(date));

    // Determine update frequency based on age
    const diffMin = (Date.now() - new Date(date).getTime()) / 60_000;
    const interval = diffMin < 60 ? 30_000 : 60_000; // every 30s if recent, else 1min

    const timer = setInterval(() => setLabel(getRelativeTime(date)), interval);
    return () => clearInterval(timer);
  }, [date]);

  return (
    <time
      className="time-ago"
      dateTime={new Date(date).toISOString()}
      title={new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      })}
    >
      {label}
    </time>
  );
}
