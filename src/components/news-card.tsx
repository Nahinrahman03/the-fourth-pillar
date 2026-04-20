import type { NewsItem } from "@prisma/client";

import { DeleteNewsButton } from "@/components/delete-news-button";
import { FlagNewsButton } from "@/components/flag-news-button";
import { TimeAgo } from "@/components/time-ago";
import { summaryPointsFromUnknown } from "@/lib/utils";

type NewsCardProps = {
  item: NewsItem;
  isAdmin?: boolean;
  isLoggedIn?: boolean;
};

export function NewsCard({ item, isAdmin = false, isLoggedIn = false }: NewsCardProps) {
  const points = summaryPointsFromUnknown(item.summaryPoints);

  return (
    <article className="news-card">
      <div className="stack">
        <div className="news-card-header">
          <div className="meta-row">
            <span className="mono-chip">{item.category}</span>
            <span className="mono-chip">
              {item.scope === "INDIA" ? "Indian" : item.scope === "LOCAL" ? "Local" : "World"}
            </span>
            <TimeAgo date={item.publishedAt} />
          </div>
          <div className="news-card-actions">
            <FlagNewsButton newsId={item.id} isLoggedIn={isLoggedIn} />
            {isAdmin ? <DeleteNewsButton headline={item.headline} newsId={item.id} /> : null}
          </div>
        </div>
        <h3 className="card-title">{item.headline}</h3>
      </div>

      <ul className="summary-list">
        {points.map((point, index) => (
          <li key={`${item.id}-${index}`}>{point}</li>
        ))}
      </ul>

      {item.sourceUrl ? (
        <a className="utility-link" href={item.sourceUrl} rel="noreferrer" target="_blank">
          Source Archive
        </a>
      ) : null}
    </article>
  );
}
