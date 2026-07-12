import { createSupabaseServerClient } from "@/lib/supabase/server";
import { removeRoster, saveRoster } from "@/app/admin/actions";
import { getAdminLocale, tr } from "@/lib/admin-i18n";
import { SubmitButton } from "@/components/admin/submit-button";
import { AutoFilterForm } from "@/components/admin/auto-filter-form";

export default async function RosterPage({ searchParams }: { searchParams: Promise<{ date?: string; location?: string }> }) {
  const params = await searchParams;
  const locale = await getAdminLocale();
  const supabase = await createSupabaseServerClient();
  const date = params.date || new Date().toISOString().slice(0, 10);
  const { data: locationRows } = await supabase.from("locations").select("id,name").eq("active", true).order("name");
  const locations = locationRows ?? [];
  const locationId = params.location || locations[0]?.id || "";
  const [{ data: therapistRows }, { data: rosterRows }] = await Promise.all([
    supabase.from("therapists").select("id,display_name,internal_name").eq("active", true).order("display_name"),
    supabase.from("daily_rosters").select("id,date,start_time,end_time,active,therapists(display_name)").eq("date", date).eq("location_id", locationId).order("start_time"),
  ]);
  const therapists = therapistRows ?? [];
  const rosters = rosterRows ?? [];

  return <div>
    <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">{tr(locale, "Daily roster", "每日排班")}</p>
    <h1 className="mt-2 font-serif text-4xl text-brown-900">{tr(locale, "Who is working?", "当天谁上班？")}</h1>
    <AutoFilterForm className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-sand-200 bg-cream-50 p-4">
      <input type="date" name="date" defaultValue={date} className="rounded-xl border border-sand-200 px-3 py-2" />
      <select name="location" defaultValue={locationId} className="min-w-60 rounded-xl border border-sand-200 px-3 py-2">{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>
      <SubmitButton pendingLabel={tr(locale, "Loading…", "正在加载…")} className="rounded-full bg-brown-900 px-5 py-2 text-sm text-cream-50">{tr(locale, "View roster", "查看排班")}</SubmitButton>
    </AutoFilterForm>
    <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_22rem]">
      <div className="space-y-3">
        {rosters.length ? rosters.map((roster) => {
          return <div key={roster.id} className="rounded-2xl border border-sand-200 bg-cream-50 p-5"><div className="flex items-start justify-between gap-4"><div>
            <h2 className="font-serif text-xl">{(roster.therapists as { display_name?: string } | null)?.display_name || tr(locale, "Therapist", "治疗师")}</h2>
            <p className="text-sm text-brown-700/70">{String(roster.start_time).slice(0,5)}–{String(roster.end_time).slice(0,5)} · {roster.active ? tr(locale, "Active", "启用") : tr(locale, "Inactive", "停用")}</p>
          </div><form action={removeRoster}><input type="hidden" name="id" value={roster.id} /><SubmitButton pendingLabel={tr(locale, "Removing…", "正在移除…")} className="text-sm text-red-700">{tr(locale, "Remove", "移除")}</SubmitButton></form></div></div>;
        }) : <p className="rounded-2xl border border-dashed border-sand-200 p-8 text-center text-brown-700/60">{tr(locale, "No therapists rostered for this location and date.", "该门店在所选日期尚未安排治疗师。")}</p>}
      </div>
      <form action={saveRoster} className="h-fit rounded-3xl border border-sand-200 bg-cream-50 p-5 shadow-sm">
        <h2 className="font-serif text-2xl">{tr(locale, "Add shift", "添加班次")}</h2>
        <input type="hidden" name="date" value={date} /><input type="hidden" name="location_id" value={locationId} />
        <label className="mt-4 block text-sm">{tr(locale, "Therapist", "治疗师")}<select name="therapist_id" required className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2">{therapists.map((therapist) => <option key={therapist.id} value={therapist.id}>{therapist.display_name}</option>)}</select></label>
        <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-sm">{tr(locale, "Start", "开始时间")}<input name="start_time" type="time" defaultValue="09:00" required className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2" /></label><label className="text-sm">{tr(locale, "End", "结束时间")}<input name="end_time" type="time" defaultValue="17:30" required className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2" /></label></div>
        <label className="mt-4 flex gap-2 text-sm"><input type="checkbox" name="active" defaultChecked />{tr(locale, "Active that day", "当天启用")}</label>
        <SubmitButton pendingLabel={tr(locale, "Saving…", "正在保存…")} className="mt-5 w-full rounded-full bg-sage-700 px-4 py-3 text-sm font-medium text-cream-50">{tr(locale, "Add to roster", "加入排班")}</SubmitButton>
      </form>
    </div>
  </div>;
}
