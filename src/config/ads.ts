/**
 * ── AD SLOT CONFIGURATION ───────────────────────────────────────────────────
 * Developer-managed ad configuration.
 * To add or update an ad:
 *   1. Set `enabled: true`
 *   2. Set `imageUrl` to an absolute image URL (only images allowed)
 *   3. Set `linkUrl` to the destination URL
 *   4. Optionally set `label`, `title`, `body`, `ctaText`
 *
 * To disable the ad slot, set `enabled: false`.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type AdConfig = {
  enabled: boolean;
  imageUrl: string;       // Image URL (required when enabled)
  linkUrl: string;        // Click-through URL
  label: string;          // Slot label, e.g. "Sponsored Intelligence"
  title: string;          // Ad headline
  body: string;           // Short ad body copy
  ctaText: string;        // Call-to-action link text
  altText: string;        // Image alt text for accessibility
};

export const MAIN_PAGE_AD: AdConfig = {
  enabled: false,          // ← Set to true to activate the ad
  imageUrl: "",            // ← Paste your image URL here
  linkUrl: "",             // ← Destination URL
  label: "Sponsored Intelligence",
  title: "",
  body: "",
  ctaText: "Learn More →",
  altText: "Sponsored advertisement",
};
