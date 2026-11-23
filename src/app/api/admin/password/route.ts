import { cookies } from "next/headers";
import { COOKIE, guard } from "@/lib/adminAuth";
import { createSessionToken, getAuthHash, setPassword, verifyPassword } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  const { current, next } = (await req.json().catch(() => ({}))) as { current?: string; next?: string };
  if (!current || !verifyPassword(current, await getAuthHash()))
    return Response.json({ error: "Current password is incorrect" }, { status: 400 });
  if (!next || next.length < 6)
    return Response.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  await setPassword(next);
  // Changing the password invalidates every other session; re-issue this one.
  const jar = await cookies();
  jar.set(COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: req.headers.get("x-forwarded-proto") === "https",
  });
  return Response.json({ ok: true });
}
