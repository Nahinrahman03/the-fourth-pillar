import { Fragment } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdSlot } from "@/components/ad-slot";
import { NewsCard } from "@/components/news-card";
import { NewsStructuredData } from "@/components/news-structured-data";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildArchiveMetadata, getNewsBySort, type NewsSort } from "@/lib/news";
import { MAIN_PAGE_AD, INLINE_FEED_AD, TOP_BANNER_AD } from "@/config/ads";

type HomePageProps = {
  searchParams: Promise<{ q?: string; sort?: string }>;
};

const VALID_SORTS: NewsSort[] = ["latest", "yesterday", "trending"];

function resolveSort(raw?: string): NewsSort {
  if (raw && (VALID_SORTS as string[]).includes(raw)) return raw as NewsSort;
  return "latest";
}

async function searchNews(q: string) {
  try {
    return await prisma.newsItem.findMany({
      where: {
        OR: [
          { headline: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { summaryPoints: { contains: q, mode: "insensitive" } },
          { details: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: 24,
    });
  } catch {
    return [];
  }
}

export async function generateMetadata({ searchParams }: HomePageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return buildArchiveMetadata({ query: q?.trim() || undefined });
}

const SORT_LABELS: Record<NewsSort, string> = {
  latest: "Latest",
  yesterday: "Yesterday",
  trending: "Trending",
};

const SORT_DESCRIPTIONS: Record<NewsSort, string> = {
  latest: "Continuously monitored intelligence stream",
  yesterday: "Catch up on what you missed",
  trending: "Most-discussed stories in the last 48 hours",
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const { q, sort: rawSort } = await searchParams;
  const query = q?.trim() ?? "";
  const sort = resolveSort(rawSort);
  const isSearching = query.length >= 2;

  const [news, user, dbAds] = await Promise.all([
    isSearching ? searchNews(query) : getNewsBySort(sort),
    getCurrentUser(),
    prisma.advertisement.findMany(),
  ]);

  const getAd = (slotId: string, defaultAd: any) => {
    const dbAd = dbAds.find((a: any) => a.slotId === slotId);
    return dbAd ? { ...defaultAd, ...dbAd } : defaultAd;
  };

  const topBannerAd = getAd("TOP_BANNER_AD", TOP_BANNER_AD);
  const mainPageAd = getAd("MAIN_PAGE_AD", MAIN_PAGE_AD);
  const inlineFeedAd = getAd("INLINE_FEED_AD", INLINE_FEED_AD);

  const isLoggedIn = !!user;
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="home-layout">
      {/* ── Top Banner Ad (admin preview / live for all when enabled) ── */}
      <AdSlot ad={topBannerAd} devPreview={isAdmin} className="ad-slot--banner" />

      {/* ── Main feed column ── */}
      <div className="feed-col">
        {/* Live briefing header */}
        <div className="live-briefing-head">
          <div className="live-badge">
            <span className="live-dot" aria-hidden="true" />
            Live Briefing
          </div>
          <h1 className="live-title">
            {isSearching ? "Search Results" : SORT_LABELS[sort] + " News"}
          </h1>
          <p className="live-subtitle">
            {isSearching
              ? `Results for "${query}" across Local, Indian, and World briefs`
              : SORT_DESCRIPTIONS[sort]}
          </p>
        </div>

        {/* Sort tabs */}
        {!isSearching && (
          <nav className="sort-tabs" aria-label="News sort">
            {VALID_SORTS.map((s) => (
              <Link
                key={s}
                href={`/?sort=${s}`}
                className={`sort-tab${sort === s ? " active" : ""}`}
                aria-current={sort === s ? "page" : undefined}
              >
                {SORT_LABELS[s]}
              </Link>
            ))}
          </nav>
        )}

        <NewsStructuredData items={news} />

        {/* News feed */}
        <div className="archive-feed">
          {news.length > 0 ? (
            news.map((item, index) => (
              <Fragment key={item.id}>
                <NewsCard
                  isAdmin={isAdmin}
                  isLoggedIn={isLoggedIn}
                  item={item}
                  index={index}
                />
                {/* Inline feed ad — injected after every 6th card; only rendered when admin previewing or ad is live */}
                {(index + 1) % 6 === 0 && (
                  <AdSlot ad={inlineFeedAd} devPreview={isAdmin} className="ad-slot--inline" />
                )}
              </Fragment>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
                  <circle cx="14" cy="14" r="13" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M14 8v7M14 18v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <p className="empty-state-text">
                {isSearching
                  ? `No briefs matched "${query}". Try a different keyword.`
                  : sort === "yesterday"
                    ? "No news was published yesterday."
                    : sort === "trending"
                      ? "No trending stories right now — check back soon."
                      : "No verified briefs are live yet."}
              </p>
            </div>
          )}
        </div>

        {/* Submit CTA */}
        <div className="feed-cta">
          <Link className="feed-cta-btn" href={user ? "/dashboard/contribute" : "/signin"}>
            {user ? "Submit a Bulletin" : "Sign In to Contribute"}
          </Link>
        </div>
      </div>

      {/* ── Right widget column ── */}
      <aside className="widget-col" aria-label="Sidebar widgets">
        {/* Sidebar Ad Slot — visible to admins always; normal users only see when enabled */}
        <AdSlot ad={mainPageAd} devPreview={isAdmin} />

        {/* Scope quick-links */}
        <div className="widget-card">
          <div className="widget-header">
            <span>Coverage Scope</span>
          </div>
          <div className="widget-body scope-links">
            <Link className="scope-link-item" href="/">
              <span className="scope-link-dot all" />
              All Briefs
            </Link>
            <Link className="scope-link-item" href="/local">
              <span className="scope-link-dot local" />
              Local
            </Link>
            <Link className="scope-link-item" href="/india">
              <span className="scope-link-dot india" />
              India
            </Link>
            <Link className="scope-link-item" href="/world">
              <span className="scope-link-dot world" />
              World
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
