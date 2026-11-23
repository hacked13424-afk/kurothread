import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/store";

export const COOKIE = "kt_admin";

export async function isAdmin() {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE)?.value);
}

export async function guard(): Promise<Response | null> {
  if (await isAdmin()) return null;
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}
