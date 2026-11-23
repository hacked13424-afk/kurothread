"use client";

import { useState } from "react";
import MediaEditor from "@/components/admin/MediaEditor";
import { api, type Ctx } from "@/components/admin/api";
import { slugify, type MediaItem, type PageEntry } from "@/lib/types";

type Draft = {
  id?: string;
  title: string;
  slug: string;
  showInNav: boolean;
  navOrder: string;
  heroHeadline: string;
  subtitle: string;
  body: string;
  media: MediaItem[];
  isSystem?: boolean;
};

const blank: Draft = { title: "", slug: "", showInNav: true, navOrder: "50", heroHeadline: "", subtitle: "", body: "", media: [] };

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={`relative h-6 w-11 rounded-full transition ${on ? "bg-emerald-500" : "bg-line"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
      <span className="text-sm">{label}</span>
    </label>
  );
}

function PageEditor({ ctx, initial, onClose }: { ctx: Ctx; initial: Draft; onClose: () => void }) {
  const [d, setD] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [busy, setBusy] = useState(false);
  const patch = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/admin/pages", "POST", { ...d, navOrder: Number(d.navOrder) });
      await ctx.reload();
      ctx.toast("Page saved");
      onClose();
    } catch (err) {
      ctx.toast((err as Error).message, "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="anim-up space-y-5 rounded-2xl border border-accent/40 bg-card p-5 sm:p-7">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl font-bold">{d.id ? `Edit “${initial.title}”` : "New page"}</h2>
        <button type="button" className="btn btn-ghost !py-2" onClick={onClose}>Cancel</button>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label className="label">Page title *</label>
          <input
            className="input"
            required
            value={d.title}
            onChange={(e) => patch({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
          />
        </div>
        <div>
          <label className="label">URL slug *</label>
          <div className="flex items-center gap-1">
            <span className="text-muted">/</span>
            <input
              className="input"
              required
              disabled={d.isSystem}
              value={d.slug}
              onChange={(e) => (setSlugTouched(true), patch({ slug: slugify(e.target.value) }))}
            />
          </div>
        </div>
        <div>
          <label className="label">Nav order (lower = earlier)</label>
          <input className="input" type="number" value={d.navOrder} onChange={(e) => patch({ navOrder: e.target.value })} />
        </div>
      </div>
      <Toggle on={d.showInNav} onChange={(v) => patch({ showInNav: v })} label="Show in top navbar" />
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="label">Hero headline</label>
          <input className="input" value={d.heroHeadline} onChange={(e) => patch({ heroHeadline: e.target.value })} />
        </div>
        <div>
          <label className="label">Subtitle</label>
          <input className="input" value={d.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Body content (markdown · unlimited length)</label>
        <textarea
          className="input min-h-72 resize-y font-mono text-[0.82rem] leading-relaxed"
          value={d.body}
          onChange={(e) => patch({ body: e.target.value })}
          placeholder={"## Heading\n\nWrite as much as you like. **Bold**, *italic*, [links](/shop), lists…"}
        />
      </div>
      <MediaEditor label="Featured media / gallery (first image becomes the banner)" items={d.media} onChange={(media) => patch({ media })} />
      <div className="flex gap-3">
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save page"}</button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

function HomeEditor({ ctx, onClose }: { ctx: Ctx; onClose: () => void }) {
  const s = ctx.data.settings;
  const [d, setD] = useState({
    heroEyebrow: s.heroEyebrow,
    heroHeadline: s.heroHeadline,
    heroSubtitle: s.heroSubtitle,
    heroCta: s.heroCta,
    heroMedia: s.heroMedia,
    heroMediaType: s.heroMediaType,
    announcement: s.announcement,
  });
  const [busy, setBusy] = useState(false);
  const patch = (p: Partial<typeof d>) => setD((x) => ({ ...x, ...p }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/admin/settings", "POST", d);
      await ctx.reload();
      ctx.toast("Home page saved");
      onClose();
    } catch (err) {
      ctx.toast((err as Error).message, "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="anim-up space-y-5 rounded-2xl border border-accent/40 bg-card p-5 sm:p-7">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl font-bold">Home page hero</h2>
        <button type="button" className="btn btn-ghost !py-2" onClick={onClose}>Cancel</button>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="label">Eyebrow text</label>
          <input className="input" value={d.heroEyebrow} onChange={(e) => patch({ heroEyebrow: e.target.value })} />
        </div>
        <div>
          <label className="label">Button label</label>
          <input className="input" value={d.heroCta} onChange={(e) => patch({ heroCta: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Headline (use Enter for line breaks)</label>
        <textarea className="input min-h-24" value={d.heroHeadline} onChange={(e) => patch({ heroHeadline: e.target.value })} />
      </div>
      <div>
        <label className="label">Subtitle</label>
        <textarea className="input min-h-20" value={d.heroSubtitle} onChange={(e) => patch({ heroSubtitle: e.target.value })} />
      </div>
      <div>
        <label className="label">Announcement bar (top of every page — leave empty to hide)</label>
        <input className="input" value={d.announcement} onChange={(e) => patch({ announcement: e.target.value })} />
      </div>
      <MediaEditor
        single
        label="Hero background (image or video)"
        items={d.heroMedia ? [{ type: d.heroMediaType, url: d.heroMedia }] : []}
        onChange={(m) => patch({ heroMedia: m[0]?.url ?? "", heroMediaType: m[0]?.type ?? "image" })}
      />
      <div className="flex gap-3">
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save home page"}</button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

export default function PagesTab({ ctx }: { ctx: Ctx }) {
  const [editing, setEditing] = useState<Draft | null>(null);
  const [home, setHome] = useState(false);
  const { pages } = ctx.data;

  const edit = (p: PageEntry) => setEditing({ ...p, navOrder: String(p.navOrder) });

  async function remove(p: PageEntry) {
    if (!confirm(`Delete page "${p.title}"?`)) return;
    try {
      await api(`/api/admin/pages?id=${p.id}`, "DELETE");
      await ctx.reload();
      ctx.toast("Page deleted");
    } catch (e) {
      ctx.toast((e as Error).message, "err");
    }
  }
  async function toggleNav(p: PageEntry) {
    await api("/api/admin/pages", "POST", { ...p, showInNav: !p.showInNav });
    await ctx.reload();
  }

  const busy = editing || home;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Pages &amp; Navigation</h1>
          <p className="mt-1 text-sm text-muted">Pages marked “in navbar” appear in the site header automatically.</p>
        </div>
        {!busy && <button className="btn btn-primary" onClick={() => setEditing({ ...blank })}>+ New page</button>}
      </div>

      {home && <HomeEditor ctx={ctx} onClose={() => setHome(false)} />}
      {editing && <PageEditor key={editing.id ?? "new"} ctx={ctx} initial={editing} onClose={() => setEditing(null)} />}

      {!busy && (
        <ul className="space-y-3">
          <li className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-card p-4">
            <div className="min-w-44 flex-1">
              <p className="font-display text-xl font-bold">Home <span className="ml-2 rounded-full bg-soft px-2 py-0.5 text-[0.62rem] uppercase tracking-widest text-muted">default</span></p>
              <p className="text-sm text-muted">/ · hero banner, headline, media &amp; announcement bar</p>
            </div>
            <div className="flex gap-2">
              <a href="/" target="_blank" className="btn btn-ghost !px-4 !py-2">View</a>
              <button className="btn btn-ghost !px-4 !py-2" onClick={() => setHome(true)}>Edit</button>
            </div>
          </li>
          {pages.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-card p-4 transition hover:border-accent/50">
              <div className="min-w-44 flex-1">
                <p className="font-display text-xl font-bold">
                  {p.title}
                  {p.isSystem && <span className="ml-2 rounded-full bg-soft px-2 py-0.5 text-[0.62rem] uppercase tracking-widest text-muted">default</span>}
                </p>
                <p className="text-sm text-muted">/{p.slug} · {p.body.length.toLocaleString()} chars · {p.media.length} media</p>
              </div>
              <button
                onClick={() => toggleNav(p)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${p.showInNav ? "bg-emerald-500/15 text-emerald-500" : "bg-line text-muted"}`}
              >
                {p.showInNav ? "In navbar" : "Not in navbar"}
              </button>
              <div className="flex gap-2">
                <a href={`/${p.slug}`} target="_blank" className="btn btn-ghost !px-4 !py-2">View</a>
                <button className="btn btn-ghost !px-4 !py-2" onClick={() => edit(p)}>Edit</button>
                {!(p.slug === "about" || p.slug === "contact") && (
                  <button className="btn btn-ghost !px-4 !py-2 hover:!border-red-500 hover:!text-red-500" onClick={() => remove(p)}>Delete</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
