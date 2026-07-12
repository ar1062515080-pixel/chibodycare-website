export type AvailableSlot = {
  startAt: string;
  endAt: string;
  time: string;
  therapistId: string;
  therapistName: string | null;
  dailyRosterId: string;
};

export type AvailabilityResponse = {
  slots: AvailableSlot[];
  hasRoster: boolean;
  message?: string;
};

export type CreateBookingInput = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  locationId: string;
  serviceId: string;
  therapistId: string | null;
  dailyRosterId: string | null;
  startAt: string;
};

