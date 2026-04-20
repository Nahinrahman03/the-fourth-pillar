import Link from "next/link";

import { SearchBar } from "@/components/search-bar";
import { SignOutButton } from "@/components/sign-out-button";
import { getCurrentUser } from "@/lib/auth";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  const isOwner = isAdmin;

  return (
    <header className="topbar">
      <Link className="brand-lockup" href="/">
        <span className="brand-title">THE FOURTH PILLAR</span>
      </Link>

      <SearchBar />

      <nav className="nav-links">
        <Link className="nav-link" href="/">
          Home
        </Link>
        {!isAdmin ? (
          <Link className="nav-link" href={user ? "/dashboard/contribute" : "/signin"}>
            Contribute
          </Link>
        ) : null}
        {user ? (
          <Link className="nav-link" href="/dashboard/profile">
            Profile
          </Link>
        ) : null}
        {isOwner ? (
          <>
            <a className="nav-link" href="/owner/publish">
              Owner Desk
            </a>
            <Link className="nav-link" href="/admin/review">
              Verify
            </Link>
          </>
        ) : null}
        {isAdmin ? (
          <Link className="nav-link dev-nav-link" href="/dashboard/dev">
            Dev
          </Link>
        ) : null}
        {user ? (
          <SignOutButton />
        ) : (
          <Link className="button" href="/signin">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
