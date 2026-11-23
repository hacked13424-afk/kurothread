import { eq } from "drizzle-orm";
import { db } from "@/db";
import { media } from "@/db/schema";
import { ensureReady } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await ensureReady();
  const [row] = await db.select().from(media).where(eq(media.id, id));
  if (!row) return new Response("Not found", { status: 404 });
  const buf = Buffer.from(row.data, "base64");
  const total = buf.length;
  const range = req.headers.get("range");
  const headers: Record<string, string> = {
    "Content-Type": row.mime,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
  };
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
      const chunk = buf.subarray(start, end + 1);
      return new Response(new Uint8Array(chunk), {
        status: 206,
        headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": String(chunk.length) },
      });
    }
  }
  return new Response(new Uint8Array(buf), { headers: { ...headers, "Content-Length": String(total) } });
}
