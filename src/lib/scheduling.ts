import { openingHours, type OpeningHour } from "@/lib/business";
import { toDateKey } from "@/lib/format";

export type TimeSlot = {
  /** "HH:mm" 24-hour start time. */
  time: string;
  available: boolean;
};

export type BookableDay = {
  date: Date;
  dateKey: string;
  weekday: string;
  hasAvailability: boolean;
};

/** Fixed slot interval, in minutes, used across the booking flow. */
const SLOT_INTERVAL = 30;

function parseTimeToMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToTime(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${`${hour}`.padStart(2, "0")}:${`${minute}`.padStart(2, "0")}`;
}

function getOpeningHourForDate(date: Date): OpeningHour | undefined {
  const weekday = date.toLocaleDateString("en-AU", { weekday: "long" });
  return openingHours.find((entry) => entry.day === weekday);
}

/**
 * Deterministic pseudo-random number in [0, 1) derived from a string seed.
 * Keeps availability stable between renders without any backend.
 */
function seededValue(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  // Map to [0, 1)
  return ((hash >>> 0) % 1000) / 1000;
}

/**
 * Generate the bookable time slots for a given date and total service
 * duration. Slots run on a fixed interval and must finish before close.
 * Availability is deterministic, derived from the date + time seed.
 */
export function generateTimeSlots(
  date: Date,
  totalDurationMinutes: number,
): TimeSlot[] {
  const hours = getOpeningHourForDate(date);
  if (!hours || totalDurationMinutes <= 0) return [];

  const openMinutes = parseTimeToMinutes(hours.open);
  const closeMinutes = parseTimeToMinutes(hours.close);
  const lastStart = closeMinutes - totalDurationMinutes;

  const slots: TimeSlot[] = [];
  const dateKey = toDateKey(date);

  for (
    let start = openMinutes;
    start <= lastStart;
    start += SLOT_INTERVAL
  ) {
    const time = minutesToTime(start);
    // ~25% of slots are "already booked" for realism, deterministically.
    const available = seededValue(`${dateKey}-${time}`) > 0.25;
    slots.push({ time, available });
  }

  return slots;
}

/**
 * Build a list of upcoming bookable days (those with opening hours and at
 * least one available slot for the given duration).
 */
export function getBookableDays(
  totalDurationMinutes: number,
  daysAhead = 14,
): BookableDay[] {
  const days: BookableDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = 0; offset < daysAhead; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);

    const hours = getOpeningHourForDate(date);
    if (!hours) continue;

    const slots =
      totalDurationMinutes > 0
        ? generateTimeSlots(date, totalDurationMinutes)
        : [];
    const hasAvailability =
      totalDurationMinutes > 0 && slots.some((slot) => slot.available);

    days.push({
      date,
      dateKey: toDateKey(date),
      weekday: date.toLocaleDateString("en-AU", { weekday: "short" }),
      hasAvailability,
    });
  }

  return days;
}

export function generateBookingReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `CBC-${suffix}`;
}
