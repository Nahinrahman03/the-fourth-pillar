import type { Metadata } from "next";
import Link from "next/link";

import { NewsCard } from "@/components/news-card";
import { NewsStructuredData } from "@/components/news-structured-data";
import { ScopeTabs } from "@/components/scope-tabs";
import { getCurrentUser } from "@/lib/auth";
import { buildArchiveMetadata, getNewsBySort, type NewsSort } from "@/lib/news";

export const metadata: Metadata = buildArchiveMetadata({ scope: "INDIA" });

type IndiaPageProps = { searchParams: Promise<{ sort?: string }> };

const VALID_SORTS: NewsSort[] = ["latest", "yesterday", "trending"];
const SORT_LABELS: Record<NewsSort, string> = { latest: "Latest", yesterday: "Yesterday", trending: "Trending" };

export default async function IndiaNewsPage({ searchParams }: IndiaPageProps) {
  const { sort: rawSort } = await searchParams;
  const sort: NewsSort = rawSort && (VALID_SORTS as string[]).includes(rawSort) ? (rawSort as NewsSort) : "latest";
  const [news, user] = await Promise.all([getNewsBySort(sort, "INDIA"), getCurrentUser()]);

  return (
    <section className="archive-layout">
      <div className="page-heading">
        <p className="page-kicker">India archive</p>
        <h1 className="page-title">Short News India</h1>
        <p className="page-subtitle">Short news India coverage built for quick news today and fast verified reading.</p>
      </div>

      <nav className="sort-tabs" aria-label="News sort">
        {VALID_SORTS.map((s) => (
          <Link key={s} href={`/india?sort=${s}`} className={`sort-tab${sort === s ? " active" : ""}`}>
            {SORT_LABELS[s]}
          </Link>
        ))}
      </nav>

      <ScopeTabs activeScope="INDIA" />
      <NewsStructuredData items={news} scope="INDIA" />

      <div className="archive-feed">
        {news.length > 0 ? (
          news.map((item) => <NewsCard isAdmin={user?.role === "ADMIN"} isLoggedIn={!!user} item={item} key={item.id} />)
        ) : (
          <div className="empty-state">No Indian briefs are live yet.</div>
        )}
      </div>

      <div className="action-row">
        <Link className="button" href={user ? "/dashboard/contribute" : "/signin"}>
          {user ? "Submit India brief" : "Sign in to contribute"}
        </Link>
      </div>
    </section>
  );
}
