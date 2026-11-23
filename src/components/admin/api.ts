import type { Category, Order, PageEntry, Product, Settings } from "@/lib/types";

export type AdminData = {
  orders: Order[];
  products: Product[];
  categories: Category[];
  pages: PageEntry[];
  settings: Settings;
};

export type Ctx = {
  data: AdminData;
  reload: () => Promise<void>;
  toast: (msg: string, kind?: "ok" | "err") => void;
};

export async function api<T = unknown>(path: string, method = "GET", body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.endsWith("/login")) window.dispatchEvent(new Event("kt-unauth"));
  if (!res.ok) throw new Error((json as { error?: string }).error || `Request failed (${res.status})`);
  return json as T;
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}
