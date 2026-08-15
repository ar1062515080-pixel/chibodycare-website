import { saveTherapist } from "@/app/admin/actions";
import { EnterSubmitForm } from "@/components/admin/enter-submit-form";
import { SubmitButton } from "@/components/admin/submit-button";
import { TherapistServiceCapabilities } from "@/components/admin/therapist-service-capabilities";
import { getAdminLocale, tr } from "@/lib/admin-i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Therapist = {
  id: string;
  display_name: string;
  internal_name: string;
  active: boolean;
  public_display: boolean;
  therapist_services: Array<{ service_id: string }> | null;
  location_therapists: Array<{ location_id: string }> | null;
};

type ServiceRow = { id: string; name: string; category: string };
type LocationRow = { id: string; name: string };

const categoryLabels: Record<string, { en: string; zh: string }> = {
  relaxation: { en: "Relaxation", zh: "放松按摩" },
  "remedial-pregnancy": { en: "Remedial", zh: "理疗按摩" },
  "foot-care": { en: "Foot care", zh: "足疗" },
  "deep-recovery": { en: "Deep recovery", zh: "深度恢复" },
  aromatherapy: { en: "Aromatherapy", zh: "芳香疗法" },
  acupuncture: { en: "Acupuncture", zh: "针灸" },
  "additional-services": { en: "Additional services", zh: "其他项目" },
  "deluxe-customised": { en: "Deluxe customised", zh: "尊享定制" },
};

export default async function TherapistsPage() {
  const locale = await getAdminLocale();
  const supabase = await createSupabaseServerClient();
  const [{ data: locationRows }, { data: therapistRows }, { data: serviceRows }] =
    await Promise.all([
      supabase.from("locations").select("id,name").eq("active", true).order("name"),
      supabase
        .from("therapists")
        .select(
          "id,display_name,internal_name,active,public_display,therapist_services(service_id),location_therapists(location_id)",
        )
        .order("display_name"),
      supabase
        .from("services")
        .select("id,name,category")
        .eq("active", true)
        .order("category")
        .order("name"),
    ]);

  const locations = (locationRows ?? []) as LocationRow[];
  const therapists = (therapistRows ?? []) as Therapist[];
  const services = (serviceRows ?? []) as ServiceRow[];

  const form = (therapist?: Therapist) => {
    const assignedServices = new Set(
      therapist?.therapist_services?.map((row) => row.service_id) ?? [],
    );
    const assignedLocations = new Set(
      therapist?.location_therapists?.map((row) => row.location_id) ?? [],
    );

    return (
      <EnterSubmitForm
        action={saveTherapist}
        saveOnBlur={Boolean(therapist)}
        className="rounded-3xl border border-sand-200 bg-cream-50 p-5 shadow-sm"
      >
        <input type="hidden" name="id" value={therapist?.id || ""} />

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            {tr(locale, "Display name", "公开显示名称")}
            <input
              name="display_name"
              required
              defaultValue={therapist?.display_name}
              className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            {tr(locale, "Internal name", "内部名称")}
            <input
              name="internal_name"
              required
              defaultValue={therapist?.internal_name}
              className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2"
            />
          </label>
        </div>

        <fieldset className="mt-4 rounded-2xl border border-sand-200 bg-sand-50/55 p-4">
          <legend className="px-1 text-sm font-medium text-brown-900">
            {tr(locale, "Works at", "工作门店")}
          </legend>
          <p className="mb-3 text-xs text-brown-700/60">
            {tr(
              locale,
              "Select every store where this employee can be rostered.",
              "勾选这位员工可以排班的所有门店。",
            )}
          </p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {locations.map((location, index) => (
              <label
                key={location.id}
                className="flex items-center gap-3 rounded-xl border border-sand-200 bg-cream-50 px-3 py-2.5 text-sm text-brown-800 transition hover:border-sage-300"
              >
                <input
                  type="checkbox"
                  name="location_ids"
                  value={location.id}
                  defaultChecked={
                    assignedLocations.has(location.id) || (!therapist && index === 0)
                  }
                  className="size-4 accent-sage-700"
                />
                <span>{location.name}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-3 flex flex-wrap gap-5">
          <label className="flex gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={therapist?.active ?? true} />
            {tr(locale, "Active", "启用")}
          </label>
          <label className="flex gap-2 text-sm">
            <input
              type="checkbox"
              name="public_display"
              defaultChecked={therapist?.public_display ?? true}
            />
            {tr(locale, "Show name publicly", "向顾客显示姓名")}
          </label>
        </div>

        <TherapistServiceCapabilities
          locale={locale}
          services={services}
          assignedServiceIds={[...assignedServices]}
          categoryLabels={categoryLabels}
        />

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <SubmitButton
            pendingLabel={tr(locale, "Saving…", "正在保存…")}
            className="rounded-full bg-sage-700 px-5 py-2.5 text-sm font-medium text-cream-50"
          >
            {therapist
              ? tr(locale, "Save employee", "保存员工")
              : tr(locale, "Add employee", "添加员工")}
          </SubmitButton>
          <span className="text-xs text-brown-700/60">
            {tr(locale, "Press Enter in a name field to save", "在名称输入框按回车即可保存")}
          </span>
        </div>
      </EnterSubmitForm>
    );
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-gold-dark">
        {tr(locale, "Therapists", "治疗师")}
      </p>
      <h1 className="mt-2 font-serif text-4xl text-brown-900">
        {tr(locale, "Team directory", "员工名册")}
      </h1>
      <p className="mt-2 text-brown-700/70">
        {tr(
          locale,
          "Create each employee once, then select every store where they work.",
          "每位员工只需创建一次，然后勾选她工作的所有门店。",
        )}
      </p>

      {locations.length ? (
        <>
          <div className="mt-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-gold-dark">
                {tr(locale, "All locations", "全部门店")}
              </p>
              <h2 className="mt-1 font-serif text-2xl text-brown-900">
                {tr(locale, "Employees", "员工")}
              </h2>
            </div>
            <span className="text-sm text-brown-700/60">
              {therapists.length} {tr(locale, "employees", "位员工")}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {form()}
            {therapists.map((therapist) => (
              <div key={therapist.id}>{form(therapist)}</div>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-8 rounded-2xl border border-sand-200 bg-cream-50 p-5">
          {tr(locale, "Add an active store before managing employees.", "请先添加并启用门店，再管理员工。")}
        </p>
      )}
    </div>
  );
}
