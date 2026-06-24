import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveTherapist } from "@/app/admin/actions";

export default async function TherapistsPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: therapistRows }, { data: serviceRows }] = await Promise.all([
    supabase.from("therapists").select("id,display_name,internal_name,active,public_display,therapist_services(service_id)").order("display_name"),
    supabase.from("services").select("id,name,category").eq("active", true).order("category").order("name"),
  ]);
  const therapists = therapistRows ?? [];
  const services = serviceRows ?? [];
  const form = (therapist?: (typeof therapists)[number]) => {
    const assigned = new Set((therapist?.therapist_services as Array<{ service_id: string }> | null)?.map((row) => row.service_id) ?? []);
    return <form action={saveTherapist} className="rounded-3xl border border-sand-200 bg-cream-50 p-5 shadow-sm"><input type="hidden" name="id" value={therapist?.id || ""} /><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">Display name<input name="display_name" required defaultValue={therapist?.display_name} className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2" /></label><label className="text-sm">Internal name<input name="internal_name" required defaultValue={therapist?.internal_name} className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2" /></label></div><div className="mt-3 flex flex-wrap gap-5"><label className="flex gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={therapist?.active ?? true} />Active</label><label className="flex gap-2 text-sm"><input type="checkbox" name="public_display" defaultChecked={therapist?.public_display ?? false} />Show name publicly</label></div><details className="mt-4"><summary className="cursor-pointer text-sm font-medium text-sage-700">Default service capabilities ({assigned.size})</summary><div className="mt-3 grid max-h-64 gap-1 overflow-y-auto rounded-xl border border-sand-200 p-3 sm:grid-cols-2">{services.map((service) => <label key={service.id} className="flex gap-2 py-1 text-xs"><input type="checkbox" name="service_ids" value={service.id} defaultChecked={assigned.has(service.id)} />{service.name}</label>)}</div></details><button className="mt-5 rounded-full bg-sage-700 px-5 py-2.5 text-sm font-medium text-cream-50">{therapist ? "Save therapist" : "Add therapist"}</button></form>;
  };
  return <div><p className="text-xs uppercase tracking-[0.18em] text-gold-dark">Therapists</p><h1 className="mt-2 font-serif text-4xl text-brown-900">Team directory</h1><p className="mt-2 text-brown-700/70">Names and default capabilities live in Supabase, not staff.ts.</p><div className="mt-8 space-y-4">{form()}{therapists.map((therapist) => <div key={therapist.id}>{form(therapist)}</div>)}</div></div>;
}
