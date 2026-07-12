"use client";

import { useRef } from "react";
import type { FormHTMLAttributes, ReactNode } from "react";

type Props = Omit<FormHTMLAttributes<HTMLFormElement>, "action"> & {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  saveOnBlur?: boolean;
};

export function EnterSubmitForm({ action, children, saveOnBlur = false, onKeyDown, onBlur, onChange, ...props }: Props) {
  const initialValue = useRef("");

  const submitIfValid = (form: HTMLFormElement) => {
    if (form.checkValidity()) form.requestSubmit();
  };

  return (
    <form
      {...props}
      action={action}
      onFocusCapture={(event) => {
        const target = event.target;
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) initialValue.current = target.value;
      }}
      onBlur={(event) => {
        onBlur?.(event);
        if (!saveOnBlur || event.defaultPrevented) return;
        const target = event.target;
        if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
        if (["hidden", "button", "submit", "checkbox", "radio"].includes(target.type)) return;
        if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
        if (target.value !== initialValue.current) submitIfValid(event.currentTarget);
      }}
      onChange={(event) => {
        onChange?.(event);
        if (!saveOnBlur || event.defaultPrevented) return;
        const target = event.target;
        if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
        if (target instanceof HTMLSelectElement || ["date", "time", "checkbox", "radio"].includes(target.type)) submitIfValid(event.currentTarget);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Enter" || event.shiftKey) return;
        const target = event.target;
        if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
        if (["checkbox", "radio", "button", "submit"].includes(target.type)) return;
        if (target instanceof HTMLTextAreaElement && !event.ctrlKey && !event.metaKey) return;
        event.preventDefault();
        submitIfValid(event.currentTarget);
      }}
    >
      {children}
    </form>
  );
}
