export type CategoryId =
  | "relaxation"
  | "deep-recovery"
  | "foot-care"
  | "aromatherapy"
  | "remedial-pregnancy"
  | "acupuncture"
  | "additional-services"
  | "deluxe-customised";

export type ServiceCategory = {
  id: CategoryId;
  name: string;
  tagline: string;
  description: string;
  /** Emoji/icon glyph used in the lightweight icon badges. */
  icon: string;
};

export type Service = {
  id: string;
  name: string;
  categoryId: CategoryId;
  description: string;
  durationMinutes: number;
  price: number;
  /** Surface on the homepage featured grid. */
  featured?: boolean;
  popular?: boolean;
};

export const categories: ServiceCategory[] = [
  {
    id: "relaxation",
    name: "Relaxation",
    tagline: "Unwind & soften tension",
    description:
      "Flowing, full-body massage designed to calm the nervous system, ease everyday stress and leave you deeply rested.",
    icon: "🌿",
  },
  {
    id: "deep-recovery",
    name: "Deep Recovery",
    tagline: "Reset for body & mind",
    description:
      "Firmer, focused massage to release deep-seated tension and support full-body recovery.",
    icon: "♨️",
  },
  {
    id: "foot-care",
    name: "Foot Care",
    tagline: "Ground & revive",
    description:
      "Reflexology-style foot treatments — on their own or combined with hands, neck, shoulders and back — to relieve tired legs and reconnect body and mind.",
    icon: "🦶",
  },
  {
    id: "aromatherapy",
    name: "Aromatherapy",
    tagline: "Sensory restoration",
    description:
      "Botanical essential-oil rituals that soothe the senses and elevate your massage into pure escape.",
    icon: "🕯️",
  },
  {
    id: "remedial-pregnancy",
    name: "Remedial Treatment / Pregnancy Massage",
    tagline: "Targeted therapeutic relief",
    description:
      "Clinical, outcome-focused treatment for muscular pain and postural strain, including gentle massage tailored for pregnancy.",
    icon: "💆",
  },
  {
    id: "acupuncture",
    name: "Acupuncture",
    tagline: "Restore natural balance",
    description:
      "Traditional acupuncture, cosmetic acupuncture and Chinese medicine consultations to support pain relief, energy and overall wellbeing.",
    icon: "🪡",
  },
  {
    id: "additional-services",
    name: "Additional Services",
    tagline: "Enhance your treatment",
    description:
      "Ear candling, traditional fire cupping and cupping-with-massage combinations to complement your session.",
    icon: "🫙",
  },
  {
    id: "deluxe-customised",
    name: "Deluxe Customised",
    tagline: "The complete experience",
    description:
      "Our signature whole body & foot massage sessions — generous, fully customised treatments for total restoration.",
    icon: "✨",
  },
];

