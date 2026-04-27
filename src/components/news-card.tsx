import type { NewsItem } from "@prisma/client";

import { DeleteNewsButton } from "@/components/delete-news-button";
import { NewsCardMenu } from "@/components/news-card-menu";
import { NewsTracker, TrackedSourceLink } from "@/components/news-tracker";
import { TimeAgo } from "@/components/time-ago";
import { summaryPointsFromUnknown } from "@/lib/utils";

type NewsCardProps = {
  item: NewsItem;
  isAdmin?: boolean;
  isLoggedIn?: boolean;
  index?: number;
};

const SCOPE_LABELS: Record<string, string> = {
  INDIA: "India",
  LOCAL: "Local",
  WORLD: "World",
};

export function NewsCard({
  item,
  isAdmin = false,
  isLoggedIn = false,
  index = 0,
}: NewsCardProps) {
  const points = summaryPointsFromUnknown(item.summaryPoints);
  const scopeLabel = SCOPE_LABELS[item.scope] ?? item.scope;

  return (
    <article className="news-card" style={{ animationDelay: `${index * 60}ms`, position: "relative" }}>
      <NewsTracker newsId={item.id} />
      {/* Header row: chips + actions */}
      <div className="news-card-header">
        <div className="meta-row">
          <span className="cat-chip">{item.category}</span>
          <span className="cat-chip scope-chip">{scopeLabel}</span>
          <span className="time-stamp">
            <TimeAgo date={item.publishedAt} />
          </span>
        </div>
        <div className="news-card-actions">
          <NewsCardMenu newsId={item.id} headline={item.headline} isLoggedIn={isLoggedIn} />
          {isAdmin ? (
            <DeleteNewsButton headline={item.headline} newsId={item.id} />
          ) : null}
        </div>
      </div>

      {/* Headline */}
      <h3 className="card-title">{item.headline}</h3>

      {/* Summary points */}
      <ul className="summary-list">
        {points.map((point, i) => (
          <li key={`${item.id}-${i}`}>{point}</li>
        ))}
      </ul>

      {/* Source link */}
      {item.sourceUrl ? (
        <TrackedSourceLink
          newsId={item.id}
          href={item.sourceUrl}
          className="source-link"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M4 1H1v8h8V6M6 1h3m0 0v3M4.5 5.5L9 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Source Archive
        </TrackedSourceLink>
      ) : null}
    </article>
  );
}
