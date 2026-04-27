import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "AI Intelligence Feed | The Fourth Pillar",
  description:
    "Autonomous AI-powered news intelligence. Fetched every hour from multiple LLM providers with credibility and real/fake probability scores.",
  robots: { index: true, follow: true },
};

// Revalidate this page every 3600 seconds (1 hour) — matches the fetch cadence
export const revalidate = 3600;

type ScopeFilter = "ALL" | "LOCAL" | "INDIA" | "WORLD";

const SCOPE_LABELS: Record<ScopeFilter, string> = {
  ALL: "All",
  LOCAL: "Local",
  INDIA: "India",
  WORLD: "World",
};

const PROVIDER_COLORS: Record<string, string> = {
  gemini: "#4285F4",
  groq: "#FF6B6B",
  cohere: "#39E09B",
  mistral: "#FF7043",
};

const PROVIDER_NAMES: Record<string, string> = {
  gemini: "Gemini",
  groq: "Groq",
  cohere: "Cohere",
  mistral: "Mistral",
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
  const scope =
    rawScope && ["LOCAL", "INDIA", "WORLD"].includes(rawScope.toUpperCase())
      ? rawScope.toUpperCase()
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
          Independently fetched every hour from{" "}
          <strong>4 AI providers</strong>. Each story includes a credibility
          score and real-vs-fake probability computed across providers.
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
                {new Date(lastFetch.fetchedAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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
          AI-generated content. Scores reflect model confidence, not verified fact-checking.
          Always cross-reference with primary sources.
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
            <div className="ai-empty-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
            </div>
            <p className="ai-empty-text">No AI briefs synced yet.</p>
            <p className="ai-empty-hint">
              A developer needs to configure and enable at least one AI provider
              from the Dev dashboard, then trigger an initial fetch.
            </p>
          </div>
        ) : (
          items.map((item, idx) => {
            const points: string[] = (() => {
              try { return JSON.parse(item.summaryPoints); } catch { return []; }
            })();
            const breakdown: Record<string, { score: number; realProb: number; model: string }> = (() => {
              try { return JSON.parse(item.providerBreakdown); } catch { return {}; }
            })();
            const cred = credibilityLabel(item.credibilityScore);
            const providerSlugs = Object.keys(breakdown);

            return (
              <article
                key={item.id}
                className="ai-news-card"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Top meta row */}
                <div className="ai-card-meta">
                  <span className="ai-cat-chip">{item.category}</span>
                  <span className="ai-scope-chip">{item.scope}</span>
                  <time className="ai-card-time" dateTime={item.fetchedAt.toISOString()}>
                    {new Date(item.fetchedAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </div>

                {/* Headline */}
                <h2 className="ai-card-headline">{item.headline}</h2>

                {/* Summary bullets */}
                <ul className="ai-card-points">
                  {points.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>

                {/* Source hint */}
                {item.sourceHint && (
                  <div className="ai-card-source">
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                      <path d="M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    Sources: {item.sourceHint}
                  </div>
                )}

                {/* ── Credibility bar section ── */}
                <div className="ai-credibility-section">
                  {/* Credibility score */}
                  <div className="ai-score-row">
                    <div className="ai-score-item">
                      <span className="ai-score-label">Credibility</span>
                      <div className="ai-score-bar-wrap">
                        <div
                          className="ai-score-bar"
                          style={{
                            width: `${item.credibilityScore}%`,
                            background: cred.color,
                          }}
                        />
                      </div>
                      <span className="ai-score-value" style={{ color: cred.color }}>
                        {Math.round(item.credibilityScore)}%{" "}
                        <span className="ai-score-tag">{cred.label}</span>
                      </span>
                    </div>

                    <div className="ai-score-item">
                      <span className="ai-score-label">Real News Probability</span>
                      <div className="ai-score-bar-wrap">
                        <div
                          className="ai-score-bar"
                          style={{
                            width: `${item.realProbability}%`,
                            background:
                              item.realProbability >= 70
                                ? "var(--accent-green)"
                                : item.realProbability >= 50
                                  ? "var(--accent-amber)"
                                  : "var(--alert)",
                          }}
                        />
                      </div>
                      <span className="ai-score-value">
                        {Math.round(item.realProbability)}%
                        <span className="ai-score-tag">
                          {item.realProbability >= 70 ? "REAL" : item.realProbability >= 50 ? "UNCERTAIN" : "SUSPECT"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Provider breakdown */}
                  {providerSlugs.length > 0 && (
                    <div className="ai-provider-row">
                      <span className="ai-provider-label">Sourced from:</span>
                      {providerSlugs.map((slug) => (
                        <span
                          key={slug}
                          className="ai-provider-badge"
                          style={{ borderColor: PROVIDER_COLORS[slug] ?? "#666" }}
                          title={`${PROVIDER_NAMES[slug] ?? slug} — Credibility: ${Math.round(breakdown[slug].score)}% | Real: ${Math.round(breakdown[slug].realProb)}%`}
                        >
                          <span
                            className="ai-provider-dot"
                            style={{ background: PROVIDER_COLORS[slug] ?? "#666" }}
                          />
                          {PROVIDER_NAMES[slug] ?? slug}
                          <span className="ai-provider-score">{Math.round(breakdown[slug].score)}%</span>
                        </span>
                      ))}
                    </div>
                  )}
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
