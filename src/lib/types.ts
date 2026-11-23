export type MediaItem = { type: "image" | "video"; url: string };
export type ColorOption = { name: string; hex: string };

export type Category = { id: string; name: string; slug: string; sort: number };

export type Product = {
  id: string;
  title: string;
  price: number;
  badge: string;
  categoryId: string | null;
  description: string;
  media: MediaItem[];
  sizes: string[];
  colors: ColorOption[];
  active: boolean;
  sort: number;
};

export type PageEntry = {
  id: string;
  title: string;
  slug: string;
  showInNav: boolean;
  navOrder: number;
  heroHeadline: string;
  subtitle: string;
  body: string;
  media: MediaItem[];
  isSystem: boolean;
};

export type OrderStatus = "pending" | "confirmed" | "sent" | "delivered" | "cancelled";

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed / Paid" },
  { value: "sent", label: "Sent to PrintKK" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export type Order = {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  productId: string;
  productTitle: string;
  size: string;
  color: string;
  quantity: number;
  unitPrice: number;
  notes: string;
  status: OrderStatus;
  createdAt: string;
};

export type Settings = {
  siteName: string;
  tagline: string;
  defaultTheme: "dark" | "light";
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  supportHours: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroCta: string;
  heroMedia: string;
  heroMediaType: "image" | "video";
  announcement: string;
};

export const DEFAULT_SETTINGS: Settings = {
  siteName: "KuroThread",
  tagline: "Dark streetwear for gamers, outlaws & night owls.",
  defaultTheme: "dark",
  contactEmail: "support@kurothread.com",
  contactPhone: "+1 555 010 2026",
  contactAddress: "Worldwide shipping · Printed on demand",
  supportHours: "Mon–Fri · 9:00–18:00 (UTC)",
  heroEyebrow: "Season 01 · Made to order",
  heroHeadline: "Wear the legend.\nOwn the night.",
  heroSubtitle:
    "Luxury black heavyweight tees with outlaw and gaming graphics, printed on demand and shipped to your door.",
  heroCta: "Shop the drop",
  heroMedia: "/assets/images/hero-banner.png",
  heroMediaType: "image",
  announcement: "Printed on demand · Worldwide shipping · Payment link sent after you order",
};

export const fmtUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
