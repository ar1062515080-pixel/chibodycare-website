"use client";

import { useBooking } from "@/components/booking/booking-context";
import { validateContact } from "@/components/booking/validation";
import { cn } from "@/lib/cn";

const fieldClass =
  "w-full rounded-2xl border bg-cream-50 px-4 py-3 text-sm text-brown-900 outline-none transition-colors placeholder:text-brown-700/40 focus:border-sage-400 focus:ring-2 focus:ring-sage-200";

export function StepContact({ showErrors }: { showErrors: boolean }) {
  const { state, dispatch } = useBooking();
  const { contact } = state;
  const errors = showErrors ? validateContact(contact) : {};

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-medium text-brown-900">
          Your details
        </h2>
        <p className="mt-1 text-sm text-brown-700/70">
          We&apos;ll use these details to confirm your booking.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="firstName"
            className="mb-1.5 block text-sm font-medium text-brown-800"
          >
            First name
          </label>
          <input
            id="firstName"
            type="text"
            value={contact.firstName}
            onChange={(event) =>
              dispatch({
                type: "SET_CONTACT_FIELD",
                field: "firstName",
                value: event.target.value,
              })
            }
            className={cn(
              fieldClass,
              errors.firstName ? "border-red-400" : "border-sand-200",
            )}
            placeholder="Jane"
            aria-invalid={Boolean(errors.firstName)}
          />
          {errors.firstName ? (
            <p className="mt-1 text-xs text-red-600">{errors.firstName}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="mb-1.5 block text-sm font-medium text-brown-800"
          >
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            value={contact.lastName}
            onChange={(event) =>
              dispatch({
                type: "SET_CONTACT_FIELD",
                field: "lastName",
                value: event.target.value,
              })
            }
            className={cn(
              fieldClass,
              errors.lastName ? "border-red-400" : "border-sand-200",
            )}
            placeholder="Doe"
            aria-invalid={Boolean(errors.lastName)}
          />
          {errors.lastName ? (
            <p className="mt-1 text-xs text-red-600">{errors.lastName}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-brown-800"
          >
            Email <span className="text-brown-700/50">(optional)</span>
          </label>
          <input
            id="email"
            type="email"
            value={contact.email}
            onChange={(event) =>
              dispatch({
                type: "SET_CONTACT_FIELD",
                field: "email",
                value: event.target.value,
              })
            }
            className={cn(
              fieldClass,
              errors.email ? "border-red-400" : "border-sand-200",
            )}
            placeholder="jane@example.com"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? (
            <p className="mt-1 text-xs text-red-600">{errors.email}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-1.5 block text-sm font-medium text-brown-800"
          >
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            value={contact.phone}
            onChange={(event) =>
              dispatch({
                type: "SET_CONTACT_FIELD",
                field: "phone",
                value: event.target.value,
              })
            }
            className={cn(
              fieldClass,
              errors.phone ? "border-red-400" : "border-sand-200",
            )}
            placeholder="04xx xxx xxx"
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone ? (
            <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor="notes"
          className="mb-1.5 block text-sm font-medium text-brown-800"
        >
          Notes <span className="text-brown-700/50">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows={3}
          value={contact.notes}
          onChange={(event) =>
            dispatch({
              type: "SET_CONTACT_FIELD",
              field: "notes",
              value: event.target.value,
            })
          }
          className={cn(fieldClass, "resize-none border-sand-200")}
          placeholder="Anything we should know before your visit?"
        />
      </div>
    </div>
  );
}
