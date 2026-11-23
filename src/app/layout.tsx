import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Bodoni_Moda, Inter } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/store";

const display = Bodoni_Moda({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700", "800", "900"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: `${s.siteName} — ${s.tagline}`, template: `%s · ${s.siteName}` },
    description: s.tagline,
    icons: { icon: "/assets/logos/kurothread-emblem.svg" },
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const s = await getSettings();
  const themeScript = `try{var t=localStorage.getItem('kt-theme')||${JSON.stringify(
    s.defaultTheme,
  )};document.documentElement.classList.toggle('dark',t==='dark')}catch(e){document.documentElement.classList.add('dark')}`;
  return (
    <html lang="en" className={`${display.variable} ${body.variable} dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
