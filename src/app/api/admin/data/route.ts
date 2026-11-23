import { guard } from "@/lib/adminAuth";
import { getSettings, listCategories, listOrders, listPages, listProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const [orders, products, categories, pages, settings] = await Promise.all([
    listOrders(),
    listProducts(),
    listCategories(),
    listPages(),
    getSettings(),
  ]);
  return Response.json({ orders, products, categories, pages, settings });
}
