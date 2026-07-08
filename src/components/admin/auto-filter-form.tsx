"use client";

import { useRef } from "react";
import type { FormHTMLAttributes, ReactNode } from "react";

export function AutoFilterForm({ children, ...props }: FormHTMLAttributes<HTMLFormElement> & { children: ReactNode }) {
  const initialValue = useRef("");
  return (
    <form
      {...props}
      data-auto-filter="true"
      onFocusCapture={(event) => {
        if (event.target instanceof HTMLInputElement) initialValue.current = event.target.value;
      }}
      onBlur={(event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement) || target.value === initialValue.current) return;
        if (["date", "month", "checkbox", "radio", "submit", "button"].includes(target.type)) return;
        if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
        event.currentTarget.requestSubmit();
      }}
      onChange={(event) => {
        const target = event.target;
        if (target instanceof HTMLSelectElement || (target instanceof HTMLInputElement && ["date", "month"].includes(target.type))) {
          event.currentTarget.requestSubmit();
        }
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" || event.shiftKey) return;
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        event.preventDefault();
        event.currentTarget.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}
