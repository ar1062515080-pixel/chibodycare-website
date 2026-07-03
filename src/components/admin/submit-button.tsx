"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  pendingLabel: string;
};

export function SubmitButton({ children, pendingLabel, className = "", disabled, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <button {...props} disabled={disabled || pending} aria-busy={pending} className={`${className} inline-flex items-center justify-center gap-2 transition disabled:cursor-wait disabled:opacity-60`}>
      {pending ? <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" /> : null}
      <span>{pending ? pendingLabel : children}</span>
    </button>
  );
}
