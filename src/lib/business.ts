export type Location = {
  id: string;
  name: string;
  centre: string;
  phone: string;
  area: string;
};

export type OpeningHour = {
  day: string;
  open: string; // 24h "HH:mm"
  close: string; // 24h "HH:mm"
};

export const business = {
  name: "Chi Body Care",
  tagline: "Restore. Rebalance. Renew.",
  shortDescription:
    "Adelaide's destination for relaxation & remedial massage, acupuncture, foot care and traditional Chinese medicine.",
  email: "hello@chibodycare.com.au",
  bookingPhone: "08 8212 6626",
  abnLabel: "Traditional wellness, modern care",
  social: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
  },
} as const;

/**
 * Studio opening hours used to generate booking slots.
 * Shopping-centre style trading hours, mobile-first friendly.
 */
export const openingHours: OpeningHour[] = [
  { day: "Monday", open: "09:00", close: "17:30" },
  { day: "Tuesday", open: "09:00", close: "17:30" },
  { day: "Wednesday", open: "09:00", close: "17:30" },
  { day: "Thursday", open: "09:00", close: "21:00" },
  { day: "Friday", open: "09:00", close: "17:30" },
  { day: "Saturday", open: "09:00", close: "17:00" },
  { day: "Sunday", open: "11:00", close: "17:00" },
];

export const locations: Location[] = [
  {
    id: "city-myer-centre",
    name: "City — Myer Centre",
    centre: "Myer Centre",
    phone: "08 8212 6626",
    area: "Adelaide CBD",
  },
  {
    id: "westfield-marion",
    name: "Westfield Marion",
    centre: "Westfield Marion",
    phone: "08 8358 4696",
    area: "Oaklands Park",
  },
  {
    id: "westfield-marion-foot-haven",
    name: "Westfield Marion — Foot Haven",
    centre: "Westfield Marion",
    phone: "08 8298 8218",
    area: "Oaklands Park",
  },
  {
    id: "westfield-west-lakes",
    name: "Westfield West Lakes",
    centre: "Westfield West Lakes",
    phone: "08 8235 2635",
    area: "West Lakes",
  },
  {
    id: "westfield-modbury",
    name: "Westfield Modbury",
    centre: "Westfield Modbury",
    phone: "08 8264 6550",
    area: "Modbury",
  },
  {
    id: "elizabeth-city-centre",
    name: "Elizabeth City Centre",
    centre: "Elizabeth City Centre",
    phone: "08 8255 0878",
    area: "Elizabeth",
  },
  {
    id: "arndale-shopping-centre",
    name: "Arndale Shopping Centre",
    centre: "Arndale Central",
    phone: "08 8244 3322",
    area: "Kilkenny",
  },
  {
    id: "golden-grove-village",
    name: "Golden Grove Village",
    centre: "Golden Grove Village",
    phone: "08 8289 2842",
    area: "Golden Grove",
  },
  {
    id: "port-adelaide-plaza",
    name: "Port Adelaide Plaza",
    centre: "Port Adelaide Plaza",
    phone: "08 8241 1312",
    area: "Port Adelaide",
  },
  {
    id: "newton-village",
    name: "Newton Village",
    centre: "Newton Village",
    phone: "08 8336 2440",
    area: "Newton",
  },
  {
    id: "mitcham-square",
    name: "Mitcham Square",
    centre: "Mitcham Square",
    phone: "08 8271 9918",
    area: "Mitcham",
  },
  {
    id: "colonnades-shopping-centre",
    name: "Colonnades Shopping Centre",
    centre: "Colonnades",
    phone: "08 8382 8883",
    area: "Noarlunga Centre",
  },
  {
    id: "burnside-village",
    name: "Burnside Village",
    centre: "Burnside Village",
    phone: "08 8379 5888",
    area: "Glenside",
  },
];

export const flagshipLocation = locations[0];
