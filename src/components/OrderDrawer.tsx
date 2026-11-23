"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { fmtUSD, type Product } from "@/lib/types";

const CODES = [
  ["🇺🇸 United States", "+1"], ["🇨🇦 Canada", "+1"], ["🇬🇧 United Kingdom", "+44"], ["🇦🇺 Australia", "+61"],
  ["🇳🇿 New Zealand", "+64"], ["🇮🇪 Ireland", "+353"], ["🇩🇪 Germany", "+49"], ["🇫🇷 France", "+33"],
  ["🇪🇸 Spain", "+34"], ["🇮🇹 Italy", "+39"], ["🇳🇱 Netherlands", "+31"], ["🇸🇪 Sweden", "+46"],
  ["🇳🇴 Norway", "+47"], ["🇩🇰 Denmark", "+45"], ["🇵🇱 Poland", "+48"], ["🇵🇹 Portugal", "+351"],
  ["🇨🇭 Switzerland", "+41"], ["🇦🇪 UAE", "+971"], ["🇸🇦 Saudi Arabia", "+966"], ["🇹🇷 Türkiye", "+90"],
  ["🇮🇳 India", "+91"], ["🇵🇰 Pakistan", "+92"], ["🇧🇩 Bangladesh", "+880"], ["🇵🇭 Philippines", "+63"],
  ["🇮🇩 Indonesia", "+62"], ["🇲🇾 Malaysia", "+60"], ["🇸🇬 Singapore", "+65"], ["🇹🇭 Thailand", "+66"],
  ["🇻🇳 Vietnam", "+84"], ["🇯🇵 Japan", "+81"], ["🇰🇷 South Korea", "+82"], ["🇨🇳 China", "+86"],
  ["🇭🇰 Hong Kong", "+852"], ["🇧🇷 Brazil", "+55"], ["🇲🇽 Mexico", "+52"], ["🇦🇷 Argentina", "+54"],
  ["🇨🇴 Colombia", "+57"], ["🇿🇦 South Africa", "+27"], ["🇳🇬 Nigeria", "+234"], ["🇰🇪 Kenya", "+254"],
  ["🇪🇬 Egypt", "+20"],
] as const;

type Receipt = {
  code: string;
  name: string;
  email: string;
  productTitle: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string;
};

