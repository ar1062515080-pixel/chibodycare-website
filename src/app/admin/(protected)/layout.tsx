import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseEnv()) redirect("/admin/login?error=not_configured");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: admin } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).single();
  if (!admin) redirect("/admin/login?error=not_authorized");
  return <div className="min-h-screen bg-sand-50/50 lg:flex"><AdminNav /><main className="min-w-0 flex-1 p-5 sm:p-8 lg:p-10">{children}</main></div>;
}
