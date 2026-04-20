import type { Metadata } from "next";

import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000"),
  title: {
    default: "The Fourth Pillar",
    template: "%s"
  },
  description: "A precision-functional news archive with contributor review, owner publishing, and private profiles.",
  keywords: ["news in 5 points", "quick news today", "short news India"],
  openGraph: {
    title: "The Fourth Pillar",
    description: "A precision-functional news archive with contributor review, owner publishing, and private profiles.",
    siteName: "The Fourth Pillar",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "The Fourth Pillar",
    description: "A precision-functional news archive with contributor review, owner publishing, and private profiles."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="site-shell">
            <SiteHeader />
            <main className="page-stack">{children}</main>
            <footer className="footer-note">
              <div>
                <strong>THE FOURTH PILLAR</strong>
                <span>(c) 2026 The Fourth Pillar. Precision Functionalism.</span>
              </div>
              <nav className="footer-links">
                <a href="/">Privacy</a>
                <a href="/">Terms</a>
                <a href="/">Archive</a>
                <a href="/">About</a>
              </nav>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
