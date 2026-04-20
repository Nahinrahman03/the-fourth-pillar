import { MarkAllReadButton } from "@/components/mark-all-read-button";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 30
  });

  return (
    <section className="dashboard-grid">
      <article className="panel stack">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Notification center</p>
            <h2 className="section-title">Your latest alerts</h2>
          </div>
          <MarkAllReadButton />
        </div>

        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <article
              className={`notification-item ${notification.readAt ? "" : "unread"}`.trim()}
              key={notification.id}
            >
              <div className="pill-row">
                <span className="pill">{notification.type.replaceAll("_", " ")}</span>
                {!notification.readAt ? <span className="pill pending">Unread</span> : null}
              </div>
              <h3 className="card-title">{notification.title}</h3>
              <p className="muted">{notification.body}</p>
              <div className="meta-row">
                <span>{formatDate(notification.createdAt)}</span>
                {notification.href ? <a href={notification.href}>Open</a> : null}
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">Notifications will appear here when your account has updates.</div>
        )}
      </article>

      <article className="card">
        <h3 className="card-title">How notifications work</h3>
        <ul className="summary-list">
          <li>You receive alerts for submission receipt, approval, and rejection.</li>
          <li>Unread notifications stay highlighted until you mark them as read.</li>
          <li>Email preference is stored in your profile and ready for provider integration.</li>
        </ul>
      </article>
    </section>
  );
}
