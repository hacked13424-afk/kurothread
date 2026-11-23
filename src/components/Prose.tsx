import type { ReactNode } from "react";

/** Minimal, safe markdown renderer (no raw HTML): headings, lists, quotes, bold, italic, links, inline code. */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const key = `${keyBase}-${n++}`;
    if (t.startsWith("**")) out.push(<strong key={key} className="font-semibold text-fg">{inline(t.slice(2, -2), key)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={key} className="rounded bg-soft px-1.5 py-0.5 text-[0.9em]">{t.slice(1, -1)}</code>);
    else if (t.startsWith("[")) {
      const mm = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(t)!;
      const safe = /^(https?:|mailto:|\/|#)/i.test(mm[2]);
      out.push(
        <a key={key} href={safe ? mm[2] : "#"} className="text-accent underline underline-offset-4" target={mm[2].startsWith("http") ? "_blank" : undefined} rel="noreferrer">
          {mm[1]}
        </a>,
      );
    } else out.push(<em key={key}>{inline(t.slice(1, -1), key)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Prose({ text, className = "" }: { text: string; className?: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = h[1].length;
      const cls =
        lvl === 1
          ? "font-display text-4xl font-bold mt-10"
          : lvl === 2
            ? "font-display text-2xl font-bold mt-8"
            : "text-lg font-semibold mt-6";
      blocks.push(
        <div key={k++} role="heading" aria-level={lvl} className={`${cls} text-fg`}>
          {inline(h[2], `h${k}`)}
        </div>,
      );
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ""));
      blocks.push(
        <ul key={k++} className="ml-5 list-disc space-y-1.5 marker:text-accent">
          {items.map((it, j) => (
            <li key={j}>{inline(it, `l${k}-${j}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ""));
      blocks.push(
        <ol key={k++} className="ml-5 list-decimal space-y-1.5 marker:text-accent">
          {items.map((it, j) => (
            <li key={j}>{inline(it, `o${k}-${j}`)}</li>
          ))}
        </ol>,
      );
      continue;
    }
    if (line.startsWith(">")) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) q.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push(
        <blockquote key={k++} className="border-l-2 border-accent pl-4 italic text-muted">
          {inline(q.join(" "), `q${k}`)}
        </blockquote>,
      );
      continue;
    }
    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={k++} className="border-line" />);
      i++;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*[-*]\s|\s*\d+[.)]\s|>|---+$)/.test(lines[i])) para.push(lines[i++]);
    blocks.push(
      <p key={k++} className="whitespace-pre-line">
        {inline(para.join("\n"), `p${k}`)}
      </p>,
    );
  }
  return <div className={`space-y-4 leading-relaxed text-fg/80 ${className}`}>{blocks}</div>;
}
