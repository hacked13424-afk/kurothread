import type { ReactNode } from "react";
import Header, { type NavLink } from "@/components/Header";
import Footer from "@/components/Footer";
import { getSettings, listPages } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const [settings, pages] = await Promise.all([getSettings(), listPages()]);
  const links: NavLink[] = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/collections", label: "Collections" },
    ...pages
      .filter((p) => p.showInNav)
      .sort((a, b) => a.navOrder - b.navOrder)
      .map((p) => ({ href: `/${p.slug}`, label: p.title })),
  ];
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header siteName={settings.siteName} links={links} announcement={settings.announcement} />
      <main className="w-full flex-1">{children}</main>
      <Footer settings={settings} links={links} />
    </div>
  );
}
