import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Inter } from "next/font/google";
import Script from "next/script";

import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SidebarNav } from "@/components/sidebar-nav";
import { getCurrentUser } from "@/lib/auth";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000"),
  title: {
    default: "The Fourth Pillar",
    template: "%s | The Fourth Pillar",
  },
  description: "Live intelligence briefings. News in 5 points — Local, Indian, and World coverage.",
  keywords: ["news in 5 points", "quick news today", "short news India", "live briefing"],
  openGraph: {
    title: "The Fourth Pillar",
    description: "Live intelligence briefings. News in 5 points.",
    siteName: "The Fourth Pillar",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Fourth Pillar",
    description: "Live intelligence briefings. News in 5 points.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const isLoggedIn = !!user;
  const isAdmin = user?.role === "ADMIN";

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/*
          Flash-of-wrong-theme prevention.
          next/script with beforeInteractive injects this into <head>
          before any other JS runs, so the correct theme is set before paint.
        */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}else if(window.matchMedia('(prefers-color-scheme: light)').matches){document.documentElement.setAttribute('data-theme','light');}else{document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`,
          }}
        />
        <Providers>
          <div className="terminal-shell">
            <SiteHeader />
            <div className="app-body">
              <SidebarNav isLoggedIn={isLoggedIn} isAdmin={isAdmin} />
              <div className="main-and-footer">
                <main className="page-stack">{children}</main>
                <footer className="site-footer">
                  <div className="footer-brand">
                    <span className="footer-brand-name">THE FOURTH PILLAR</span>
                    <span className="footer-copy">© 2026 — All Rights Reserved</span>
                  </div>
                  <nav className="footer-links" aria-label="Footer navigation">
                    <a href="/">Privacy</a>
                    <a href="/">Terms</a>
                    <a href="/">Archive</a>
                    <a href="/">About</a>
                    <a href="/">API</a>
                    <a href="/">Ethics</a>
                  </nav>
                </footer>
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
