"use client";

import { useState } from "react";
import { Thumb } from "@/components/MediaView";
import MediaEditor from "@/components/admin/MediaEditor";
import { api, type Ctx } from "@/components/admin/api";
import { fmtUSD, type ColorOption, type MediaItem, type Product } from "@/lib/types";

type Draft = {
  id?: string;
  title: string;
  price: string;
  badge: string;
  categoryId: string;
  description: string;
  media: MediaItem[];
  sizes: string[];
  colors: ColorOption[];
  active: boolean;
};

const blank: Draft = {
  title: "",
  price: "34.99",
  badge: "",
  categoryId: "",
  description: "",
  media: [],
  sizes: ["S", "M", "L", "XL", "XXL"],
  colors: [{ name: "Black", hex: "#0a0a0a" }],
  active: true,
};

function CategoryManager({ ctx }: { ctx: Ctx }) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const { categories, products } = ctx.data;

  async function save(id: string | undefined, n: string) {
    if (!n.trim()) return;
    try {
      await api("/api/admin/categories", "POST", { id, name: n });
      await ctx.reload();
      ctx.toast("Category saved");
    } catch (e) {
      ctx.toast((e as Error).message, "err");
    }
  }
  async function del(id: string, n: string) {
    if (!confirm(`Delete category "${n}"? Its products become uncategorised.`)) return;
    await api(`/api/admin/categories?id=${id}`, "DELETE");
    await ctx.reload();
    ctx.toast("Category deleted");
  }

  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <p className="label">Categories</p>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center gap-1 rounded-full border border-line bg-soft py-1 pl-3 pr-1 text-sm">
            {editing?.id === c.id ? (
              <>
                <input
                  autoFocus
                  className="w-32 bg-transparent outline-none"
                  value={editing.name}
                  onChange={(e) => setEditing({ id: c.id, name: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && (save(c.id, editing.name), setEditing(null))}
                />
                <button className="px-2 text-emerald-500" onClick={() => (save(c.id, editing.name), setEditing(null))}>✓</button>
              </>
            ) : (
              <>
                <span>
                  {c.name} <span className="text-muted">({products.filter((p) => p.categoryId === c.id).length})</span>
                </span>
                <button className="px-1.5 text-muted hover:text-accent" onClick={() => setEditing({ id: c.id, name: c.name })} aria-label="Rename">✎</button>
                <button className="px-1.5 text-muted hover:text-red-500" onClick={() => del(c.id, c.name)} aria-label="Delete">✕</button>
              </>
            )}
          </div>
        ))}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save(undefined, name);
            setName("");
          }}
        >
          <input className="input !w-44 !rounded-full !py-1.5" placeholder="New category…" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn btn-ghost !py-1.5">Add</button>
        </form>
      </div>
    </div>
  );
}

