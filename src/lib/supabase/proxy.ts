import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/config";

export async function updateSupabaseSession(request: NextRequest) {
  if (!hasSupabaseEnv()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const path = request.nextUrl.pathname;
  const publicAdminPaths = ["/admin/login", "/admin/register"];
  let data: Awaited<ReturnType<typeof supabase.auth.getClaims>>["data"] | null = null;
  try {
    ({ data } = await supabase.auth.getClaims());
  } catch (error) {
    console.error("Unable to reach the authentication service", error);
    if (!publicAdminPaths.includes(path)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "service-unavailable");
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (!data?.claims && path.startsWith("/admin") && !publicAdminPaths.includes(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  return response;
}
