import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type MediaItem = { type: "image" | "video"; url: string };
export type ColorOption = { name: string; hex: string };

export const kv = pgTable("kv", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  sort: integer("sort").notNull().default(0),
});

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  price: doublePrecision("price").notNull().default(0),
  badge: text("badge").notNull().default(""),
  categoryId: text("category_id"),
  description: text("description").notNull().default(""),
  media: jsonb("media").$type<MediaItem[]>().notNull().default([]),
  sizes: jsonb("sizes").$type<string[]>().notNull().default([]),
  colors: jsonb("colors").$type<ColorOption[]>().notNull().default([]),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pages = pgTable("pages", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  showInNav: boolean("show_in_nav").notNull().default(false),
  navOrder: integer("nav_order").notNull().default(0),
  heroHeadline: text("hero_headline").notNull().default(""),
  subtitle: text("subtitle").notNull().default(""),
  body: text("body").notNull().default(""),
  media: jsonb("media").$type<MediaItem[]>().notNull().default([]),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  productId: text("product_id").notNull().default(""),
  productTitle: text("product_title").notNull(),
  size: text("size").notNull().default(""),
  color: text("color").notNull().default(""),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: doublePrecision("unit_price").notNull().default(0),
  notes: text("notes").notNull().default(""),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const media = pgTable("media", {
  id: text("id").primaryKey(),
  mime: text("mime").notNull(),
  data: text("data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
