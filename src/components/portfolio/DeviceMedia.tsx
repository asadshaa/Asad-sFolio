import Image from "next/image";
import type { MediaItem } from "@/config/portfolio";

function Media({ m, sizes }: { m: MediaItem; sizes: string }) {
  if (m.kind === "video") {
    return (
      <video
        src={m.src}
        poster={m.poster}
        className="h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={m.alt}
      />
    );
  }
  return <Image src={m.src} alt={m.alt} fill sizes={sizes} className="object-cover object-top" />;
}

/**
 * Screenshot / screen-recording presented in a device frame:
 * phones for mobile apps, a browser window for web apps.
 */
export function DeviceMedia({ m }: { m: MediaItem }) {
  if (m.device === "phone") {
    return (
      <figure className="flex flex-col items-center gap-2">
        <div className="relative w-[200px] rounded-[2.2rem] border-[7px] border-ink bg-ink p-0 shadow-xl">
          <div aria-hidden className="absolute left-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-ink" />
          <div className="relative aspect-[9/19.5] overflow-hidden rounded-[1.7rem] bg-paper">
            <Media m={m} sizes="200px" />
          </div>
        </div>
        {m.caption && <figcaption className="max-w-[220px] text-center text-xs text-ink-soft">{m.caption}</figcaption>}
      </figure>
    );
  }
  if (m.device === "browser") {
    return (
      <figure className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
        <div className="flex items-center gap-1 border-b border-ink/8 bg-paper px-3 py-2">
          {["#e8603f", "#f2b84b", "#5fb3a1"].map((c) => (
            <span key={c} aria-hidden className="h-2 w-2 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <div className="relative aspect-[16/10]">
          <Media m={m} sizes="(min-width: 768px) 50vw, 100vw" />
        </div>
        {m.caption && <figcaption className="px-3 py-2 text-xs text-ink-soft">{m.caption}</figcaption>}
      </figure>
    );
  }
  return (
    <figure className="overflow-hidden rounded-xl border border-ink/10 bg-white">
      <div className="relative aspect-[16/10]">
        <Media m={m} sizes="(min-width: 768px) 50vw, 100vw" />
      </div>
      {m.caption && <figcaption className="px-3 py-2 text-xs text-ink-soft">{m.caption}</figcaption>}
    </figure>
  );
}
