import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, orders, pages, products } from "@/db/schema";
import { guard } from "@/lib/adminAuth";
import { saveSettings } from "@/lib/store";
import { slugify, type ColorOption, type MediaItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const RESERVED = new Set(["admin", "shop", "collections", "api", "product", "_next", "assets", "kt-admin-portal"]);

type Ctx = { params: Promise<{ resource: string }> };

const s = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const mediaList = (v: unknown): MediaItem[] =>
  arr<MediaItem>(v)
    .filter((m) => m && typeof m.url === "string" && m.url)
    .map((m) => ({ type: m.type === "video" ? "video" : "image", url: m.url }));

function done(data: unknown = { ok: true }) {
  revalidatePath("/", "layout");
  return Response.json(data);
}

export async function POST(req: Request, ctx: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const { resource } = await ctx.params;
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return Response.json({ error: "Invalid body" }, { status: 400 });

  try {
    switch (resource) {
      case "settings": {
        const next = await saveSettings(b);
        return done({ settings: next });
      }
      case "categories": {
        const name = s(b.name).trim();
        if (!name) return Response.json({ error: "Category name required" }, { status: 400 });
        const id = s(b.id) || crypto.randomUUID();
        const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${categories.sort}),0)` }).from(categories);
        await db
          .insert(categories)
          .values({ id, name, slug: slugify(name) || id, sort: Number(max) + 1 })
          .onConflictDoUpdate({ target: categories.id, set: { name, slug: slugify(name) || id } });
        return done({ id });
      }
      case "products": {
        const title = s(b.title).trim();
        if (!title) return Response.json({ error: "Product title required" }, { status: 400 });
        const id = s(b.id) || crypto.randomUUID();
        const values = {
          title,
          price: Math.max(0, Number(b.price) || 0),
          badge: s(b.badge).trim(),
          categoryId: s(b.categoryId) || null,
          description: s(b.description),
          media: mediaList(b.media),
          sizes: arr<string>(b.sizes).map((x) => String(x).trim()).filter(Boolean),
          colors: arr<ColorOption>(b.colors)
            .filter((c) => c && c.name)
            .map((c) => ({ name: String(c.name).trim(), hex: String(c.hex || "#000000") })),
          active: b.active !== false,
        };
        const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${products.sort}),0)` }).from(products);
        await db
          .insert(products)
          .values({ id, ...values, sort: Number(max) + 1 })
          .onConflictDoUpdate({ target: products.id, set: values });
        return done({ id });
      }
      case "pages": {
        const title = s(b.title).trim();
        const slug = slugify(s(b.slug) || title);
        if (!title || !slug) return Response.json({ error: "Title and slug required" }, { status: 400 });
        if (RESERVED.has(slug)) return Response.json({ error: `"${slug}" is a reserved URL.` }, { status: 400 });
        const id = s(b.id) || crypto.randomUUID();
        const clash = await db.select().from(pages).where(eq(pages.slug, slug));
        if (clash.some((p) => p.id !== id))
          return Response.json({ error: "Another page already uses that slug." }, { status: 400 });
        const values = {
          title,
          slug,
          showInNav: b.showInNav === true,
          navOrder: Math.floor(Number(b.navOrder) || 50),
          heroHeadline: s(b.heroHeadline),
          subtitle: s(b.subtitle),
          body: s(b.body),
          media: mediaList(b.media),
        };
        await db
          .insert(pages)
          .values({ id, ...values, isSystem: false })
          .onConflictDoUpdate({ target: pages.id, set: values });
        return done({ id, slug });
      }
      case "orders": {
        const id = s(b.id);
        if (!id) return Response.json({ error: "Order id required" }, { status: 400 });
        await db.update(orders).set({ status: s(b.status, "pending") }).where(eq(orders.id, id));
        return done();
      }
      default:
        return Response.json({ error: "Unknown resource" }, { status: 404 });
    }
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const denied = await guard();
  if (denied) return denied;
  const { resource } = await ctx.params;
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  switch (resource) {
    case "products":
      await db.delete(products).where(eq(products.id, id));
      break;
    case "categories":
      await db.update(products).set({ categoryId: null }).where(eq(products.categoryId, id));
      await db.delete(categories).where(eq(categories.id, id));
      break;
    case "pages": {
      const [p] = await db.select().from(pages).where(eq(pages.id, id));
      if (p?.isSystem && (p.slug === "about" || p.slug === "contact"))
        return Response.json({ error: "Default pages can be edited but not deleted." }, { status: 400 });
      await db.delete(pages).where(eq(pages.id, id));
      break;
    }
    case "orders":
      await db.delete(orders).where(eq(orders.id, id));
      break;
    default:
      return Response.json({ error: "Unknown resource" }, { status: 404 });
  }
  return done();
}
