"use client";

import { useState, useEffect } from "react";

type AiProvider = {
  id: string;
  name: string;
  slug: string;
  model: string;
  apiKeyEnv: string;
  enabled: boolean;
  weight: number;
  lastUsedAt: string | null;
};

type FetchResult = {
  success: boolean;
  saved?: number;
  errors?: string[];
  providers?: { slug: string; itemsFetched: number; error: string | null }[];
  triggeredAt?: string;
  error?: string;
};

type AiNewsPreview = {
  id: string;
  headline: string;
  category: string;
  scope: string;
  credibilityScore: number;
  realProbability: number;
  fetchedAt: string;
  providerBreakdown: Record<string, { score: number; realProb: number; model: string }>;
};

const PROVIDER_COLORS: Record<string, string> = {
  openrouter: "#6F42C1",
  gemini: "#4285F4",
  groq: "#FF6B6B",
  cohere: "#39E09B",
  mistral: "#FF7043",
};

const PROVIDER_FREE_LINKS: Record<string, string> = {
  openrouter: "https://openrouter.ai/keys",
  gemini: "https://aistudio.google.com/app/apikey",
  groq: "https://console.groq.com/keys",
  cohere: "https://dashboard.cohere.com/api-keys",
  mistral: "https://console.mistral.ai/api-keys/",
};

