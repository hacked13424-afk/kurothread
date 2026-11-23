import { cookies } from "next/headers";
import { COOKIE } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST() {
  const jar = await cookies();
  jar.delete(COOKIE);
  return Response.json({ ok: true });
}
