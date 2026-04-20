import { SubmitNewsForm } from "@/components/submit-news-form";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function ContributePage() {
  const user = await requireUser();
  const submissions = await prisma.submission.findMany({
    where: {
      contributorId: user.id
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 6
  });

  return (
    <section className="editorial-grid">
      <div className="stack">
        <div className="page-heading">
          <p className="page-kicker">Workspace / Portal</p>
          <h1 className="page-title">Submit News</h1>
          <p className="page-subtitle">
            Precision functionalism starts here. Provide your findings with clear evidence and concise data
            points. All submissions are reviewed before publication.
          </p>
        </div>

        <SubmitNewsForm />
      </div>

      <aside className="stack">
        <article className="info-panel dark">
          <h2 className="section-title">Architect&apos;s checklist</h2>
          <ul className="summary-list">
            <li>Headline should stay under 80 characters when possible.</li>
            <li>Use 2 to 5 points that can be checked against sources.</li>
            <li>Keep the tone neutral, exact, and evidence-led.</li>
          </ul>
        </article>

        <article className="info-panel">
          <h2 className="section-title">Submission status</h2>
          <div className="metric-strip single">
            <div className="metric-cell">
              <p className="section-label">Pending analysis</p>
              <div className="metric-value">
                {submissions.filter((submission) => submission.status === "PENDING").length}
              </div>
            </div>
          </div>
          <p className="section-meta">Automated semantic checks run when you submit the brief.</p>
        </article>

        <article className="info-panel">
          <div className="section-heading">
            <div>
              <p className="section-label">Latest submissions</p>
              <h2 className="section-title">Archive preview</h2>
            </div>
          </div>
          <div className="stack">
            {submissions.length > 0 ? (
              submissions.map((submission) => (
                <div className="archive-row" key={submission.id}>
                  <div>
                    <p className="section-label">{submission.category}</p>
                    <h3 className="card-title">{submission.headline}</h3>
                    <p className="section-meta">{formatDate(submission.createdAt)}</p>
                  </div>
                  <div
                    className={`archive-points status-badge status-${submission.status.toLowerCase()}`}
                  >
                    {submission.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">Your recent submissions will appear here.</div>
            )}
          </div>
        </article>
      </aside>
    </section>
  );
}
