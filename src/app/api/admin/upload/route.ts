import crypto from "node:crypto";
import { guard } from "@/lib/adminAuth";
import { db } from "@/db";
import { media } from "@/db/schema";
import { ensureReady } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  await ensureReady();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) return Response.json({ error: "Only images and videos are allowed" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const id = crypto.randomUUID();
  await db.insert(media).values({ id, mime: file.type, data: buf.toString("base64") });
  return Response.json({ url: `/api/media/${id}`, type: isVideo ? "video" : "image" });
}
