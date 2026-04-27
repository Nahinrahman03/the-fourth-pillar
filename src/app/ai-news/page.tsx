import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AiNewsCardMenu } from "@/components/ai-news-card-menu";
import { TimeAgo } from "@/components/time-ago";

export const metadata: Metadata = {
  title: "AI Intelligence Feed | The Fourth Pillar",
  description:
    "Autonomous AI-powered news intelligence. Fetched every hour from multiple LLM providers with credibility and real/fake probability scores.",
  robots: { index: true, follow: true },
};

// Revalidate this page every 3600 seconds (1 hour)
export const revalidate = 3600;

type ScopeFilter = "ALL" | "LOCAL" | "INDIA" | "WORLD";

const SCOPE_LABELS: Record<ScopeFilter, string> = {
  ALL: "All",
  LOCAL: "Local",
  INDIA: "India",
  WORLD: "World",
};

function credibilityLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "HIGH", color: "var(--accent-green)" };
  if (score >= 60) return { label: "MEDIUM", color: "var(--accent-amber)" };
  return { label: "LOW", color: "var(--alert)" };
}

export default async function AiNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; category?: string }>;
}) {
  const { scope: rawScope, category } = await searchParams;
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session;
  const isAdmin = session?.user?.role === "ADMIN";

  const scope =
    rawScope && ["LOCAL", "INDIA", "WORLD"].includes(rawScope.toUpperCase())
      ? (rawScope.toUpperCase() as "LOCAL" | "INDIA" | "WORLD")
      : undefined;

  const [items, lastFetch, totalCount] = await Promise.all([
    prisma.aiNewsItem.findMany({
      where: {
        isActive: true,
        ...(scope ? { scope } : {}),
        ...(category ? { category: { contains: category, mode: "insensitive" } } : {}),
      },
      orderBy: { fetchedAt: "desc" },
      take: 30,
    }).catch(() => []),
    prisma.aiNewsItem.findFirst({
      orderBy: { fetchedAt: "desc" },
      select: { fetchedAt: true },
    }).catch(() => null),
    prisma.aiNewsItem.count({ where: { isActive: true } }).catch(() => 0),
  ]);

  const SCOPE_TABS: ScopeFilter[] = ["ALL", "LOCAL", "INDIA", "WORLD"];

  return (
    <section className="ai-feed-layout">
      {/* ── Header ── */}
      <div className="ai-feed-header">
        <div className="ai-feed-badge">
          <span className="ai-feed-pulse" aria-hidden="true" />
          AI Intelligence
        </div>
        <h1 className="ai-feed-title">Autonomous<br />News Briefing</h1>
        <p className="ai-feed-subtitle">
          Independently fetched every hour. Each story includes a credibility
          score and real-vs-fake probability computed across multiple AI models.
        </p>

        {/* Stats row */}
        <div className="ai-feed-stats">
          <div className="ai-stat">
            <span className="ai-stat-value">{totalCount}</span>
            <span className="ai-stat-label">Total Briefs</span>
          </div>
          <div className="ai-stat">
            <span className="ai-stat-value">4</span>
            <span className="ai-stat-label">AI Providers</span>
          </div>
          <div className="ai-stat">
            <span className="ai-stat-value">~1hr</span>
            <span className="ai-stat-label">Fetch Cycle</span>
          </div>
          {lastFetch && (
            <div className="ai-stat">
              <span className="ai-stat-value ai-stat-time">
                <TimeAgo date={lastFetch.fetchedAt} />
              </span>
              <span className="ai-stat-label">Last Sync</span>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="ai-disclaimer">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
            <path d="M7 5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          AI-generated content. Scores reflect model confidence. Always cross-reference with primary sources.
        </div>
      </div>

      {/* ── Scope tabs ── */}
      <nav className="ai-scope-tabs" aria-label="Scope filter">
        {SCOPE_TABS.map((s) => (
          <Link
            key={s}
            href={s === "ALL" ? "/ai-news" : `/ai-news?scope=${s}`}
            className={`ai-scope-tab${(!scope && s === "ALL") || scope === s ? " active" : ""}`}
          >
            {SCOPE_LABELS[s]}
          </Link>
        ))}
      </nav>

      {/* ── Feed ── */}
      <div className="ai-news-feed">
        {items.length === 0 ? (
          <div className="ai-empty">
            <p className="ai-empty-text">No AI briefs synced yet.</p>
          </div>
        ) : (
          items.map((item, idx) => {
            const points: string[] = (() => {
              try { return JSON.parse(item.summaryPoints); } catch { return []; }
            })();
            const cred = credibilityLabel(item.credibilityScore);

            return (
              <article
                key={item.id}
                className="news-card"
                style={{ animationDelay: `${idx * 50}ms`, position: "relative" }}
              >
                {/* Header row: chips + actions */}
                <div className="news-card-header">
                  <div className="meta-row">
                    <span className="cat-chip">{item.category}</span>
                    <span className="cat-chip scope-chip">{item.scope}</span>
                    <span className="time-stamp">
                      <TimeAgo date={item.fetchedAt} />
                    </span>
                  </div>
                  <div className="news-card-actions">
                    <AiNewsCardMenu newsId={item.id} headline={item.headline} isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
                  </div>
                </div>

                {/* Headline */}
                <h3 className="card-title">{item.headline}</h3>

                {/* Summary points */}
                <ul className="summary-list">
                  {points.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>

                {/* Source link */}
                <div className="ai-card-footer" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--line)', paddingTop: '1rem' }}>
                  {item.sourceHint && (
                    <div className="ai-card-source" style={{ fontSize: '0.8rem', color: 'var(--ink-soft)', marginBottom: '0.5rem' }}>
                      {item.sourceUrl ? (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="source-link"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M4 1H1v8h8V6M6 1h3m0 0v3M4.5 5.5L9 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Reported by: {item.sourceHint}
                        </a>
                      ) : (
                        <span>Source: {item.sourceHint}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* ── AI Intelligence Metrics ── */}
                <div className="ai-metrics-footer" style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '4px', border: '1px dashed var(--line)' }}>
                  <div className="ai-score-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="ai-score-item" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-soft)', width: '70px' }}>CREDIBILITY</span>
                      <div style={{ flex: 1, height: '4px', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${item.credibilityScore}%`, height: '100%', background: cred.color }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: cred.color, minWidth: '40px' }}>{Math.round(item.credibilityScore)}%</span>
                    </div>

                    <div className="ai-score-item" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--ink-soft)', width: '70px' }}>REALITY PROB</span>
                      <div style={{ flex: 1, height: '4px', background: 'var(--line)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${item.realProbability}%`, 
                            height: '100%', 
                            background: item.realProbability >= 70 ? "var(--accent-green)" : item.realProbability >= 50 ? "var(--accent-amber)" : "var(--alert)" 
                          }} 
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink)', minWidth: '40px' }}>{Math.round(item.realProbability)}%</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* ── API CTA ── */}
      <div className="ai-api-cta">
        <div className="ai-api-cta-content">
          <div className="ai-api-cta-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h7" strokeLinecap="round" />
              <circle cx="19" cy="18" r="3" />
              <path d="M22 21l-1.5-1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="ai-api-cta-title">Use this data in your own apps</p>
            <code className="ai-api-cta-url">GET /api/ai-intelligence</code>
          </div>
        </div>
        <div className="ai-api-cta-params">
          <span>?scope=INDIA</span>
          <span>?category=Technology</span>
          <span>?minCredibility=70</span>
          <span>?limit=10</span>
        </div>
      </div>
    </section>
  );
}
