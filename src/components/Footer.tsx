import Link from "next/link";
import type { NavLink } from "@/components/Header";
import type { Settings } from "@/lib/types";

export default function Footer({ settings, links }: { settings: Settings; links: NavLink[] }) {
  return (
    <footer className="relative mt-24 w-full border-t border-line bg-soft">
      <div className="grid w-full gap-10 px-4 py-14 sm:px-8 md:grid-cols-3 lg:px-12">
        <div>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logos/kurothread-emblem.svg" alt="" className="h-9 w-9" />
            <span className="wordmark text-2xl">{settings.siteName}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">{settings.tagline}</p>
        </div>
        <div>
          <p className="label">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-fg/80 transition hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label">Support</p>
          <ul className="mt-3 space-y-2 text-sm text-fg/80">
            {settings.contactEmail && (
              <li>
                <a href={`mailto:${settings.contactEmail}`} className="transition hover:text-accent">
                  {settings.contactEmail}
                </a>
              </li>
            )}
            {settings.contactPhone && <li>{settings.contactPhone}</li>}
            {settings.supportHours && <li className="text-muted">{settings.supportHours}</li>}
            {settings.contactAddress && <li className="text-muted">{settings.contactAddress}</li>}
          </ul>
        </div>
      </div>
      <div className="w-full border-t border-line px-4 py-5 text-center text-[0.68rem] uppercase tracking-[0.22em] text-muted sm:px-8">
        © {new Date().getFullYear()} {settings.siteName}. All rights reserved. Printed on demand.
      </div>
    </footer>
  );
}
