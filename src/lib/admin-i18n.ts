import { cookies } from "next/headers";

export type AdminLocale = "en" | "zh";

export async function getAdminLocale(): Promise<AdminLocale> {
  return (await cookies()).get("admin_locale")?.value === "zh" ? "zh" : "en";
}

export function tr(locale: AdminLocale, english: string, chinese: string) {
  return locale === "zh" ? chinese : english;
}

export const statusLabels = {
  pending: { en: "Pending", zh: "待确认" },
  confirmed: { en: "Confirmed", zh: "已确认" },
  cancelled: { en: "Cancelled", zh: "已取消" },
  completed: { en: "Completed", zh: "已完成" },
  no_show: { en: "No-show", zh: "未到店" },
} as const;

export const dayLabels: Record<string, { en: string; zh: string }> = {
  Monday: { en: "Monday", zh: "星期一" },
  Tuesday: { en: "Tuesday", zh: "星期二" },
  Wednesday: { en: "Wednesday", zh: "星期三" },
  Thursday: { en: "Thursday", zh: "星期四" },
  Friday: { en: "Friday", zh: "星期五" },
  Saturday: { en: "Saturday", zh: "星期六" },
  Sunday: { en: "Sunday", zh: "星期日" },
};
