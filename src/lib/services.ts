export type CategoryId =
  | "relaxation-massage"
  | "remedial-massage"
  | "acupuncture"
  | "foot-care"
  | "aromatherapy"
  | "deep-recovery"
  | "chinese-medicine"
  | "cupping-additional";

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
    id: "relaxation-massage",
    name: "Relaxation Massage",
    tagline: "Unwind & soften tension",
    description:
      "Flowing, full-body massage designed to calm the nervous system, ease everyday stress and leave you deeply rested.",
    icon: "🌿",
  },
  {
    id: "remedial-massage",
    name: "Remedial Massage",
    tagline: "Targeted therapeutic relief",
    description:
      "Clinical, outcome-focused treatment for muscular pain, postural strain and recovery from injury.",
    icon: "💪",
  },
  {
    id: "acupuncture",
    name: "Acupuncture",
    tagline: "Restore natural balance",
    description:
      "Gentle, precise needling to support pain relief, energy, sleep and overall wellbeing.",
    icon: "🪡",
  },
  {
    id: "foot-care",
    name: "Foot Care",
    tagline: "Ground & revive",
    description:
      "Reflexology and therapeutic foot treatments to relieve tired legs and reconnect body and mind.",
    icon: "🦶",
  },
  {
    id: "aromatherapy",
    name: "Aromatherapy",
    tagline: "Sensory restoration",
    description:
      "Botanical essential-oil rituals that soothe the senses and elevate any massage into pure escape.",
    icon: "🕯️",
  },
  {
    id: "deep-recovery",
    name: "Deep Recovery",
    tagline: "Reset for body & mind",
    description:
      "Longer, layered sessions combining deep tissue, heat and stretch for full-body recovery.",
    icon: "♨️",
  },
  {
    id: "chinese-medicine",
    name: "Chinese Medicine Consultation",
    tagline: "Personalised wellness plans",
    description:
      "Traditional Chinese Medicine assessment with tailored lifestyle, herbal and treatment guidance.",
    icon: "🍵",
  },
  {
    id: "cupping-additional",
    name: "Cupping & Additional Services",
    tagline: "Boost your treatment",
    description:
      "Cupping, gua sha and targeted add-ons to enhance circulation and complement your session.",
    icon: "🫧",
  },
];

export const services: Service[] = [
  // Relaxation Massage
  {
    id: "signature-relaxation",
    name: "Signature Relaxation Massage",
    categoryId: "relaxation-massage",
    description:
      "Our soothing full-body flow with calming pressure to melt away tension head to toe.",
    durationMinutes: 60,
    price: 99,
    featured: true,
    popular: true,
  },
  {
    id: "express-relaxation",
    name: "Express Relaxation Massage",
    categoryId: "relaxation-massage",
    description:
      "A focused 30-minute reset for neck, shoulders and back — perfect on a lunch break.",
    durationMinutes: 30,
    price: 59,
  },
  {
    id: "extended-relaxation",
    name: "Extended Relaxation Ritual",
    categoryId: "relaxation-massage",
    description:
      "A generous 90-minute escape for complete unwinding and deep calm.",
    durationMinutes: 90,
    price: 139,
  },

  // Remedial Massage
  {
    id: "remedial-massage",
    name: "Remedial Massage",
    categoryId: "remedial-massage",
    description:
      "Assessment and treatment of muscular tension, knots and restricted movement.",
    durationMinutes: 60,
    price: 109,
    featured: true,
    popular: true,
  },
  {
    id: "deep-tissue-massage",
    name: "Deep Tissue Massage",
    categoryId: "remedial-massage",
    description:
      "Firm, sustained pressure to release chronic tension in deeper muscle layers.",
    durationMinutes: 60,
    price: 115,
  },
  {
    id: "sports-recovery-massage",
    name: "Sports Recovery Massage",
    categoryId: "remedial-massage",
    description:
      "Performance-focused treatment to aid recovery, mobility and injury prevention.",
    durationMinutes: 45,
    price: 99,
  },

  // Acupuncture
  {
    id: "acupuncture-initial",
    name: "Acupuncture — Initial Session",
    categoryId: "acupuncture",
    description:
      "Comprehensive first consultation and treatment tailored to your health goals.",
    durationMinutes: 75,
    price: 125,
    featured: true,
  },
  {
    id: "acupuncture-followup",
    name: "Acupuncture — Follow Up",
    categoryId: "acupuncture",
    description:
      "Ongoing acupuncture treatment to maintain balance, manage pain and support wellbeing.",
    durationMinutes: 45,
    price: 89,
  },

  // Foot Care
  {
    id: "reflexology",
    name: "Reflexology Foot Treatment",
    categoryId: "foot-care",
    description:
      "Pressure-point foot therapy to relieve tension and restore whole-body balance.",
    durationMinutes: 45,
    price: 75,
    featured: true,
    popular: true,
  },
  {
    id: "foot-haven-ritual",
    name: "Foot Haven Ritual",
    categoryId: "foot-care",
    description:
      "Warm soak, exfoliation and a soothing massage for tired feet and legs.",
    durationMinutes: 60,
    price: 95,
  },

  // Aromatherapy
  {
    id: "aromatherapy-massage",
    name: "Aromatherapy Massage",
    categoryId: "aromatherapy",
    description:
      "A full-body massage enriched with bespoke essential-oil blends for deep relaxation.",
    durationMinutes: 60,
    price: 109,
    featured: true,
  },
  {
    id: "glow-facial",
    name: "Aromatherapy Glow Facial",
    categoryId: "aromatherapy",
    description:
      "A nourishing facial ritual with botanical oils and a relaxing pressure-point massage.",
    durationMinutes: 50,
    price: 99,
    popular: true,
  },

  // Deep Recovery
  {
    id: "deep-recovery-90",
    name: "Deep Recovery 90",
    categoryId: "deep-recovery",
    description:
      "A 90-minute fusion of deep tissue, heat therapy and assisted stretch for full reset.",
    durationMinutes: 90,
    price: 165,
    featured: true,
  },
  {
    id: "hot-stone-recovery",
    name: "Hot Stone Recovery",
    categoryId: "deep-recovery",
    description:
      "Smooth heated stones glide over the body to release deep-seated muscular tension.",
    durationMinutes: 75,
    price: 145,
  },

  // Chinese Medicine Consultation
  {
    id: "tcm-consultation",
    name: "Chinese Medicine Consultation",
    categoryId: "chinese-medicine",
    description:
      "Traditional diagnosis with a personalised plan across treatment, lifestyle and herbs.",
    durationMinutes: 60,
    price: 105,
    featured: true,
  },
  {
    id: "herbal-followup",
    name: "Herbal Wellness Review",
    categoryId: "chinese-medicine",
    description:
      "Follow-up review to fine-tune your herbal program and track your progress.",
    durationMinutes: 30,
    price: 65,
  },

  // Cupping & Additional Services
  {
    id: "cupping-therapy",
    name: "Cupping Therapy",
    categoryId: "cupping-additional",
    description:
      "Traditional suction cupping to boost circulation and ease muscular tightness.",
    durationMinutes: 30,
    price: 65,
    popular: true,
  },
  {
    id: "gua-sha",
    name: "Gua Sha Treatment",
    categoryId: "cupping-additional",
    description:
      "Gentle scraping technique to release tension and stimulate healthy circulation.",
    durationMinutes: 30,
    price: 60,
  },
  {
    id: "heat-pack-addon",
    name: "Heat Therapy Add-On",
    categoryId: "cupping-additional",
    description:
      "Add soothing heat therapy to any treatment for enhanced muscle release.",
    durationMinutes: 15,
    price: 25,
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
