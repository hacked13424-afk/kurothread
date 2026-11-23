"use client";

import { useCallback, useEffect, useState } from "react";
import { ThemeToggle } from "@/components/Header";
import OrdersTab from "@/components/admin/OrdersTab";
import PagesTab from "@/components/admin/PagesTab";
import ProductsTab from "@/components/admin/ProductsTab";
import SettingsTab from "@/components/admin/SettingsTab";
import { api, type AdminData, type Ctx } from "@/components/admin/api";

const TABS = [
  { id: "orders", label: "Dashboard & Orders", icon: "◈" },
  { id: "products", label: "Products", icon: "▣" },
  { id: "pages", label: "Pages & Navigation", icon: "☰" },
  { id: "settings", label: "Site & Security", icon: "⚙" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api("/api/admin/login", "POST", { password: pw });
      onDone();
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grain relative grid min-h-screen w-full place-items-center bg-bg px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <form onSubmit={submit} className="anim-pop w-full max-w-sm space-y-5 rounded-3xl border border-line bg-card p-8 shadow-[var(--shadow)]">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logos/kurothread-emblem.svg" alt="" className="mx-auto h-14 w-14" />
          <h1 className="wordmark mt-4 text-3xl">KuroThread</h1>
          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-muted">Admin access</p>
        </div>
        <div>
          <label className="label" htmlFor="pw">Password</label>
          <input id="pw" type="password" autoFocus className="input" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        </div>
        {err && <p className="text-sm text-neon">{err}</p>}
        <button className="btn btn-primary w-full" disabled={busy || !pw}>{busy ? "Checking…" : "Enter"}</button>
      </form>
    </div>
  );
}

export default function AdminApp({ initialAuthed }: { initialAuthed: boolean }) {
  const [authed, setAuthed] = useState(initialAuthed);
  const [data, setData] = useState<AdminData | null>(null);
  const [tab, setTab] = useState<TabId>("orders");
  const [toastMsg, setToastMsg] = useState<{ msg: string; kind: "ok" | "err" } | null>(null);

  const toast = useCallback((msg: string, kind: "ok" | "err" = "ok") => {
    setToastMsg({ msg, kind });
    setTimeout(() => setToastMsg(null), 3200);
  }, []);

  const reload = useCallback(async () => {
    setData(await api<AdminData>("/api/admin/data"));
  }, []);

  useEffect(() => {
    const off = () => setAuthed(false);
    window.addEventListener("kt-unauth", off);
    return () => window.removeEventListener("kt-unauth", off);
  }, []);

  useEffect(() => {
    if (authed) reload().catch(() => undefined);
  }, [authed, reload]);

  useEffect(() => {
    const h = location.hash.replace("#", "") as TabId;
    if (TABS.some((t) => t.id === h)) setTab(h);
  }, []);

  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  const ctx: Ctx | null = data ? { data, reload, toast } : null;
  const pickTab = (t: TabId) => {
    setTab(t);
    history.replaceState(null, "", `#${t}`);
  };

  async function logout() {
    await api("/api/admin/logout", "POST");
    setAuthed(false);
    setData(null);
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-bg text-fg lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-line bg-soft lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:flex-col lg:items-start lg:gap-5 lg:py-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logos/kurothread-emblem.svg" alt="" className="h-9 w-9" />
            <div>
              <p className="wordmark text-xl">{data?.settings.siteName ?? "KuroThread"}</p>
              <p className="mt-1 text-[0.6rem] uppercase tracking-[0.25em] text-muted">Control room</p>
            </div>
          </div>
          <div className="lg:hidden"><ThemeToggle /></div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => pickTab(t.id)}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                tab === t.id ? "bg-accent text-accentfg" : "text-fg/75 hover:bg-card hover:text-fg"
              }`}
            >
              <span className="text-base">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="hidden flex-col gap-2 border-t border-line p-4 lg:flex">
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <a href="/" target="_blank" className="text-xs uppercase tracking-[0.2em] text-muted hover:text-accent">View store ↗</a>
          </div>
          <button className="btn btn-ghost !py-2" onClick={logout}>Log out</button>
        </div>
        <button className="mx-3 mb-3 rounded-xl border border-line py-2 text-xs uppercase tracking-widest lg:hidden" onClick={logout}>Log out</button>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
        {!ctx ? (
          <p className="py-24 text-center text-muted">Loading…</p>
        ) : (
          <div key={tab} className="anim-in">
            {tab === "orders" && <OrdersTab ctx={ctx} />}
            {tab === "products" && <ProductsTab ctx={ctx} />}
            {tab === "pages" && <PagesTab ctx={ctx} />}
            {tab === "settings" && <SettingsTab ctx={ctx} />}
          </div>
        )}
      </main>

      {toastMsg && (
        <div
          className={`anim-pop fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 rounded-full px-6 py-3 text-sm font-semibold shadow-2xl ${
            toastMsg.kind === "err" ? "bg-red-600 text-white" : "bg-accent text-accentfg"
          }`}
          role="status"
        >
          {toastMsg.msg}
        </div>
      )}
    </div>
  );
}
