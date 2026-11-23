import crypto from "node:crypto";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { ensureReady, getProduct } from "@/lib/store";

export const dynamic = "force-dynamic";

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[crypto.randomInt(alphabet.length)];
  return `KT-${s}`;
}

export async function POST(req: Request) {
  await ensureReady();
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return Response.json({ error: "Invalid request" }, { status: 400 });
  const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string).trim() : "");
  const name = str("name");
  const phone = str("phone");
  const email = str("email");
  const address = str("address");
  const productId = str("productId");
  if (!name || !phone || !email || !address)
    return Response.json({ error: "Please fill in your name, phone, email and shipping address." }, { status: 400 });
  if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: "Please enter a valid email." }, { status: 400 });
  const product = productId ? await getProduct(productId) : null;
  const quantity = Math.max(1, Math.min(999, Math.floor(Number(b.quantity) || 1)));
  const code = makeCode();
  const row = {
    id: crypto.randomUUID(),
    code,
    name,
    phone,
    email,
    address,
    productId: product?.id ?? productId,
    productTitle: product?.title ?? (str("productTitle") || "Unknown product"),
    size: str("size"),
    color: str("color"),
    quantity,
    unitPrice: product?.price ?? 0,
    notes: str("notes"),
    status: "pending",
  };
  await db.insert(orders).values(row);
  return Response.json({
    ok: true,
    receipt: {
      code,
      name,
      email,
      productTitle: row.productTitle,
      size: row.size,
      color: row.color,
      quantity,
      unitPrice: row.unitPrice,
      total: row.unitPrice * quantity,
      createdAt: new Date().toISOString(),
    },
  });
}