export const services: Service[] = [
  // Relaxation
  {
    id: "relaxation-20",
    name: "Relaxation Massage — 20 min",
    categoryId: "relaxation",
    description:
      "A quick reset for neck, shoulders and back — ideal on a busy day.",
    durationMinutes: 20,
    price: 40,
  },
  {
    id: "relaxation-30",
    name: "Relaxation Massage — 30 min",
    categoryId: "relaxation",
    description: "A focused half-hour to ease tension and unwind.",
    durationMinutes: 30,
    price: 55,
  },
  {
    id: "relaxation-45",
    name: "Relaxation Massage — 45 min",
    categoryId: "relaxation",
    description: "Soothing, flowing massage to soften everyday stress.",
    durationMinutes: 45,
    price: 80,
  },
  {
    id: "relaxation-60",
    name: "Relaxation Massage — 60 min",
    categoryId: "relaxation",
    description:
      "Our soothing full-body flow to melt away tension head to toe.",
    durationMinutes: 60,
    price: 100,
    featured: true,
    popular: true,
  },
  {
    id: "relaxation-90",
    name: "Relaxation Massage — 90 min",
    categoryId: "relaxation",
    description: "A generous escape for complete unwinding and deep calm.",
    durationMinutes: 90,
    price: 150,
  },
  {
    id: "relaxation-120",
    name: "Relaxation Massage — 120 min",
    categoryId: "relaxation",
    description: "The ultimate two-hour journey into total relaxation.",
    durationMinutes: 120,
    price: 200,
  },

  // Deep Recovery
  {
    id: "deep-recovery-20",
    name: "Deep Recovery — 20 min",
    categoryId: "deep-recovery",
    description: "Targeted firm pressure for a specific area of tension.",
    durationMinutes: 20,
    price: 40,
  },
  {
    id: "deep-recovery-30",
    name: "Deep Recovery — 30 min",
    categoryId: "deep-recovery",
    description: "A focused deep-tissue session for tight muscles.",
    durationMinutes: 30,
    price: 55,
  },
  {
    id: "deep-recovery-45",
    name: "Deep Recovery — 45 min",
    categoryId: "deep-recovery",
    description: "Sustained pressure to release deeper muscle layers.",
    durationMinutes: 45,
    price: 80,
  },
  {
    id: "deep-recovery-60",
    name: "Deep Recovery — 60 min",
    categoryId: "deep-recovery",
    description:
      "Full-body deep-tissue work to ease chronic tension and aid recovery.",
    durationMinutes: 60,
    price: 100,
    featured: true,
  },
  {
    id: "deep-recovery-90",
    name: "Deep Recovery — 90 min",
    categoryId: "deep-recovery",
    description: "An extended deep-recovery session for complete reset.",
    durationMinutes: 90,
    price: 150,
  },

  // Foot Care
  {
    id: "foot-care-20",
    name: "Foot Care — 20 min",
    categoryId: "foot-care",
    description: "A quick, reviving foot treatment for tired feet.",
    durationMinutes: 20,
    price: 40,
  },
  {
    id: "foot-care-30",
    name: "Foot Care — 30 min",
    categoryId: "foot-care",
    description: "Pressure-point foot therapy to relieve tension.",
    durationMinutes: 30,
    price: 55,
  },
  {
    id: "foot-care-45",
    name: "Foot Care — 45 min",
    categoryId: "foot-care",
    description: "An extended foot session to restore whole-body balance.",
    durationMinutes: 45,
    price: 80,
  },
  {
    id: "foot-care-60",
    name: "Foot Care — 60 min",
    categoryId: "foot-care",
    description: "A full hour of grounding, restorative foot therapy.",
    durationMinutes: 60,
    price: 100,
    featured: true,
    popular: true,
  },
  {
    id: "foot-care-60-hands",
    name: "Foot Care — 60 min (incl. Hands Massage)",
    categoryId: "foot-care",
    description: "Foot therapy combined with a soothing hands massage.",
    durationMinutes: 60,
    price: 100,
  },
  {
    id: "foot-care-60-neck-shoulders",
    name: "Foot Care — 60 min (incl. Neck & Shoulders Massage)",
    categoryId: "foot-care",
    description:
      "Foot therapy combined with a relaxing neck and shoulders massage.",
    durationMinutes: 60,
    price: 100,
  },
  {
    id: "foot-care-90-neck-shoulders-back",
    name: "Foot Care — 90 min (incl. Neck, Shoulders & Back Massage)",
    categoryId: "foot-care",
    description:
      "Extended foot therapy with neck, shoulders and back massage for full relief.",
    durationMinutes: 90,
    price: 150,
  },

  // Aromatherapy
  {
    id: "aromatherapy-45",
    name: "Aromatherapy Massage — 45 min",
    categoryId: "aromatherapy",
    description:
      "A botanical essential-oil massage to soothe the senses and relax.",
    durationMinutes: 45,
    price: 90,
  },
  {
    id: "aromatherapy-60",
    name: "Aromatherapy Massage — 60 min",
    categoryId: "aromatherapy",
    description:
      "A full-body massage enriched with bespoke essential-oil blends.",
    durationMinutes: 60,
    price: 120,
    featured: true,
  },
  {
    id: "aromatherapy-90",
    name: "Aromatherapy Massage — 90 min",
    categoryId: "aromatherapy",
    description: "An indulgent, sensory escape for deep relaxation.",
    durationMinutes: 90,
    price: 170,
  },
  {
    id: "aromatherapy-120",
    name: "Aromatherapy Massage — 120 min",
    categoryId: "aromatherapy",
    description: "The ultimate two-hour aromatherapy ritual.",
    durationMinutes: 120,
    price: 220,
  },

  // Remedial Treatment / Pregnancy Massage
  {
    id: "remedial-20",
    name: "Remedial / Pregnancy Massage — 20 min",
    categoryId: "remedial-pregnancy",
    description: "A focused remedial treatment for a specific concern.",
    durationMinutes: 20,
    price: 40,
  },
  {
    id: "remedial-30",
    name: "Remedial / Pregnancy Massage — 30 min",
    categoryId: "remedial-pregnancy",
    description: "Targeted remedial work for muscular tension.",
    durationMinutes: 30,
    price: 55,
  },
  {
    id: "remedial-45",
    name: "Remedial / Pregnancy Massage — 45 min",
    categoryId: "remedial-pregnancy",
    description: "Therapeutic massage for pain, posture and tension.",
    durationMinutes: 45,
    price: 80,
  },
  {
    id: "remedial-60",
    name: "Remedial / Pregnancy Massage — 60 min",
    categoryId: "remedial-pregnancy",
    description:
      "Clinical, outcome-focused treatment — including gentle pregnancy massage.",
    durationMinutes: 60,
    price: 100,
    featured: true,
    popular: true,
  },
  {
    id: "remedial-90",
    name: "Remedial / Pregnancy Massage — 90 min",
    categoryId: "remedial-pregnancy",
    description: "An extended remedial session for lasting relief.",
    durationMinutes: 90,
    price: 150,
  },
  {
    id: "remedial-120",
    name: "Remedial / Pregnancy Massage — 120 min",
    categoryId: "remedial-pregnancy",
    description: "A comprehensive two-hour therapeutic treatment.",
    durationMinutes: 120,
    price: 200,
  },

  // Acupuncture
  {
    id: "acupuncture-initial",
    name: "Acupuncture — Initial",
    categoryId: "acupuncture",
    description:
      "Comprehensive first consultation and acupuncture treatment tailored to you.",
    durationMinutes: 60,
    price: 120,
    featured: true,
  },
  {
    id: "acupuncture-followup",
    name: "Acupuncture — Follow Up",
    categoryId: "acupuncture",
    description:
      "Ongoing acupuncture to maintain balance, manage pain and support wellbeing.",
    durationMinutes: 45,
    price: 100,
  },
  {
    id: "acupuncture-massage-60",
    name: "Acupuncture & Massage — 60 min",
    categoryId: "acupuncture",
    description: "Acupuncture combined with massage in one restorative session.",
    durationMinutes: 60,
    price: 155,
    popular: true,
  },
  {
    id: "acupuncture-massage-90",
    name: "Acupuncture & Massage — 90 min",
    categoryId: "acupuncture",
    description: "An extended acupuncture and massage treatment.",
    durationMinutes: 90,
    price: 200,
  },
  {
    id: "cosmetic-acupuncture-initial",
    name: "Cosmetic Acupuncture — Initial",
    categoryId: "acupuncture",
    description:
      "Your first cosmetic acupuncture session to support natural radiance.",
    durationMinutes: 60,
    price: 150,
  },
  {
    id: "cosmetic-acupuncture-followup",
    name: "Cosmetic Acupuncture — Follow Up",
    categoryId: "acupuncture",
    description: "Ongoing cosmetic acupuncture to maintain your results.",
    durationMinutes: 45,
    price: 120,
  },
  {
    id: "chinese-medicine-consultation",
    name: "Chinese Medicine Consultation",
    categoryId: "acupuncture",
    description:
      "Traditional Chinese medicine assessment with personalised wellness guidance.",
    durationMinutes: 30,
    price: 60,
  },

  // Additional Services
  {
    id: "ear-candling-head-massage",
    name: "Ear Candling & Head Massage — 30 min",
    categoryId: "additional-services",
    description:
      "Gentle ear candling paired with a relaxing head massage.",
    durationMinutes: 30,
    price: 55,
  },
  {
    id: "fire-cupping",
    name: "Traditional Fire Cupping",
    categoryId: "additional-services",
    description:
      "Traditional suction cupping to boost circulation and ease tightness.",
    durationMinutes: 20,
    price: 50,
  },
  {
    id: "fire-cupping-massage-45",
    name: "Traditional Fire Cupping & Massage — 45 min",
    categoryId: "additional-services",
    description: "Fire cupping combined with a therapeutic massage.",
    durationMinutes: 45,
    price: 100,
  },
  {
    id: "fire-cupping-massage-60",
    name: "Traditional Fire Cupping & Massage — 60 min",
    categoryId: "additional-services",
    description: "An hour of fire cupping with massage for deeper relief.",
    durationMinutes: 60,
    price: 125,
    popular: true,
  },
  {
    id: "fire-cupping-massage-75",
    name: "Traditional Fire Cupping & Massage — 75 min",
    categoryId: "additional-services",
    description: "An extended fire cupping and massage treatment.",
    durationMinutes: 75,
    price: 145,
  },

  // Deluxe Customised
  {
    id: "deluxe-90",
    name: "Whole Body & Foot Massage — 90 min",
    categoryId: "deluxe-customised",
    description:
      "Our signature whole body and foot massage, fully customised to you.",
    durationMinutes: 90,
    price: 150,
    featured: true,
  },
  {
    id: "deluxe-120",
    name: "Whole Body & Foot Massage — 120 min",
    categoryId: "deluxe-customised",
    description: "A two-hour whole body and foot massage experience.",
    durationMinutes: 120,
    price: 200,
    popular: true,
  },
  {
    id: "deluxe-150",
    name: "Whole Body & Foot Massage — 150 min",
    categoryId: "deluxe-customised",
    description: "An indulgent 2.5-hour whole body and foot journey.",
    durationMinutes: 150,
    price: 245,
  },
  {
    id: "deluxe-180",
    name: "Whole Body & Foot Massage — 180 min",
    categoryId: "deluxe-customised",
    description: "The complete three-hour deluxe restoration ritual.",
    durationMinutes: 180,
    price: 290,
  },
];

export function getServiceById(id: string): Service | undefined {
  return services.find((service) => service.id === id);
}

export function getCategoryById(id: CategoryId): ServiceCategory | undefined {
  return categories.find((category) => category.id === id);
}

export function getServicesByCategory(id: CategoryId): Service[] {
  return services.filter((service) => service.categoryId === id);
}

export function getFeaturedServices(): Service[] {
  return services.filter((service) => service.featured);
}

export type ServicesGroupedByCategory = {
  category: ServiceCategory;
  services: Service[];
};

export function getServicesGroupedByCategory(): ServicesGroupedByCategory[] {
  return categories.map((category) => ({
    category,
    services: getServicesByCategory(category.id),
  }));
}
