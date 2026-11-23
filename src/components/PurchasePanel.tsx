"use client";

import { useState } from "react";
import OrderDrawer from "@/components/OrderDrawer";
import { fmtUSD, type Product } from "@/lib/types";

export default function PurchasePanel({ product }: { product: Product }) {
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [qty, setQty] = useState(1);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      {product.sizes.length > 0 && (
        <div>
          <p className="label">Size · <span className="text-fg">{size}</span></p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button key={s} className="pill min-w-12" data-active={s === size} onClick={() => setSize(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {product.colors.length > 0 && (
        <div>
          <p className="label">Color · <span className="text-fg">{color}</span></p>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((c) => (
              <button
                key={c.name}
                title={c.name}
                aria-label={c.name}
                onClick={() => setColor(c.name)}
                className={`h-9 w-9 rounded-full border-2 p-0.5 transition hover:scale-110 ${
                  c.name === color ? "border-accent" : "border-line"
                }`}
              >
                <span className="block h-full w-full rounded-full border border-white/20" style={{ background: c.hex }} />
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="label">Quantity</p>
        <div className="inline-flex items-center rounded-full border border-line">
          <button className="h-10 w-10 text-lg transition hover:text-accent" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease">
            −
          </button>
          <span className="w-10 text-center text-sm font-semibold">{qty}</span>
          <button className="h-10 w-10 text-lg transition hover:text-accent" onClick={() => setQty(qty + 1)} aria-label="Increase">
            +
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
        <div>
          <p className="label !mb-1">Total</p>
          <p className="font-display text-3xl font-bold">{fmtUSD(product.price * qty)}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          Order Now
        </button>
      </div>
      {open && <OrderDrawer product={product} size={size} color={color} quantity={qty} onClose={() => setOpen(false)} />}
    </div>
  );
}
