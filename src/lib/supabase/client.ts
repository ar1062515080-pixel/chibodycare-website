"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/config";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (!client) {
    const { url, anonKey } = getSupabaseEnv();
    client = createBrowserClient(url, anonKey);
  }
  return client;
}

