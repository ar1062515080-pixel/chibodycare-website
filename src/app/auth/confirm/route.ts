import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const requestedNext = request.nextUrl.searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/admin/login";

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/admin/login?error=Invalid%20confirmation%20link", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    return NextResponse.redirect(
      new URL("/admin/login?error=This%20confirmation%20link%20is%20invalid%20or%20has%20expired.%20Please%20request%20a%20new%20email.", request.url),
    );
  }

  const destination = new URL(next, request.url);
  destination.searchParams.set("confirmed", "true");
  return NextResponse.redirect(destination);
}
