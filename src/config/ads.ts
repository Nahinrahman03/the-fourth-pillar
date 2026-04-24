/**
 * ── AD SLOT CONFIGURATION ───────────────────────────────────────────────────
 * Developer-managed ad configuration.
 *
 * Available slots:
 *   • MAIN_PAGE_AD   — Sidebar widget on the home feed (right column)
 *   • INLINE_FEED_AD — Inline card injected between news cards (every ~6 items)
 *   • TOP_BANNER_AD  — Full-width banner below the site header
 *
 * To activate any slot:
 *   1. Set `enabled: true`
 *   2. Set `imageUrl` to an absolute image URL (images only)
 *   3. Set `linkUrl` to the click-through destination
 *   4. Optionally set `label`, `title`, `body`, `ctaText`, `altText`
 *
 * Ads are ONLY visible to normal users when `enabled: true`.
 * Developer/admin accounts always see the placeholder for layout preview.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type AdConfig = {
  enabled: boolean;
  imageUrl: string;    // Absolute image URL (required when enabled)
  linkUrl: string;     // Click-through destination URL
  label: string;       // Slot label shown in the widget header
  title: string;       // Ad headline (optional body copy)
  body: string;        // Short ad description (optional)
  ctaText: string;     // Call-to-action link text
  altText: string;     // Image alt text for accessibility
};

/** ── Slot 1: Right-column sidebar widget (home page) ── */
export const MAIN_PAGE_AD: AdConfig = {
  enabled: false,                    // ← Set true to activate
  imageUrl: "",                      // ← Paste absolute image URL
  linkUrl: "",                       // ← Destination URL
  label: "Sponsored Intelligence",
  title: "",
  body: "",
  ctaText: "Learn More →",
  altText: "Sponsored advertisement",
};

/** ── Slot 2: Inline card injected into the news feed ── */
export const INLINE_FEED_AD: AdConfig = {
  enabled: false,                    // ← Set true to activate
  imageUrl: "",                      // ← Paste absolute image URL
  linkUrl: "",                       // ← Destination URL
  label: "Sponsored",
  title: "",
  body: "",
  ctaText: "Discover →",
  altText: "Sponsored advertisement",
};

/** ── Slot 3: Full-width banner below the site header ── */
export const TOP_BANNER_AD: AdConfig = {
  enabled: false,                    // ← Set true to activate
  imageUrl: "",                      // ← Paste absolute image URL
  linkUrl: "",                       // ← Destination URL
  label: "Advertisement",
  title: "",
  body: "",
  ctaText: "Learn More →",
  altText: "Sponsored banner advertisement",
};
