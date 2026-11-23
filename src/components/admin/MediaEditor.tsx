"use client";

import { useRef, useState } from "react";
import { Thumb } from "@/components/MediaView";
import { guessMediaType } from "@/lib/media";
import type { MediaItem } from "@/lib/types";

async function shrinkImage(file: File): Promise<Blob | File> {
  if (file.size < 450_000 || /gif|svg/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const max = 2000;
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.88));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export default function MediaEditor({
  items,
  onChange,
  label = "Photos & videos",
  single = false,
}: {
  items: MediaItem[];
  onChange: (m: MediaItem[]) => void;
  label?: string;
  single?: boolean;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState("");
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const latest = useRef(items);
  latest.current = items;

  async function upload(files: FileList | File[]) {
    setErr("");
    for (const f of Array.from(files)) {
      if (f.size > 80 * 1024 * 1024) {
        setErr(`${f.name} is larger than 80MB — host it elsewhere and paste the URL.`);
        continue;
      }
      setBusy((b) => b + 1);
      try {
        const body = f.type.startsWith("image/") ? await shrinkImage(f) : f;
        const fd = new FormData();
        fd.append("file", body, f.name);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Upload failed");
        const item: MediaItem = { type: json.type, url: json.url };
        onChange(single ? [item] : [...latest.current, item]);
        latest.current = single ? [item] : [...latest.current, item];
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setBusy((b) => b - 1);
      }
    }
  }

  function addUrl() {
    const u = url.trim();
    if (!u) return;
    const item: MediaItem = { type: guessMediaType(u), url: u };
    onChange(single ? [item] : [...items, item]);
    setUrl("");
  }

  function move(from: number, to: number) {
    if (from === to || to < 0 || to >= items.length) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onChange(next);
  }

  return (
    <div>
      <p className="label">{label}</p>
      <div className="rounded-xl border border-dashed border-line bg-soft p-4">
        <div
          onDragOver={(e) => e.dataTransfer.types.includes("Files") && e.preventDefault()}
          onDrop={(e) => {
            if (e.dataTransfer.files.length) {
              e.preventDefault();
              upload(e.dataTransfer.files);
            }
          }}
          className="flex flex-wrap items-center gap-3"
        >
          <button type="button" className="btn btn-ghost !py-2" onClick={() => fileRef.current?.click()}>
            ⬆ Upload files
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple={!single} hidden onChange={(e) => e.target.files && upload(e.target.files)} />
          <span className="text-xs text-muted">or</span>
          <input
            className="input !w-auto min-w-48 flex-1"
            placeholder="Paste image / video URL (mp4, YouTube, Vimeo…)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
          />
          <button type="button" className="btn btn-primary !py-2" onClick={addUrl}>
            Add URL
          </button>
          {busy > 0 && <span className="text-xs text-accent">Uploading {busy}…</span>}
        </div>
        {err && <p className="mt-2 text-xs text-neon">{err}</p>}

        {items.length > 0 && (
          <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
            {items.map((m, i) => (
              <li
                key={m.url + i}
                draggable
                onDragStart={() => setDrag(i)}
                onDragEnd={() => (setDrag(null), setOver(null))}
                onDragOver={(e) => (e.preventDefault(), setOver(i))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (drag !== null) move(drag, i);
                  setDrag(null);
                  setOver(null);
                }}
                className={`group relative aspect-square cursor-grab overflow-hidden rounded-lg border bg-card transition ${
                  over === i && drag !== i ? "border-accent scale-95" : "border-line"
                } ${drag === i ? "opacity-40" : ""}`}
              >
                <Thumb item={m} className="pointer-events-none h-full w-full object-cover" />
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase text-white">
                  {i === 0 ? "Cover" : m.type}
                </span>
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/70 px-1 py-1 text-white opacity-0 transition group-hover:opacity-100">
                  <button type="button" className="px-1.5" onClick={() => move(i, i - 1)} aria-label="Move left">←</button>
                  <button type="button" className="px-1.5 text-red-400" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove">✕</button>
                  <button type="button" className="px-1.5" onClick={() => move(i, i + 1)} aria-label="Move right">→</button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {items.length > 1 && <p className="mt-2 text-[0.7rem] text-muted">Drag thumbnails to reorder. The first item is the cover.</p>}
      </div>
    </div>
  );
}
