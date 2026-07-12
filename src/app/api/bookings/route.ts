import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import type { CreateBookingInput } from "@/lib/booking-api";

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return Response.json({ error: "Booking is not configured yet." }, { status: 503 });
  }

  let body: CreateBookingInput;
  try {
    body = (await request.json()) as CreateBookingInput;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    !body.customerName?.trim() ||
    !body.customerPhone?.trim() ||
    (body.customerEmail?.trim()
      ? !validEmail(body.customerEmail.trim())
      : false) ||
    !body.locationId ||
    !body.serviceId ||
    !body.startAt
  ) {
    return Response.json({ error: "Booking details are incomplete." }, { status: 400 });
  }

  const startAt = new Date(body.startAt);
  if (Number.isNaN(startAt.getTime()) || startAt.getTime() <= Date.now()) {
    return Response.json({ error: "Please choose a future appointment." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const [locationResult, serviceResult] = await Promise.all([
    supabase.from("locations").select("id").eq("slug", body.locationId).eq("active", true).single(),
    supabase.from("services").select("id").eq("slug", body.serviceId).eq("active", true).single(),
  ]);
  if (!locationResult.data || !serviceResult.data) {
    return Response.json({ error: "Location or service is unavailable." }, { status: 404 });
  }
  const { data, error } = await supabase.rpc("create_booking", {
    p_customer_name: body.customerName.trim(),
    p_customer_phone: body.customerPhone.trim(),
    p_customer_email: body.customerEmail?.trim().toLowerCase() || "",
    p_notes: body.notes?.trim() || "",
    p_location_id: locationResult.data.id,
    p_service_id: serviceResult.data.id,
    p_therapist_id: body.therapistId || null,
    p_start_at: startAt.toISOString(),
  });

  if (error) {
    const unavailable = /SLOT_UNAVAILABLE|NO_ROSTER|SERVICE_NOT_AVAILABLE/.test(
      error.message,
    );
    return Response.json(
      {
        error: unavailable
          ? "That time is no longer available. Please choose another time."
          : error.message,
      },
      { status: unavailable ? 409 : 400 },
    );
  }

  return Response.json(data, { status: 201 });
}
