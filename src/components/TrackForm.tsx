"use client";

import { useState } from "react";

const STEPS = [
  ["pending", "Request received"],
  ["confirmed", "Payment confirmed"],
  ["sent", "In production / shipped"],
  ["delivered", "Delivered"],
] as const;

type Result = {
  code: string;
  productTitle: string;
  size: string;
  color: string;
  quantity: number;
  rawStatus: string;
  createdAt: string;
};

export default function TrackForm() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const stepIdx = result ? STEPS.findIndex(([k]) => k === result.rawStatus) : -1;

  return (
    <div className="rounded-2xl border border-line bg-card p-6 sm:p-8">
      <h2 className="font-display text-2xl font-bold">Track your order</h2>
      <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label className="label">Order code</label>
          <input className="input font-mono uppercase" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="KT-XXXXXX" />
        </div>
        <div>
          <label className="label">Email used</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </div>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Checking…" : "Track"}
        </button>
      </form>
      {error && <p className="mt-4 text-sm text-neon">{error}</p>}
      {result && (
        <div className="anim-up mt-6 border-t border-line pt-6">
          <p className="text-sm text-muted">
            {result.code} · {result.productTitle} · {result.size} · {result.color} · ×{result.quantity}
          </p>
          {result.rawStatus === "cancelled" ? (
            <p className="mt-3 font-semibold text-neon">This order was cancelled.</p>
          ) : (
            <ol className="mt-5 grid gap-3 sm:grid-cols-4">
              {STEPS.map(([k, label], i) => (
                <li key={k} className={`rounded-xl border p-4 text-sm transition ${i <= stepIdx ? "border-accent bg-accent/10 text-fg" : "border-line text-muted"}`}>
                  <span className="mb-1 block text-xs">{i <= stepIdx ? "●" : "○"}</span>
                  {label}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
