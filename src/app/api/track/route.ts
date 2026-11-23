import { findOrderByCode } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { code, email } = (await req.json().catch(() => ({}))) as { code?: string; email?: string };
  if (!code || !email) return Response.json({ error: "Enter your order code and email." }, { status: 400 });
  const o = await findOrderByCode(code, email);
  if (!o) return Response.json({ error: "We couldn't find an order with those details." }, { status: 404 });
  return Response.json({
    order: {
      code: o.code,
      productTitle: o.productTitle,
      size: o.size,
      color: o.color,
      quantity: o.quantity,
      status: o.status === "sent" ? "In production / shipped" : o.status,
      rawStatus: o.status,
      createdAt: o.createdAt,
    },
  });
}
