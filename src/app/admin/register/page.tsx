import Link from "next/link";
import { registerAdmin, resendAdminConfirmation } from "@/app/admin/actions";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export default async function AdminRegister({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string; resent?: string }>;
}) {
  const { error, registered, resent } = await searchParams;

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-sand-50/50 px-5 py-16">
      <div className="w-full max-w-md rounded-3xl border border-sand-200 bg-cream-50 p-8 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">Chi Body Care</p>
        <h1 className="mt-2 font-serif text-3xl text-brown-900">Register admin account</h1>
        <p className="mt-2 text-sm leading-relaxed text-brown-700/70">
          Create your login details. A current administrator must approve your account before you can access the dashboard.
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
                ? "A new confirmation email has been sent. Use only the newest link."
                : "Registration received. Confirm your email using the newest message, then return to sign in. An administrator must still approve dashboard access."}
            </div>
            <form action={resendAdminConfirmation} className="space-y-3">
              <label className="block text-sm font-medium text-brown-800">
                Didn&apos;t receive a working link?
                <input name="email" type="email" autoComplete="email" placeholder="Your registered email" required className="mt-1.5 w-full rounded-xl border border-sand-200 bg-white px-4 py-3" />
              </label>
              <button className="w-full rounded-full border border-sage-700 px-5 py-3 font-medium text-sage-800">
                Resend confirmation email
              </button>
            </form>
          </div>
        ) : (
          <form action={registerAdmin} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-brown-800">
              Email
              <input name="email" type="email" autoComplete="email" required className="mt-1.5 w-full rounded-xl border border-sand-200 bg-white px-4 py-3" />
            </label>
            <label className="block text-sm font-medium text-brown-800">
              Password
              <input name="password" type="password" autoComplete="new-password" minLength={8} required className="mt-1.5 w-full rounded-xl border border-sand-200 bg-white px-4 py-3" />
            </label>
            <label className="block text-sm font-medium text-brown-800">
              Confirm password
              <input name="confirm_password" type="password" autoComplete="new-password" minLength={8} required className="mt-1.5 w-full rounded-xl border border-sand-200 bg-white px-4 py-3" />
            </label>
            <button disabled={!hasSupabaseEnv()} className="w-full rounded-full bg-sage-700 px-5 py-3 font-medium text-cream-50 disabled:opacity-40">
              Register account
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-brown-700/70">
          Already registered?{" "}
          <Link href="/admin/login" className="font-medium text-sage-700 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
