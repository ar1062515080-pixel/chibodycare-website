import Link from "next/link";
import { registerAdmin, resendAdminConfirmation } from "@/app/admin/actions";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { LanguageSwitcher } from "@/components/admin/language-switcher";
import { getAdminLocale, tr } from "@/lib/admin-i18n";

export default async function AdminRegister({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string; resent?: string }>;
}) {
  const { error, registered, resent } = await searchParams;
  const locale = await getAdminLocale();

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-sand-50/50 px-5 py-16">
      <div className="w-full max-w-md rounded-3xl border border-sand-200 bg-cream-50 p-8 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">Chi Body Care</p>
        <div className="mt-3"><LanguageSwitcher locale={locale} /></div>
        <h1 className="mt-4 font-serif text-3xl text-brown-900">{tr(locale, "Register admin account", "注册管理员账号")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-brown-700/70">
          {tr(locale, "Create your login details. A current administrator must approve your account before you can access the dashboard.", "创建登录账号后，需要由现有管理员授权，才能进入管理后台。")}
        </p>

        {!hasSupabaseEnv() ? (
          <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
            Supabase environment variables are not configured.
          </p>
        ) : null}
        {error ? (
          <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {decodeURIComponent(error)}
          </p>
        ) : null}
        {registered ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl bg-sage-50 p-4 text-sm leading-relaxed text-sage-800">
              {resent
                ? tr(locale, "A new confirmation email has been sent. Use only the newest link.", "新的确认邮件已发送，请只使用最新邮件中的链接。")
                : tr(locale, "Registration received. Confirm your email using the newest message, then return to sign in. An administrator must still approve dashboard access.", "注册申请已收到。请使用最新邮件验证邮箱，然后返回登录。后台访问仍需管理员授权。")}
            </div>
            <form action={resendAdminConfirmation} className="space-y-3">
              <label className="block text-sm font-medium text-brown-800">
                {tr(locale, "Didn't receive a working link?", "没有收到有效链接？")}
                <input name="email" type="email" autoComplete="email" placeholder={tr(locale, "Your registered email", "已注册的邮箱")} required className="mt-1.5 w-full rounded-xl border border-sand-200 bg-white px-4 py-3" />
              </label>
              <button className="w-full rounded-full border border-sage-700 px-5 py-3 font-medium text-sage-800">
                {tr(locale, "Resend confirmation email", "重新发送确认邮件")}
              </button>
            </form>
          </div>
        ) : (
          <form action={registerAdmin} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-brown-800">
              {tr(locale, "Email", "邮箱")}
              <input name="email" type="email" autoComplete="email" required className="mt-1.5 w-full rounded-xl border border-sand-200 bg-white px-4 py-3" />
            </label>
            <label className="block text-sm font-medium text-brown-800">
              {tr(locale, "Password", "密码")}
              <input name="password" type="password" autoComplete="new-password" minLength={8} required className="mt-1.5 w-full rounded-xl border border-sand-200 bg-white px-4 py-3" />
            </label>
            <label className="block text-sm font-medium text-brown-800">
              {tr(locale, "Confirm password", "确认密码")}
              <input name="confirm_password" type="password" autoComplete="new-password" minLength={8} required className="mt-1.5 w-full rounded-xl border border-sand-200 bg-white px-4 py-3" />
            </label>
            <button disabled={!hasSupabaseEnv()} className="w-full rounded-full bg-sage-700 px-5 py-3 font-medium text-cream-50 disabled:opacity-40">
              {tr(locale, "Register account", "注册账号")}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-brown-700/70">
          {tr(locale, "Already registered?", "已经注册？")}{" "}
          <Link href="/admin/login" className="font-medium text-sage-700 underline-offset-4 hover:underline">
            {tr(locale, "Sign in", "登录")}
          </Link>
        </p>
      </div>
    </div>
  );
}
