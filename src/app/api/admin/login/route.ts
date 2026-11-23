import { cookies } from "next/headers";
import { COOKIE } from "@/lib/adminAuth";
import { createSessionToken, getAuthHash, verifyPassword } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  const hash = await getAuthHash();
  if (!password || !verifyPassword(password, hash)) {
    await new Promise((r) => setTimeout(r, 600));
    return Response.json({ error: "Incorrect password" }, { status: 401 });
  }
  const token = await createSessionToken();
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: req.headers.get("x-forwarded-proto") === "https",
  });
  return Response.json({ ok: true });
}
