"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { locations } from "@/lib/business";

type FormState = {
  name: string;
  email: string;
  phone: string;
  location: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialState: FormState = {
  name: "",
  email: "",
  phone: "",
  location: "",
  message: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(state: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!state.name.trim()) errors.name = "Please enter your name.";
  if (!state.email.trim()) {
    errors.email = "Please enter your email.";
  } else if (!emailPattern.test(state.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }
  if (!state.message.trim()) {
    errors.message = "Please tell us how we can help.";
  } else if (state.message.trim().length < 10) {
    errors.message = "Your message is a little short.";
  }
  return errors;
}

const fieldClass =
  "w-full rounded-2xl border bg-cream-50 px-4 py-3 text-sm text-brown-900 outline-none transition-colors placeholder:text-brown-700/40 focus:border-sage-400 focus:ring-2 focus:ring-sage-200";

export function ContactForm() {
  const [state, setState] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(state);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-sage-200 bg-sage-50 p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sage-600 text-cream-50">
          <svg
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              d="M5 13l4 4L19 7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <h3 className="mt-4 font-serif text-2xl font-medium text-brown-900">
          Thank you, {state.name.split(" ")[0]}!
        </h3>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-brown-700/80">
          Your message has been received. This is a demo form, so nothing was
          sent — but our team would normally be in touch within one business
          day.
        </p>
        <button
          type="button"
          onClick={() => {
            setState(initialState);
            setSubmitted(false);
          }}
          className="mt-6 rounded-full border border-sage-400 px-5 py-2.5 text-sm font-medium text-sage-700 transition-colors hover:bg-sage-100"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-sm font-medium text-brown-800"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            value={state.name}
            onChange={(event) => update("name", event.target.value)}
            className={cn(
              fieldClass,
              errors.name ? "border-red-400" : "border-sand-200",
            )}
            placeholder="Your full name"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name ? (
            <p className="mt-1 text-xs text-red-600">{errors.name}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-1.5 block text-sm font-medium text-brown-800"
          >
            Phone <span className="text-brown-700/50">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={state.phone}
            onChange={(event) => update("phone", event.target.value)}
            className={cn(fieldClass, "border-sand-200")}
            placeholder="04xx xxx xxx"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-brown-800"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={state.email}
            onChange={(event) => update("email", event.target.value)}
            className={cn(
              fieldClass,
              errors.email ? "border-red-400" : "border-sand-200",
            )}
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="location"
            className="mb-1.5 block text-sm font-medium text-brown-800"
          >
            Preferred location{" "}
            <span className="text-brown-700/50">(optional)</span>
          </label>
          <select
            id="location"
            value={state.location}
            onChange={(event) => update("location", event.target.value)}
            className={cn(fieldClass, "border-sand-200")}
          >
            <option value="">No preference</option>
            {locations.map((location) => (
              <option key={location.id} value={location.name}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="message"
          className="mb-1.5 block text-sm font-medium text-brown-800"
        >
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          value={state.message}
          onChange={(event) => update("message", event.target.value)}
          className={cn(
            fieldClass,
            "resize-none",
            errors.message ? "border-red-400" : "border-sand-200",
          )}
          placeholder="How can we help you feel your best?"
          aria-invalid={Boolean(errors.message)}
        />
        {errors.message ? (
          <p className="mt-1 text-xs text-red-600">{errors.message}</p>
        ) : null}
      </div>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-full bg-sage-600 px-6 py-3.5 text-sm font-medium text-cream-50 shadow-sm transition-all hover:bg-sage-700 hover:shadow-md active:scale-[0.99] sm:w-auto"
      >
        Send message
      </button>
      <p className="text-xs text-brown-700/60">
        This is a demonstration form — submissions are handled entirely in your
        browser and are not stored or sent.
      </p>
    </form>
  );
}
