import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div className="empty-state-icon" style={{ marginBottom: '24px' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <h2 className="live-title" style={{ fontSize: '2rem', marginBottom: '12px' }}>404 — Page Not Found</h2>
      <p className="empty-state-text" style={{ maxWidth: '400px', textAlign: 'center', marginBottom: '32px' }}>
        The intelligence briefing you are looking for has been archived, moved, or never existed in this sector.
      </p>
      <Link href="/" className="feed-cta-btn">
        Return to Command Center
      </Link>
    </div>
  );
}
