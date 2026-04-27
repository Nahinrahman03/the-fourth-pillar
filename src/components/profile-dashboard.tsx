"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* ─── Types ───────────────────────────────────────────────── */
type Submission = {
  id: string;
  headline: string;
  category: string;
  status: string;
  awardedPoints: number | null;
  createdAt: string;
};

type ProfileDashboardProps = {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
    image: string | null;
    role: string;
    createdAt: string;
    profile: {
      points: number;
      notifyInApp: boolean;
      notifyByEmail: boolean;
      lastSeenAt: string | null;
    } | null;
  };
  submissions: Submission[];
  stats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    totalPoints: number;
  };
  activityByMonth: { label: string; count: number }[];
};

/* ─── Mini Activity Graph ─────────────────────────────────── */
function ActivityGraph({ data }: { data: { label: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const H = 60;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: `${H + 20}px` }}>
      {data.map((d, i) => {
        const barH = Math.max((d.count / max) * H, d.count > 0 ? 4 : 2);
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <div
              title={`${d.label}: ${d.count} submission${d.count !== 1 ? "s" : ""}`}
              style={{
                width: "100%",
                height: `${barH}px`,
                background: d.count > 0 ? "var(--primary)" : "var(--surface-high)",
                borderRadius: "2px 2px 0 0",
                transition: "height 0.4s ease",
                cursor: "default",
                opacity: d.count > 0 ? 1 : 0.4,
              }}
            />
            <span style={{ fontSize: "8px", color: "var(--ink-soft)", letterSpacing: "0.04em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Radial Points Gauge ─────────────────────────────────── */
function PointsGauge({ points }: { points: number }) {
  const max = 500;
  const clampedPct = Math.min(points / max, 1);
  const r = 42;
  const circ = 2 * Math.PI * r;
  const filled = clampedPct * circ * 0.75; // 270° arc
  const circumference = circ * 0.75;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        {/* Track */}
        <circle
          cx="55" cy="55" r={r}
          fill="none"
          stroke="var(--surface-high)"
          strokeWidth="7"
          strokeDasharray={`${circumference} ${circ}`}
          strokeLinecap="round"
          transform="rotate(135 55 55)"
        />
        {/* Fill */}
        <circle
          cx="55" cy="55" r={r}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="7"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          transform="rotate(135 55 55)"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="55" y="51" textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--ink)" fontFamily="var(--heading)">
          {points}
        </text>
        <text x="55" y="65" textAnchor="middle" fontSize="8" fill="var(--ink-soft)" letterSpacing="2" fontFamily="var(--mono)">
          POINTS
        </text>
      </svg>
      <p style={{ fontSize: "10px", color: "var(--ink-soft)", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
        Intelligence Score
      </p>
    </div>
  );
}

/* ─── Subscription Tier Card ──────────────────────────────── */
function SubscriptionCard({ role }: { role: string }) {
  const isAdmin = role === "ADMIN";
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        padding: "22px 24px",
        background: isAdmin
          ? "linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 60%, #16213e 100%)"
          : "linear-gradient(135deg, #0a0a0a 0%, #111 100%)",
        border: `1px solid ${isAdmin ? "rgba(118,120,237,0.45)" : "rgba(255,255,255,0.08)"}`,
        borderRadius: "2px",
      }}
    >
      {/* Holographic shimmer strip */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: isAdmin
          ? "linear-gradient(90deg, transparent, #7678ed, #a78bfa, #7678ed, transparent)"
          : "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
        animation: "holo-sweep 3s linear infinite",
      }} />

      {/* Grid texture overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,0.025) 28px, rgba(255,255,255,0.025) 29px), repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(255,255,255,0.025) 28px, rgba(255,255,255,0.025) 29px)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative" }}>
        <p style={{ fontSize: "9px", letterSpacing: "0.2em", color: isAdmin ? "#7678ed" : "#888", textTransform: "uppercase", margin: "0 0 6px", fontFamily: "var(--mono)" }}>
          Subscription Tier
        </p>
        <p style={{
          fontSize: "22px", fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase",
          color: isAdmin ? "#a78bfa" : "#fff",
          margin: "0 0 10px",
          fontFamily: "var(--heading)",
        }}>
          {isAdmin ? "Alpha Clearance" : "Standard Access"}
        </p>
        <p style={{ fontSize: "11px", color: isAdmin ? "rgba(167,139,250,0.75)" : "rgba(255,255,255,0.5)", margin: "0 0 14px", lineHeight: 1.6 }}>
          {isAdmin
            ? "Full access to dark-pool signals, satellite imaging, and direct comms with Sector Command."
            : "Access to verified intelligence briefings across all global sectors."}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80", flexShrink: 0 }} />
          <span style={{ fontSize: "9px", letterSpacing: "0.15em", color: "#4ade80", textTransform: "uppercase", fontFamily: "var(--mono)" }}>
            Valid Until: 31 DEC 2026
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Stat Box ────────────────────────────────────────────── */
function StatBox({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div style={{ padding: "16px 18px", background: "var(--surface-low)", borderLeft: `3px solid ${accent ?? "var(--line-strong)"}` }}>
      <p style={{ margin: "0 0 4px", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-soft)", fontFamily: "var(--mono)" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: "22px", fontWeight: 800, letterSpacing: "-0.03em", fontFamily: "var(--heading)", color: "var(--ink)" }}>
        {value}
      </p>
    </div>
  );
}

/* ─── Notification Toggle ─────────────────────────────────── */
function NotifToggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px",
        padding: "14px 0",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div>
        <p style={{ margin: "0 0 2px", fontSize: "13px", fontWeight: 600, color: "var(--ink)" }}>{label}</p>
        <p style={{ margin: 0, fontSize: "11px", color: "var(--ink-soft)" }}>{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          flexShrink: 0,
          width: "40px", height: "22px",
          borderRadius: "11px",
          background: checked ? "var(--primary)" : "var(--surface-high)",
          border: "none",
          cursor: "pointer",
          position: "relative",
          transition: "background 200ms ease",
        }}
      >
        <span style={{
          position: "absolute",
          top: "3px",
          left: checked ? "21px" : "3px",
          width: "16px", height: "16px",
          borderRadius: "50%",
          background: "#fff",
          transition: "left 200ms ease",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
        }} />
      </button>
    </div>
  );
}

/* ─── Status Pill ─────────────────────────────────────────── */
function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    APPROVED: { bg: "rgba(74,222,128,0.12)", color: "var(--accent-green)" },
    PENDING:  { bg: "rgba(251,191,36,0.12)",  color: "var(--accent-amber)" },
    REJECTED: { bg: "rgba(248,113,113,0.12)", color: "var(--alert)" },
  };
  const s = cfg[status] ?? { bg: "var(--surface-high)", color: "var(--ink-soft)" };
  return (
    <span style={{ padding: "3px 9px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", background: s.bg, color: s.color, borderRadius: "2px", fontFamily: "var(--mono)" }}>
      {status}
    </span>
  );
}

/* ─── Main Component ──────────────────────────────────────── */
export function ProfileDashboard({ user, submissions, stats, activityByMonth }: ProfileDashboardProps) {
  const router = useRouter();
  const [notifyInApp, setNotifyInApp]     = useState(user.profile?.notifyInApp ?? true);
  const [notifyByEmail, setNotifyByEmail] = useState(user.profile?.notifyByEmail ?? false);
  const [saving, setSaving]   = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const identifier = user.email ?? user.phoneNumber ?? `AGENT-${user.id.slice(-6).toUpperCase()}`;
  const initials = (user.name ?? identifier).slice(0, 2).toUpperCase();
  const successRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  async function handleSavePreferences() {
    setSaving(true);
    setSaveMsg(null);
    setSaveErr(null);
    try {
      const res = await fetch("/api/profile/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifyInApp, notifyByEmail }),
      });
      const json = await res.json() as { message?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to save.");
      setSaveMsg(json.message ?? "Preferences updated.");
      router.refresh();
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : "Error saving preferences.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* ══ Row 1: Identity ══ */}
      <div style={{ padding: "24px", background: "var(--surface-low)", display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Avatar */}
        {user.image ? (
          <img src={user.image} alt={user.name ?? "Avatar"} style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid var(--primary)" }} />
        ) : (
          <div style={{
            width: 68, height: 68, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, var(--primary), var(--primary-dim))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px", fontWeight: 900, color: "#fff", fontFamily: "var(--heading)",
          }}>
            {initials}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: "0 0 2px", fontSize: "9px", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-soft)", fontFamily: "var(--mono)" }}>
            Intelligence Agent
          </p>
          <p style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800, color: "var(--ink)", fontFamily: "var(--heading)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.name ?? "Anonymous"}
          </p>
          <p style={{ margin: "0 0 10px", fontSize: "11px", color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {identifier}
          </p>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "4px 10px", fontSize: "9px", letterSpacing: "0.14em",
            textTransform: "uppercase", fontFamily: "var(--mono)",
            background: user.role === "ADMIN" ? "rgba(118,120,237,0.15)" : "rgba(255,255,255,0.06)",
            color: user.role === "ADMIN" ? "var(--primary)" : "var(--ink-soft)",
            border: `1px solid ${user.role === "ADMIN" ? "rgba(118,120,237,0.3)" : "var(--line)"}`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: user.role === "ADMIN" ? "var(--primary)" : "var(--ink-soft)" }} />
            {user.role}
          </span>
        </div>
      </div>

      {/* ══ Row 2: Stats strip ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
        <StatBox label="Total Filed" value={stats.total} accent="var(--ink-soft)" />
        <StatBox label="Verified" value={stats.approved} accent="var(--accent-green)" />
        <StatBox label="Pending" value={stats.pending} accent="var(--accent-amber)" />
        <StatBox label="Success Rate" value={`${successRate}%`} accent="var(--primary)" />
      </div>

      {/* ══ Row 3: Gauge + Activity Graph ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "16px" }}>
        {/* Points gauge */}
        <div style={{ padding: "24px", background: "var(--surface-low)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
          <PointsGauge points={stats.totalPoints} />
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 2px", fontSize: "9px", letterSpacing: "0.16em", color: "var(--ink-soft)", textTransform: "uppercase", fontFamily: "var(--mono)" }}>
              Clearance threshold
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: "var(--ink)" }}>
              500 pts = Priority Access
            </p>
          </div>
        </div>

        {/* Activity graph */}
        <div style={{ padding: "24px", background: "var(--surface-low)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-soft)", fontFamily: "var(--mono)" }}>
                Submission Activity
              </p>
              <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--heading)" }}>
                12-Month Overview
              </p>
            </div>
            <span style={{ fontSize: "9px", color: "var(--ink-soft)", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "var(--mono)" }}>
              {stats.total} total
            </span>
          </div>
          <ActivityGraph data={activityByMonth} />
        </div>
      </div>

      {/* ══ Row 4: Recent Submissions ══ */}
      <div style={{ background: "var(--surface-low)", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-soft)", fontFamily: "var(--mono)" }}>
              Contribution archive
            </p>
            <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--heading)" }}>
              Latest Submissions
            </p>
          </div>
          <a href="/dashboard/contributions" style={{ fontSize: "11px", color: "var(--primary)", letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none", fontWeight: 700 }}>
            My Contributions →
          </a>
        </div>

        {submissions.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-soft)", fontSize: "13px", borderTop: "1px solid var(--line)" }}>
            No submissions yet. File your first intelligence brief to earn points.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 80px", gap: "12px", padding: "8px 0", borderBottom: "1px solid var(--line)", marginBottom: "4px" }}>
              {["Headline", "Category", "Status", "Points"].map((h) => (
                <span key={h} style={{ fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-soft)", fontFamily: "var(--mono)" }}>{h}</span>
              ))}
            </div>
            {submissions.map((s) => (
              <div key={s.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 90px 80px", gap: "12px", padding: "13px 0", borderBottom: "1px solid var(--line)", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={s.headline}>
                  {s.headline}
                </span>
                <span style={{ fontSize: "11px", color: "var(--ink-soft)" }}>{s.category}</span>
                <StatusPill status={s.status} />
                <span style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--heading)", color: s.status === "APPROVED" ? "var(--accent-green)" : "var(--ink-soft)" }}>
                  {s.status === "APPROVED" && s.awardedPoints ? `+${s.awardedPoints}` : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ Row 5: Notification Preferences ══ */}
      <div style={{ background: "var(--surface-low)", padding: "24px" }}>
        <div style={{ marginBottom: "16px" }}>
          <p style={{ margin: "0 0 2px", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--ink-soft)", fontFamily: "var(--mono)" }}>
            System alerts
          </p>
          <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--ink)", fontFamily: "var(--heading)" }}>
            Notification Matrix
          </p>
        </div>

        <NotifToggle
          label="In-App Alerts"
          desc="Breaking reports and verified briefings delivered in-app."
          checked={notifyInApp}
          onChange={setNotifyInApp}
        />
        <NotifToggle
          label="Email Dispatch"
          desc="Contribution milestones and system broadcasts via email."
          checked={notifyByEmail}
          onChange={setNotifyByEmail}
        />

        <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSavePreferences()}
            style={{
              padding: "10px 24px",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: "12px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: saving ? "wait" : "pointer",
              opacity: saving ? 0.7 : 1,
              transition: "opacity 150ms ease",
            }}
          >
            {saving ? "Saving…" : "Update Preferences"}
          </button>
          {saveMsg && <span style={{ fontSize: "11px", color: "var(--accent-green)", fontWeight: 700 }}>{saveMsg}</span>}
          {saveErr && <span style={{ fontSize: "11px", color: "var(--alert)", fontWeight: 700 }}>{saveErr}</span>}
        </div>
      </div>
    </div>
  );
}
