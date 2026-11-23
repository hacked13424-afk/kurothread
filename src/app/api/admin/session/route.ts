import { isAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ok: await isAdmin() });
}
