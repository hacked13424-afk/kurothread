/** Returns an iframe-embeddable URL for YouTube / Vimeo links, otherwise null. */
export function embedUrl(url: string): string | null {
  try {
    const u = new URL(url, "http://x");
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (host.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/embed/")) return url;
      if (u.pathname.startsWith("/shorts/")) return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
    }
    if (host === "vimeo.com") return `https://player.vimeo.com/video/${u.pathname.split("/").filter(Boolean)[0]}`;
  } catch {
    /* ignore */
  }
  return null;
}

export function guessMediaType(url: string): "image" | "video" {
  if (embedUrl(url)) return "video";
  return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url) ? "video" : "image";
}
