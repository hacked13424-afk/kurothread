import type { Metadata } from "next";
import ProductGrid from "@/components/ProductGrid";
import { listCategories, listProducts } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const [products, categories] = await Promise.all([listProducts({ activeOnly: true }), listCategories()]);
  const loose = products.filter((p) => !p.categoryId || !categories.some((c) => c.id === p.categoryId));

  return (
    <div className="w-full px-4 py-14 sm:px-8 lg:px-12">
      <div className="anim-up mb-14">
        <p className="label !mb-2 text-accent">Collections</p>
        <h1 className="font-display text-5xl font-bold sm:text-6xl">Pick your world</h1>
      </div>
      <div className="space-y-20">
        {categories.map((c) => {
          const list = products.filter((p) => p.categoryId === c.id);
          if (!list.length) return null;
          return (
            <section key={c.id} id={c.slug} className="scroll-mt-32">
              <div className="mb-6 flex items-baseline gap-4 border-b border-line pb-4">
                <h2 className="font-display text-3xl font-bold">{c.name}</h2>
                <span className="text-xs uppercase tracking-[0.2em] text-muted">{list.length} pieces</span>
              </div>
              <ProductGrid products={list} categories={categories} />
            </section>
          );
        })}
        {loose.length > 0 && (
          <section>
            <div className="mb-6 border-b border-line pb-4">
              <h2 className="font-display text-3xl font-bold">More</h2>
            </div>
            <ProductGrid products={loose} categories={categories} />
          </section>
        )}
      </div>
    </div>
  );
}
