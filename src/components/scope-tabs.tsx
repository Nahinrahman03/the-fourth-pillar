import Link from "next/link";
import { NEWS_SCOPE_OPTIONS } from "@/lib/news-scope";
import { cn } from "@/lib/utils";

type ScopeTabsProps = {
  activeScope?: "LOCAL" | "INDIA" | "WORLD";
};

export function ScopeTabs({ activeScope }: ScopeTabsProps) {
  return (
    <nav className="scope-tabs" aria-label="News scopes">
      {NEWS_SCOPE_OPTIONS.map((option) => (
        <Link
          className={cn("scope-tab", activeScope === option.scope && "active")}
          href={option.href as any}
          key={option.scope}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