export default function OrderDrawer({
  product,
  size,
  color,
  quantity,
  onClose,
}: {
  product: Product;
  size: string;
  color: string;
  quantity: number;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ name: "", cc: "+1", phone: "", email: "", address: "", notes: "" });
  const [sz, setSz] = useState(size);
  const [col, setCol] = useState(color);
  const [qty, setQty] = useState(quantity);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: `${form.cc} ${form.phone.trim()}`,
          email: form.email,
          address: form.address,
          notes: form.notes,
          productId: product.id,
          productTitle: product.title,
          size: sz,
          color: col,
          quantity: qty,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setReceipt(data.receipt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true" aria-label="Order request">
      <div className="anim-in absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <aside className="anim-drawer scroll-thin relative flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-line bg-bg text-fg shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg/90 px-6 py-4 backdrop-blur">
          <h2 className="font-display text-2xl font-bold">{receipt ? "Order received" : "Order request"}</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-line hover:border-accent">
            ✕
          </button>
        </div>

        {receipt ? (
          <div className="anim-up space-y-6 p-6">
            <div className="rounded-2xl border border-accent/40 bg-card p-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent text-2xl text-accentfg">✓</div>
              <p className="mt-4 text-sm text-muted">Thank you, {receipt.name.split(" ")[0]}. Your order code is</p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-widest text-accent">{receipt.code}</p>
            </div>
            <div className="rounded-2xl border border-line bg-card p-5 text-sm">
              <p className="label">Receipt</p>
              <dl className="mt-2 space-y-2">
                {[
                  ["Item", receipt.productTitle],
                  ["Size", receipt.size || "—"],
                  ["Color", receipt.color || "—"],
                  ["Quantity", String(receipt.quantity)],
                  ["Unit price", fmtUSD(receipt.unitPrice)],
                  ["Email", receipt.email],
                  ["Placed", new Date(receipt.createdAt).toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t border-line pt-3 text-base">
                  <dt className="font-semibold">Estimated total</dt>
                  <dd className="font-display text-xl font-bold">{fmtUSD(receipt.total)}</dd>
                </div>
              </dl>
            </div>
            <p className="rounded-xl bg-soft p-4 text-sm leading-relaxed text-muted">
              <strong className="text-fg">No payment has been taken.</strong> We&apos;ll review your request and send a
              payment invoice / confirmation to <strong className="text-fg">{receipt.email}</strong> shortly. Your item
              goes into production once payment is confirmed. Keep your order code to track the status on our Track page.
            </p>
            <button className="btn btn-primary w-full" onClick={onClose}>
              Continue browsing
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5 p-6">
            <div className="flex gap-4 rounded-2xl border border-line bg-card p-4">
              {product.media[0]?.type === "image" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.media[0].url} alt="" className="h-20 w-20 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="label !mb-1">Selected product</p>
                <p className="font-display text-xl font-bold leading-tight">{product.title}</p>
                <p className="text-sm text-muted">
                  {fmtUSD(product.price)} each · <span className="text-fg">{fmtUSD(product.price * qty)}</span> total
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Size</label>
                {product.sizes.length ? (
                  <select className="input" value={sz} onChange={(e) => setSz(e.target.value)}>
                    {product.sizes.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <input className="input" value={sz} onChange={(e) => setSz(e.target.value)} />
                )}
              </div>
              <div>
                <label className="label">Color</label>
                {product.colors.length ? (
                  <select className="input" value={col} onChange={(e) => setCol(e.target.value)}>
                    {product.colors.map((c) => (
                      <option key={c.name}>{c.name}</option>
                    ))}
                  </select>
                ) : (
                  <input className="input" value={col} onChange={(e) => setCol(e.target.value)} />
                )}
              </div>
              <div>
                <label className="label">Qty</label>
                <input className="input" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="o-name">Full name *</label>
              <input id="o-name" className="input" required autoComplete="name" value={form.name} onChange={set("name")} placeholder="Jane Doe" />
            </div>
            <div>
              <label className="label" htmlFor="o-phone">Phone number (with country code) *</label>
              <div className="flex gap-2">
                <select className="input !w-40 shrink-0" value={form.cc} onChange={set("cc")} aria-label="Country code">
                  {CODES.map(([n, c]) => (
                    <option key={n} value={c}>
                      {n.split(" ")[0]} {c}
                    </option>
                  ))}
                </select>
                <input id="o-phone" className="input" required type="tel" autoComplete="tel-national" value={form.phone} onChange={set("phone")} placeholder="555 123 4567" />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="o-email">Email address *</label>
              <input id="o-email" className="input" required type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="you@email.com" />
            </div>
            <div>
              <label className="label" htmlFor="o-address">Full shipping address *</label>
              <textarea
                id="o-address"
                className="input min-h-32 resize-y"
                required
                value={form.address}
                onChange={set("address")}
                placeholder={"Street, apartment / unit\nCity, State / Province, Postal code\nCountry"}
              />
            </div>
            <div>
              <label className="label" htmlFor="o-notes">Order notes (optional)</label>
              <textarea id="o-notes" className="input min-h-20 resize-y" value={form.notes} onChange={set("notes")} placeholder="Anything we should know?" />
            </div>

            {error && <p className="rounded-lg border border-neon/40 bg-neon/10 px-4 py-3 text-sm text-neon">{error}</p>}
            <button className="btn btn-primary w-full" disabled={busy}>
              {busy ? "Sending…" : "Submit order request"}
            </button>
            <p className="text-center text-xs text-muted">No payment now. We&apos;ll email your invoice after confirming your order.</p>
          </form>
        )}
      </aside>
    </div>,
    document.body,
  );
}
