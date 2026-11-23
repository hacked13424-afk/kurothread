"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type NavLink = { href: string; label: string };

export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("kt-theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="group relative grid h-10 w-10 place-items-center rounded-full border border-line text-fg transition hover:border-accent hover:text-accent"
    >
      {dark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="transition group-hover:rotate-45">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="transition group-hover:-rotate-12">
          <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export default function Header({ siteName, links, announcement }: { siteName: string; links: NavLink[]; announcement: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const active = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

  return (
    <>
      {announcement && (
        <div className="w-full border-b border-line bg-soft px-4 py-2 text-center text-[0.68rem] uppercase tracking-[0.22em] text-muted">
          {announcement}
        </div>
      )}
      <header
        className={`sticky top-0 z-40 w-full border-b transition-all duration-300 ${
          scrolled ? "border-line bg-bg/80 backdrop-blur-xl" : "border-transparent bg-bg"
        }`}
      >
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center px-4 py-3 sm:px-8 lg:px-12">
          <div className="flex items-center">
            <button
              className="grid h-10 w-10 place-items-center rounded-full border border-line md:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
              aria-expanded={open}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h10" />}
              </svg>
            </button>
          </div>

          <Link href="/" className="flex flex-col items-center gap-1 text-center" aria-label={siteName}>
            <span className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logos/kurothread-emblem.svg" alt="" className="h-9 w-9 sm:h-11 sm:w-11" />
              <span className="wordmark text-2xl sm:text-4xl">{siteName}</span>
            </span>
          </Link>

          <div className="flex items-center justify-end">
            <ThemeToggle />
          </div>
        </div>

        <nav className="hidden w-full items-center justify-center gap-10 pb-3 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`group relative py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] transition-colors ${
                active(l.href) ? "text-accent" : "text-fg/80 hover:text-fg"
              }`}
            >
              {l.label}
              <span
                className={`absolute -bottom-0.5 left-0 h-px bg-accent transition-all duration-300 ${
                  active(l.href) ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
          ))}
        </nav>

        {open && (
          <nav className="anim-in flex w-full flex-col border-t border-line bg-bg px-6 py-3 md:hidden" aria-label="Mobile">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`border-b border-line/60 py-3 text-sm font-semibold uppercase tracking-[0.2em] ${
                  active(l.href) ? "text-accent" : ""
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