export function AiIntelligencePanel() {
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [lastResult, setLastResult] = useState<FetchResult | null>(null);
  const [recentItems, setRecentItems] = useState<AiNewsPreview[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    loadProviders();
    loadStats();
  }, []);

  async function loadProviders() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-intelligence/providers");
      const data = await res.json();
      setProviders(data.providers ?? []);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/ai-intelligence?limit=5");
      const data = await res.json();
      setRecentItems(data.data ?? []);
      setTotalItems(data.pagination?.total ?? 0);
    } catch {
      setRecentItems([]);
    } finally {
      setStatsLoading(false);
    }
  }

  async function toggleProvider(id: string, enabled: boolean) {
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled } : p))
    );
    await fetch("/api/ai-intelligence/providers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, enabled }),
    });
  }

  async function updateWeight(id: string, weight: number) {
    await fetch("/api/ai-intelligence/providers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, weight }),
    });
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, weight } : p))
    );
  }

  async function updateModel(id: string, model: string) {
    await fetch("/api/ai-intelligence/providers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, model }),
    });
    setProviders((prev) =>
      prev.map((p) => (p.id === id ? { ...p, model } : p))
    );
  }

  async function triggerFetch() {
    setFetching(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/ai-intelligence/fetch", { method: "POST" });
      const data = await res.json();
      setLastResult(data);
      await loadStats();
    } catch (err) {
      setLastResult({ success: false, error: String(err) });
    } finally {
      setFetching(false);
    }
  }

  const enabledCount = providers.filter((p) => p.enabled).length;

  return (
    <div className="ai-intel-panel">
      {/* ── Header ── */}
      <div className="ai-intel-header">
        <div>
          <h2 className="ai-intel-title">AI Intelligence Engine</h2>
          <p className="ai-intel-subtitle">
            Manage LLM providers, monitor fetch cycles, and trigger manual syncs.
            This system is completely independent of the manual news pipeline.
          </p>
        </div>
        <a href="/ai-news" target="_blank" rel="noopener" className="ai-intel-view-btn">
          View Public Feed →
        </a>
      </div>

      {/* ── Stats row ── */}
      <div className="ai-intel-stats">
        <div className="ai-intel-stat">
          <span className="ai-intel-stat-value">{statsLoading ? "…" : totalItems}</span>
          <span className="ai-intel-stat-label">Total AI Briefs</span>
        </div>
        <div className="ai-intel-stat">
          <span className="ai-intel-stat-value" style={{ color: enabledCount > 0 ? "var(--accent-green)" : "var(--alert)" }}>
            {loading ? "…" : enabledCount} / {providers.length}
          </span>
          <span className="ai-intel-stat-label">Providers Active</span>
        </div>
        <div className="ai-intel-stat">
          <span className="ai-intel-stat-value">{statsLoading || recentItems.length === 0 ? "—" : `${Math.round(recentItems[0]?.credibilityScore ?? 0)}%`}</span>
          <span className="ai-intel-stat-label">Avg Credibility</span>
        </div>
      </div>

      {/* ── Manual fetch trigger ── */}
      <div className="ai-intel-trigger-section">
        <div className="ai-intel-section-label">Manual Sync</div>
        <div className="ai-intel-trigger-row">
          <div>
            <p className="ai-intel-trigger-desc">
              Manually trigger a fetch from all enabled providers. This is also callable
              via cron using the <code>AI_CRON_SECRET</code> env var.
            </p>
            <code className="ai-intel-cron-hint">
              POST /api/ai-intelligence/fetch<br />
              Authorization: Bearer $AI_CRON_SECRET
            </code>
          </div>
          <button
            id="ai-fetch-btn"
            onClick={triggerFetch}
            disabled={fetching || enabledCount === 0}
            className="ai-intel-fetch-btn"
          >
            {fetching ? (
              <><span className="ai-spin" /> Fetching…</>
            ) : (
              <><span className="ai-bolt">⚡</span> Run Fetch Now</>
            )}
          </button>
        </div>

        {/* Fetch result */}
        {lastResult && (
          <div className={`ai-intel-result ${lastResult.success ? "success" : "error"}`}>
            {lastResult.success ? (
              <>
                <strong>✓ Fetch complete.</strong> Saved {lastResult.saved} new brief{lastResult.saved !== 1 ? "s" : ""}.
                {lastResult.providers && (
                  <div className="ai-result-providers">
                    {lastResult.providers.map((p) => (
                      <span key={p.slug} className={`ai-result-provider ${p.error ? "error" : "ok"}`}>
                        {p.slug}: {p.error ? `Error — ${p.error}` : `${p.itemsFetched} items`}
                      </span>
                    ))}
                  </div>
                )}
                {lastResult.errors && lastResult.errors.length > 0 && (
                  <div className="ai-result-errors">
                    {lastResult.errors.map((e, i) => <span key={i}>⚠ {e}</span>)}
                  </div>
                )}
              </>
            ) : (
              <><strong>✗ Fetch failed.</strong> {lastResult.error}</>
            )}
          </div>
        )}
      </div>

      {/* ── Provider configuration ── */}
      <div className="ai-intel-providers">
        <div className="ai-intel-section-label">Provider Configuration</div>
        {loading ? (
          <div className="ai-providers-loading">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="ai-provider-card skeleton-pulse" style={{ height: 120 }} />
            ))}
          </div>
        ) : (
          <div className="ai-providers-grid">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`ai-provider-card ${provider.enabled ? "enabled" : "disabled"}`}
                style={{ borderLeftColor: PROVIDER_COLORS[provider.slug] ?? "#444" }}
              >
                {/* Provider header */}
                <div className="ai-provider-card-header">
                  <div className="ai-provider-name-row">
                    <span
                      className="ai-provider-dot-lg"
                      style={{ background: PROVIDER_COLORS[provider.slug] ?? "#666" }}
                    />
                    <span className="ai-provider-name">{provider.name}</span>
                    {provider.lastUsedAt && (
                      <span className="ai-provider-last-used">
                        Last used {new Date(provider.lastUsedAt).toLocaleDateString("en-IN")}
                      </span>
                    )}
                  </div>

                  {/* Toggle */}
                  <button
                    onClick={() => toggleProvider(provider.id, !provider.enabled)}
                    className={`ai-toggle-btn ${provider.enabled ? "on" : "off"}`}
                    aria-label={`${provider.enabled ? "Disable" : "Enable"} ${provider.name}`}
                  >
                    <span className="ai-toggle-knob" />
                  </button>
                </div>

                {/* API Key info */}
                <div className="ai-provider-key-row">
                  <div>
                    <span className="ai-provider-key-label">Env Variable</span>
                    <code className="ai-provider-key-env">{provider.apiKeyEnv}</code>
                  </div>
                  <a
                    href={PROVIDER_FREE_LINKS[provider.slug]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ai-get-key-link"
                  >
                    Get free key →
                  </a>
                </div>

                {/* Model input */}
                <div className="ai-provider-model-row">
                  <label className="ai-provider-key-label" htmlFor={`model-${provider.id}`}>
                    Model Slug
                  </label>
                  <input
                    id={`model-${provider.id}`}
                    className="ai-model-input"
                    defaultValue={provider.model}
                    onBlur={(e) => {
                      if (e.target.value !== provider.model) {
                        updateModel(provider.id, e.target.value);
                      }
                    }}
                    placeholder="e.g. gemini-1.5-flash"
                  />
                </div>

                {/* Weight slider */}
                <div className="ai-provider-weight-row">
                  <label className="ai-provider-key-label" htmlFor={`weight-${provider.id}`}>
                    Credibility Weight: <strong>{provider.weight.toFixed(1)}×</strong>
                  </label>
                  <input
                    id={`weight-${provider.id}`}
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={provider.weight}
                    className="ai-weight-slider"
                    onChange={(e) =>
                      setProviders((prev) =>
                        prev.map((p) =>
                          p.id === provider.id ? { ...p, weight: parseFloat(e.target.value) } : p
                        )
                      )
                    }
                    onMouseUp={(e) => updateWeight(provider.id, parseFloat((e.target as HTMLInputElement).value))}
                    onTouchEnd={(e) => updateWeight(provider.id, parseFloat((e.target as HTMLInputElement).value))}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent AI items preview ── */}
      <div className="ai-intel-recent">
        <div className="ai-intel-section-label">Recent AI Briefs (last 5)</div>
        {statsLoading ? (
          <div className="ai-recent-loading">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton-pulse" style={{ height: 56, marginBottom: 8 }} />
            ))}
          </div>
        ) : recentItems.length === 0 ? (
          <div className="ai-recent-empty">No briefs fetched yet. Run a fetch above to get started.</div>
        ) : (
          <div className="ai-recent-list">
            {recentItems.map((item) => {
              const breakdown = item.providerBreakdown;
              const providerSlugs = Object.keys(breakdown);
              return (
                <div key={item.id} className="ai-recent-item">
                  <div className="ai-recent-item-main">
                    <span className="ai-recent-cat">{item.category}</span>
                    <span className="ai-recent-scope">{item.scope}</span>
                    <span className="ai-recent-headline">{item.headline}</span>
                  </div>
                  <div className="ai-recent-item-scores">
                    <span className="ai-recent-score" title="Credibility">
                      🎯 {Math.round(item.credibilityScore)}%
                    </span>
                    <span className="ai-recent-score" title="Real probability">
                      ✓ {Math.round(item.realProbability)}%
                    </span>
                    {providerSlugs.map((slug) => (
                      <span
                        key={slug}
                        className="ai-recent-provider-dot"
                        style={{ background: PROVIDER_COLORS[slug] ?? "#666" }}
                        title={slug}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Public API docs ── */}
      <div className="ai-intel-api-docs">
        <div className="ai-intel-section-label">Unified API Reference</div>
        <div className="ai-api-doc-grid">
          <div className="ai-api-doc-item">
            <code>GET /api/ai-intelligence</code>
            <p>Public endpoint. Returns AI news briefs with credibility scores.</p>
          </div>
          <div className="ai-api-doc-item">
            <code>?scope=INDIA|WORLD|LOCAL</code>
            <p>Filter by geographic scope.</p>
          </div>
          <div className="ai-api-doc-item">
            <code>?category=Technology</code>
            <p>Filter by news category.</p>
          </div>
          <div className="ai-api-doc-item">
            <code>?minCredibility=70</code>
            <p>Only return items with credibility ≥ threshold.</p>
          </div>
          <div className="ai-api-doc-item">
            <code>?limit=20&page=1</code>
            <p>Pagination. Default limit: 20. Max: 100.</p>
          </div>
          <div className="ai-api-doc-item">
            <code>POST /api/ai-intelligence/fetch</code>
            <p>Trigger a fetch. Requires admin session or <code>AI_CRON_SECRET</code> header.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
