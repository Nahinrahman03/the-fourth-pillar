export default function AiNewsLoading() {
  return (
    <section className="ai-feed-layout">
      <div className="ai-feed-header">
        <div className="skeleton-pulse" style={{ width: 120, height: 22, marginBottom: 16 }} />
        <div className="skeleton-pulse" style={{ width: "60%", height: 48, marginBottom: 12 }} />
        <div className="skeleton-pulse" style={{ width: "45%", height: 18 }} />
      </div>

      <div className="ai-news-feed" style={{ marginTop: 32 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="ai-news-card" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="ai-card-meta">
              <div className="skeleton-pulse" style={{ width: 72, height: 20 }} />
              <div className="skeleton-pulse" style={{ width: 60, height: 20 }} />
            </div>
            <div className="skeleton-pulse" style={{ width: "85%", height: 26, marginTop: 12 }} />
            <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
              {[...Array(5)].map((_, j) => (
                <div key={j} className="skeleton-pulse" style={{ width: `${90 - j * 5}%`, height: 14 }} />
              ))}
            </div>
            <div className="skeleton-pulse" style={{ width: "100%", height: 56, marginTop: 16 }} />
          </div>
        ))}
      </div>
    </section>
  );
}
