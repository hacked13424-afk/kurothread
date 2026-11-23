"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Gallery from "@/components/Gallery";
import MediaView from "@/components/MediaView";
import PurchasePanel from "@/components/PurchasePanel";
import { fmtUSD, type Product } from "@/lib/types";

function QuickPreview({ product, category, onClose }: { product: Product; category?: string; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[90] grid place-items-center p-3 sm:p-8" role="dialog" aria-modal="true">
      <div className="anim-in absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="anim-pop scroll-thin relative grid max-h-full w-full max-w-6xl gap-8 overflow-y-auto rounded-3xl border border-line bg-bg p-5 text-fg shadow-2xl md:grid-cols-2 md:p-8">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-line bg-bg hover:border-accent">
          ✕
        </button>
        <Gallery media={product.media} title={product.title} />
        <div className="flex flex-col gap-5">
          <div>
            <p className="label !mb-2 text-accent">{category || product.badge}</p>
            <h3 className="font-display text-4xl font-bold leading-tight">{product.title}</h3>
            <p className="mt-2 text-xl">{fmtUSD(product.price)}</p>
          </div>
          <PurchasePanel product={product} />
          <Link href={`/product/${product.id}`} className="text-xs font-semibold uppercase tracking-[0.2em] text-muted hover:text-accent">
            View full details →
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function ProductCard({ product, category, index = 0 }: { product: Product; category?: string; index?: number }) {
  const [preview, setPreview] = useState(false);
  const first = product.media[0];
  const second = product.media.find((m, i) => i > 0 && m.type === "image");

  return (
    <article
      className="anim-up group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition duration-500 hover:-translate-y-1.5 hover:border-accent/60 hover:shadow-[var(--shadow)]"
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
    >
      <div className="relative aspect-square overflow-hidden bg-soft">
      <Link href={`/product/${product.id}`} className="absolute inset-0 block" aria-label={product.title}>
        {first ? (
          <MediaView item={first} controls={false} alt={product.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
        ) : (
          <div className="h-full w-full" />
        )}
        {second && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={second.url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:scale-105 group-hover:opacity-100" />
        )}
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#f4e7c1] backdrop-blur">
            {product.badge}
          </span>
        )}
      </Link>
      <button
        onClick={() => setPreview(true)}
        className="absolute inset-x-4 bottom-4 hidden translate-y-3 rounded-full bg-black/75 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white opacity-0 backdrop-blur transition duration-300 hover:bg-black group-hover:translate-y-0 group-hover:opacity-100 md:block"
      >
        Quick preview
      </button>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-muted">{category || "Apparel"}</p>
        <div className="flex items-start justify-between gap-3">
          <Link href={`/product/${product.id}`} className="font-display text-xl font-bold leading-snug transition hover:text-accent">
            {product.title}
          </Link>
          <p className="shrink-0 pt-0.5 text-sm font-semibold">{fmtUSD(product.price)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5">
            {product.colors.slice(0, 6).map((c) => (
              <span key={c.name} title={c.name} className="h-4 w-4 rounded-full border border-fg/25" style={{ background: c.hex }} />
            ))}
          </div>
          <button onClick={() => setPreview(true)} className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-accent md:hidden">
            Quick view
          </button>
        </div>
      </div>
      {preview && <QuickPreview product={product} category={category} onClose={() => setPreview(false)} />}
    </article>
  );
}
