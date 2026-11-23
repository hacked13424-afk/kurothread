import Link from "next/link";
import MediaView from "@/components/MediaView";
import ProductGrid from "@/components/ProductGrid";
import { getSettings, listCategories, listProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [s, products, categories] = await Promise.all([getSettings(), listProducts({ activeOnly: true }), listCategories()]);
  const heroItem = { type: s.heroMediaType, url: s.heroMedia } as const;

  return (
    <>
      <section className="grain relative isolate flex min-h-[78vh] w-full items-end overflow-hidden bg-black">
        {s.heroMedia && (
          <MediaView
            item={heroItem}
            controls={false}
            className="absolute inset-0 -z-10 h-full w-full scale-105 object-cover object-center opacity-80"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-bg to-transparent" />
        <div className="w-full px-4 pb-16 pt-32 sm:px-8 lg:px-12 lg:pb-24">
          <p className="anim-up text-[0.72rem] font-semibold uppercase tracking-[0.35em] text-[#d4af5a]">{s.heroEyebrow}</p>
          <h1
            className="anim-up font-display mt-5 max-w-5xl whitespace-pre-line text-5xl font-extrabold leading-[1.02] text-[#f6f1e6] sm:text-7xl xl:text-8xl"
            style={{ animationDelay: "120ms" }}
          >
            {s.heroHeadline}
          </h1>
          <p className="anim-up mt-6 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg" style={{ animationDelay: "240ms" }}>
            {s.heroSubtitle}
          </p>
          <div className="anim-up mt-9 flex flex-wrap gap-4" style={{ animationDelay: "360ms" }}>
            <Link href="/shop" className="btn btn-primary">
              {s.heroCta || "Shop"}
            </Link>
            <Link href="/collections" className="btn border border-white/30 text-white hover:border-[#d4af5a] hover:text-[#d4af5a]">
              Collections
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full px-4 py-16 sm:px-8 lg:px-12">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label !mb-2 text-accent">The Drop</p>
            <h2 className="font-display text-4xl font-bold sm:text-5xl">Latest pieces</h2>
          </div>
          <Link href="/shop" className="text-xs font-semibold uppercase tracking-[0.22em] text-muted transition hover:text-accent">
            View all →
          </Link>
        </div>
        <ProductGrid products={products.slice(0, 8)} categories={categories} />
      </section>

      {categories.length > 0 && (
        <section className="w-full px-4 pb-8 sm:px-8 lg:px-12">
          <div className="grid w-full gap-5 md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">
            {categories.map((c) => {
              const cover = products.find((p) => p.categoryId === c.id)?.media.find((m) => m.type === "image");
              const count = products.filter((p) => p.categoryId === c.id).length;
              return (
                <Link
                  key={c.id}
                  href={`/collections#${c.slug}`}
                  className="group relative isolate flex aspect-[16/9] items-end overflow-hidden rounded-2xl border border-line bg-card"
                >
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover.url} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-110 group-hover:opacity-90" />
                  )}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 to-transparent" />
                  <div className="p-6 text-white">
                    <p className="text-[0.66rem] uppercase tracking-[0.25em] text-[#d4af5a]">{count} pieces</p>
                    <h3 className="font-display text-3xl font-bold">{c.name}</h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
