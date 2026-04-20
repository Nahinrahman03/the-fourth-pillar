import type { NewsScope } from "@prisma/client";

export const NEWS_SCOPE_OPTIONS: Array<{
  scope: NewsScope;
  slug: "local" | "india" | "world";
  label: string;
  href: string;
  title: string;
  description: string;
  keywords: string[];
}> = [
  {
    scope: "LOCAL",
    slug: "local",
    label: "Local",
    href: "/local",
    title: "Local News in 5 Points",
    description: "Local news in 5 points with quick briefs, verified highlights, and short updates you can scan fast.",
    keywords: ["news in 5 points", "quick news today", "local short news"]
  },
  {
    scope: "INDIA",
    slug: "india",
    label: "Indian",
    href: "/india",
    title: "Short News India",
    description: "Short news India coverage with quick news today, major headlines, and compact verified updates.",
    keywords: ["short news India", "quick news today", "news in 5 points"]
  },
  {
    scope: "WORLD",
    slug: "world",
    label: "World",
    href: "/world",
    title: "World News in 5 Points",
    description: "World headlines delivered as news in 5 points so readers can catch up on quick news today in minutes.",
    keywords: ["news in 5 points", "quick news today", "world short news"]
  }
];

export function getScopeMeta(scope: NewsScope) {
  return NEWS_SCOPE_OPTIONS.find((option) => option.scope === scope) ?? NEWS_SCOPE_OPTIONS[1];
}

export function getScopeBySlug(slug: string) {
  return NEWS_SCOPE_OPTIONS.find((option) => option.slug === slug) ?? null;
}

export function isNewsScope(value: string): value is NewsScope {
  return NEWS_SCOPE_OPTIONS.some((option) => option.scope === value);
}
