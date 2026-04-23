import { ReviewSubmissionForm } from "@/components/review-submission-form";
import { requireAdmin } from "@/lib/auth";
import { getReviewMetrics, getReviewQueue } from "@/lib/news";
import { formatDate } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

type ReviewSubmission = Prisma.SubmissionGetPayload<{
  include: { contributor: { include: { profile: true } } };
}>;

export default async function ReviewQueuePage() {
  await requireAdmin();
  const [queue, metrics] = await Promise.all([
    getReviewQueue(),
    getReviewMetrics()
  ]);

  const urgentCount = queue.filter((submission: ReviewSubmission) => submission.priority > 0).length;

  return (
    <section className="stack">
      <div className="page-heading">
        <p className="page-kicker">Pending submissions editorial queue</p>
        <h1 className="page-title">Verification Portal</h1>
      </div>

      <div className="metric-strip">
        <div className="metric-cell">
          <p className="section-label">Total pending</p>
          <div className="metric-value">{queue.length}</div>
        </div>
        <div className="metric-cell">
          <p className="section-label">High priority</p>
          <div className="metric-value accent">{urgentCount}</div>
        </div>
        <div className="metric-cell">
          <p className="section-label">Reviewed today</p>
          <div className="metric-value">{metrics.reviewedToday}</div>
        </div>
        <div className="metric-cell">
          <p className="section-label">Avg. wait time</p>
          <div className="metric-value">{metrics.waitTime}</div>
        </div>
      </div>

      <div className="verification-table">
        <div className="verification-head">
          <span>Priority</span>
          <span>Submission detail</span>
          <span>Category</span>
          <span>Actions</span>
        </div>

        {queue.length > 0 ? (
          queue.map((submission: ReviewSubmission) => (
            <article className="verification-row" key={submission.id}>
              <div className={`priority-flag ${submission.priority > 0 ? "urgent" : "standard"}`.trim()}>
                {submission.priority > 0 ? "Priority" : "Standard"}
              </div>
              <div className="stack">
                <h3 className="card-title">{submission.headline}</h3>
                <p className="section-meta">
                  {submission.scope === "INDIA" ? "Indian" : submission.scope === "LOCAL" ? "Local" : "World"} | Submitted by{" "}
                  {submission.contributor.email ?? submission.contributor.phoneNumber ?? "restricted"} | {formatDate(submission.createdAt)}
                </p>
                {submission.details ? <p className="helper">{submission.details}</p> : null}
              </div>
              <div className="mono-chip">{submission.category}</div>
              <ReviewSubmissionForm submissionId={submission.id} />
            </article>
          ))
        ) : (
          <div className="empty-state">No pending submissions right now.</div>
        )}
      </div>
    </section>
  );
}
