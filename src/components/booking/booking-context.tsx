"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  getServiceById,
  type CategoryId,
  type Service,
} from "@/lib/services";
import { getStaffForCategories, getStaffById } from "@/lib/staff";
import type { StaffMember } from "@/lib/staff";

export const TOTAL_STEPS = 5;
export type BookingStep = 1 | 2 | 3 | 4 | 5;

export const ANY_PROFESSIONAL = "any";

export type ContactDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
};

export type BookingState = {
  step: BookingStep;
  serviceIds: string[];
  professionalId: string | null; // null | ANY_PROFESSIONAL | staff id
  locationId: string;
  dateKey: string | null;
  time: string | null;
  contact: ContactDetails;
  reference: string | null;
};

type BookingAction =
  | { type: "TOGGLE_SERVICE"; serviceId: string }
  | { type: "SET_PROFESSIONAL"; professionalId: string }
  | { type: "SET_LOCATION"; locationId: string }
  | { type: "SET_DATE"; dateKey: string }
  | { type: "SET_TIME"; time: string }
  | { type: "SET_CONTACT_FIELD"; field: keyof ContactDetails; value: string }
  | { type: "GO_TO_STEP"; step: BookingStep }
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "CONFIRM"; reference: string }
  | { type: "RESET" };

const emptyContact: ContactDetails = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
};

function createInitialState(initialServiceIds: string[] = []): BookingState {
  const valid = initialServiceIds.filter((id) => getServiceById(id));
  return {
    step: 1,
    serviceIds: valid,
    professionalId: null,
    locationId: "city-myer-centre",
    dateKey: null,
    time: null,
    contact: emptyContact,
    reference: null,
  };
}

/** Categories required by the currently selected services. */
function categoriesForServices(serviceIds: string[]): CategoryId[] {
  const set = new Set<CategoryId>();
  for (const id of serviceIds) {
    const service = getServiceById(id);
    if (service) set.add(service.categoryId);
  }
  return Array.from(set);
}

function professionalStillValid(
  professionalId: string | null,
  serviceIds: string[],
): boolean {
  if (professionalId === null || professionalId === ANY_PROFESSIONAL) {
    return true;
  }
  const categories = categoriesForServices(serviceIds);
  const eligible = getStaffForCategories(categories);
  return eligible.some((member) => member.id === professionalId);
}

function reducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "TOGGLE_SERVICE": {
      const exists = state.serviceIds.includes(action.serviceId);
      const serviceIds = exists
        ? state.serviceIds.filter((id) => id !== action.serviceId)
        : [...state.serviceIds, action.serviceId];

      // Changing services may invalidate downstream selections.
      const keepProfessional = professionalStillValid(
        state.professionalId,
        serviceIds,
      );

      return {
        ...state,
        serviceIds,
        professionalId: keepProfessional ? state.professionalId : null,
        // Duration may change, so reset the chosen time.
        time: null,
      };
    }

    case "SET_PROFESSIONAL":
      return { ...state, professionalId: action.professionalId };

    case "SET_LOCATION":
      return { ...state, locationId: action.locationId };

    case "SET_DATE":
      return { ...state, dateKey: action.dateKey, time: null };

    case "SET_TIME":
      return { ...state, time: action.time };

    case "SET_CONTACT_FIELD":
      return {
        ...state,
        contact: { ...state.contact, [action.field]: action.value },
      };

    case "GO_TO_STEP":
      return { ...state, step: action.step };

    case "NEXT":
      return {
        ...state,
        step: Math.min(state.step + 1, TOTAL_STEPS) as BookingStep,
      };

    case "BACK":
      return {
        ...state,
        step: Math.max(state.step - 1, 1) as BookingStep,
      };

    case "CONFIRM":
      return { ...state, reference: action.reference, step: 5 };

    case "RESET":
      return createInitialState();

    default:
      return state;
  }
}

export type BookingDerived = {
  selectedServices: Service[];
  totalDuration: number;
  totalPrice: number;
  categories: CategoryId[];
  eligibleStaff: StaffMember[];
  selectedProfessional: StaffMember | null;
};

function deriveState(state: BookingState): BookingDerived {
  const selectedServices = state.serviceIds
    .map((id) => getServiceById(id))
    .filter((service): service is Service => Boolean(service));

  const totalDuration = selectedServices.reduce(
    (sum, service) => sum + service.durationMinutes,
    0,
  );
  const totalPrice = selectedServices.reduce(
    (sum, service) => sum + service.price,
    0,
  );

  const categories = categoriesForServices(state.serviceIds);
  const eligibleStaff = getStaffForCategories(categories);

  const selectedProfessional =
    state.professionalId && state.professionalId !== ANY_PROFESSIONAL
      ? (getStaffById(state.professionalId) ?? null)
      : null;

  return {
    selectedServices,
    totalDuration,
    totalPrice,
    categories,
    eligibleStaff,
    selectedProfessional,
  };
}

type BookingContextValue = {
  state: BookingState;
  dispatch: Dispatch<BookingAction>;
  derived: BookingDerived;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({
  children,
  initialServiceIds,
}: {
  children: ReactNode;
  initialServiceIds?: string[];
}) {
  const [state, dispatch] = useReducer(
    reducer,
    initialServiceIds,
    createInitialState,
  );

  const derived = useMemo(() => deriveState(state), [state]);

  const value = useMemo(
    () => ({ state, dispatch, derived }),
    [state, derived],
  );

  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}
