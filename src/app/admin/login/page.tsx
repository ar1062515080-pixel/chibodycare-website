import { signIn } from "@/app/admin/actions";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/admin/language-switcher";
import { SubmitButton } from "@/components/admin/submit-button";
import { getAdminLocale, tr } from "@/lib/admin-i18n";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string; confirmed?: string }> }) {
  const { error, confirmed } = await searchParams;
  const locale = await getAdminLocale();
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-sand-50/50 px-5 py-16">
      <div className="w-full max-w-md rounded-3xl border border-sand-200 bg-cream-50 p-8 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">Chi Body Care</p>
        <div className="mt-3"><LanguageSwitcher locale={locale} /></div>
        <h1 className="mt-4 font-serif text-3xl text-brown-900">{tr(locale, "Admin sign in", "管理员登录")}</h1>
        <p className="mt-2 text-sm text-brown-700/70">{tr(locale, "Use your approved administrator account.", "请使用已获授权的管理员账号登录。")}</p>
        {!hasSupabaseEnv() ? <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Supabase environment variables are not configured.</p> : null}
        {error ? <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{decodeURIComponent(error)}</p> : null}
        {confirmed ? <p className="mt-5 rounded-xl bg-sage-50 p-3 text-sm text-sage-800">{tr(locale, "Email confirmed. You can now sign in. Dashboard access still requires administrator approval.", "邮箱已验证，现在可以登录。进入后台仍需管理员授权。")}</p> : null}
        <form action={signIn} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-brown-800">{tr(locale, "Email", "邮箱")}<input name="email" type="email" required className="mt-1.5 w-full rounded-xl border border-sand-200 bg-white px-4 py-3" /></label>
          <label className="block text-sm font-medium text-brown-800">{tr(locale, "Password", "密码")}<input name="password" type="password" required className="mt-1.5 w-full rounded-xl border border-sand-200 bg-white px-4 py-3" /></label>
          <SubmitButton disabled={!hasSupabaseEnv()} pendingLabel={tr(locale, "Signing in…", "正在登录…")} className="w-full rounded-full bg-sage-700 px-5 py-3 font-medium text-cream-50 disabled:opacity-40">{tr(locale, "Sign in", "登录")}</SubmitButton>
        </form>
        <p className="mt-6 text-center text-sm text-brown-700/70">
          {tr(locale, "Need an account?", "还没有账号？")}{" "}
          <Link href="/admin/register" className="font-medium text-sage-700 underline-offset-4 hover:underline">
            {tr(locale, "Register", "注册")}
          </Link>
        </p>
      </div>
    </div>
  );
}
