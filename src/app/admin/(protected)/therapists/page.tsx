import { saveTherapist } from "@/app/admin/actions";
import { EnterSubmitForm } from "@/components/admin/enter-submit-form";
import { LocationFilter } from "@/components/admin/location-filter";
import { SubmitButton } from "@/components/admin/submit-button";
import { getAdminLocale, tr } from "@/lib/admin-i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Therapist = {
  id: string;
  display_name: string;
  internal_name: string;
  active: boolean;
  public_display: boolean;
  therapist_services: Array<{ service_id: string }> | null;
};

function relationOne<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function TherapistsPage({ searchParams }: { searchParams: Promise<{ location?: string }> }) {
  const locale = await getAdminLocale();
  const supabase = await createSupabaseServerClient();
  const { data: locationRows } = await supabase.from("locations").select("id,name").eq("active", true).order("name");
  const locations = locationRows ?? [];
  const requestedLocation = (await searchParams).location;
  const locationId = locations.some((location) => location.id === requestedLocation) ? requestedLocation! : locations[0]?.id ?? "";

  const [{ data: linkRows }, { data: serviceRows }] = await Promise.all([
    locationId
      ? supabase.from("location_therapists").select("therapists(id,display_name,internal_name,active,public_display,therapist_services(service_id))").eq("location_id", locationId)
      : Promise.resolve({ data: [] }),
    supabase.from("services").select("id,name,category").eq("active", true).order("category").order("name"),
  ]);
  const therapists = (linkRows ?? [])
    .map((row) => relationOne((row as { therapists: Therapist | Therapist[] | null }).therapists))
    .filter((therapist): therapist is Therapist => Boolean(therapist))
    .sort((a, b) => a.display_name.localeCompare(b.display_name));
  const services = serviceRows ?? [];
  const selectedLocation = locations.find((location) => location.id === locationId);

  const form = (therapist?: Therapist) => {
    const assigned = new Set(therapist?.therapist_services?.map((row) => row.service_id) ?? []);
    return (
      <EnterSubmitForm action={saveTherapist} saveOnBlur={Boolean(therapist)} className="rounded-3xl border border-sand-200 bg-cream-50 p-5 shadow-sm">
        <input type="hidden" name="id" value={therapist?.id || ""} />
        <input type="hidden" name="location_id" value={locationId} />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">{tr(locale, "Display name", "公开显示名称")}<input name="display_name" required defaultValue={therapist?.display_name} className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2" /></label>
          <label className="text-sm">{tr(locale, "Internal name", "内部名称")}<input name="internal_name" required defaultValue={therapist?.internal_name} className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2" /></label>
        </div>
        <div className="mt-3 flex flex-wrap gap-5">
          <label className="flex gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={therapist?.active ?? true} />{tr(locale, "Active", "启用")}</label>
          <label className="flex gap-2 text-sm"><input type="checkbox" name="public_display" defaultChecked={therapist?.public_display ?? false} />{tr(locale, "Show name publicly", "向顾客显示姓名")}</label>
        </div>
        <details className="mt-4"><summary className="cursor-pointer text-sm font-medium text-sage-700">{tr(locale, `Default service capabilities (${assigned.size})`, `默认服务能力（${assigned.size}）`)}</summary><div className="mt-3 grid max-h-64 gap-1 overflow-y-auto rounded-xl border border-sand-200 p-3 sm:grid-cols-2">{services.map((service) => <label key={service.id} className="flex gap-2 py-1 text-xs"><input type="checkbox" name="service_ids" value={service.id} defaultChecked={assigned.has(service.id)} />{service.name}</label>)}</div></details>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <SubmitButton pendingLabel={tr(locale, "Saving…", "正在保存…")} className="rounded-full bg-sage-700 px-5 py-2.5 text-sm font-medium text-cream-50">{therapist ? tr(locale, "Save therapist", "保存治疗师") : tr(locale, "Add therapist", "添加治疗师")}</SubmitButton>
          <span className="text-xs text-brown-700/60">{tr(locale, "Press Enter in a name field to save", "在名称输入框按回车即可保存")}</span>
        </div>
      </EnterSubmitForm>
    );
  };

  return <div>
    <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">{tr(locale, "Therapists", "治疗师")}</p>
    <h1 className="mt-2 font-serif text-4xl text-brown-900">{tr(locale, "Store team directory", "门店治疗师管理")}</h1>
    <p className="mt-2 text-brown-700/70">{tr(locale, "Choose a store, then manage only that store’s therapist team.", "先选择门店，再管理该门店自己的治疗师。")}</p>
    {locations.length ? <>
      <div className="mt-7 border-y border-sand-200 bg-champagne-100/35 px-4 py-4 sm:rounded-2xl sm:border"><LocationFilter locations={locations} value={locationId} label={tr(locale, "Select store", "选择门店")} /></div>
      <div className="mt-7 flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.16em] text-gold-dark">{selectedLocation?.name}</p><h2 className="mt-1 font-serif text-2xl text-brown-900">{tr(locale, "Therapist team", "治疗师名单")}</h2></div><span className="text-sm text-brown-700/60">{therapists.length} {tr(locale, "therapists", "位治疗师")}</span></div>
      <div className="mt-4 space-y-4">{form()}{therapists.map((therapist) => <div key={therapist.id}>{form(therapist)}</div>)}</div>
    </> : <p className="mt-8 rounded-2xl border border-sand-200 bg-cream-50 p-5">{tr(locale, "Add an active store before managing therapists.", "请先添加并启用门店，再管理治疗师。")}</p>}
  </div>;
}
