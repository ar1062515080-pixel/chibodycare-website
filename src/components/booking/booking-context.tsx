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

export type BookingLocation = { id: string; name: string; phone: string };

export type BookingState = {
  step: BookingStep;
  serviceIds: string[];
  professionalId: string | null; // null | ANY_PROFESSIONAL | staff id
  professionalName: string | null;
  locationId: string;
  dateKey: string | null;
  time: string | null;
  startAt: string | null;
  dailyRosterId: string | null;
  contact: ContactDetails;
  reference: string | null;
};

type BookingAction =
  | { type: "TOGGLE_SERVICE"; serviceId: string }
  | { type: "CLEAR_SERVICE" }
  | { type: "SET_PROFESSIONAL"; professionalId: string; professionalName?: string | null }
  | { type: "SET_LOCATION"; locationId: string }
  | { type: "SET_DATE"; dateKey: string }
  | { type: "SELECT_START_TIME"; time: string; startAt: string }
  | {
      type: "SELECT_SLOT";
      time: string;
      startAt: string;
      dailyRosterId: string;
      professionalId: string;
      professionalName: string | null;
    }
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
    professionalName: null,
    locationId: "",
    dateKey: null,
    time: null,
    startAt: null,
    dailyRosterId: null,
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

function reducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case "TOGGLE_SERVICE": {
      const exists = state.serviceIds.includes(action.serviceId);
      const serviceIds = exists ? [] : [action.serviceId];

      return {
        ...state,
        serviceIds,
        dailyRosterId: null,
      };
    }

    case "CLEAR_SERVICE":
      return {
        ...state,
        serviceIds: [],
        dailyRosterId: null,
      };

    case "SET_PROFESSIONAL":
      return {
        ...state,
        professionalId: action.professionalId,
        professionalName: action.professionalName ?? null,
        serviceIds: [],
        dailyRosterId: null,
      };

    case "SET_LOCATION":
      return {
        ...state,
        locationId: action.locationId,
        professionalId: null,
        professionalName: null,
        serviceIds: [],
        dateKey: null,
        time: null,
        startAt: null,
        dailyRosterId: null,
      };

    case "SET_DATE":
      return {
        ...state,
        dateKey: action.dateKey,
        professionalId: null,
        professionalName: null,
        serviceIds: [],
        time: null,
        startAt: null,
        dailyRosterId: null,
      };

    case "SELECT_START_TIME":
      return {
        ...state,
        time: action.time,
        startAt: action.startAt,
        professionalId: null,
        professionalName: null,
        serviceIds: [],
        dailyRosterId: null,
      };

    case "SELECT_SLOT":
      return {
        ...state,
        time: action.time,
        startAt: action.startAt,
        dailyRosterId: action.dailyRosterId,
        professionalId: state.professionalId === ANY_PROFESSIONAL ? ANY_PROFESSIONAL : action.professionalId,
        professionalName: state.professionalId === ANY_PROFESSIONAL ? null : action.professionalName,
      };

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
  selectedProfessional: { id: string; name: string } | null;
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
  const selectedProfessional =
    state.professionalId &&
    state.professionalId !== ANY_PROFESSIONAL &&
    state.professionalName
      ? { id: state.professionalId, name: state.professionalName }
      : null;

  return {
    selectedServices,
    totalDuration,
    totalPrice,
    categories,
    selectedProfessional,
  };
}

type BookingContextValue = {
  state: BookingState;
  dispatch: Dispatch<BookingAction>;
  derived: BookingDerived;
  bookingLocations: BookingLocation[];
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({
  children,
  initialServiceIds,
  initialLocations,
}: {
  children: ReactNode;
  initialServiceIds?: string[];
  initialLocations: BookingLocation[];
}) {
  const [state, dispatch] = useReducer(
    reducer,
    initialServiceIds,
    createInitialState,
  );

  const derived = useMemo(() => deriveState(state), [state]);

  const value = useMemo(
    () => ({ state, dispatch, derived, bookingLocations: initialLocations }),
    [state, derived, initialLocations],
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
