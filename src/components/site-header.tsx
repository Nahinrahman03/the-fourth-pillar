import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="terminal-topbar">
      {/* Brand */}
      <Link className="topbar-brand" href="/">
        THE FOURTH PILLAR
      </Link>

      {/* Scope navigation tabs */}
      <nav className="topbar-scope-tabs" aria-label="News scope">
        <Link className="topbar-scope-tab" href="/">
          All
        </Link>
        <Link className="topbar-scope-tab" href="/local">
          Local
        </Link>
        <Link className="topbar-scope-tab" href="/india">
          India
        </Link>
        <Link className="topbar-scope-tab" href="/world">
          World
        </Link>
      </nav>

      {/* Right actions */}
      <div className="topbar-actions">
        <SearchBar />
        <ThemeToggle />

        {user ? (
          <Link
            href="/dashboard/profile"
            className="topbar-avatar"
            aria-label="Profile"
            title={user.name || user.email || "Profile"}
          >
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name || "User"}
                className="topbar-avatar-img"
              />
            ) : (
              <span className="topbar-avatar-initials">
                {(user.name || user.email || "U").charAt(0).toUpperCase()}
              </span>
            )}
            {isAdmin && <span className="topbar-admin-dot" aria-label="Admin" />}
          </Link>
        ) : (
          <Link className="topbar-signin-btn" href="/signin">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
