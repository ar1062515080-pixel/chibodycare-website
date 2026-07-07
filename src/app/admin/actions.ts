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
  const locationId = String(formData.get("location_id") ?? "");
  const payload = {
    display_name: String(formData.get("display_name") ?? "").trim(),
    internal_name: String(formData.get("internal_name") ?? "").trim(),
    active: formData.get("active") === "on",
    public_display: formData.get("public_display") === "on",
  };
  if (!payload.display_name || !payload.internal_name || !locationId) return;
  const result = id
    ? await supabase.from("therapists").update(payload).eq("id", id).select("id").single()
    : await supabase.from("therapists").insert(payload).select("id").single();
  if (result.error || !result.data) throw new Error(result.error?.message || "Unable to save therapist");
  const therapistId = result.data.id;
  const { error: locationError } = await supabase.from("location_therapists").upsert(
    { location_id: locationId, therapist_id: therapistId },
    { onConflict: "location_id,therapist_id" },
  );
  if (locationError) throw new Error(locationError.message);
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

export async function updateRosterHours(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await requireAdmin();
  const rosterId = String(formData.get("roster_id") ?? "");
  const startTime = String(formData.get("start_time") ?? "");
  const endTime = String(formData.get("end_time") ?? "");
  if (!rosterId || !/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime) || startTime >= endTime) {
    return { ok: false, error: "Please enter valid arrival and departure times." };
  }
  const { error } = await supabase.from("daily_rosters").update({ start_time: startTime, end_time: endTime }).eq("id", rosterId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/roster");
  return { ok: true };
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

export type BookingCalendarStatus = "unpaid" | "paid" | "no_show";
export type BookingPaymentAmounts = {
  cardAmount: number;
  insuranceAmount: number;
  cashAmount: number;
  voucherAmount: number;
  waivedAmount: number;
};

export type UpdateBookingAppointmentInput = {
  bookingId: string;
  therapistId: string;
  dailyRosterId: string;
  startAt: string;
  endAt: string;
  calendarStatus: BookingCalendarStatus;
  paymentAmounts: BookingPaymentAmounts;
  voucherNumber: string;
};

export type UpdateBookingAppointmentResult =
  | {
      ok: true;
      booking: {
        id: string;
        therapistId: string;
        dailyRosterId: string;
        startAt: string;
        endAt: string;
        status: string;
        calendarStatus: BookingCalendarStatus;
      };
    }
  | { ok: false; error: string };

export async function updateBookingAppointment(
  input: UpdateBookingAppointmentInput,
): Promise<UpdateBookingAppointmentResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "Your admin session has expired. Please sign in again." };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (adminError || !admin) {
    return { ok: false, error: "You are not authorised to update appointments." };
  }

  const calendarStatuses: BookingCalendarStatus[] = ["unpaid", "paid", "no_show"];
  if (
    !input.bookingId ||
    !input.therapistId ||
    !input.dailyRosterId ||
    !input.startAt ||
    !input.endAt ||
    !calendarStatuses.includes(input.calendarStatus)
  ) {
    return { ok: false, error: "The appointment update is incomplete." };
  }

  if (Object.values(input.paymentAmounts).some((value) => value < 0 || !Number.isFinite(value))) {
    return { ok: false, error: "Please enter valid payment amounts." };
  }

  const startAt = new Date(input.startAt);
  const endAt = new Date(input.endAt);
  if (
    Number.isNaN(startAt.getTime()) ||
    Number.isNaN(endAt.getTime()) ||
    endAt <= startAt
  ) {
    return { ok: false, error: "Please select a valid appointment time." };
  }

  const { data, error } = await supabase.rpc("admin_update_booking_appointment", {
    p_booking_id: input.bookingId,
    p_therapist_id: input.therapistId,
    p_daily_roster_id: input.dailyRosterId,
    p_start_at: startAt.toISOString(),
    p_end_at: endAt.toISOString(),
    p_calendar_status: input.calendarStatus,
  });

  if (error) {
    return { ok: false, error: error.message || "Unable to update this appointment." };
  }

  const row = data?.[0] as {
    booking_id: string;
    therapist_id: string;
    daily_roster_id: string;
    start_at: string;
    end_at: string;
    status: string;
    calendar_status: BookingCalendarStatus;
  } | undefined;
  if (!row) return { ok: false, error: "The appointment could not be updated." };

  const { error: paymentError } = await supabase
    .from("bookings")
    .update({
      card_amount_cents: input.paymentAmounts.cardAmount,
      insurance_amount_cents: input.paymentAmounts.insuranceAmount,
      cash_amount_cents: input.paymentAmounts.cashAmount,
      voucher_amount_cents: input.paymentAmounts.voucherAmount,
      waived_amount_cents: input.paymentAmounts.waivedAmount,
      voucher_number: input.paymentAmounts.voucherAmount > 0 ? input.voucherNumber.trim() : "",
    })
    .eq("id", input.bookingId);

  if (paymentError) {
    return { ok: false, error: paymentError.message || "Unable to save payment amounts." };
  }

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  return {
    ok: true,
    booking: {
      id: row.booking_id,
      therapistId: row.therapist_id,
      dailyRosterId: row.daily_roster_id,
      startAt: row.start_at,
      endAt: row.end_at,
      status: row.status,
      calendarStatus: row.calendar_status,
    },
  };
}

