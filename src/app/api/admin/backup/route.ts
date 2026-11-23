import { revalidatePath } from "next/cache";
import { guard } from "@/lib/adminAuth";
import { exportBackup, importBackup } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await guard();
  if (denied) return denied;
  const data = await exportBackup();
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="kurothread-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

export async function POST(req: Request) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || (!body.products && !body.settings && !body.pages && !body.orders))
      return Response.json({ error: "This doesn't look like a KuroThread backup file." }, { status: 400 });
    await importBackup(body);
    revalidatePath("/", "layout");
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Import failed" }, { status: 400 });
  }
}
