import type { Metadata } from "next";
import AdminApp from "@/components/admin/AdminApp";
import { isAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage() {
  return <AdminApp initialAuthed={await isAdmin()} />;
}
