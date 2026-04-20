import { PreferencesForm } from "@/components/preferences-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function ProfilePage() {
  const user = await requireUser();
  const contributions = await prisma.submission.findMany({
    where: {
      contributorId: user.id
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 5
  });

  return (
    <section className="profile-layout">
      <aside className="stack">
        <div className="page-heading">
          <p className="page-kicker">Member archive</p>
          <h1 className="page-title">Your Profile</h1>
        </div>

        <article className="authority-card">
          <p className="section-label">Accumulated authority</p>
          <div className="authority-value">{user.profile?.points ?? 0}</div>
          <p className="section-meta">Private points are visible only to your account.</p>
        </article>

        <PreferencesForm
          notifyByEmail={user.profile?.notifyByEmail ?? false}
          notifyInApp={user.profile?.notifyInApp ?? true}
        />

        <article className="info-panel">
          <p className="section-label">Identity</p>
          <p className="card-title">{user.email ?? user.phoneNumber ?? "Restricted member"}</p>
          <p className="section-meta">Profile created {formatDate(user.createdAt)}</p>
        </article>
      </aside>

      <div className="archive-panel stack">
        <div className="section-heading">
          <div>
            <p className="section-label">Contribution archive</p>
            <h2 className="section-title">Latest activities</h2>
          </div>
          <p className="section-meta">Showing last 5 activities</p>
        </div>

        <div className="stack">
          {contributions.length > 0 ? (
            contributions.map((submission) => (
              <article className="archive-row" key={submission.id}>
                <div>
                  <p className="section-label">{submission.category}</p>
                  <h3 className="card-title">{submission.headline}</h3>
                  <p className="section-meta">
                    {submission.status === "APPROVED" ? "Verified" : "Submitted"} • {formatDate(submission.createdAt)}
                  </p>
                </div>
                <div className="archive-points">
                  {submission.awardedPoints ? `+${submission.awardedPoints} pts` : submission.status}
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">Your contribution archive will appear here after your first submission.</div>
          )}
        </div>
      </div>
    </section>
  );
}