export async function updateBookingCalendar(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const bookingId = String(formData.get("id") ?? "");
  const therapistId = String(formData.get("therapist_id") ?? "");
  const startAtValue = String(formData.get("start_at") ?? "");
  const endAtValue = String(formData.get("end_at") ?? "");
  const calendarStatus = String(formData.get("calendar_status") ?? "") as BookingCalendarStatus;
  const validCalendarStatuses: BookingCalendarStatus[] = ["unpaid", "paid", "no_show"];
  const parseAmount = (name: string) => {
    const value = String(formData.get(name) ?? "").trim();
    if (!value) return 0;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) return Number.NaN;
    return Math.round(numeric * 100);
  };
  const paymentAmounts = {
    cardAmount: parseAmount("card_amount"),
    insuranceAmount: parseAmount("insurance_amount"),
    cashAmount: parseAmount("cash_amount"),
    voucherAmount: parseAmount("voucher_amount"),
    waivedAmount: parseAmount("waived_amount"),
  };
  const voucherNumber = String(formData.get("voucher_number") ?? "").trim();

  if (!bookingId || !therapistId || !startAtValue || !endAtValue || !validCalendarStatuses.includes(calendarStatus)) {
    return { ok: false, error: "The appointment update is incomplete." };
  }
  if (Object.values(paymentAmounts).some(Number.isNaN)) {
    return { ok: false, error: "Please enter valid payment amounts." };
  }
  if (paymentAmounts.voucherAmount > 0 && !voucherNumber) {
    return { ok: false, error: "Please enter the gift voucher number." };
  }

  const startAt = new Date(startAtValue);
  const endAt = new Date(endAtValue);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return { ok: false, error: "Please select a valid appointment time." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "Your admin session has expired. Please sign in again." };
  }
  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return { ok: false, error: "You are not authorised to update appointments." };

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("location_id")
    .eq("id", bookingId)
    .maybeSingle();
  if (bookingError || !booking) return { ok: false, error: "Booking not found or access denied." };

  const appointmentDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Adelaide",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(startAt);
  const { data: roster, error: rosterError } = await supabase
    .from("daily_rosters")
    .select("id")
    .eq("location_id", booking.location_id)
    .eq("therapist_id", therapistId)
    .eq("date", appointmentDate)
    .eq("active", true)
    .maybeSingle();
  if (rosterError || !roster) {
    return { ok: false, error: "The selected therapist is not rostered at this store on this date." };
  }

  const result = await updateBookingAppointment({
    bookingId,
    therapistId,
    dailyRosterId: roster.id,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    calendarStatus,
    paymentAmounts,
    voucherNumber,
  });
  return result.ok ? { ok: true } : result;
}

export async function cancelBookingCalendar(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const bookingId = String(formData.get("id") ?? "").trim();
  if (!bookingId) return { ok: false, error: "Booking ID is required." };

  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "Your admin session has expired. Please sign in again." };
  }

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (adminError || !admin) {
    return { ok: false, error: "You are not authorised to cancel appointments." };
  }

  // This is intentionally a soft cancellation. The existing bookings update
  // policy applies can_manage_location to both the current and updated row,
  // so store managers cannot cancel appointments outside their location.
  const { data: booking, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .select("id")
    .maybeSingle();

  if (error) return { ok: false, error: error.message || "Unable to cancel this appointment." };
  if (!booking) return { ok: false, error: "Booking not found or access denied." };

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  return { ok: true };
}

function moneyToCents(value: FormDataEntryValue | null) {
  const amount = Number(String(value ?? "0").trim() || "0");
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : null;
}

