"use client";

import { useRef, useState } from "react";
import { api, type Ctx } from "@/components/admin/api";
import type { Settings } from "@/lib/types";

export default function SettingsTab({ ctx }: { ctx: Ctx }) {
  const [s, setS] = useState<Settings>(ctx.data.settings);
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const patch = (p: Partial<Settings>) => setS((x) => ({ ...x, ...p }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/admin/settings", "POST", {
        siteName: s.siteName,
        tagline: s.tagline,
        defaultTheme: s.defaultTheme,
        contactEmail: s.contactEmail,
        contactPhone: s.contactPhone,
        contactAddress: s.contactAddress,
        supportHours: s.supportHours,
      });
      await ctx.reload();
      ctx.toast("Settings saved — storefront updated");
    } catch (err) {
      ctx.toast((err as Error).message, "err");
    } finally {
      setBusy(false);
    }
  }

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next !== pw.confirm) return ctx.toast("New passwords don't match", "err");
    setPwBusy(true);
    try {
      await api("/api/admin/password", "POST", { current: pw.current, next: pw.next });
      setPw({ current: "", next: "", confirm: "" });
      ctx.toast("Password changed");
    } catch (err) {
      ctx.toast((err as Error).message, "err");
    } finally {
      setPwBusy(false);
    }
  }

  async function importFile(file: File) {
    try {
      const json = JSON.parse(await file.text());
      const n = `${json.products?.length ?? 0} products, ${json.pages?.length ?? 0} pages, ${json.orders?.length ?? 0} orders`;
      if (!confirm(`Import backup (${n})?\n\nThis REPLACES the matching current data (products, pages, orders, settings).`)) return;
      await api("/api/admin/backup", "POST", json);
      await ctx.reload();
      ctx.toast("Backup imported ✓");
    } catch (err) {
      ctx.toast(err instanceof SyntaxError ? "That file isn't valid JSON" : (err as Error).message, "err");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold">Site &amp; Security</h1>
        <p className="mt-1 text-sm text-muted">Changes go live on the storefront immediately.</p>
      </div>

      <form onSubmit={save} className="space-y-5 rounded-2xl border border-line bg-card p-5 sm:p-7">
        <h2 className="font-display text-2xl font-bold">Website</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="label">Website name</label>
            <input className="input" required value={s.siteName} onChange={(e) => patch({ siteName: e.target.value })} />
          </div>
          <div>
            <label className="label">Default theme (for first-time visitors)</label>
            <select className="input" value={s.defaultTheme} onChange={(e) => patch({ defaultTheme: e.target.value as "dark" | "light" })}>
              <option value="dark">Dark (obsidian)</option>
              <option value="light">Light (alabaster)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Tagline</label>
          <input className="input" value={s.tagline} onChange={(e) => patch({ tagline: e.target.value })} />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="label">Support email</label>
            <input className="input" type="email" value={s.contactEmail} onChange={(e) => patch({ contactEmail: e.target.value })} />
          </div>
          <div>
            <label className="label">Support phone</label>
            <input className="input" value={s.contactPhone} onChange={(e) => patch({ contactPhone: e.target.value })} />
          </div>
          <div>
            <label className="label">Support hours</label>
            <input className="input" value={s.supportHours} onChange={(e) => patch({ supportHours: e.target.value })} />
          </div>
          <div>
            <label className="label">Location / shipping note</label>
            <input className="input" value={s.contactAddress} onChange={(e) => patch({ contactAddress: e.target.value })} />
          </div>
        </div>
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
      </form>

      <div className="grid gap-8 xl:grid-cols-2">
        <form onSubmit={changePw} className="space-y-4 rounded-2xl border border-line bg-card p-5 sm:p-7">
          <h2 className="font-display text-2xl font-bold">Change admin password</h2>
          <div>
            <label className="label">Current password</label>
            <input className="input" type="password" required autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          </div>
          <div>
            <label className="label">New password (min 6 characters)</label>
            <input className="input" type="password" required minLength={6} autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input className="input" type="password" required minLength={6} autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </div>
          <button className="btn btn-primary" disabled={pwBusy}>{pwBusy ? "Updating…" : "Update password"}</button>
        </form>

        <div className="space-y-4 rounded-2xl border border-line bg-card p-5 sm:p-7">
          <h2 className="font-display text-2xl font-bold">Backup &amp; sync</h2>
          <p className="text-sm leading-relaxed text-muted">
            Export everything — products, categories, custom pages, settings, orders and uploaded media — as one JSON file.
            Import it on any other deployment to sync instantly, no redeploy needed. The admin password is never included.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="/api/admin/backup" download className="btn btn-primary">⬇ Export Site Backup (JSON)</a>
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>⬆ Import Site Backup (JSON)</button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
          </div>
        </div>
      </div>
    </div>
  );
}
