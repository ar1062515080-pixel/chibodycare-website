export type Testimonial = {
  id: string;
  name: string;
  location: string;
  quote: string;
  rating: number;
  service: string;
};

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    name: "Hannah R.",
    location: "Westfield Marion",
    quote:
      "The most relaxing massage I've had in Adelaide. The space is calm, the therapists are skilled, and I left feeling completely renewed.",
    rating: 5,
    service: "Signature Relaxation Massage",
  },
  {
    id: "t2",
    name: "Marcus T.",
    location: "City — Myer Centre",
    quote:
      "After months of shoulder pain, a few remedial sessions made a huge difference. Genuinely caring and professional team.",
    rating: 5,
    service: "Remedial Massage",
  },
  {
    id: "t3",
    name: "Priya S.",
    location: "Burnside Village",
    quote:
      "I booked acupuncture for sleep and stress and noticed results almost immediately. Mei is wonderful and so knowledgeable.",
    rating: 5,
    service: "Acupuncture",
  },
  {
    id: "t4",
    name: "Olivia W.",
    location: "Westfield West Lakes",
    quote:
      "The reflexology foot treatment is my monthly ritual now. Such a beautiful, grounding experience every single time.",
    rating: 5,
    service: "Reflexology Foot Treatment",
  },
  {
    id: "t5",
    name: "Daniel K.",
    location: "Golden Grove Village",
    quote:
      "Booking online was effortless and the deep recovery session was exactly what my body needed. Highly recommend.",
    rating: 5,
    service: "Deep Recovery 90",
  },
  {
    id: "t6",
    name: "Aisha M.",
    location: "Colonnades",
    quote:
      "From the welcome to the aromatherapy massage, everything felt premium yet warm. My new go-to wellness spot.",
    rating: 5,
    service: "Aromatherapy Massage",
  },
];
