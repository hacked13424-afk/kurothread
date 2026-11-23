import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/Gallery";
import ProductGrid from "@/components/ProductGrid";
import Prose from "@/components/Prose";
import PurchasePanel from "@/components/PurchasePanel";
import { getProduct, listCategories, listProducts } from "@/lib/store";
import { fmtUSD } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await getProduct(id);
  return { title: p?.title ?? "Product" };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories, all] = await Promise.all([getProduct(id), listCategories(), listProducts({ activeOnly: true })]);
  if (!product) notFound();
  const category = categories.find((c) => c.id === product.categoryId);
  const related = all.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="w-full px-4 py-10 sm:px-8 lg:px-12">
      <nav className="mb-8 text-xs uppercase tracking-[0.2em] text-muted">
        <Link href="/shop" className="hover:text-accent">Shop</Link> <span className="mx-2">/</span>
        {category && (
          <>
            <Link href={`/shop?c=${category.slug}`} className="hover:text-accent">{category.name}</Link> <span className="mx-2">/</span>
          </>
        )}
        <span className="text-fg">{product.title}</span>
      </nav>

      <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:gap-16">
        <div className="anim-up">
          <Gallery media={product.media} title={product.title} />
        </div>
        <div className="anim-up flex flex-col gap-6 lg:sticky lg:top-32 lg:self-start" style={{ animationDelay: "120ms" }}>
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {product.badge && <span className="rounded-full bg-accent px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-accentfg">{product.badge}</span>}
              {category && <span className="rounded-full border border-line px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted">{category.name}</span>}
              {!product.active && <span className="rounded-full border border-neon px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-neon">Unavailable</span>}
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] sm:text-6xl">{product.title}</h1>
            <p className="mt-3 text-2xl">{fmtUSD(product.price)}</p>
          </div>
          {product.active ? (
            <PurchasePanel product={product} />
          ) : (
            <p className="rounded-xl border border-line bg-card p-4 text-sm text-muted">This item is currently out of stock.</p>
          )}
        </div>
      </div>

      {product.description && (
        <section className="mt-16 w-full max-w-4xl border-t border-line pt-10">
          <p className="label text-accent">Details</p>
          <Prose text={product.description} />
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-display text-3xl font-bold">You may also like</h2>
          <ProductGrid products={related} categories={categories} />
        </section>
      )}
    </div>
  );
}
