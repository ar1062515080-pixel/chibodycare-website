"use client";

import type { FormHTMLAttributes, ReactNode } from "react";

type Props = Omit<FormHTMLAttributes<HTMLFormElement>, "action"> & {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
};

export function EnterSubmitForm({ action, children, onKeyDown, ...props }: Props) {
  return (
    <form
      {...props}
      action={action}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || event.key !== "Enter" || event.shiftKey) return;
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        if (["checkbox", "radio", "button", "submit"].includes(target.type)) return;
        event.preventDefault();
        event.currentTarget.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}
