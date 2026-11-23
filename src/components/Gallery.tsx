"use client";

import { useState } from "react";
import MediaView, { Thumb } from "@/components/MediaView";
import type { MediaItem } from "@/lib/types";

export default function Gallery({ media, title }: { media: MediaItem[]; title: string }) {
  const [i, setI] = useState(0);
  const items = media.length ? media : [];
  const cur = items[Math.min(i, items.length - 1)];

  if (!cur)
    return <div className="grid aspect-square w-full place-items-center rounded-2xl bg-card text-muted">No media</div>;

  return (
    <div className="flex w-full flex-col gap-3 md:flex-row-reverse">
      <div className="group relative aspect-square w-full flex-1 overflow-hidden rounded-2xl border border-line bg-card">
        <MediaView
          key={cur.url}
          item={cur}
          alt={title}
          className="anim-in h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        {items.length > 1 && (
          <>
            <button
              aria-label="Previous"
              onClick={() => setI((i - 1 + items.length) % items.length)}
              className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur transition group-hover:opacity-100"
            >
              ‹
            </button>
            <button
              aria-label="Next"
              onClick={() => setI((i + 1) % items.length)}
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur transition group-hover:opacity-100"
            >
              ›
            </button>
          </>
        )}
      </div>
      {items.length > 1 && (
        <div className="scroll-thin flex gap-2 overflow-auto md:max-h-[640px] md:w-20 md:flex-col">
          {items.map((m, idx) => (
            <button
              key={m.url + idx}
              onClick={() => setI(idx)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition md:h-20 md:w-20 ${
                idx === i ? "border-accent" : "border-line opacity-70 hover:opacity-100"
              }`}
            >
              <Thumb item={m} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
