"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { TimeAgo } from "@/components/time-ago";
import { AiIntelligencePanel } from "@/components/ai-intelligence-panel";

/* ═══ Types ═══════════════════════════════════════════════ */
type Period = "daily" | "weekly" | "monthly";
type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

type Stats = {
  totalSubmissions: number; activeContributors: number; pointsToday: number;
  systemResponseMs: number; pendingCount: number; approvedCount: number;
  rejectedCount: number; totalUsers: number; totalNewsItems: number; velocity: number;
};
type ChartData = { labels: string[]; submissions: number[]; verifications: number[] };
type RecentItem = { id: string; contributor: string; category: string; status: string; points: number; createdAt: string };
type SecurityData = { authFailures: number; expiredCodes: number; activeSessions: number };
type AnalyticsPayload = { stats: Stats; chart: ChartData; recentSubmissions: RecentItem[]; security: SecurityData };

type UserRow = {
  id: string; email: string | null; phoneNumber: string | null; name: string | null;
  role: string; createdAt: string;
  profile: { points: number; lastSeenAt: string | null } | null;
  _count: { submissions: number };
};

type ContribRow = {
  id: string; fullId: string; headline: string; category: string; status: string;
  points: number; contributor: string; createdAt: string; moderationNotes: string | null;
};

