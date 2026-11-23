/* eslint-disable @next/next/no-img-element */
import { embedUrl } from "@/lib/media";
import type { MediaItem } from "@/lib/types";

export default function MediaView({
  item,
  className = "",
  controls = true,
  alt = "",
}: {
  item: MediaItem;
  className?: string;
  controls?: boolean;
  alt?: string;
}) {
  if (item.type === "video") {
    const embed = embedUrl(item.url);
    if (embed)
      return (
        <iframe
          src={embed}
          title={alt || "Video"}
          className={className}
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      );
    return (
      <video
        src={item.url}
        className={className}
        controls={controls}
        muted={!controls}
        loop={!controls}
        autoPlay={!controls}
        playsInline
        preload="metadata"
      />
    );
  }
  return <img src={item.url} alt={alt} className={className} loading="lazy" />;
}

export function Thumb({ item, className = "" }: { item: MediaItem; className?: string }) {
  if (item.type === "video" && embedUrl(item.url)) {
    return (
      <div className={`grid place-items-center bg-black text-white ${className}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    );
  }
  if (item.type === "video") return <video src={item.url} className={className} muted preload="metadata" />;
  return <img src={item.url} alt="" className={className} loading="lazy" />;
}
