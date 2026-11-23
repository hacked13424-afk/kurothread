"use client";

import { useMemo, useState } from "react";
import { fmtUSD, ORDER_STATUSES, type Order } from "@/lib/types";
import { api, copyText, type Ctx } from "@/components/admin/api";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-500",
  confirmed: "bg-emerald-500/15 text-emerald-500",
  sent: "bg-sky-500/15 text-sky-500",
  delivered: "bg-violet-500/15 text-violet-400",
  cancelled: "bg-red-500/15 text-red-500",
};

export function printKKText(o: Order) {
  return [
    `ORDER ${o.code}`,
    ``,
    `— SHIPPING —`,
    `Recipient: ${o.name}`,
    `Phone: ${o.phone}`,
    `Email: ${o.email}`,
    `Address:`,
    o.address.trim(),
    ``,
    `— PRODUCT —`,
    `Item: ${o.productTitle} (Gildan 5000 tee)`,
    `Size: ${o.size || "-"}`,
    `Color: ${o.color || "-"}`,
    `Quantity: ${o.quantity}`,
    o.notes ? `\nNotes: ${o.notes}` : "",
  ]
    .filter((l) => l !== undefined)
    .join("\n");
}

export default function OrdersTab({ ctx }: { ctx: Ctx }) {
  const { orders } = ctx.data;
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const count = (s: string) => orders.filter((o) => o.status === s).length;
  const sum = (list: Order[]) => list.reduce((a, o) => a + o.unitPrice * o.quantity, 0);
  const paid = orders.filter((o) => ["confirmed", "sent", "delivered"].includes(o.status));
  const pipeline = orders.filter((o) => o.status === "pending");

  const kpis = [
    { label: "Total orders", value: orders.length },
    { label: "Pending", value: count("pending") },
    { label: "Confirmed / Paid", value: count("confirmed") },
    { label: "Sent to PrintKK", value: count("sent") },
    { label: "Delivered", value: count("delivered") },
    { label: "Est. revenue (USD)", value: fmtUSD(sum(paid)), sub: `${fmtUSD(sum(pipeline))} pending` },
  ];

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (filter === "all" || o.status === filter) &&
        (!needle || [o.code, o.name, o.email, o.phone, o.productTitle].join(" ").toLowerCase().includes(needle)),
    );
  }, [orders, filter, q]);

  async function setStatus(o: Order, status: string) {
    try {
      await api("/api/admin/orders", "POST", { id: o.id, status });
      await ctx.reload();
      ctx.toast(`${o.code} → ${ORDER_STATUSES.find((s) => s.value === status)?.label}`);
    } catch (e) {
      ctx.toast((e as Error).message, "err");
    }
  }
  async function remove(o: Order) {
    if (!confirm(`Delete order ${o.code} from ${o.name}? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/orders?id=${o.id}`, "DELETE");
      await ctx.reload();
      ctx.toast("Order deleted");
    } catch (e) {
      ctx.toast((e as Error).message, "err");
    }
  }
  async function copy(o: Order) {
    ctx.toast((await copyText(printKKText(o))) ? "Copied for PrintKK ✓" : "Copy failed", "ok");
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold">Dashboard &amp; Orders</h1>
        <p className="mt-1 text-sm text-muted">Every order request from the storefront lands here instantly.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:border-accent/50">
            <p className="label !mb-2">{k.label}</p>
            <p className="font-display text-3xl font-bold">{k.value}</p>
            {k.sub && <p className="mt-1 text-xs text-muted">{k.sub}</p>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input className="input !w-full sm:!w-72" placeholder="Search name, email, code…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          {[{ value: "all", label: "All" }, ...ORDER_STATUSES].map((s) => (
            <button key={s.value} className="pill !py-1.5" data-active={filter === s.value} onClick={() => setFilter(s.value)}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-14 text-center text-muted">No orders match.</div>
      ) : (
        <ul className="space-y-3">
          {list.map((o) => {
            const isOpen = open === o.id;
            return (
              <li key={o.id} className="overflow-hidden rounded-2xl border border-line bg-card">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
                  <button className="flex min-w-48 flex-1 flex-col text-left" onClick={() => setOpen(isOpen ? null : o.id)}>
                    <span className="font-mono text-sm font-bold text-accent">{o.code}</span>
                    <span className="font-semibold">{o.name}</span>
                    <span className="text-xs text-muted">{new Date(o.createdAt).toLocaleString()}</span>
                  </button>
                  <div className="min-w-40 text-sm">
                    <p className="font-semibold">{o.productTitle}</p>
                    <p className="text-muted">
                      {o.size} · {o.color} · ×{o.quantity}
                    </p>
                  </div>
                  <p className="w-24 font-display text-xl font-bold">{fmtUSD(o.unitPrice * o.quantity)}</p>
                  <select
                    className={`rounded-full border-0 px-3 py-2 text-xs font-semibold outline-none ${STATUS_STYLE[o.status]}`}
                    value={o.status}
                    onChange={(e) => setStatus(o, e.target.value)}
                    aria-label="Order status"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value} className="bg-card text-fg">
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button className="btn btn-primary !px-4 !py-2" onClick={() => copy(o)}>
                      Copy for PrintKK
                    </button>
                    <button className="btn btn-ghost !px-3 !py-2 hover:!border-red-500 hover:!text-red-500" onClick={() => remove(o)} aria-label="Delete order">
                      🗑
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="anim-in grid gap-6 border-t border-line bg-soft p-5 text-sm md:grid-cols-3">
                    <div>
                      <p className="label">Customer</p>
                      <p className="font-semibold">{o.name}</p>
                      <p>{o.phone}</p>
                      <a className="text-accent" href={`mailto:${o.email}`}>{o.email}</a>
                    </div>
                    <div className="md:col-span-1">
                      <p className="label">Full shipping address</p>
                      <p className="whitespace-pre-wrap break-words">{o.address}</p>
                    </div>
                    <div>
                      <p className="label">Order notes</p>
                      <p className="whitespace-pre-wrap break-words text-muted">{o.notes || "—"}</p>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
