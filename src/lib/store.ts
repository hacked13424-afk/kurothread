import crypto from "node:crypto";
import { asc, desc, eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { categories, kv, media, orders, pages, products } from "@/db/schema";
import {
  DEFAULT_SETTINGS,
  type Category,
  type Order,
  type OrderStatus,
  type PageEntry,
  type Product,
  type Settings,
} from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Bootstrap: create tables if needed + seed initial catalog           */
/* ------------------------------------------------------------------ */

const DEFAULT_PASSWORD = "KuroAdmin2026";

const DDL = `
CREATE TABLE IF NOT EXISTS kv (key text PRIMARY KEY, value jsonb NOT NULL);
CREATE TABLE IF NOT EXISTS categories (id text PRIMARY KEY, name text NOT NULL, slug text NOT NULL, sort integer NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY, title text NOT NULL, price double precision NOT NULL DEFAULT 0,
  badge text NOT NULL DEFAULT '', category_id text, description text NOT NULL DEFAULT '',
  media jsonb NOT NULL DEFAULT '[]', sizes jsonb NOT NULL DEFAULT '[]', colors jsonb NOT NULL DEFAULT '[]',
  active boolean NOT NULL DEFAULT true, sort integer NOT NULL DEFAULT 0, created_at timestamp NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS pages (
  id text PRIMARY KEY, title text NOT NULL, slug text NOT NULL UNIQUE, show_in_nav boolean NOT NULL DEFAULT false,
  nav_order integer NOT NULL DEFAULT 0, hero_headline text NOT NULL DEFAULT '', subtitle text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '', media jsonb NOT NULL DEFAULT '[]', is_system boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY, code text NOT NULL, name text NOT NULL, phone text NOT NULL, email text NOT NULL,
  address text NOT NULL, product_id text NOT NULL DEFAULT '', product_title text NOT NULL, size text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '', quantity integer NOT NULL DEFAULT 1, unit_price double precision NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'pending', created_at timestamp NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS media (id text PRIMARY KEY, mime text NOT NULL, data text NOT NULL, created_at timestamp NOT NULL DEFAULT now());
`;

const GILDAN =
  "Printed on a premium black **Gildan 5000** heavy cotton tee — 5.3 oz, classic fit, double-needle stitching and a durable seamless collar.";

const SEED_PRODUCTS = [
  {
    id: "outlaw-duo",
    title: "Outlaw Duo",
    price: 34.99,
    badge: "Bestseller",
    cat: "western-outlaw",
    img: "/assets/images/outlaw-duo.png",
    description: `## Two guns. One legend.\n\nBack-to-back, masked and unbothered — the **Outlaw Duo** is a distressed western graphic for the ones who never ride alone.\n\n${GILDAN}\n\n- Print: DTG, soft-hand, wash-safe\n- Fit: Classic unisex, true to size\n- Made to order and shipped worldwide\n\nCare: machine wash cold, inside out. Tumble dry low.`,
  },
  {
    id: "strike-team",
    title: "Strike Team",
    price: 36.99,
    badge: "Gamer Pick",
    cat: "gaming",
    img: "/assets/images/strike-team.png",
    description: `## Squad up.\n\nFour operators, one objective. **Strike Team** brings tactical energy and neon-cyan highlights to your lobby-night uniform.\n\n${GILDAN}\n\n- Print: DTG, vivid neon-cyan detail\n- Fit: Classic unisex, true to size\n- Made to order and shipped worldwide\n\nCare: machine wash cold, inside out. Do not iron on the print.`,
  },
  {
    id: "deadeye-outlaw",
    title: "Deadeye Outlaw",
    price: 35.99,
    badge: "Limited",
    cat: "western-outlaw",
    img: "/assets/images/deadeye-outlaw.png",
    description: `## One eye. One shot.\n\nA lone gunslinger with a crimson crosshair stare. **Deadeye Outlaw** is gritty, vintage-inked and built to stand out in the dark.\n\n${GILDAN}\n\n- Print: DTG in gold & crimson\n- Fit: Classic unisex, true to size\n- Made to order and shipped worldwide\n\nCare: machine wash cold, inside out. Tumble dry low.`,
  },
  {
    id: "new-life-sim",
    title: "New Life Sim",
    price: 33.99,
    badge: "New Drop",
    cat: "gaming",
    img: "/assets/images/new-life-sim.png",
    description: `## Start a new save file.\n\nPixel-art skyline, a glowing green diamond and neon magenta haze — **New Life Sim** is for everyone who has ever rebuilt their whole world from scratch.\n\n${GILDAN}\n\n- Print: DTG, neon green & magenta\n- Fit: Classic unisex, true to size\n- Made to order and shipped worldwide\n\nCare: machine wash cold, inside out. Do not bleach.`,
  },
];

const SEED_PAGES = [
  {
    id: "page-about",
    title: "About",
    slug: "about",
    showInNav: true,
    navOrder: 20,
    heroHeadline: "Born in the dark. Printed for you.",
    subtitle: "KuroThread is a dark-streetwear and gaming label built on a print-on-demand engine.",
    body: `## The idea\n\n**Kuro** means *black*. Every piece we make starts as a blank black canvas and becomes something louder.\n\nWe design outlaw and gaming graphics for people who live between the screen and the street. Nothing sits in a warehouse — each tee is **printed on demand**, just for you, which means less waste and more care.\n\n## How it works\n\n- Pick your tee, size and color\n- Send us your order request — no card needed up front\n- We confirm and send you a payment invoice shortly after\n- Your order is printed, packed and shipped worldwide\n\n## Quality\n\nWe print on premium black Gildan 5000 heavy cotton tees with soft-hand DTG ink that survives the wash.`,
    media: [{ type: "image", url: "/assets/images/about-banner.png" }],
  },
  {
    id: "page-contact",
    title: "Track / Contact",
    slug: "contact",
    showInNav: true,
    navOrder: 30,
    heroHeadline: "Track an order. Talk to a human.",
    subtitle: "Enter your order code and email to check status, or reach out to our support team.",
    body: `## Need help?\n\nSend us a message with your **order code** and we'll reply within one business day. Because every piece is printed on demand, production usually takes 3–5 business days before shipping.`,
    media: [],
  },
];

declare global {
  var __ktReady: Promise<void> | undefined;
}

export function hashPassword(pw: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(pw, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(pw, salt, 32);
  const real = Buffer.from(hash, "hex");
  return real.length === test.length && crypto.timingSafeEqual(real, test);
}

async function bootstrap() {
  await pool.query(DDL);
  const seeded = await db.select().from(kv).where(eq(kv.key, "seeded"));
  if (seeded.length) return;

  await db
    .insert(kv)
    .values([
      { key: "settings", value: DEFAULT_SETTINGS },
      { key: "auth", value: { hash: hashPassword(DEFAULT_PASSWORD) } },
    ])
    .onConflictDoNothing();

  await db
    .insert(categories)
    .values([
      { id: "western-outlaw", name: "Western Outlaw", slug: "western-outlaw", sort: 0 },
      { id: "gaming", name: "Gaming", slug: "gaming", sort: 1 },
    ])
    .onConflictDoNothing();

  await db
    .insert(products)
    .values(
      SEED_PRODUCTS.map((p, i) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        badge: p.badge,
        categoryId: p.cat,
        description: p.description,
        media: [{ type: "image" as const, url: p.img }],
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: [{ name: "Black", hex: "#0a0a0a" }],
        active: true,
        sort: i,
      })),
    )
    .onConflictDoNothing();

  await db
    .insert(pages)
    .values(SEED_PAGES.map((p) => ({ ...p, isSystem: true, media: p.media as { type: "image"; url: string }[] })))
    .onConflictDoNothing();

  await db.insert(kv).values({ key: "seeded", value: true }).onConflictDoNothing();
}