export async function saveDailyStoreRecord(formData: FormData) {
  const { supabase } = await requireAdmin();
  const locationId = String(formData.get("location_id") ?? "");
  const recordDate = String(formData.get("record_date") ?? "");
  const openingCash = moneyToCents(formData.get("opening_cash"));
  const promotion = moneyToCents(formData.get("promotion"));
  const otherIncome = moneyToCents(formData.get("other_income"));
  const cashExpense = moneyToCents(formData.get("cash_expense"));
  if (!locationId || !/^\d{4}-\d{2}-\d{2}$/.test(recordDate) || [openingCash, promotion, otherIncome, cashExpense].some((value) => value === null)) {
    throw new Error("Please enter valid daily record amounts.");
  }
  const { error } = await supabase.from("daily_store_records").upsert({
    location_id: locationId,
    record_date: recordDate,
    opening_cash_cents: openingCash,
    promotion_cents: promotion,
    other_income_cents: otherIncome,
    cash_expense_cents: cashExpense,
    notes: String(formData.get("notes") ?? "").trim(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "location_id,record_date" });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/bookings");
}

export async function saveGiftVoucherSale(formData: FormData) {
  const { supabase } = await requireAdmin();
  const locationId = String(formData.get("location_id") ?? "");
  const saleDate = String(formData.get("sale_date") ?? "");
  const voucherNumber = String(formData.get("voucher_number") ?? "").trim();
  const faceValue = moneyToCents(formData.get("face_value"));
  const card = moneyToCents(formData.get("card_amount"));
  const hicaps = moneyToCents(formData.get("hicaps_amount"));
  const cash = moneyToCents(formData.get("cash_amount"));
  const voucher = moneyToCents(formData.get("voucher_amount"));
  const waived = moneyToCents(formData.get("waived_amount"));
  if (!locationId || !/^\d{4}-\d{2}-\d{2}$/.test(saleDate) || !voucherNumber || faceValue === null || faceValue <= 0 || [card, hicaps, cash, voucher, waived].some((value) => value === null)) {
    throw new Error("Please enter a voucher number, value and valid payment amounts.");
  }
  const { error } = await supabase.from("gift_voucher_sales").insert({
    location_id: locationId,
    sale_date: saleDate,
    voucher_number: voucherNumber,
    face_value_cents: faceValue,
    card_amount_cents: card,
    hicaps_amount_cents: hicaps,
    cash_amount_cents: cash,
    voucher_amount_cents: voucher,
    waived_amount_cents: waived,
    notes: String(formData.get("voucher_notes") ?? "").trim(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/bookings");
}

export async function removeGiftVoucherSale(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("gift_voucher_sales").delete().eq("id", String(formData.get("id") ?? ""));
  if (error) throw new Error(error.message);
  revalidatePath("/admin/bookings");
}

export async function redeemGiftVoucher(formData: FormData) {
  const { supabase } = await requireAdmin();
  const locationId = String(formData.get("location_id") ?? "");
  const voucherNumber = String(formData.get("voucher_number") ?? "").trim();
  const amount = moneyToCents(formData.get("amount"));
  const usedDate = String(formData.get("used_date") ?? "");
  if (!locationId || !voucherNumber || amount === null || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(usedDate)) {
    throw new Error("Please enter a valid voucher number and amount.");
  }
  const { data: sale, error: saleError } = await supabase.from("gift_voucher_sales").select("id,face_value_cents").eq("voucher_number", voucherNumber).maybeSingle();
  if (saleError || !sale) throw new Error("Gift voucher not found.");
  const { data: redemptions, error: redemptionError } = await supabase.from("gift_voucher_redemptions").select("amount_cents").eq("gift_voucher_sale_id", sale.id);
  if (redemptionError) throw new Error(redemptionError.message);
  const balance = sale.face_value_cents - (redemptions ?? []).reduce((sum, row) => sum + row.amount_cents, 0);
  if (amount > balance) throw new Error("The amount exceeds the voucher balance.");
  const { error } = await supabase.from("gift_voucher_redemptions").insert({ gift_voucher_sale_id: sale.id, location_id: locationId, amount_cents: amount, used_date: usedDate });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/vouchers");
}

export async function removeGiftVoucherRedemption(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("gift_voucher_redemptions").delete().eq("id", String(formData.get("id") ?? ""));
  if (error) throw new Error(error.message);
  revalidatePath("/admin/vouchers");
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
