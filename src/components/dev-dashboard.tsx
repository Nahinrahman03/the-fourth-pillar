"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { TimeAgo } from "@/components/time-ago";

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
            <g key={`${label}-${i}`}>
              <rect x={x} y={H - subH} width={barW} height={subH} fill="#3d3d3d" rx="1" />
              <rect x={x + barW + gap} y={H - verH} width={barW} height={verH} fill="#d0d5d5" rx="1" />
              {label ? (
                <text x={x + barW} y={H + 18} textAnchor="middle" fontSize="8" fill="#5a6061" fontFamily="Inter,sans-serif" letterSpacing="0.08em">
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
        <text x="65" y="76" textAnchor="middle" fontSize="8" fill="#5a6061" letterSpacing="2">TARGET</text>
      </svg>
    </div>
  );
}

/* ═══ Users Section ════════════════════════════════════════ */
function UsersSection({ router }: { router: ReturnType<typeof useRouter> }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

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
          <div className="da-table-head da-users-cols" role="row">
            <span>IDENTIFIER</span><span>ROLE</span><span>SUBMISSIONS</span><span>POINTS</span><span>LAST SEEN</span><span>JOINED</span>
          </div>
          {users.length === 0 ? (
            <div className="da-table-empty">No users found.</div>
          ) : users.map(u => (
            <div className="da-table-row da-users-cols" key={u.id} role="row">
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
          <div className="da-table-head da-contrib-cols" role="row">
            <span>ID</span><span>HEADLINE</span><span>CATEGORY</span><span>CONTRIBUTOR</span><span>STATUS</span><span>POINTS</span><span>SUBMITTED</span>
          </div>
          {contribs.length === 0 ? (
            <div className="da-table-empty">{loading ? "Loading…" : "No submissions found."}</div>
          ) : contribs.map(c => (
            <div className="da-table-row da-contrib-cols" key={c.fullId} role="row">
              <span className="da-table-id">#{c.id}</span>
              <span className="da-contrib-headline" title={c.headline}>{c.headline.length > 45 ? c.headline.slice(0, 43) + "…" : c.headline}</span>
              <span>{c.category}</span>
              <span className="da-table-contrib" title={c.contributor}>{c.contributor.length > 22 ? c.contributor.slice(0, 20) + "…" : c.contributor}</span>
              <span><span className={`da-status-chip ${c.status.toLowerCase()}`}>{c.status}</span></span>
              <span className="da-table-pts">{c.status === "APPROVED" ? `+${c.points}` : c.status === "REJECTED" ? "0" : "—"}</span>
              <span><TimeAgo date={c.createdAt} /></span>
            </div>
          ))}
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
const NAV_TOP = ["Overview", "Users", "Contributions", "System Health"];
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
    item === "System Health" ? "⬡" : item === "Security" ? "⬡" : "⚿";

  function renderMain() {
    if (activeNav === "Users") return <UsersSection router={router} />;
    if (activeNav === "Contributions") return <ContributionsSection router={router} />;
    if (activeNav === "System Health") return <SystemHealthSection stats={data.stats} security={data.security} />;
    if (activeNav === "Security") return <SecuritySection stats={data.stats} security={data.security} router={router} />;
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
