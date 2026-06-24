import { signIn } from "@/app/admin/actions";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-sand-50/50 px-5 py-16">
      <div className="w-full max-w-md rounded-3xl border border-sand-200 bg-cream-50 p-8 shadow-lg">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">Chi Body Care</p>
        <h1 className="mt-2 font-serif text-3xl text-brown-900">Admin sign in</h1>
        <p className="mt-2 text-sm text-brown-700/70">Use the admin account created in Supabase Auth.</p>
        {!hasSupabaseEnv() ? <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Supabase environment variables are not configured.</p> : null}
        {error ? <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{decodeURIComponent(error)}</p> : null}
        <form action={signIn} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-brown-800">Email<input name="email" type="email" required className="mt-1.5 w-full rounded-xl border border-sand-200 bg-white px-4 py-3" /></label>
          <label className="block text-sm font-medium text-brown-800">Password<input name="password" type="password" required className="mt-1.5 w-full rounded-xl border border-sand-200 bg-white px-4 py-3" /></label>
          <button disabled={!hasSupabaseEnv()} className="w-full rounded-full bg-sage-700 px-5 py-3 font-medium text-cream-50 disabled:opacity-40">Sign in</button>
        </form>
      </div>
    </div>
  );
}