/* ═══ Chart ════════════════════════════════════════════════ */
function ContributionChart({ data }: { data: ChartData }) {
  const max = Math.max(...data.submissions, ...data.verifications, 1);
  const H = 130; const barW = 14; const gap = 4; const groupW = barW * 2 + gap + 10;
  const totalW = data.labels.length * groupW;
  return (
    <div className="da-chart-scroll">
      <svg className="da-chart-svg" viewBox={`0 0 ${totalW} ${H + 28}`} preserveAspectRatio="xMidYMid meet">
        {data.labels.map((label, i) => {
          const x = i * groupW;
          const subH = Math.max((data.submissions[i] / max) * H, 2);
          const verH = Math.max((data.verifications[i] / max) * H, 2);
          return (
            <g key={`${label}-${i}`} style={{ cursor: "crosshair" }}>
              <title>{`${label ? label.toUpperCase() : "Unknown"}\nSubmissions: ${data.submissions[i].toLocaleString()}\nVerifications: ${data.verifications[i].toLocaleString()}`}</title>
              <rect x={x} y={H - subH} width={barW} height={subH} fill="var(--surface-high)" rx="1" style={{ transition: "fill 0.2s" }} />
              <rect x={x + barW + gap} y={H - verH} width={barW} height={verH} fill="var(--primary)" rx="1" style={{ transition: "fill 0.2s" }} />
              {label ? (
                <text x={x + barW} y={H + 18} textAnchor="middle" fontSize="8" fill="var(--ink-soft)" fontFamily="Inter,sans-serif" letterSpacing="0.08em">
                  {label.toUpperCase()}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ═══ Engagement Chart ═════════════════════════════════════ */
function EngagementChart({ data }: { data: { labels: string[]; views: number[]; clicks: number[] } }) {
  const max = Math.max(...data.views, ...data.clicks, 1);
  const H = 130; const barW = 14; const gap = 4; const groupW = barW * 2 + gap + 10;
  const totalW = data.labels.length * groupW;
  return (
    <div className="da-chart-scroll">
      <svg className="da-chart-svg" viewBox={`0 0 ${totalW} ${H + 28}`} preserveAspectRatio="xMidYMid meet">
        {data.labels.map((label, i) => {
          const x = i * groupW;
          const viewH = Math.max((data.views[i] / max) * H, 2);
          const clickH = Math.max((data.clicks[i] / max) * H, 2);
          return (
            <g key={`${label}-${i}`} style={{ cursor: "crosshair" }}>
              <title>{`${label ? label.toUpperCase() : "Unknown"}\nViews: ${data.views[i].toLocaleString()}\nClicks: ${data.clicks[i].toLocaleString()}`}</title>
              <rect x={x} y={H - viewH} width={barW} height={viewH} fill="var(--surface-high)" rx="1" style={{ transition: "fill 0.2s" }} />
              <rect x={x + barW + gap} y={H - clickH} width={barW} height={clickH} fill="var(--accent-green)" rx="1" style={{ transition: "fill 0.2s" }} />
              {label ? (
                <text x={x + barW} y={H + 18} textAnchor="middle" fontSize="8" fill="var(--ink-soft)" fontFamily="Inter,sans-serif" letterSpacing="0.08em">
                  {label.toUpperCase()}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ═══ Gauge ════════════════════════════════════════════════ */
function VelocityGauge({ value }: { value: number }) {
  const r = 48; const circ = 2 * Math.PI * r; const filled = Math.min(value / 100, 1) * circ;
  return (
    <div className="da-gauge-wrap">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#dde4e5" strokeWidth="9" />
        <circle cx="65" cy="65" r={r} fill="none" stroke="#3d3d3d" strokeWidth="9"
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round" transform="rotate(-90 65 65)"
          style={{ transition: "stroke-dasharray 600ms ease" }} />
        <text x="65" y="60" textAnchor="middle" fontSize="20" fontWeight="800" fill="#2d3435" fontFamily="Work Sans,Arial Black,sans-serif">{value}%</text>
        <text x="65" y="76" textAnchor="middle" fontSize="8" fill="var(--ink-soft)" letterSpacing="2">TARGET</text>
      </svg>
    </div>
  );
}

/* ═══ Users Section ════════════════════════════════════════ */
function UsersSection({ router }: { router: ReturnType<typeof useRouter> }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user? All their submissions and profile data will be permanently removed.")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete.");
      }
    } catch (err) {
      alert("Error deleting user.");
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/dev-users");
        const json = (await res.json()) as { users: UserRow[] };
        setUsers(json.users ?? []);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="da-section-loading">Loading users…</div>;

  const admins = users.filter(u => u.role === "ADMIN").length;
  const totalPoints = users.reduce((s, u) => s + (u.profile?.points ?? 0), 0);

  return (
    <div className="da-section">
      <div className="da-section-header">
        <div>
          <h2 className="da-title">User Management</h2>
          <p className="da-subtitle">All registered accounts — roles, activity, and contribution points.</p>
        </div>
      </div>

      <div className="da-stats-row">
        <div className="da-stat-box">
          <p className="da-stat-label">TOTAL USERS</p>
          <p className="da-stat-value">{users.length}</p>
        </div>
        <div className="da-stat-box">
          <p className="da-stat-label">ADMIN ACCOUNTS</p>
          <p className="da-stat-value">{admins}<span className="da-stat-badge">elevated</span></p>
        </div>
        <div className="da-stat-box">
          <p className="da-stat-label">TOTAL POINTS IN SYSTEM</p>
          <p className="da-stat-value">{totalPoints.toLocaleString()}</p>
        </div>
        <div className="da-stat-box">
          <p className="da-stat-label">CONTRIBUTORS</p>
          <p className="da-stat-value">{users.filter(u => u._count.submissions > 0).length}</p>
        </div>
      </div>

      <div className="da-recent-panel">
        <div className="da-panel-header">
          <h3 className="da-panel-title">All Users</h3>
          <span className="da-view-all">{users.length} accounts</span>
        </div>
        <div className="da-table" role="table">
          <div className="da-table-head da-users-cols" role="row" style={{ gridTemplateColumns: "1fr 100px 100px 100px 100px 100px 40px" }}>
            <span>IDENTIFIER</span><span>ROLE</span><span>SUBMISSIONS</span><span>POINTS</span><span>LAST SEEN</span><span>JOINED</span><span></span>
          </div>
          {users.length === 0 ? (
            <div className="da-table-empty">No users found.</div>
          ) : users.map(u => (
            <div className="da-table-row da-users-cols" key={u.id} role="row" style={{ gridTemplateColumns: "1fr 100px 100px 100px 100px 100px 40px" }}>
              <span className="da-table-contrib" title={u.email ?? u.phoneNumber ?? u.id}>
                {(u.email ?? u.phoneNumber ?? `ID: ${u.id.slice(-8)}`).slice(0, 28)}
              </span>
              <span>
                <span className={`da-status-chip ${u.role.toLowerCase()}`}>{u.role}</span>
              </span>
              <span className="da-table-pts">{u._count.submissions}</span>
              <span>{u.profile?.points ?? 0} pts</span>
              <span>{u.profile?.lastSeenAt ? <TimeAgo date={u.profile.lastSeenAt} /> : <span className="da-table-contrib">—</span>}</span>
              <span><TimeAgo date={u.createdAt} /></span>
              <button 
                onClick={() => deleteUser(u.id)}
                title="Delete user"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--alert)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0",
                  opacity: 0.6
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "0.6"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ Contributions Section ════════════════════════════════ */
function ContributionsSection({ router }: { router: ReturnType<typeof useRouter> }) {
  const [contribs, setContribs] = useState<ContribRow[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("ALL");
  const [loading, setLoading] = useState(true);

  const fetchContribs = useCallback(async (f: StatusFilter) => {
    setLoading(true);
    try {
      const url = f === "ALL" ? "/api/admin/dev-contributions" : `/api/admin/dev-contributions?status=${f}`;
      const res = await fetch(url);
      const json = (await res.json()) as { submissions: ContribRow[] };
      setContribs(json.submissions ?? []);
    } finally { setLoading(false); }
  }, []);

  const deleteSubmission = async (id: string) => {
    if (!confirm("Are you sure you want to delete this submission?")) return;
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setContribs(prev => prev.filter(c => c.fullId !== id));
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to delete.");
      }
    } catch (err) {
      alert("Error deleting submission.");
    }
  };

  useEffect(() => { void fetchContribs(filter); }, [filter, fetchContribs]);

  const counts = contribs.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1; return acc;
  }, {} as Record<string, number>);

  return (
    <div className="da-section">
      <div className="da-section-header">
        <div>
          <h2 className="da-title">All Contributions</h2>
          <p className="da-subtitle">Browse, filter, and inspect every submission in the pipeline.</p>
        </div>
        <button className="da-security-action" style={{ width: "auto", padding: "9px 18px" }}
          onClick={() => router.push("/admin/review")} type="button">
          Open Review Queue →
        </button>
      </div>

      <div className="da-stats-row">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as StatusFilter[]).map(s => (
          <div className={`da-stat-box da-filter-box${filter === s ? " da-filter-active" : ""}`}
            key={s} onClick={() => setFilter(s)} role="button" tabIndex={0}
            onKeyDown={e => e.key === "Enter" && setFilter(s)}>
            <p className="da-stat-label">{s}</p>
            <p className="da-stat-value">
              {s === "ALL" ? contribs.length : (counts[s] ?? 0)}
            </p>
          </div>
        ))}
      </div>

      <div className="da-recent-panel">
        <div className="da-panel-header">
          <h3 className="da-panel-title">
            {filter === "ALL" ? "All Submissions" : `${filter} Submissions`}
          </h3>
          {loading ? <span className="da-view-all">Loading…</span> : null}
        </div>
        <div className="da-table" role="table">
          <div className="da-table-head da-contrib-cols" role="row" style={{ gridTemplateColumns: "70px 1fr 100px 140px 90px 60px 100px 40px" }}>
            <span>ID</span><span>HEADLINE</span><span>CATEGORY</span><span>CONTRIBUTOR</span><span>STATUS</span><span>POINTS</span><span>SUBMITTED</span><span></span>
          </div>
          {contribs.length === 0 ? (
            <div className="da-table-empty">{loading ? "Loading…" : "No submissions found."}</div>
          ) : contribs.map(c => (
            <div className="da-table-row da-contrib-cols" key={c.fullId} role="row" style={{ gridTemplateColumns: "70px 1fr 100px 140px 90px 60px 100px 40px" }}>
              <span className="da-table-id">#{c.id}</span>
              <span className="da-contrib-headline" title={c.headline}>{c.headline.length > 45 ? c.headline.slice(0, 43) + "…" : c.headline}</span>
              <span>{c.category}</span>
              <span className="da-table-contrib" title={c.contributor}>{c.contributor.length > 22 ? c.contributor.slice(0, 20) + "…" : c.contributor}</span>
              <span><span className={`da-status-chip ${c.status.toLowerCase()}`}>{c.status}</span></span>
              <span className="da-table-pts">{c.status === "APPROVED" ? `+${c.points}` : c.status === "REJECTED" ? "0" : "—"}</span>
              <span><TimeAgo date={c.createdAt} /></span>
              <button 
                onClick={() => deleteSubmission(c.fullId)}
                title="Delete submission"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--alert)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0",
                  opacity: 0.6
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "0.6"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══ Ads Section ══════════════════════════════════════════ */
function AdsSection() {
  const [ads, setAds] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState("standard");
  const [roi, setRoi] = useState({ budget: 500, cpm: 2.5, ctr: 1.2 });
  const [activeTab, setActiveTab] = useState<"slots" | "plans" | "evaluator">("slots");

  const SLOTS = [
    { id: "TOP_BANNER_AD",    name: "Top Banner",     icon: "▬", desc: "Full-width banner below site header",        reach: "High" },
    { id: "MAIN_PAGE_AD",     name: "Sidebar Widget", icon: "◧", desc: "Right-column widget on home feed",           reach: "Medium" },
    { id: "INLINE_FEED_AD",   name: "Inline Feed",    icon: "≡", desc: "Injected between news cards (~6 items)",     reach: "High" },
  ];

  const PLANS = [
    { id: "free",       name: "Free",       price: 0,    slots: 0, color: "var(--ink-soft)", badge: null,         features: ["No ad slots", "No analytics", "Community support"] },
    { id: "standard",   name: "Standard",   price: 49,   slots: 1, color: "var(--accent-green)", badge: "Popular",    features: ["1 active slot", "Basic analytics", "Email support", "Image ads"] },
    { id: "pro",        name: "Pro",        price: 149,  slots: 3, color: "var(--primary)", badge: "Best Value", features: ["All 3 slots", "Full analytics + CTR", "Priority support", "Custom CTA & body"] },
    { id: "enterprise", name: "Enterprise", price: null, slots: 3, color: "var(--primary-dim)", badge: "Custom",     features: ["Unlimited slots", "Dedicated manager", "Custom integrations", "SLA guarantee"] },
  ];

  useEffect(() => { void fetchAds(); }, []);

  async function fetchAds() {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/ads");
      const json = await res.json();
      setAds(json.ads || []);
      setMetrics(json.metrics || null);
    } finally { setLoading(false); }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>, slotId: string) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      slotId,
      enabled:  fd.get("enabled") === "true",
      imageUrl: fd.get("imageUrl") as string,
      linkUrl:  fd.get("linkUrl")  as string,
      label:    fd.get("label")    as string,
      title:    fd.get("title")    as string,
      body:     fd.get("body")     as string,
      ctaText:  fd.get("ctaText")  as string,
      altText:  fd.get("altText")  as string,
    };
    const res = await fetch("/api/admin/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { setEditingSlot(null); void fetchAds(); }
    else alert("Failed to save.");
  }

  async function handleClear(slotId: string) {
    if (!confirm("Clear this ad slot? This removes all saved data for it.")) return;
    await fetch("/api/admin/ads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId }),
    });
    void fetchAds();
  }

  const estimatedImpressions = Math.round((roi.budget / roi.cpm) * 1000);
  const estimatedClicks      = Math.round(estimatedImpressions * (roi.ctr / 100));
  const estimatedCPC         = roi.budget > 0 && estimatedClicks > 0
    ? (roi.budget / estimatedClicks).toFixed(2) : "—";
  const liveCount = ads.filter(a => a.enabled).length;

  const TABS: { id: "slots" | "plans" | "evaluator"; label: string }[] = [
    { id: "slots",     label: "🪧 Ad Slots" },
    { id: "plans",     label: "⬆ Upgrade Plans" },
    { id: "evaluator", label: "📊 ROI Evaluator" },
  ];

  const COMPARE_ROWS: [string, string, string, string, string][] = [
    ["Ad Slots",              "0",     "1",       "3",        "∞"],
    ["Banner Placement",      "✕",     "✕",       "✓",        "✓"],
    ["Sidebar Widget",        "✕",     "✓",       "✓",        "✓"],
    ["Inline Feed Injection", "✕",     "✕",       "✓",        "✓"],
    ["CTR Analytics",         "✕",     "Basic",   "Full",     "Full"],
    ["Custom CTA & Body",     "✕",     "✕",       "✓",        "✓"],
    ["Support Level",         "Community","Email","Priority", "Dedicated"],
    ["SLA Guarantee",         "✕",     "✕",       "✕",        "✓"],
  ];

  const ROI_SLIDERS = [
    { label: "Monthly Budget (USD)", key: "budget" as const, min: 50,  max: 5000, step: 50,  unit: "$" },
    { label: "CPM Rate",             key: "cpm"    as const, min: 0.5, max: 20,   step: 0.5, unit: "$" },
    { label: "Expected CTR",         key: "ctr"    as const, min: 0.1, max: 10,   step: 0.1, unit: "%" },
  ];

  const recommendation =
    roi.budget < 100  ? { plan: "Free",       text: "Budget is below the recommended minimum. Try the Standard plan at $49/mo for a single slot with basic analytics." }
    : roi.budget < 300 ? { plan: "Standard",   text: "Good starting point. The Standard plan covers a sidebar widget. Monitor CTR weekly and scale to Pro when ready." }
    : roi.budget < 1000? { plan: "Pro",         text: "Pro plan recommended — all 3 slots (banner, sidebar, inline) for full-funnel coverage across every news category." }
    :                    { plan: "Enterprise",  text: "High-volume campaign. Enterprise gives custom integrations, a dedicated account manager, and SLA uptime guarantees." };

  return (
    <div className="da-section">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="da-section-header">
        <div>
          <h2 className="da-title">Advertisement Management</h2>
          <p className="da-subtitle">Manage ad slots, compare upgrade plans, and evaluate campaign ROI.</p>
        </div>
        {metrics && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>Platform CTR</span>
            <span style={{ fontSize: "20px", fontWeight: "bold" }}>{metrics.platformCTR}%</span>
          </div>
        )}
      </div>

      {/* ── Stats row ────────────────────────────────────────── */}
      {metrics && (
        <div className="da-stats-row">
          <div className="da-stat-box">
            <p className="da-stat-label">PLATFORM VIEWS</p>
            <p className="da-stat-value">{metrics.platformViews.toLocaleString()}</p>
          </div>
          <div className="da-stat-box">
            <p className="da-stat-label">PLATFORM CLICKS</p>
            <p className="da-stat-value">{metrics.platformClicks.toLocaleString()}</p>
          </div>
          <div className="da-stat-box">
            <p className="da-stat-label">LIVE AD SLOTS</p>
            <p className="da-stat-value">
              {liveCount}
              <span className="da-stat-badge">{liveCount > 0 ? "active" : "none live"}</span>
            </p>
          </div>
          <div className="da-stat-box">
            <p className="da-stat-label">TOTAL ARTICLES</p>
            <p className="da-stat-value">{metrics.totalNews.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--line)", marginBottom: "24px" }}>
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
            style={{
              padding: "10px 20px", background: "none", border: "none",
              borderBottom: activeTab === t.id ? "2px solid var(--ink)" : "2px solid transparent",
              color: activeTab === t.id ? "var(--ink)" : "var(--muted)",
              fontWeight: activeTab === t.id ? "bold" : "normal",
              cursor: "pointer", fontSize: "13px", letterSpacing: "0.04em",
              textTransform: "uppercase", transition: "all 0.2s",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: Ad Slots                                         */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === "slots" && (
        <div className="da-recent-panel">
          <div className="da-panel-header">
            <h3 className="da-panel-title">Configured Slots ({liveCount}/3 live)</h3>
            {loading && <span className="da-view-all">Refreshing…</span>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
            {SLOTS.map(slot => {
              const ad = ads.find(a => a.slotId === slot.id) ?? {
                enabled: false, imageUrl: "", linkUrl: "", label: "Sponsored",
                title: "", body: "", ctaText: "Learn More", altText: "",
              };
              const isEditing = editingSlot === slot.id;
              return (
                <div key={slot.id} style={{
                  border: "1px solid var(--line)", borderRadius: "8px", overflow: "hidden",
                  background: ad.enabled ? "var(--surface-mid)" : "var(--bg)",
                }}>
                  {/* Slot header row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "22px" }}>{slot.icon}</span>
                      <div>
                        <span style={{ fontSize: "15px", fontWeight: "bold" }}>{slot.name}</span>
                        <span style={{ marginLeft: "10px", fontSize: "12px", color: "var(--muted)" }}>{slot.desc}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span style={{ fontSize: "11px", color: "var(--muted)", border: "1px solid var(--line)", padding: "2px 8px", borderRadius: "4px" }}>
                        Reach: {slot.reach}
                      </span>
                      <span className={`da-status-chip ${ad.enabled ? "approved" : "rejected"}`}>
                        {ad.enabled ? "LIVE" : "OFF"}
                      </span>
                      {ad.imageUrl && (
                        <button className="da-view-all" onClick={() => handleClear(slot.id)} type="button"
                          style={{ color: "var(--muted)" }}>
                          Clear
                        </button>
                      )}
                      <button className="da-view-all" onClick={() => setEditingSlot(isEditing ? null : slot.id)} type="button">
                        {isEditing ? "Cancel" : "Edit"}
                      </button>
                    </div>
                  </div>

                  {/* Edit form */}
                  {isEditing && (
                    <form style={{ display: "flex", flexDirection: "column", gap: "0", borderTop: "1px solid var(--line)" }}
                      onSubmit={e => handleSave(e, slot.id)}>

                      {/* ── Sticky save toolbar ── always visible at top of form */}
                      <div style={{
                        position: "sticky", top: 0, zIndex: 10,
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "12px 20px",
                        background: "var(--bg)",
                        borderBottom: "1px solid var(--line)",
                        backdropFilter: "blur(8px)",
                      }}>
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <label style={{ fontSize: "13px", fontWeight: "bold", minWidth: "56px", color: "var(--ink)" }}>Status</label>
                          <select name="enabled" defaultValue={String(ad.enabled)}
                            style={{ padding: "7px 12px", background: "var(--bg)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "4px", fontSize: "13px" }}>
                            <option value="true">✓ Enabled — Go Live</option>
                            <option value="false">✕ Disabled — Keep Hidden</option>
                          </select>
                        </div>
                        <button type="submit" style={{
                          padding: "10px 28px",
                          background: "var(--primary)", color: "#ffffff",
                          border: "none", borderRadius: "4px",
                          fontWeight: "bold", cursor: "pointer", fontSize: "13px",
                          letterSpacing: "0.03em",
                        }}>
                          💾 Save &amp; Go Live
                        </button>
                      </div>

                      {/* ── Field grid ── */}
                      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                          {([
                            ["imageUrl", "Image URL (required)", "https://cdn.example.com/ad.png", true],
                            ["linkUrl",  "Destination URL",       "https://example.com",             true],
                            ["label",   "Slot Label",             "Sponsored",                       false],
                            ["altText", "Alt Text",               "Ad banner",                       false],
                            ["title",   "Headline (optional)",    "Ad Headline",                     false],
                            ["ctaText", "CTA Text",               "Learn More →",                    false],
                          ] as [string, string, string, boolean][]).map(([n, l, ph, req]) => (
                            <div key={n} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                              <label style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</label>
                              <input type="text" name={n} defaultValue={ad[n] || ""} placeholder={ph} required={req}
                                style={{ padding: "10px", background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink)", borderRadius: "4px", fontSize: "13px" }} />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                          <label style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Body Description (optional)</label>
                          <textarea name="body" defaultValue={ad.body || ""} placeholder="Short ad description…" rows={2}
                            style={{ padding: "10px", background: "var(--bg)", border: "1px solid var(--line)", color: "var(--ink)", borderRadius: "4px", resize: "none", fontSize: "13px" }} />
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: Upgrade Plans                                    */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === "plans" && (
        <div>
          {/* Plan cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: "16px", marginBottom: "28px" }}>
            {PLANS.map(plan => (
              <div key={plan.id} onClick={() => setActivePlan(plan.id)}
                style={{
                  border: activePlan === plan.id ? "2px solid var(--ink)" : "1px solid var(--line)",
                  borderRadius: "10px", padding: "20px 18px", cursor: "pointer",
                  background: activePlan === plan.id ? "var(--surface-mid)" : "var(--bg)",
                  transition: "all 0.2s", position: "relative",
                }}>
                {plan.badge && (
                  <span style={{ position: "absolute", top: "-10px", right: "12px", background: plan.color, color: "var(--bg)", fontSize: "10px", padding: "2px 8px", borderRadius: "10px", fontWeight: "bold" }}>
                    {plan.badge}
                  </span>
                )}
                <p style={{ fontSize: "11px", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "6px" }}>{plan.name}</p>
                <p style={{ fontSize: "26px", fontWeight: "900", color: plan.color, marginBottom: "4px" }}>
                  {plan.price === null ? "Custom" : plan.price === 0 ? "Free" : `$${plan.price}/mo`}
                </p>
                <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "14px" }}>
                  {plan.slots === 0 ? "No ad slots" : `${plan.slots} slot${plan.slots > 1 ? "s" : ""} included`}
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ fontSize: "12px", display: "flex", gap: "6px", alignItems: "flex-start" }}>
                      <span style={{ color: plan.color, flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Feature comparison table */}
          <div className="da-recent-panel">
            <div className="da-panel-header"><h3 className="da-panel-title">Full Feature Comparison</h3></div>
            <div className="da-table" role="table">
              <div className="da-table-head" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }}>
                <span>FEATURE</span><span>FREE</span><span>STANDARD</span><span>PRO</span><span>ENTERPRISE</span>
              </div>
              {COMPARE_ROWS.map(([feat, ...vals]) => (
                <div className="da-table-row" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr" }} key={feat}>
                  <span style={{ fontWeight: 500 }}>{feat}</span>
                  {vals.map((v, i) => (
                    <span key={i} style={{ color: v === "✕" ? "var(--muted)" : v === "✓" ? "var(--accent-green)" : "var(--ink)" }}>
                      {v}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* TAB: ROI Evaluator                                    */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeTab === "evaluator" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Sliders */}
          <div className="da-recent-panel">
            <div className="da-panel-header"><h3 className="da-panel-title">Campaign Inputs</h3></div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "22px" }}>
              {ROI_SLIDERS.map(({ label, key, min, max, step, unit }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <label style={{ fontSize: "12px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
                    <span style={{ fontSize: "15px", fontWeight: "bold" }}>{unit}{roi[key]}</span>
                  </div>
                  <input type="range" min={min} max={max} step={step} value={roi[key]}
                    onChange={e => setRoi(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                    style={{ width: "100%", accentColor: "var(--ink)" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--muted)" }}>
                    <span>{unit}{min}</span><span>{unit}{max}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Results + recommendation */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="da-recent-panel" style={{ flex: 1 }}>
              <div className="da-panel-header"><h3 className="da-panel-title">Estimated Results</h3></div>
              <div className="da-health-grid" style={{ padding: "16px" }}>
                {([
                  { label: "Est. Impressions / mo", value: estimatedImpressions.toLocaleString(), color: "var(--ink)" },
                  { label: "Est. Clicks / mo",       value: estimatedClicks.toLocaleString(),      color: "var(--accent-green)" },
                  { label: "Cost Per Click (CPC)",    value: estimatedCPC !== "—" ? `$${estimatedCPC}` : "—", color: "var(--primary)" },
                  { label: "Platform Audience",       value: metrics ? metrics.platformViews.toLocaleString() : "—", color: "var(--muted)" },
                ] as { label: string; value: string; color: string }[]).map(m => (
                  <div className="da-health-metric" key={m.label}>
                    <p className="da-stat-label">{m.label}</p>
                    <p style={{ fontSize: "22px", fontWeight: "800", color: m.color, margin: "4px 0 0" }}>{m.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="da-recent-panel">
              <div className="da-panel-header"><h3 className="da-panel-title">Recommendation</h3></div>
              <div style={{ padding: "16px" }}>
                <p style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                  Suggested plan: <strong style={{ color: "var(--ink)" }}>{recommendation.plan}</strong>
                </p>
                <p style={{ fontSize: "13px", color: "var(--ink)", lineHeight: "1.7" }}>{recommendation.text}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ═══ Engagement Section ═══════════════════════════════════ */
function EngagementSection() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [country, setCountry] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (period !== "all") query.set("period", period);
        if (country) query.set("country", country);
        const res = await fetch(`/api/admin/engagement?${query.toString()}`);
        const json = await res.json();
        setData(json);
      } finally {
        setLoading(false);
      }
    })();
  }, [period, country]);

  if (loading && !data) return <div className="da-section-loading">Loading engagement data…</div>;
  if (!data) return <div className="da-section-loading">Failed to load data.</div>;

  const ctr = data.totalViews > 0 ? ((data.totalClicks / data.totalViews) * 100).toFixed(2) : "0.00";

  return (
    <div className="da-section">
      <div className="da-section-header">
        <div>
          <h2 className="da-title">News Engagement Analytics</h2>
          <p className="da-subtitle">Track which news items are getting the most attention, views, and source clicks.</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {loading && <span style={{ fontSize: "12px", color: "var(--muted)" }}>Updating...</span>}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ padding: "8px 12px", background: "var(--bg)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "4px", fontSize: "14px" }}
          >
            <option value="all">All Time</option>
            <option value="year">Past Year</option>
            <option value="month">Past Month</option>
            <option value="day">Past 24 Hours</option>
            <option value="hour">Past Hour</option>
          </select>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            style={{ padding: "8px 12px", background: "var(--bg)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "4px", fontSize: "14px" }}
          >
            <option value="">All Countries</option>
            {data.availableCountries?.map((c: string) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="da-stats-row">
        <div className="da-stat-box">
          <p className="da-stat-label">TOTAL PLATFORM VIEWS</p>
          <p className="da-stat-value">{data.totalViews.toLocaleString()}</p>
        </div>
        <div className="da-stat-box">
          <p className="da-stat-label">SOURCE CLICKS</p>
          <p className="da-stat-value">{data.totalClicks.toLocaleString()}</p>
        </div>
        <div className="da-stat-box">
          <p className="da-stat-label">AVERAGE CTR</p>
          <p className="da-stat-value">{ctr}%</p>
        </div>
      </div>

      {data.chartData && (
        <div className="da-chart-panel" style={{ marginTop: "24px" }}>
          <div className="da-chart-header">
            <h3 className="da-panel-title">Engagement Trends</h3>
            <div className="da-legend">
              <span className="da-legend-submissions" style={{ color: "var(--surface-high)" }}>■ Views</span>
              <span className="da-legend-verifications" style={{ color: "var(--accent-green)" }}>■ Clicks</span>
            </div>
          </div>
          <EngagementChart data={data.chartData} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
        <div className="da-recent-panel">
          <div className="da-panel-header">
            <h3 className="da-panel-title">Most Viewed News</h3>
          </div>
          <div className="da-table" role="table">
            <div className="da-table-head" style={{ gridTemplateColumns: "1fr 80px 80px" }}>
              <span>HEADLINE</span><span style={{ textAlign: "right" }}>VIEWS</span><span style={{ textAlign: "right" }}>CLICKS</span>
            </div>
            {data.mostViewed.length > 0 ? data.mostViewed.map((item: any) => (
              <div className="da-table-row" style={{ gridTemplateColumns: "1fr 80px 80px" }} key={item.id}>
                <span title={item.headline} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <span className="da-status-chip approved" style={{ marginRight: "8px", fontSize: "10px" }}>{item.category}</span>
                  {item.headline}
                </span>
                <span style={{ textAlign: "right", fontWeight: "bold" }}>{item.views.toLocaleString()}</span>
                <span style={{ textAlign: "right", color: "var(--muted)" }}>{item.clicks.toLocaleString()}</span>
              </div>
            )) : <div className="da-table-empty">No data available for this filter.</div>}
          </div>
        </div>

        <div className="da-recent-panel">
          <div className="da-panel-header">
            <h3 className="da-panel-title">Least Viewed News</h3>
          </div>
          <div className="da-table" role="table">
            <div className="da-table-head" style={{ gridTemplateColumns: "1fr 80px 80px" }}>
              <span>HEADLINE</span><span style={{ textAlign: "right" }}>VIEWS</span><span style={{ textAlign: "right" }}>CLICKS</span>
            </div>
            {data.leastViewed.length > 0 ? data.leastViewed.map((item: any) => (
              <div className="da-table-row" style={{ gridTemplateColumns: "1fr 80px 80px" }} key={item.id}>
                <span title={item.headline} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <span className="da-status-chip pending" style={{ marginRight: "8px", fontSize: "10px" }}>{item.category}</span>
                  {item.headline}
                </span>
                <span style={{ textAlign: "right", fontWeight: "bold" }}>{item.views.toLocaleString()}</span>
                <span style={{ textAlign: "right", color: "var(--muted)" }}>{item.clicks.toLocaleString()}</span>
              </div>
            )) : <div className="da-table-empty">No data available for this filter.</div>}
          </div>
        </div>
      </div>

    </div>
  );
}

/* ═══ System Health Section ════════════════════════════════ */
function SystemHealthSection({ stats, security }: { stats: Stats; security: SecurityData }) {
  const [pingMs, setPingMs] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const t0 = Date.now();
      await fetch("/api/admin/dev-analytics?period=daily");
      setPingMs(Date.now() - t0);
    })();
  }, []);

  const healthScore = (() => {
    let score = 100;
    if (stats.systemResponseMs > 400) score -= 30;
    else if (stats.systemResponseMs > 200) score -= 15;
    if (security.authFailures > 10) score -= 20;
    else if (security.authFailures > 3) score -= 10;
    if (stats.pendingCount > 20) score -= 10;
    return Math.max(score, 0);
  })();

  const healthColor = healthScore >= 80 ? "#1a5c2a" : healthScore >= 50 ? "#b37700" : "#8a2c2c";
  const healthLabel = healthScore >= 80 ? "HEALTHY" : healthScore >= 50 ? "DEGRADED" : "CRITICAL";

  const metrics = [
    { label: "DB Query Response", value: `${stats.systemResponseMs}ms`, status: stats.systemResponseMs < 200 ? "ok" : stats.systemResponseMs < 500 ? "warn" : "err" },
    { label: "API Round-Trip", value: pingMs !== null ? `${pingMs}ms` : "Measuring…", status: pingMs !== null ? (pingMs < 500 ? "ok" : "warn") : "idle" },
    { label: "Active Sessions", value: security.activeSessions.toString(), status: "ok" },
    { label: "Auth Failures", value: security.authFailures.toString(), status: security.authFailures === 0 ? "ok" : security.authFailures < 5 ? "warn" : "err" },
    { label: "Expired Codes", value: security.expiredCodes.toString(), status: "idle" },
    { label: "Pending Review Queue", value: stats.pendingCount.toString(), status: stats.pendingCount === 0 ? "ok" : stats.pendingCount < 10 ? "warn" : "err" },
    { label: "Published Articles", value: stats.totalNewsItems.toString(), status: "ok" },
    { label: "Approval Velocity", value: `${stats.velocity}%`, status: stats.velocity > 50 ? "ok" : "warn" },
  ];

  return (
    <div className="da-section">
      <div className="da-section-header">
        <div>
          <h2 className="da-title">System Health</h2>
          <p className="da-subtitle">Live infrastructure metrics, response times, and pipeline diagnostics.</p>
        </div>
      </div>

      {/* Overall score */}
      <div className="da-health-score-wrap">
        <div className="da-health-score-left">
          <p className="da-stat-label">OVERALL HEALTH SCORE</p>
          <p className="da-health-score-value" style={{ color: healthColor }}>{healthScore}</p>
          <span className="da-security-tag" style={{ background: `${healthColor}22`, color: healthColor }}>{healthLabel}</span>
        </div>
        <div className="da-health-score-bar-wrap">
          <div className="da-health-bar-track">
            <div className="da-health-bar-fill" style={{ width: `${healthScore}%`, background: healthColor }} />
          </div>
          <p className="da-velocity-desc" style={{ textAlign: "left", marginTop: 8 }}>
            Score is calculated from DB response time, auth failures, and review queue depth.
          </p>
        </div>
      </div>

      {/* Metric grid */}
      <div className="da-recent-panel">
        <div className="da-panel-header">
          <h3 className="da-panel-title">Live Diagnostics</h3>
          <span className="da-traffic-dot" style={{ display: "inline-block" }} aria-hidden="true" />
        </div>
        <div className="da-health-grid">
          {metrics.map(m => (
            <div className="da-health-metric" key={m.label}>
              <p className="da-stat-label">{m.label}</p>
              <p className={`da-health-metric-val da-hm-${m.status}`}>{m.value}</p>
              <div className={`da-health-indicator da-hi-${m.status}`} />
            </div>
          ))}
        </div>
      </div>

      {/* DB model counts */}
      <div className="da-bottom-grid" style={{ borderTop: "1px solid var(--line)" }}>
        <div className="da-traffic-panel">
          <div className="da-traffic-top">
            <span className="da-traffic-dot" aria-hidden="true" />
            <h3 className="da-traffic-title">Database Status</h3>
          </div>
          <div className="da-traffic-main">
            <div>
              <p className="da-traffic-label">TOTAL RECORDS (SUBMISSIONS)</p>
              <p className="da-traffic-big">{stats.totalSubmissions.toLocaleString()}</p>
            </div>
            <div className="da-traffic-status-wrap">
              <p className="da-traffic-label">STATUS</p>
              <p className="da-traffic-status-val">ONLINE</p>
            </div>
          </div>
          <div className="da-traffic-metrics">
            <div className="da-traffic-metric">
              <p className="da-traffic-label">PUBLISHED ITEMS</p>
              <p className="da-traffic-metric-val">{stats.totalNewsItems}</p>
            </div>
            <div className="da-traffic-metric">
              <p className="da-traffic-label">REGISTERED USERS</p>
              <p className="da-traffic-metric-val">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        <div className="da-security-panel">
          <h3 className="da-panel-title">Pipeline Status</h3>
          <ul className="da-security-list">
            {[
              { label: "Pending review", val: stats.pendingCount, tag: stats.pendingCount < 5 ? "clear" : "watch" },
              { label: "Approved total", val: stats.approvedCount, tag: "clear" },
              { label: "Rejected total", val: stats.rejectedCount, tag: stats.rejectedCount > 10 ? "danger" : "watch" },
            ].map(r => (
              <li className="da-security-row" key={r.label}>
                <div className="da-security-info">
                  <span className="da-security-val">{r.val}</span>
                  <span className="da-security-desc">{r.label}</span>
                </div>
                <span className={`da-security-tag ${r.tag}`}>{r.tag.toUpperCase()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ═══ Overview (existing) ═══════════════════════════════════ */
function OverviewSection({
  stats, chart, recentSubmissions, security, period, setPeriod, loading, router
}: {
  stats: Stats; chart: ChartData; recentSubmissions: RecentItem[]; security: SecurityData;
  period: Period; setPeriod: (p: Period) => void; loading: boolean; router: ReturnType<typeof useRouter>;
}) {
  const queueLabel = stats.pendingCount > 20 ? "High" : stats.pendingCount > 5 ? "Medium" : "Low";
  const queueBg = stats.pendingCount > 20 ? "#5e2a2a" : stats.pendingCount > 5 ? "#5e4a1a" : "#1a3a28";

  return (
    <>
      <div className="da-topbar">
        <div>
          <h2 className="da-title">Developer Analytics</h2>
          <p className="da-subtitle">Real-time contribution throughput and infrastructure telemetry.</p>
        </div>
        <div className="da-period-tabs" role="tablist">
          {(["daily", "weekly", "monthly"] as Period[]).map(p => (
            <button key={p} className={`da-period-tab${period === p ? " active" : ""}`}
              onClick={() => setPeriod(p)} role="tab" aria-selected={period === p} type="button">
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="da-section-loading">Refreshing data…</div> : null}

      <div className="da-stats-row">
        <div className="da-stat-box"><p className="da-stat-label">TOTAL SUBMISSIONS</p>
          <p className="da-stat-value">{stats.totalSubmissions.toLocaleString()}<span className="da-stat-badge">+{stats.pendingCount} pending</span></p></div>
        <div className="da-stat-box"><p className="da-stat-label">ACTIVE CONTRIBUTORS</p>
          <p className="da-stat-value">{stats.activeContributors}<span className="da-stat-badge">of {stats.totalUsers} users</span></p></div>
        <div className="da-stat-box"><p className="da-stat-label">POINTS AWARDED TODAY</p>
          <p className="da-stat-value">{stats.pointsToday.toLocaleString()}<span className="da-stat-badge">today</span></p></div>
        <div className="da-stat-box"><p className="da-stat-label">SYSTEM RESPONSE</p>
          <p className="da-stat-value">{stats.systemResponseMs}<span className="da-stat-unit">ms</span>
            <span className={`da-stat-badge${stats.systemResponseMs > 300 ? " warn" : ""}`}>
              {stats.systemResponseMs < 150 ? "Fast" : stats.systemResponseMs < 400 ? "Slow" : "Critical"}
            </span></p></div>
      </div>

      <div className="da-mid-grid">
        <div className="da-chart-panel">
          <div className="da-chart-header">
            <h3 className="da-panel-title">Contribution Trends</h3>
            <div className="da-legend">
              <span className="da-legend-submissions">■ Submissions</span>
              <span className="da-legend-verifications">■ Verification</span>
            </div>
          </div>
          <ContributionChart data={chart} />
        </div>
        <div className="da-right-col">
          <div className="da-velocity-panel">
            <p className="da-small-label">USER POINTS VELOCITY</p>
            <VelocityGauge value={stats.velocity} />
            <p className="da-velocity-desc">Approval rate vs total submissions at <strong>{stats.velocity}%</strong>.</p>
          </div>
          <div className="da-queue-panel" style={{ background: queueBg }}>
            <p className="da-queue-label">{queueLabel}</p>
            <div className="da-queue-bar">
              <div className="da-queue-fill" style={{ width: `${Math.min((stats.pendingCount / 30) * 100, 100)}%` }} />
            </div>
            <p className="da-queue-sub">{stats.pendingCount} items in review queue</p>
          </div>
        </div>
      </div>

      <div className="da-recent-panel">
        <div className="da-panel-header">
          <h3 className="da-panel-title">Recent Contributions</h3>
          <button className="da-view-all" onClick={() => router.push("/admin/review")} type="button">VIEW ALL LOGS →</button>
        </div>
        <div className="da-table" role="table">
          <div className="da-table-head" role="row">
            <span>ID</span><span>CONTRIBUTOR</span><span>CATEGORY</span><span>STATUS</span><span>POINTS</span><span>TIMESTAMP</span>
          </div>
          {recentSubmissions.length > 0 ? recentSubmissions.map(item => (
            <div className="da-table-row" key={item.id} role="row">
              <span className="da-table-id">#{item.id}</span>
              <span className="da-table-contrib" title={item.contributor}>{item.contributor.length > 24 ? item.contributor.slice(0, 22) + "…" : item.contributor}</span>
              <span>{item.category}</span>
              <span><span className={`da-status-chip ${item.status.toLowerCase()}`}>{item.status}</span></span>
              <span className="da-table-pts">{item.status === "APPROVED" ? `+${item.points}` : item.status === "REJECTED" ? "0" : "—"}</span>
              <span><TimeAgo date={item.createdAt} /></span>
            </div>
          )) : <div className="da-table-empty" role="row">No submissions yet.</div>}
        </div>
      </div>

      <div className="da-bottom-grid">
        <div className="da-traffic-panel">
          <div className="da-traffic-top"><span className="da-traffic-dot" /><h3 className="da-traffic-title">Active Session Management</h3></div>
          <div className="da-traffic-main">
            <div><p className="da-traffic-label">ACTIVE SESSIONS</p><p className="da-traffic-big">{security.activeSessions}</p></div>
            <div className="da-traffic-status-wrap">
              <p className="da-traffic-label">STATUS</p>
              <p className={`da-traffic-status-val${security.authFailures > 5 ? " danger" : ""}`}>
                {security.authFailures > 5 ? "ALERT" : "STABLE"}
              </p>
            </div>
          </div>
          <div className="da-traffic-metrics">
            <div className="da-traffic-metric"><p className="da-traffic-label">EXPIRED CODES</p><p className="da-traffic-metric-val">{security.expiredCodes}</p></div>
            <div className="da-traffic-metric"><p className="da-traffic-label">AUTH FAILURES</p>
              <p className="da-traffic-metric-val">
                {security.activeSessions + security.expiredCodes > 0
                  ? ((security.authFailures / (security.activeSessions + security.expiredCodes)) * 100).toFixed(2) : "0.00"}%
              </p>
            </div>
          </div>
        </div>
        <div className="da-security-panel">
          <h3 className="da-panel-title">Security Alerts</h3>
          <ul className="da-security-list">
            {[
              { val: security.authFailures, desc: "Failed sign-in attempts (3+ tries)", tag: security.authFailures > 10 ? "danger" : security.authFailures > 0 ? "watch" : "clear", label: security.authFailures > 10 ? "SUSPICIOUS" : security.authFailures > 0 ? "UNDER WATCH" : "CLEAR" },
              { val: security.expiredCodes, desc: "Unused codes (auto-expired)", tag: "watch", label: "EXPIRED" },
              { val: stats.rejectedCount, desc: "Total rejected submissions", tag: stats.rejectedCount > 10 ? "danger" : "watch", label: stats.rejectedCount > 10 ? "HIGH" : "NORMAL" },
            ].map(r => (
              <li className="da-security-row" key={r.desc}>
                <div className="da-security-info"><span className="da-security-val">{r.val}</span><span className="da-security-desc">{r.desc}</span></div>
                <span className={`da-security-tag ${r.tag}`}>{r.label}</span>
              </li>
            ))}
          </ul>
          <button className="da-security-action" onClick={() => router.push("/admin/review")} type="button">REVIEW QUEUE →</button>
        </div>
      </div>
    </>
  );
}

/* ═══ Security Section ═════════════════════════════════════ */
function SecuritySection({ stats, security, router }: { stats: Stats; security: SecurityData; router: ReturnType<typeof useRouter> }) {
  return (
    <div className="da-section">
      <div className="da-section-header">
        <div>
          <h2 className="da-title">Security & Traffic</h2>
          <p className="da-subtitle">Active session management and security alerts.</p>
        </div>
      </div>
      <div className="da-bottom-grid">
        <div className="da-traffic-panel" style={{ borderTop: 0 }}>
          <div className="da-traffic-top"><span className="da-traffic-dot" /><h3 className="da-traffic-title">Active Session Management</h3></div>
          <div className="da-traffic-main">
            <div><p className="da-traffic-label">ACTIVE SESSIONS</p><p className="da-traffic-big">{security.activeSessions}</p></div>
            <div className="da-traffic-status-wrap">
              <p className="da-traffic-label">STATUS</p>
              <p className={`da-traffic-status-val${security.authFailures > 5 ? " danger" : ""}`}>
                {security.authFailures > 5 ? "ALERT" : "STABLE"}
              </p>
            </div>
          </div>
          <div className="da-traffic-metrics">
            <div className="da-traffic-metric"><p className="da-traffic-label">EXPIRED CODES</p><p className="da-traffic-metric-val">{security.expiredCodes}</p></div>
            <div className="da-traffic-metric"><p className="da-traffic-label">AUTH FAILURES</p>
              <p className="da-traffic-metric-val">
                {security.activeSessions + security.expiredCodes > 0
                  ? ((security.authFailures / (security.activeSessions + security.expiredCodes)) * 100).toFixed(2) : "0.00"}%
              </p>
            </div>
          </div>
        </div>
        <div className="da-security-panel">
          <h3 className="da-panel-title">Security Alerts</h3>
          <ul className="da-security-list">
            {[
              { val: security.authFailures, desc: "Failed sign-in attempts (3+ tries)", tag: security.authFailures > 10 ? "danger" : security.authFailures > 0 ? "watch" : "clear", label: security.authFailures > 10 ? "SUSPICIOUS" : security.authFailures > 0 ? "UNDER WATCH" : "CLEAR" },
              { val: security.expiredCodes, desc: "Unused codes (auto-expired)", tag: "watch", label: "EXPIRED" },
              { val: stats.rejectedCount, desc: "Total rejected submissions", tag: stats.rejectedCount > 10 ? "danger" : "watch", label: stats.rejectedCount > 10 ? "HIGH" : "NORMAL" },
            ].map(r => (
              <li className="da-security-row" key={r.desc}>
                <div className="da-security-info"><span className="da-security-val">{r.val}</span><span className="da-security-desc">{r.desc}</span></div>
                <span className={`da-security-tag ${r.tag}`}>{r.label}</span>
              </li>
            ))}
          </ul>
          <button className="da-security-action" onClick={() => router.push("/admin/review")} type="button">REVIEW QUEUE →</button>
        </div>
      </div>
    </div>
  );
}

/* ═══ Root Dashboard ════════════════════════════════════════ */
const NAV_TOP = ["Overview", "Users", "Contributions", "Engagement", "Advertisements", "System Health", "AI Intelligence"];
const NAV_BOT = ["Security"];
type NavSection = string;

export function DevDashboard({ initial }: { initial: AnalyticsPayload }) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("weekly");
  const [data, setData] = useState<AnalyticsPayload>(initial);
  const [loading, setLoading] = useState(false);
  const [activeNav, setActiveNav] = useState<NavSection>("Overview");

  const fetchOverview = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dev-analytics?period=${p}`);
      const json = (await res.json()) as AnalyticsPayload;
      setData(json);
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { void fetchOverview(period); }, [period, fetchOverview]);

  function generateReport() {
    const { stats, security } = data;
    const lines = [
      "=== NEWSOPS ANALYTICS REPORT ===",
      `Period: ${period.toUpperCase()}  |  Generated: ${new Date().toLocaleString()}`,
      "", "── SUBMISSIONS ─────────────────",
      `  Total: ${stats.totalSubmissions}`, `  Pending: ${stats.pendingCount}`,
      `  Approved: ${stats.approvedCount}`, `  Rejected: ${stats.rejectedCount}`,
      "", "── CONTRIBUTORS ─────────────────",
      `  Active: ${stats.activeContributors} / ${stats.totalUsers}`,
      `  Points Today: ${stats.pointsToday}`, `  Velocity: ${stats.velocity}%`,
      "", "── SYSTEM ───────────────────────",
      `  Response: ${stats.systemResponseMs}ms`, `  Published: ${stats.totalNewsItems} items`,
      "", "── SECURITY ─────────────────────",
      `  Auth Failures: ${security.authFailures}`,
      `  Expired Codes: ${security.expiredCodes}`,
      `  Active Sessions: ${security.activeSessions}`,
    ];
    void navigator.clipboard.writeText(lines.join("\n"));
    alert("Report copied to clipboard!");
  }

  const navIcon = (item: string) =>
    item === "Overview" ? "⊞" : item === "Users" ? "◯" : item === "Contributions" ? "≡" :
    item === "Engagement" ? "📈" : item === "Advertisements" ? "🪧" : item === "System Health" ? "⬡" :
    item === "AI Intelligence" ? "🤖" : item === "Security" ? "⬡" : "⚿";

  function renderMain() {
    if (activeNav === "Users") return <UsersSection router={router} />;
    if (activeNav === "Contributions") return <ContributionsSection router={router} />;
    if (activeNav === "Engagement") return <EngagementSection />;
    if (activeNav === "Advertisements") return <AdsSection />;
    if (activeNav === "System Health") return <SystemHealthSection stats={data.stats} security={data.security} />;
    if (activeNav === "Security") return <SecuritySection stats={data.stats} security={data.security} router={router} />;
    if (activeNav === "AI Intelligence") return <AiIntelligencePanel />;
    // Overview
    return (
      <OverviewSection
        stats={data.stats} chart={data.chart} recentSubmissions={data.recentSubmissions}
        security={data.security} period={period} setPeriod={setPeriod} loading={loading} router={router}
      />
    );
  }

  return (
    <div className={`da-shell${loading && activeNav === "Overview" ? " da-loading" : ""}`}>
      {/* Sidebar */}
      <aside className="da-sidebar">
        <div className="da-sidebar-brand">
          <span className="da-brand-name">NewsOps Analytics</span>
          <span className="da-brand-ver">v2.4.0-stable</span>
        </div>

        <nav className="da-nav" aria-label="Analytics sections">
          {NAV_TOP.map(item => (
            <button key={item} className={`da-nav-item${activeNav === item ? " active" : ""}`}
              onClick={() => setActiveNav(item)} type="button">
              <span className="da-nav-icon" aria-hidden="true">{navIcon(item)}</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="da-sidebar-mid">
          <button className="da-report-btn" onClick={generateReport} type="button">Generate Report</button>
        </div>

        <nav className="da-nav da-nav-bottom" aria-label="Admin sections">
          {NAV_BOT.map(item => (
            <button key={item} className={`da-nav-item${activeNav === item ? " active" : ""}`}
              onClick={() => setActiveNav(item)} type="button">
              <span className="da-nav-icon" aria-hidden="true">{navIcon(item)}</span>
              {item}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="da-main">{renderMain()}</main>
    </div>
  );
}
