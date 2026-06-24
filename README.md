# Chi Body Care — Website (Phase 1)

Official website for **Chi Body Care**, Adelaide's destination for relaxation &
remedial massage, acupuncture, foot care and traditional Chinese medicine.

Phase 1 delivers the **marketing website** plus a **Fresha-style front-end
booking flow** built entirely with static data and local React state. There is
no backend, payments or admin dashboard yet.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router)
- TypeScript
- Tailwind CSS v4
- Mobile-first, responsive, premium wellness/spa visual style
- Elegant serif headings (Cormorant Garamond) + clean sans-serif body (Jost)

## Pages

| Route       | Description                                                              |
| ----------- | ------------------------------------------------------------------------ |
| `/`         | Homepage — hero, treatment categories, featured services, why us, team preview, testimonials, CTA |
| `/services` | Full treatment menu grouped by category with sticky anchor navigation    |
| `/about`    | Brand story, values and therapist profiles                               |
| `/contact`  | Studio details, opening hours and a demo contact form (local state)      |
| `/book`     | Fresha-style multi-step booking flow                                     |
| `/booking`  | Alias that redirects to `/book` (query params preserved)                 |

## Booking flow (`/book`)

A 5-step flow powered by `useReducer` + React context (no backend save):

1. **Treatments** — select one or more treatments (grouped by category)
2. **Professional** — professionals filtered by the selected treatments, plus "Any professional"
3. **Date & time** — deterministic slots generated from business hours, respecting total service duration
4. **Your details** — validated contact form
5. **Confirmation** — generated booking reference and receipt-style summary

Features:

- Step progress indicator (with back-navigation to completed steps)
- Live booking summary sidebar on desktop, summary card on mobile
- Deep-link support to preselect a treatment, e.g. `/book?service=glow-facial`
  (multiple supported via `?service=a&service=b` or `?service=a,b`)

## Static data layer

All content lives in clean, typed modules under `src/lib/`:

- `services.ts` — treatment categories & services
- `staff.ts` — practitioners and their specialties
- `testimonials.ts` — client testimonials
- `business.ts` — business info, opening hours and the 13 Adelaide locations
- `scheduling.ts` — deterministic slot/day generation and booking references
- `format.ts` — currency, duration, time and date formatting helpers

## Getting started

```bash
# install dependencies
npm install

# start the dev server (http://localhost:3000)
npm run dev

# lint
npm run lint

# production build
npm run build

# run the production build
npm run start
```

## Project structure

```
src/
├─ app/                  # App Router pages (/, /services, /about, /contact, /book, /booking)
├─ components/
│  ├─ booking/           # Booking context, reducer, steps and summary
│  ├─ home/              # Homepage sections
│  └─ ui/                # Shared UI primitives (button, section heading, stars)
└─ lib/                  # Static data + utilities
```

> Phase 1 scope: no Supabase, no Stripe, no admin dashboard. All booking state
> is client-side only.
