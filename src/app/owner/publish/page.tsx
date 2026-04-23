import { FlagReviewActions } from "@/components/flag-review-actions";
import { OwnerPublishForm } from "@/components/owner-publish-form";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPendingFlagQueue } from "@/lib/news";
import { formatDate, summaryPointsFromUnknown } from "@/lib/utils";

export default async function OwnerPublishPage() {
  const owner = await requireAdmin();
  const [recentNews, pendingFlags] = await Promise.all([
    prisma.newsItem.findMany({
      orderBy: {
        publishedAt: "desc"
      },
      take: 6
    }),
    getPendingFlagQueue()
  ]);

  return (
    <section className="editorial-grid">
      <div className="stack">
        <div className="page-heading">
          <p className="page-kicker">Workspace / Owner Desk</p>
          <h1 className="page-title">Publish News</h1>
          <p className="page-subtitle">
            Direct publishing is reserved for the owner and editorial leads. Each published brief can include
            private internal detail while the public archive stays concise.
          </p>
        </div>

        <OwnerPublishForm />
      </div>

      <aside className="stack">
        <article className="info-panel dark">
          <h2 className="section-title">Owner protocol</h2>
          <ul className="summary-list">
            <li>Use direct publish only for already-verified briefs.</li>
            <li>Keep the public summary tight at 2 to 5 points.</li>
            <li>Internal details stay stored for the owner workspace.</li>
          </ul>
        </article>

        <article className="info-panel">
          <h2 className="section-title">Current owner</h2>
          <p className="section-meta">{owner.email ?? owner.phoneNumber}</p>
        </article>

        <article className="info-panel">
          <div className="section-heading">
            <div>
              <p className="section-label">Flagged news</p>
              <h2 className="section-title">Developer review queue</h2>
            </div>
            <p className="section-meta">{pendingFlags.length} pending</p>
          </div>

          <div className="stack">
            {pendingFlags.length > 0 ? (
              pendingFlags.map((flag) => (
                <article className="archive-row flagged-row" key={flag.id}>
                  <div>
                    <p className="section-label">
                      {flag.newsItem.scope === "INDIA" ? "Indian" : flag.newsItem.scope === "LOCAL" ? "Local" : "World"}
                    </p>
                    <h3 className="card-title">{flag.newsItem.headline}</h3>
                    <p className="section-meta">
                      Flagged {formatDate(flag.createdAt)} | by {flag.reporter?.email ?? flag.reporter?.phoneNumber ?? "member"}
                    </p>
                  </div>
                  <FlagReviewActions flagId={flag.id} />
                </article>
              ))
            ) : (
              <div className="empty-state">No flagged news is waiting for review.</div>
            )}
          </div>
        </article>

        <article className="info-panel">
          <div className="section-heading">
            <div>
              <p className="section-label">Recent publications</p>
              <h2 className="section-title">Latest live briefs</h2>
            </div>
          </div>

          <div className="stack">
            {recentNews.map((item) => (
              <article className="archive-row" key={item.id}>
                <div>
                  <p className="section-label">{item.category}</p>
                  <h3 className="card-title">{item.headline}</h3>
                  <p className="section-meta">{formatDate(item.publishedAt)}</p>
                </div>
                <div className="section-meta">{summaryPointsFromUnknown(item.summaryPoints).length} points</div>
              </article>
            ))}
          </div>
        </article>
      </aside>
    </section>
  );
}
