import type { NewsItem, NewsScope } from "@prisma/client";

import { getScopeMeta } from "@/lib/news-scope";
import { summaryPointsFromUnknown } from "@/lib/utils";

type NewsStructuredDataProps = {
  items: NewsItem[];
  scope?: NewsScope;
};

export function NewsStructuredData({ items, scope }: NewsStructuredDataProps) {
  const appUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000";
  const section = scope ? getScopeMeta(scope) : null;

  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: section ? section.title : "Quick News Today",
    url: section ? `${appUrl}${section.href}` : `${appUrl}/`,
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "NewsArticle",
          headline: item.headline,
          datePublished: new Date(item.publishedAt).toISOString(),
          articleSection: item.category,
          about: scope ? getScopeMeta(scope).label : item.scope,
          publisher: {
            "@type": "Organization",
            name: "The Fourth Pillar"
          },
          description: summaryPointsFromUnknown(item.summaryPoints).join(" "),
          url: section ? `${appUrl}${section.href}` : `${appUrl}/`
        }
      }))
    }
  };

  return <script dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} type="application/ld+json" />;
}
