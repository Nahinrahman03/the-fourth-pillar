import type { Metadata } from "next";
import Link from "next/link";

import { NewsCard } from "@/components/news-card";
import { NewsStructuredData } from "@/components/news-structured-data";
import { ScopeTabs } from "@/components/scope-tabs";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildArchiveMetadata, getNewsBySort, type NewsSort } from "@/lib/news";

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
          { headline: { contains: q } },
          { category: { contains: q } },
          { summaryPoints: { contains: q } },
          { details: { contains: q } }
        ]
      },
      orderBy: { publishedAt: "desc" },
      take: 24
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

export default async function HomePage({ searchParams }: HomePageProps) {
  const { q, sort: rawSort } = await searchParams;
  const query = q?.trim() ?? "";
  const sort = resolveSort(rawSort);
  const isSearching = query.length >= 2;

  const [news, user] = await Promise.all([
    isSearching ? searchNews(query) : getNewsBySort(sort),
    getCurrentUser()
  ]);

  const isLoggedIn = !!user;
  const isAdmin = user?.role === "ADMIN";

  return (
    <section className="archive-layout">
      <div className="page-heading">
        <p className="page-kicker">Editorial archive</p>
        <h1 className="page-title">
          {isSearching ? "Search Results" : SORT_LABELS[sort] + " News"}
        </h1>
        <p className="page-subtitle">
          {isSearching
            ? `Results for "${query}" across Local, Indian, and World briefs.`
            : sort === "yesterday"
              ? "News published yesterday. Catch up on what you missed."
              : sort === "trending"
                ? "Most-discussed stories in the last 48 hours."
                : "News in 5 points. Quick news today across Local, Indian, and World coverage."}
        </p>
      </div>

      {/* Sort tabs */}
      {!isSearching && (
        <nav className="sort-tabs" aria-label="News sort">
          {VALID_SORTS.map((s) => (
            <a
              key={s}
              href={`/?sort=${s}`}
              className={`sort-tab${sort === s ? " active" : ""}`}
              aria-current={sort === s ? "page" : undefined}
            >
              {SORT_LABELS[s]}
            </a>
          ))}
        </nav>
      )}

      <ScopeTabs />
      <NewsStructuredData items={news} />

      <div className="archive-feed">
        {news.length > 0 ? (
          news.map((item) => (
            <NewsCard
              isAdmin={isAdmin}
              isLoggedIn={isLoggedIn}
              item={item}
              key={item.id}
            />
          ))
        ) : (
          <div className="empty-state">
            {isSearching
              ? `No briefs matched "${query}". Try a different keyword.`
              : sort === "yesterday"
                ? "No news was published yesterday."
                : sort === "trending"
                  ? "No trending stories right now — check back soon."
                  : "No verified briefs are live yet."}
          </div>
        )}
      </div>

      <div className="action-row">
        <Link className="button" href={user ? "/dashboard/contribute" : "/signin"}>
          {user ? "Submit bulletin" : "Sign in to contribute"}
        </Link>
      </div>
    </section>
  );
}