export function ensureReady() {
  if (!globalThis.__ktReady) {
    globalThis.__ktReady = bootstrap().catch((e) => {
      globalThis.__ktReady = undefined;
      throw e;
    });
  }
  return globalThis.__ktReady;
}

/* ------------------------------------------------------------------ */
/* Readers                                                             */
/* ------------------------------------------------------------------ */

export async function getSettings(): Promise<Settings> {
  await ensureReady();
  const [row] = await db.select().from(kv).where(eq(kv.key, "settings"));
  return { ...DEFAULT_SETTINGS, ...((row?.value as Partial<Settings>) ?? {}) };
}

export async function saveSettings(patch: Partial<Settings>) {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await db
    .insert(kv)
    .values({ key: "settings", value: next })
    .onConflictDoUpdate({ target: kv.key, set: { value: next } });
  return next;
}

export async function listCategories(): Promise<Category[]> {
  await ensureReady();
  return db.select().from(categories).orderBy(asc(categories.sort), asc(categories.name));
}

function mapProduct(r: typeof products.$inferSelect): Product {
  return {
    id: r.id,
    title: r.title,
    price: r.price,
    badge: r.badge,
    categoryId: r.categoryId,
    description: r.description,
    media: r.media ?? [],
    sizes: r.sizes ?? [],
    colors: r.colors ?? [],
    active: r.active,
    sort: r.sort,
  };
}

