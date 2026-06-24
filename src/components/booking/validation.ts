import type { ContactDetails } from "@/components/booking/booking-context";

export type ContactErrors = Partial<Record<keyof ContactDetails, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9 ()+-]{8,}$/;

export function validateContact(contact: ContactDetails): ContactErrors {
  const errors: ContactErrors = {};

  if (!contact.firstName.trim()) {
    errors.firstName = "First name is required.";
  }
  if (!contact.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }
  if (!contact.email.trim()) {
    errors.email = "Email is required.";
  } else if (!emailPattern.test(contact.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!contact.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!phonePattern.test(contact.phone.trim())) {
    errors.phone = "Enter a valid phone number.";
  }

  return errors;
}

export function isContactValid(contact: ContactDetails): boolean {
  return Object.keys(validateContact(contact)).length === 0;
}
