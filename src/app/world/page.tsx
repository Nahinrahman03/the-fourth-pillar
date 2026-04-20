import type { Metadata } from "next";
import Link from "next/link";

import { NewsCard } from "@/components/news-card";
import { NewsStructuredData } from "@/components/news-structured-data";
import { ScopeTabs } from "@/components/scope-tabs";
import { getCurrentUser } from "@/lib/auth";
import { buildArchiveMetadata, getNewsBySort, type NewsSort } from "@/lib/news";

export const metadata: Metadata = buildArchiveMetadata({ scope: "WORLD" });

type WorldPageProps = { searchParams: Promise<{ sort?: string }> };

const VALID_SORTS: NewsSort[] = ["latest", "yesterday", "trending"];
const SORT_LABELS: Record<NewsSort, string> = { latest: "Latest", yesterday: "Yesterday", trending: "Trending" };

export default async function WorldNewsPage({ searchParams }: WorldPageProps) {
  const { sort: rawSort } = await searchParams;
  const sort: NewsSort = rawSort && (VALID_SORTS as string[]).includes(rawSort) ? (rawSort as NewsSort) : "latest";
  const [news, user] = await Promise.all([getNewsBySort(sort, "WORLD"), getCurrentUser()]);

  return (
    <section className="archive-layout">
      <div className="page-heading">
        <p className="page-kicker">World archive</p>
        <h1 className="page-title">World News</h1>
        <p className="page-subtitle">World headlines delivered as quick news today and news in 5 points.</p>
      </div>

      <nav className="sort-tabs" aria-label="News sort">
        {VALID_SORTS.map((s) => (
          <a key={s} href={`/world?sort=${s}`} className={`sort-tab${sort === s ? " active" : ""}`}>
            {SORT_LABELS[s]}
          </a>
        ))}
      </nav>

      <ScopeTabs activeScope="WORLD" />
      <NewsStructuredData items={news} scope="WORLD" />

      <div className="archive-feed">
        {news.length > 0 ? (
          news.map((item) => <NewsCard isAdmin={user?.role === "ADMIN"} isLoggedIn={!!user} item={item} key={item.id} />)
        ) : (
          <div className="empty-state">No world briefs are live yet.</div>
        )}
      </div>

      <div className="action-row">
        <Link className="button" href={user ? "/dashboard/contribute" : "/signin"}>
          {user ? "Submit world brief" : "Sign in to contribute"}
        </Link>
      </div>
    </section>
  );
}