export async function listProducts(opts: { activeOnly?: boolean } = {}): Promise<Product[]> {
  await ensureReady();
  const rows = await db.select().from(products).orderBy(asc(products.sort), desc(products.createdAt));
  const all = rows.map(mapProduct);
  return opts.activeOnly ? all.filter((p) => p.active) : all;
}

export async function getProduct(id: string): Promise<Product | null> {
  await ensureReady();
  const [r] = await db.select().from(products).where(eq(products.id, id));
  return r ? mapProduct(r) : null;
}

function mapPage(r: typeof pages.$inferSelect): PageEntry {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    showInNav: r.showInNav,
    navOrder: r.navOrder,
    heroHeadline: r.heroHeadline,
    subtitle: r.subtitle,
    body: r.body,
    media: r.media ?? [],
    isSystem: r.isSystem,
  };
}

export async function listPages(): Promise<PageEntry[]> {
  await ensureReady();
  const rows = await db.select().from(pages).orderBy(asc(pages.navOrder), asc(pages.createdAt));
  return rows.map(mapPage);
}

export async function getPageBySlug(slug: string): Promise<PageEntry | null> {
  await ensureReady();
  const [r] = await db.select().from(pages).where(eq(pages.slug, slug));
  return r ? mapPage(r) : null;
}

