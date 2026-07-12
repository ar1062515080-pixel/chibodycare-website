"use client";

import { useMemo, useState } from "react";

type Locale = "en" | "zh";

type ServiceOption = {
  id: string;
  name: string;
  category: string;
};

type CategoryOption = {
  id: string;
  label: string;
  services: ServiceOption[];
};

type Props = {
  locale: Locale;
  services: ServiceOption[];
  assignedServiceIds: string[];
  categoryLabels: Record<string, { en: string; zh: string }>;
};

export function TherapistServiceCapabilities({
  locale,
  services,
  assignedServiceIds,
  categoryLabels,
}: Props) {
  const grouped = useMemo<CategoryOption[]>(() => {
    const byCategory = new Map<string, ServiceOption[]>();
    for (const service of services) {
      const list = byCategory.get(service.category) ?? [];
      list.push(service);
      byCategory.set(service.category, list);
    }

    return [...byCategory.entries()].map(([id, items]) => ({
      id,
      label: categoryLabels[id]?.[locale] ?? id,
      services: items,
    }));
  }, [categoryLabels, locale, services]);

  const [selected, setSelected] = useState(() => new Set(assignedServiceIds));
  const [open, setOpen] = useState(() => new Set<string>());

  const selectedCount = selected.size;

  function toggleCategory(category: CategoryOption, checked: boolean) {
    const next = new Set(selected);
    for (const service of category.services) {
      if (checked) next.add(service.id);
      else next.delete(service.id);
    }
    setSelected(next);
  }

  function toggleService(serviceId: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(serviceId);
    else next.delete(serviceId);
    setSelected(next);
  }

  function toggleOpen(categoryId: string) {
    const next = new Set(open);
    if (next.has(categoryId)) next.delete(categoryId);
    else next.add(categoryId);
    setOpen(next);
  }

  return (
    <details className="mt-4" open>
      <summary className="cursor-pointer text-sm font-medium text-sage-700">
        {locale === "zh"
          ? `默认服务能力（${selectedCount}）`
          : `Default service capabilities (${selectedCount})`}
      </summary>

      <div className="mt-3 grid gap-3 rounded-2xl border border-sand-200 p-3 lg:grid-cols-2">
        {grouped.map((category) => {
          const serviceIds = category.services.map((service) => service.id);
          const checkedCount = serviceIds.filter((id) => selected.has(id)).length;
          const allChecked = checkedCount === serviceIds.length && serviceIds.length > 0;
          const partlyChecked = checkedCount > 0 && !allChecked;
          const expanded = open.has(category.id);

          return (
            <div key={category.id} className="rounded-2xl bg-sand-50/80 p-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="service_categories"
                  value={category.id}
                  checked={allChecked}
                  ref={(node) => {
                    if (node) node.indeterminate = partlyChecked;
                  }}
                  onChange={(event) => toggleCategory(category, event.target.checked)}
                  className="size-4 shrink-0"
                />
                <button
                  type="button"
                  onClick={() => toggleOpen(category.id)}
                  className="flex flex-1 items-center justify-between gap-3 text-left text-sm font-medium text-brown-900"
                >
                  <span>{category.label}</span>
                  <span className="text-xs text-brown-700/55">
                    {checkedCount}/{serviceIds.length} {expanded ? "⌃" : "⌄"}
                  </span>
                </button>
              </div>

              {expanded ? (
                <div className="mt-3 grid gap-2 border-t border-sand-200 pt-3 sm:grid-cols-2">
                  {category.services.map((service) => (
                    <label
                      key={service.id}
                      className="flex items-start gap-2 rounded-xl bg-cream-50 px-3 py-2 text-xs text-brown-800"
                    >
                      <input
                        type="checkbox"
                        name="service_ids"
                        value={service.id}
                        checked={selected.has(service.id)}
                        onChange={(event) => toggleService(service.id, event.target.checked)}
                        className="mt-0.5 size-4 shrink-0"
                      />
                      <span>{service.name}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </details>
  );
}
