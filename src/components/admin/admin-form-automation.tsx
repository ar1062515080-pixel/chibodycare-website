"use client";

import { useEffect } from "react";

export function AdminFormAutomation() {
  useEffect(() => {
    const onChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLSelectElement || target instanceof HTMLInputElement)) return;
      const form = target.form;
      if (!form || form.dataset.autoFilter === "true" || form.method.toLowerCase() !== "get" || form.hasAttribute("action")) return;
      if (target instanceof HTMLSelectElement || ["date", "month"].includes(target.type)) form.requestSubmit();
    };
    document.addEventListener("change", onChange);
    return () => document.removeEventListener("change", onChange);
  }, []);

  return null;
}