function mapOrder(r: typeof orders.$inferSelect): Order {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    phone: r.phone,
    email: r.email,
    address: r.address,
    productId: r.productId,
    productTitle: r.productTitle,
    size: r.size,
    color: r.color,
    quantity: r.quantity,
    unitPrice: r.unitPrice,
    notes: r.notes,
    status: r.status as OrderStatus,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function listOrders(): Promise<Order[]> {
  await ensureReady();
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  return rows.map(mapOrder);
}

export async function findOrderByCode(code: string, email: string) {
  await ensureReady();
  const rows = await db.select().from(orders).where(eq(orders.code, code.trim().toUpperCase()));
  const r = rows.find((o) => o.email.trim().toLowerCase() === email.trim().toLowerCase());
  return r ? mapOrder(r) : null;
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export async function getAuthHash(): Promise<string> {
  await ensureReady();
  const [row] = await db.select().from(kv).where(eq(kv.key, "auth"));
  return ((row?.value as { hash?: string })?.hash as string) ?? "";
}

export async function setPassword(pw: string) {
  const value = { hash: hashPassword(pw) };
  await db
    .insert(kv)
    .values({ key: "auth", value })
    .onConflictDoUpdate({ target: kv.key, set: { value } });
}

function sign(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export async function createSessionToken() {
  const hash = await getAuthHash();
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 7;
  return `${exp}.${sign(String(exp), hash + (process.env.ADMIN_SESSION_SECRET ?? ""))}`;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const hash = await getAuthHash();
  const expected = sign(exp, hash + (process.env.ADMIN_SESSION_SECRET ?? ""));
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ------------------------------------------------------------------ */
/* Backup                                                              */
/* ------------------------------------------------------------------ */

export async function exportBackup() {
  await ensureReady();
  const [settings, cats, prods, pgs, ords, med] = await Promise.all([
    getSettings(),
    listCategories(),
    listProducts(),
    listPages(),
    listOrders(),
    db.select().from(media),
  ]);
  return {
    app: "KuroThread",
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    categories: cats,
    products: prods,
    pages: pgs,
    orders: ords,
    media: med.map((m) => ({ id: m.id, mime: m.mime, data: m.data })),
  };
}

type Backup = Partial<Awaited<ReturnType<typeof exportBackup>>>;

export async function importBackup(b: Backup) {
  await ensureReady();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (b.categories) {
      await client.query("DELETE FROM categories");
      for (const c of b.categories)
        await client.query("INSERT INTO categories (id,name,slug,sort) VALUES ($1,$2,$3,$4)", [
          c.id,
          c.name,
          c.slug,
          c.sort ?? 0,
        ]);
    }
    if (b.media) {
      await client.query("DELETE FROM media");
      for (const m of b.media)
        await client.query("INSERT INTO media (id,mime,data) VALUES ($1,$2,$3)", [m.id, m.mime, m.data]);
    }
    if (b.products) {
      await client.query("DELETE FROM products");
      for (const p of b.products)
        await client.query(
          "INSERT INTO products (id,title,price,badge,category_id,description,media,sizes,colors,active,sort) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
          [
            p.id,
            p.title,
            p.price,
            p.badge ?? "",
            p.categoryId ?? null,
            p.description ?? "",
            JSON.stringify(p.media ?? []),
            JSON.stringify(p.sizes ?? []),
            JSON.stringify(p.colors ?? []),
            p.active ?? true,
            p.sort ?? 0,
          ],
        );
    }
    if (b.pages) {
      await client.query("DELETE FROM pages");
      for (const p of b.pages)
        await client.query(
          "INSERT INTO pages (id,title,slug,show_in_nav,nav_order,hero_headline,subtitle,body,media,is_system) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
          [
            p.id,
            p.title,
            p.slug,
            p.showInNav ?? false,
            p.navOrder ?? 0,
            p.heroHeadline ?? "",
            p.subtitle ?? "",
            p.body ?? "",
            JSON.stringify(p.media ?? []),
            p.isSystem ?? false,
          ],
        );
    }
    if (b.orders) {
      await client.query("DELETE FROM orders");
      for (const o of b.orders)
        await client.query(
          "INSERT INTO orders (id,code,name,phone,email,address,product_id,product_title,size,color,quantity,unit_price,notes,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)",
          [
            o.id,
            o.code,
            o.name,
            o.phone,
            o.email,
            o.address,
            o.productId ?? "",
            o.productTitle,
            o.size ?? "",
            o.color ?? "",
            o.quantity ?? 1,
            o.unitPrice ?? 0,
            o.notes ?? "",
            o.status ?? "pending",
            o.createdAt ?? new Date().toISOString(),
          ],
        );
    }
    if (b.settings) {
      const value = { ...DEFAULT_SETTINGS, ...b.settings };
      await client.query(
        "INSERT INTO kv (key,value) VALUES ('settings',$1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [JSON.stringify(value)],
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
