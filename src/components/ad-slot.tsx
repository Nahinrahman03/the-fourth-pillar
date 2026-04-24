import type { AdConfig } from "@/config/ads";

type AdSlotProps = {
  ad: AdConfig;
  /**
   * Pass `true` for admin/developer accounts so they always see the
   * slot placeholder for layout reference. Normal users receive `false`
   * and will only see the slot when `ad.enabled === true` and an
   * `imageUrl` is set.
   */
  devPreview?: boolean;
  /** Optional extra CSS class for the wrapper (e.g. "ad-slot--banner") */
  className?: string;
};

export function AdSlot({ ad, devPreview = false, className }: AdSlotProps) {
  const isLive = ad.enabled && !!ad.imageUrl;

  // Normal users: hide the component entirely when no live ad is configured
  if (!devPreview && !isLive) return null;

  return (
    <div className={`ad-slot${className ? ` ${className}` : ""}`}>
      <div className="ad-slot-header">
        <span>{ad.label || "Sponsored Intelligence"}</span>
        <span className="ad-slot-tag">AD</span>
      </div>

      {isLive ? (
        <>
          <a
            href={ad.linkUrl || "#"}
            rel="noopener noreferrer sponsored"
            target="_blank"
            className="ad-slot-link"
            aria-label={ad.altText || "Sponsored advertisement"}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.imageUrl}
              alt={ad.altText || "Sponsored advertisement"}
              className="ad-slot-image"
            />
          </a>
          {(ad.title || ad.body) && (
            <div className="ad-slot-content">
              {ad.title && <p className="ad-slot-title">{ad.title}</p>}
              {ad.body && <p className="ad-slot-body">{ad.body}</p>}
              {ad.linkUrl && (
                <a
                  href={ad.linkUrl}
                  rel="noopener noreferrer sponsored"
                  target="_blank"
                  className="ad-slot-cta"
                >
                  {ad.ctaText || "Learn More →"}
                </a>
              )}
            </div>
          )}
        </>
      ) : (
        /* Developer-only placeholder — never shown to normal users */
        <div className="ad-slot-placeholder">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="30" height="30" rx="1" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" />
            <path d="M10 22L14 16L17 19L20 14L22 22" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1" />
          </svg>
          <p className="ad-slot-placeholder-label">
            Ad Space<br />Image Only
          </p>
          <p className="ad-slot-placeholder-hint">
            Edit <code>src/config/ads.ts</code> to activate
          </p>
        </div>
      )}
    </div>
  );
}
