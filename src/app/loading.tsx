export default function RootLoading() {
  return (
    <div className="home-layout">
      {/* Skeleton Banner Ad */}
      <div className="ad-slot ad-slot--banner skeleton-pulse" style={{ height: '120px' }} />

      <div className="feed-col">
        {/* Skeleton Header */}
        <div className="live-briefing-head">
          <div className="skeleton-pulse" style={{ width: '100px', height: '24px', borderRadius: '12px' }} />
          <div className="skeleton-pulse" style={{ width: '60%', height: '32px', marginTop: '12px' }} />
          <div className="skeleton-pulse" style={{ width: '40%', height: '16px', marginTop: '8px' }} />
        </div>

        {/* Skeleton Feed */}
        <div className="archive-feed" style={{ marginTop: '32px' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="news-card skeleton-card">
              <div className="meta-row">
                <div className="skeleton-pulse" style={{ width: '60px', height: '20px' }} />
                <div className="skeleton-pulse" style={{ width: '60px', height: '20px' }} />
                <div className="skeleton-pulse" style={{ width: '80px', height: '20px' }} />
              </div>
              <div className="skeleton-pulse" style={{ width: '90%', height: '24px', marginTop: '16px' }} />
              <div className="summary-list" style={{ marginTop: '16px' }}>
                <div className="skeleton-pulse" style={{ width: '100%', height: '16px', marginBottom: '8px' }} />
                <div className="skeleton-pulse" style={{ width: '100%', height: '16px', marginBottom: '8px' }} />
                <div className="skeleton-pulse" style={{ width: '80%', height: '16px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="widget-col">
        <div className="ad-slot skeleton-pulse" style={{ height: '250px' }} />
        <div className="widget-card">
          <div className="skeleton-pulse" style={{ width: '100%', height: '200px' }} />
        </div>
      </aside>
    </div>
  );
}
