"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { Route } from "next";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  requiresAuth: boolean;
  adminOnly: boolean;
};

type AdminItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
};

type SidebarNavProps = {
  isLoggedIn: boolean;
  isAdmin: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "feed",
    label: "Feed",
    href: "/",
    icon: (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
        <rect x="8" y="1" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
        <rect x="1" y="8" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
        <rect x="8" y="8" width="5" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
    requiresAuth: false,
    adminOnly: false,
  },
  {
    id: "contribute",
    label: "Contribute",
    href: "/dashboard/contribute",
    icon: (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    requiresAuth: false,
    adminOnly: false,
  },
  {
    id: "profile",
    label: "Profile",
    href: "/dashboard/profile",
    icon: (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <circle cx="7" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" />
        <path d="M1 13c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
    requiresAuth: true,
    adminOnly: false,
  },
];

const ADMIN_ITEMS: AdminItem[] = [
  {
    id: "owner-desk",
    label: "Owner Desk",
    href: "/owner/publish",
    icon: (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M2 10L5 7l2.5 2.5L12 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "verify",
    label: "Verify",
    href: "/admin/review",
    icon: (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M7 1L8.73 5.07L13 5.63L9.92 8.47L10.71 12.73L7 10.77L3.29 12.73L4.08 8.47L1 5.63L5.27 5.07L7 1Z" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    id: "dev",
    label: "Dev",
    href: "/dashboard/dev",
    icon: (
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M4 4L1 7L4 10M10 4L13 7L10 10M8 2L6 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function SidebarNav({ isLoggedIn, isAdmin }: SidebarNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Hamburger toggle button — always visible */}
      <button
        id="sidebar-toggle"
        className={`sidebar-toggle-btn${open ? " sidebar-toggle-btn--open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="sidebar-nav-panel"
      >
        <span className="sidebar-toggle-bar" />
        <span className="sidebar-toggle-bar" />
        <span className="sidebar-toggle-bar" />
      </button>

      {/* Backdrop overlay */}
      {open && (
        <div
          className="sidebar-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sliding sidebar panel */}
      <aside
        id="sidebar-nav-panel"
        className={`sidebar-nav${open ? " sidebar-nav--open" : ""}`}
        aria-label="Main navigation"
        aria-hidden={!open}
      >
        {/* Terminal label */}
        <div className="sidebar-label">
          <strong>THE 4TH PILLAR</strong>
          <span>TERMINAL v1.0</span>
        </div>

        {/* Primary nav */}
        <nav className="sidebar-nav-items">
          {NAV_ITEMS.filter((item) => {
            if (item.requiresAuth && !isLoggedIn) return false;
            if (item.adminOnly && !isAdmin) return false;
            return true;
          }).map((item) => (
            <Link
              key={item.id}
              href={(isLoggedIn || !item.requiresAuth ? item.href : "/signin") as any}
              className={`sidebar-item ${isActive(item.href) ? "active" : ""}`}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="sidebar-divider" />
              {ADMIN_ITEMS.map((item) => (
                <Link
                  key={item.id}
                  href={item.href as any}
                  className={`sidebar-item admin-item ${isActive(item.href) ? "active" : ""}`}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="sidebar-bottom">
          {isLoggedIn ? (
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="sidebar-item sidebar-sign-out">
                <span className="sidebar-item-icon">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3M10 4l3 3-3 3M5 7h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                Sign Out
              </button>
            </form>
          ) : (
            <Link href="/signin" className="sidebar-item">
              <span className="sidebar-item-icon">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M9 2h3a1 1 0 011 1v8a1 1 0 01-1 1H9M6 4l-3 3 3 3M1 7h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Sign In
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
