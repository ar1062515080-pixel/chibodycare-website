"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getAuthRedirectUrl() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  return host ? `${protocol}://${host}/admin/login?confirmed=true` : undefined;
}

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: admin } = await supabase
    .from("admin_users")
    .select("role, location_id")
    .eq("user_id", user.id)
    .single();
  if (!admin) redirect("/admin/login?error=not_authorized");
  return { supabase, admin };
}

export async function signIn(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  redirect("/admin");
}

export async function registerAdmin(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!email || password.length < 8) {
    redirect("/admin/register?error=Please%20use%20a%20valid%20email%20and%20a%20password%20of%20at%20least%208%20characters");
  }
  if (password !== confirmPassword) {
    redirect("/admin/register?error=Passwords%20do%20not%20match");
  }

  const emailRedirectTo = await getAuthRedirectUrl();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  });
  if (error) redirect(`/admin/register?error=${encodeURIComponent(error.message)}`);

  // Registration creates an Auth user only. Access is granted separately by
  // an existing administrator adding the user to public.admin_users.
  await supabase.auth.signOut();
  redirect("/admin/register?registered=true");
}

export async function resendAdminConfirmation(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/admin/register?registered=true&error=Please%20enter%20your%20email%20address");
  }

  const emailRedirectTo = await getAuthRedirectUrl();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  });
  if (error) {
    redirect(`/admin/register?registered=true&error=${encodeURIComponent(error.message)}`);
  }

  redirect("/admin/register?registered=true&resent=true");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function saveTherapist(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const payload = {
    display_name: String(formData.get("display_name") ?? "").trim(),
    internal_name: String(formData.get("internal_name") ?? "").trim(),
    active: formData.get("active") === "on",
    public_display: formData.get("public_display") === "on",
  };
  if (!payload.display_name || !payload.internal_name) return;
  const result = id
    ? await supabase.from("therapists").update(payload).eq("id", id).select("id").single()
    : await supabase.from("therapists").insert(payload).select("id").single();
  if (result.error || !result.data) throw new Error(result.error?.message || "Unable to save therapist");
  const therapistId = result.data.id;
  await supabase.from("therapist_services").delete().eq("therapist_id", therapistId);
  const serviceIds = formData.getAll("service_ids").map(String);
  if (serviceIds.length) {
    const { error } = await supabase.from("therapist_services").insert(
      serviceIds.map((serviceId) => ({ therapist_id: therapistId, service_id: serviceId })),
    );
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/therapists");
}

export async function saveRoster(formData: FormData) {
  const { supabase } = await requireAdmin();
  const serviceIds = formData.getAll("service_ids").map(String);
  const { error } = await supabase.rpc("upsert_daily_roster", {
    p_roster_id: formData.get("id") ? String(formData.get("id")) : null,
    p_date: String(formData.get("date")),
    p_location_id: String(formData.get("location_id")),
    p_therapist_id: String(formData.get("therapist_id")),
    p_start_time: String(formData.get("start_time")),
    p_end_time: String(formData.get("end_time")),
    p_active: formData.get("active") === "on",
    p_service_ids: serviceIds.length ? serviceIds : null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/roster");
}

export async function removeRoster(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("daily_rosters").delete().eq("id", String(formData.get("id")));
  if (error) throw new Error(error.message);
  revalidatePath("/admin/roster");
}

export async function updateBookingStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const status = String(formData.get("status"));
  if (!["pending", "confirmed", "cancelled", "completed", "no_show"].includes(status)) return;
  const { error } = await supabase.from("bookings").update({ status }).eq("id", String(formData.get("id")));
  if (error) throw new Error(error.message);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

export async function saveLocation(formData: FormData) {
  const { supabase } = await requireAdmin();
  const locationId = String(formData.get("id"));
  const { error } = await supabase.from("locations").update({
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    active: formData.get("active") === "on",
  }).eq("id", locationId);
  if (error) throw new Error(error.message);
  for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]) {
    const open = String(formData.get(`${day}_open`) ?? "");
    const close = String(formData.get(`${day}_close`) ?? "");
    if (open && close) {
      const { error: hoursError } = await supabase.from("location_opening_hours").upsert({
        location_id: locationId,
        day_of_week: day,
        open_time: open,
        close_time: close,
        active: true,
      }, { onConflict: "location_id,day_of_week" });
      if (hoursError) throw new Error(hoursError.message);
    }
  }
  revalidatePath("/admin/locations");
}
