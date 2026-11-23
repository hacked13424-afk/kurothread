import ProductCard from "@/components/ProductCard";
import type { Category, Product } from "@/lib/types";

export default function ProductGrid({ products, categories }: { products: Product[]; categories: Category[] }) {
  const names = new Map(categories.map((c) => [c.id, c.name]));
  if (!products.length)
    return <p className="py-20 text-center text-muted">Nothing here yet — check back for the next drop.</p>;
  return (
    <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(min(100%,270px),1fr))] gap-5 lg:gap-7">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} category={p.categoryId ? names.get(p.categoryId) : undefined} />
      ))}
    </div>
  );
}
