"use client";

import { useRouter } from "next/navigation";
import type { AdminLocale } from "@/lib/admin-i18n";

export function LanguageSwitcher({ locale, dark = false }: { locale: AdminLocale; dark?: boolean }) {
  const router = useRouter();
  const setLocale = (value: AdminLocale) => {
    document.cookie = `admin_locale=${value}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <div className={`inline-flex rounded-full border p-1 text-xs ${dark ? "border-cream-100/20 bg-white/5" : "border-sand-200 bg-white"}`} aria-label="Language / 语言">
      <button type="button" onClick={() => setLocale("zh")} aria-pressed={locale === "zh"} className={`rounded-full px-3 py-1.5 ${locale === "zh" ? "bg-gold-dark text-white" : "opacity-65"}`}>中文</button>
      <button type="button" onClick={() => setLocale("en")} aria-pressed={locale === "en"} className={`rounded-full px-3 py-1.5 ${locale === "en" ? "bg-gold-dark text-white" : "opacity-65"}`}>English</button>
    </div>
  );
}
