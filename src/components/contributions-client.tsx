"use client";

import { useState, useMemo } from "react";

type Submission = {
  id: string;
  headline: string;
  category: string;
  scope: string;
  status: string;
  awardedPoints: number | null;
  moderationNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

type Stats = {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  points: number;
};

type Filter = "ALL" | "APPROVED" | "PENDING" | "REJECTED";

/* ─── Status Pill ─────────────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    APPROVED: { bg: "rgba(74,222,128,0.12)",  color: "var(--accent-green)" },
    PENDING:  { bg: "rgba(251,191,36,0.12)",  color: "var(--accent-amber)" },
    REJECTED: { bg: "rgba(248,113,113,0.12)", color: "var(--alert)" },
  };
  const s = cfg[status] ?? { bg: "var(--surface-high)", color: "var(--ink-soft)" };
  return (
    <span style={{
      padding: "3px 10px", fontSize: "9px", fontWeight: 700,
      letterSpacing: "0.12em", textTransform: "uppercase",
      background: s.bg, color: s.color, borderRadius: "2px",
      fontFamily: "var(--mono)", whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

/* ─── Scope Badge ─────────────────────────────────────────── */
function ScopeBadge({ scope }: { scope: string }) {
  return (
    <span style={{
      padding: "2px 7px", fontSize: "8px", fontWeight: 700,
      letterSpacing: "0.12em", textTransform: "uppercase",
      background: "var(--surface-high)", color: "var(--ink-soft)",
      borderRadius: "2px", fontFamily: "var(--mono)",
    }}>
      {scope}
    </span>
  );
}

/* ─── Stat Card ───────────────────────────────────────────── */
function StatCard({ label, value, accent, sub }: { label: string; value: string | number; accent: string; sub?: string }) {
  return (
    <div style={{
      padding: "20px 22px",
      background: "var(--surface-low)",
      borderTop: `3px solid ${accent}`,
      display: "flex", flexDirection: "column", gap: "4px",
    }}>
      <p style={{ margin: 0, fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-soft)", fontFamily: "var(--mono)" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: "28px", fontWeight: 900, letterSpacing: "-0.04em", color: "var(--ink)", fontFamily: "var(--heading)", lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p style={{ margin: 0, fontSize: "10px", color: "var(--ink-soft)" }}>{sub}</p>
      )}
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */
export function ContributionsClient({ submissions, stats }: { submissions: Submission[]; stats: Stats }) {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const successRate = stats.total > 0
    ? Math.round((stats.approved / stats.total) * 100)
    : 0;

  const filtered = useMemo(() => {
    let list = filter === "ALL" ? submissions : submissions.filter((s) => s.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.headline.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.scope.toLowerCase().includes(q)
      );
    }
    return list;
  }, [submissions, filter, search]);

  const filterTabs: { key: Filter; label: string; count: number; color: string }[] = [
    { key: "ALL",      label: "All",      count: stats.total,    color: "var(--ink-soft)" },
    { key: "PENDING",  label: "Pending",  count: stats.pending,  color: "var(--accent-amber)" },
    { key: "APPROVED", label: "Approved", count: stats.approved, color: "var(--accent-green)" },
    { key: "REJECTED", label: "Rejected", count: stats.rejected, color: "var(--alert)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── Stats Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
        <StatCard label="Total Filed"   value={stats.total}     accent="var(--line-strong)" sub="All time" />
        <StatCard label="Verified"      value={stats.approved}  accent="var(--accent-green)" sub={`${successRate}% success rate`} />
        <StatCard label="Pending"       value={stats.pending}   accent="var(--accent-amber)" sub="Awaiting review" />
        <StatCard label="Points Earned" value={`+${stats.points}`} accent="var(--primary)" sub="Intelligence score" />
      </div>

      {/* ── Filter + Search bar ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: "12px",
        borderBottom: "1px solid var(--line)", paddingBottom: "0",
      }}>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "0" }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              style={{
                padding: "10px 18px",
                background: "none",
                border: "none",
                borderBottom: filter === tab.key ? `2px solid ${tab.color}` : "2px solid transparent",
                color: filter === tab.key ? tab.color : "var(--ink-soft)",
                fontWeight: filter === tab.key ? 700 : 400,
                cursor: "pointer",
                fontSize: "12px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {tab.label}
              <span style={{
                padding: "1px 6px",
                borderRadius: "10px",
                background: filter === tab.key ? tab.color : "var(--surface-high)",
                color: filter === tab.key ? (tab.key === "ALL" ? "var(--ink)" : "#fff") : "var(--ink-soft)",
                fontSize: "9px",
                fontWeight: 700,
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", background: "var(--surface-low)", border: "1px solid var(--line)", minWidth: "220px" }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: "var(--ink-soft)" }}>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11.5 11.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="search"
            placeholder="Search briefs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--ink)",
              fontSize: "12px",
              width: "100%",
            }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: "var(--surface-low)" }}>
        {/* Table head */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 110px 80px 80px 90px",
          gap: "12px",
          padding: "10px 20px",
          borderBottom: "1px solid var(--line)",
        }}>
          {["Headline", "Category", "Scope", "Points", "Status"].map((h) => (
            <span key={h} style={{ fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-soft)", fontFamily: "var(--mono)" }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--ink-soft)", fontSize: "13px" }}>
            {search ? `No briefs match "${search}".` : "No submissions in this category yet."}
          </div>
        ) : (
          filtered.map((s) => {
            const isExpanded = expanded === s.id;
            const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(s.createdAt));
            return (
              <div key={s.id}>
                {/* Main row */}
                <div
                  onClick={() => setExpanded(isExpanded ? null : s.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 110px 80px 80px 90px",
                    gap: "12px",
                    padding: "14px 20px",
                    borderBottom: "1px solid var(--line)",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "background 120ms ease",
                    background: isExpanded ? "var(--surface-mid)" : "transparent",
                  }}
                  onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = "var(--surface)"; }}
                  onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ minWidth: 0 }}>
                    <span style={{
                      display: "block",
                      fontSize: "13px", fontWeight: 600,
                      color: "var(--ink)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }} title={s.headline}>
                      {s.headline}
                    </span>
                    <span style={{ fontSize: "10px", color: "var(--ink-soft)" }}>{date}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>{s.category}</span>
                  <ScopeBadge scope={s.scope} />
                  <span style={{
                    fontSize: "14px", fontWeight: 800, fontFamily: "var(--heading)",
                    color: s.status === "APPROVED" ? "var(--accent-green)" : "var(--ink-soft)",
                  }}>
                    {s.status === "APPROVED" && s.awardedPoints ? `+${s.awardedPoints}` : "—"}
                  </span>
                  <StatusPill status={s.status} />
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{
                    padding: "16px 20px 20px",
                    borderBottom: "1px solid var(--line)",
                    background: "var(--surface-mid)",
                    animation: "dropdown-in 120ms ease",
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                      <div>
                        <p style={{ margin: "0 0 6px", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-soft)", fontFamily: "var(--mono)" }}>
                          Submission ID
                        </p>
                        <p style={{ margin: 0, fontSize: "11px", color: "var(--ink)", fontFamily: "var(--mono)" }}>
                          #{s.id.slice(-10).toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p style={{ margin: "0 0 6px", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-soft)", fontFamily: "var(--mono)" }}>
                          Last Updated
                        </p>
                        <p style={{ margin: 0, fontSize: "11px", color: "var(--ink)" }}>
                          {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(s.updatedAt))}
                        </p>
                      </div>
                      {s.moderationNotes && (
                        <div style={{ gridColumn: "1 / -1" }}>
                          <p style={{ margin: "0 0 6px", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-soft)", fontFamily: "var(--mono)" }}>
                            Moderation Note
                          </p>
                          <p style={{
                            margin: 0, fontSize: "12px", color: "var(--ink)", lineHeight: 1.6,
                            padding: "10px 14px",
                            background: s.status === "REJECTED" ? "rgba(248,113,113,0.06)" : "var(--surface-high)",
                            borderLeft: `3px solid ${s.status === "REJECTED" ? "var(--alert)" : "var(--accent-green)"}`,
                          }}>
                            {s.moderationNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Footer count */}
        {filtered.length > 0 && (
          <div style={{ padding: "10px 20px", borderTop: "1px solid var(--line)" }}>
            <p style={{ margin: 0, fontSize: "10px", color: "var(--ink-soft)", fontFamily: "var(--mono)", letterSpacing: "0.08em" }}>
              Showing {filtered.length} of {stats.total} submissions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
