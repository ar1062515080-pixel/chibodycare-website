import type { CategoryId } from "@/lib/services";

export type StaffMember = {
  id: string;
  name: string;
  title: string;
  bio: string;
  /** Categories this professional can deliver. */
  specialties: CategoryId[];
  /** Short specialty labels for the team cards. */
  focus: string[];
  yearsExperience: number;
  /** Initials used for the avatar placeholder. */
  initials: string;
  /** Tailwind gradient classes for the avatar badge. */
  accent: string;
};

export const staff: StaffMember[] = [
  {
    id: "mei-lin",
    name: "Mei Lin",
    title: "Senior TCM Practitioner & Acupuncturist",
    bio: "With over 15 years of clinical practice, Mei blends traditional Chinese medicine diagnosis with gentle, effective acupuncture to help clients restore balance and ease persistent pain.",
    specialties: ["acupuncture", "chinese-medicine", "cupping-additional"],
    focus: ["Acupuncture", "Chinese Medicine", "Cupping"],
    yearsExperience: 15,
    initials: "ML",
    accent: "from-sage-400 to-sage-600",
  },
  {
    id: "daniel-cho",
    name: "Daniel Cho",
    title: "Remedial Massage Therapist",
    bio: "Daniel specialises in remedial and deep tissue work, drawing on a background in sports therapy to help clients recover from injury and move freely again.",
    specialties: ["remedial-massage", "deep-recovery", "cupping-additional"],
    focus: ["Remedial", "Deep Tissue", "Sports Recovery"],
    yearsExperience: 10,
    initials: "DC",
    accent: "from-gold-light to-gold-dark",
  },
  {
    id: "sophie-nguyen",
    name: "Sophie Nguyen",
    title: "Relaxation & Aromatherapy Specialist",
    bio: "Sophie creates deeply restorative experiences, pairing flowing relaxation massage with bespoke aromatherapy blends for total calm.",
    specialties: ["relaxation-massage", "aromatherapy", "deep-recovery"],
    focus: ["Relaxation", "Aromatherapy", "Hot Stone"],
    yearsExperience: 8,
    initials: "SN",
    accent: "from-sand-300 to-sand-400",
  },
  {
    id: "amara-okafor",
    name: "Amara Okafor",
    title: "Reflexologist & Foot Care Therapist",
    bio: "Amara is our foot-care expert, combining reflexology with soothing rituals to relieve tired legs and bring the whole body back into balance.",
    specialties: ["foot-care", "relaxation-massage", "aromatherapy"],
    focus: ["Reflexology", "Foot Haven", "Relaxation"],
    yearsExperience: 9,
    initials: "AO",
    accent: "from-sage-300 to-sage-500",
  },
  {
    id: "james-park",
    name: "James Park",
    title: "Remedial & Recovery Therapist",
    bio: "James focuses on long-form recovery sessions, integrating deep tissue, heat and assisted stretch to reset tight, overworked bodies.",
    specialties: ["remedial-massage", "deep-recovery", "relaxation-massage"],
    focus: ["Deep Recovery", "Remedial", "Hot Stone"],
    yearsExperience: 12,
    initials: "JP",
    accent: "from-brown-700 to-brown-900",
  },
];

export function getStaffById(id: string): StaffMember | undefined {
  return staff.find((member) => member.id === id);
}

/**
 * Professionals able to deliver every category required by the selected
 * treatments. When no treatments are selected, returns all staff.
 */
export function getStaffForCategories(categoryIds: CategoryId[]): StaffMember[] {
  if (categoryIds.length === 0) return staff;
  return staff.filter((member) =>
    categoryIds.every((categoryId) => member.specialties.includes(categoryId)),
  );
}
