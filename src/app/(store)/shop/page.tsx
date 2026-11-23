import type { Metadata } from "next";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import { listCategories, listProducts } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const [all, categories] = await Promise.all([listProducts({ activeOnly: true }), listCategories()]);
  const cat = categories.find((x) => x.slug === c);
  const products = cat ? all.filter((p) => p.categoryId === cat.id) : all;

  return (
    <section className="w-full px-4 py-14 sm:px-8 lg:px-12">
      <div className="anim-up mb-10">
        <p className="label !mb-2 text-accent">Shop</p>
        <h1 className="font-display text-5xl font-bold sm:text-6xl">{cat ? cat.name : "All pieces"}</h1>
        <p className="mt-3 text-muted">{products.length} item{products.length === 1 ? "" : "s"} · printed on demand</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/shop" className="pill" data-active={!cat}>
            All
          </Link>
          {categories.map((x) => (
            <Link key={x.id} href={`/shop?c=${x.slug}`} className="pill" data-active={cat?.id === x.id}>
              {x.name}
            </Link>
          ))}
        </div>
      </div>
      <ProductGrid products={products} categories={categories} />
    </section>
  );
}
