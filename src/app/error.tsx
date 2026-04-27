'use strict';
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div className="empty-state-icon" style={{ marginBottom: '24px', color: '#ff4444' }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="live-title" style={{ fontSize: '2rem', marginBottom: '12px' }}>System Failure</h2>
      <p className="empty-state-text" style={{ maxWidth: '400px', textAlign: 'center', marginBottom: '32px' }}>
        An unexpected error occurred while processing the intelligence feed.
        <br />
        <small style={{ opacity: 0.6, fontSize: '0.8rem' }}>Error Code: {error.digest || 'UNKNOWN_SIG'}</small>
      </p>
      <button 
        onClick={() => reset()}
        className="feed-cta-btn"
        style={{ border: '1px solid #ff4444', color: '#ff4444' }}
      >
        Try to Reconnect
      </button>
    </div>
  );
}