function Editor({ ctx, initial, onClose }: { ctx: Ctx; initial: Draft; onClose: () => void }) {
  const [d, setD] = useState<Draft>(initial);
  const [size, setSize] = useState("");
  const [busy, setBusy] = useState(false);
  const patch = (p: Partial<Draft>) => setD((x) => ({ ...x, ...p }));

  function addSize() {
    const s = size.trim();
    if (s && !d.sizes.includes(s)) patch({ sizes: [...d.sizes, s] });
    setSize("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/admin/products", "POST", { ...d, price: Number(d.price) });
      await ctx.reload();
      ctx.toast(d.id ? "Product updated" : "Product created");
      onClose();
    } catch (err) {
      ctx.toast((err as Error).message, "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="anim-up space-y-6 rounded-2xl border border-accent/40 bg-card p-5 sm:p-7">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl font-bold">{d.id ? "Edit product" : "New product"}</h2>
        <button type="button" className="btn btn-ghost !py-2" onClick={onClose}>Cancel</button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2">
          <label className="label">Title *</label>
          <input className="input" required value={d.title} onChange={(e) => patch({ title: e.target.value })} />
        </div>
        <div>
          <label className="label">Price (USD) *</label>
          <input className="input" required type="number" step="0.01" min="0" value={d.price} onChange={(e) => patch({ price: e.target.value })} />
        </div>
        <div>
          <label className="label">Badge</label>
          <input className="input" placeholder="New Drop, Limited…" value={d.badge} onChange={(e) => patch({ badge: e.target.value })} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={d.categoryId} onChange={(e) => patch({ categoryId: e.target.value })}>
            <option value="">— None —</option>
            {ctx.data.categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={d.active}
              onClick={() => patch({ active: !d.active })}
              className={`relative h-6 w-11 rounded-full transition ${d.active ? "bg-emerald-500" : "bg-line"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${d.active ? "left-[22px]" : "left-0.5"}`} />
            </button>
            <span className="text-sm">{d.active ? "Active · in stock" : "Hidden / out of stock"}</span>
          </label>
        </div>
      </div>

      <MediaEditor items={d.media} onChange={(media) => patch({ media })} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="label">Available sizes</p>
          <div className="flex flex-wrap gap-2">
            {d.sizes.map((s) => (
              <span key={s} className="flex items-center gap-1 rounded-full border border-line bg-soft py-1 pl-3 pr-1 text-sm">
                {s}
                <button type="button" className="px-1.5 text-muted hover:text-red-500" onClick={() => patch({ sizes: d.sizes.filter((x) => x !== s) })}>✕</button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <input className="input !w-40" placeholder="Custom size (e.g. 3XL)" value={size} onChange={(e) => setSize(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSize())} />
            <button type="button" className="btn btn-ghost !py-2" onClick={addSize}>Add</button>
            <button type="button" className="btn btn-ghost !py-2" onClick={() => patch({ sizes: ["S", "M", "L", "XL", "XXL"] })}>Reset S–XXL</button>
          </div>
        </div>
        <div>
          <p className="label">Available colors</p>
          <div className="space-y-2">
            {d.colors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="color"
                  value={c.hex}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-line bg-transparent"
                  onChange={(e) => patch({ colors: d.colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)) })}
                />
                <input className="input" placeholder="Color name" value={c.name} onChange={(e) => patch({ colors: d.colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} />
                <button type="button" className="px-2 text-muted hover:text-red-500" onClick={() => patch({ colors: d.colors.filter((_, j) => j !== i) })}>✕</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-ghost mt-3 !py-2" onClick={() => patch({ colors: [...d.colors, { name: "", hex: "#222222" }] })}>
            + Add color
          </button>
        </div>
      </div>

      <div>
        <label className="label">Full description (markdown supported · unlimited length)</label>
        <textarea
          className="input min-h-64 resize-y font-mono text-[0.82rem] leading-relaxed"
          value={d.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder={"## Headline\n\nParagraphs, **bold**, *italic*, [links](https://…)\n\n- bullet\n- bullet"}
        />
      </div>

      <div className="flex gap-3">
        <button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save product"}</button>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

export default function ProductsTab({ ctx }: { ctx: Ctx }) {
  const [editing, setEditing] = useState<Draft | null>(null);
  const { products, categories } = ctx.data;

  const edit = (p: Product) =>
    setEditing({
      id: p.id,
      title: p.title,
      price: String(p.price),
      badge: p.badge,
      categoryId: p.categoryId ?? "",
      description: p.description,
      media: p.media,
      sizes: p.sizes,
      colors: p.colors,
      active: p.active,
    });

  async function remove(p: Product) {
    if (!confirm(`Delete "${p.title}" permanently?`)) return;
    try {
      await api(`/api/admin/products?id=${p.id}`, "DELETE");
      await ctx.reload();
      ctx.toast("Product deleted");
    } catch (e) {
      ctx.toast((e as Error).message, "err");
    }
  }
  async function toggle(p: Product) {
    await api("/api/admin/products", "POST", { ...p, active: !p.active });
    await ctx.reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-muted">{products.length} products · no limit</p>
        </div>
        {!editing && (
          <button className="btn btn-primary" onClick={() => setEditing({ ...blank })}>+ Add new product</button>
        )}
      </div>

      {editing ? (
        <Editor key={editing.id ?? "new"} ctx={ctx} initial={editing} onClose={() => setEditing(null)} />
      ) : (
        <>
          <CategoryManager ctx={ctx} />
          <ul className="space-y-3">
            {products.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-card p-3 transition hover:border-accent/50">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-soft">
                  {p.media[0] && <Thumb item={p.media[0]} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-44 flex-1">
                  <p className="font-display text-xl font-bold">{p.title}</p>
                  <p className="text-sm text-muted">
                    {fmtUSD(p.price)} · {categories.find((c) => c.id === p.categoryId)?.name ?? "No category"} · {p.media.length} media · {p.sizes.length} sizes · {p.colors.length} colors
                  </p>
                </div>
                <button
                  onClick={() => toggle(p)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${p.active ? "bg-emerald-500/15 text-emerald-500" : "bg-line text-muted"}`}
                >
                  {p.active ? "Active" : "Hidden"}
                </button>
                <div className="flex gap-2">
                  <button className="btn btn-ghost !px-4 !py-2" onClick={() => edit(p)}>Edit</button>
                  <button className="btn btn-ghost !px-4 !py-2 hover:!border-red-500 hover:!text-red-500" onClick={() => remove(p)}>Delete</button>
                </div>
              </li>
            ))}
            {products.length === 0 && <p className="rounded-2xl border border-dashed border-line p-14 text-center text-muted">No products yet.</p>}
          </ul>
        </>
      )}
    </div>
  );
}
