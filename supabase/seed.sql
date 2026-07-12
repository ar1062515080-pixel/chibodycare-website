-- Phase 2 seed data migrated from src/lib/business.ts and src/lib/services.ts.
-- No sample therapists are inserted: real therapists must be created by an admin.

insert into public.locations (slug, name, phone, address, active) values
  ('city-myer-centre', 'City — Myer Centre', '08 8212 6626', 'Myer Centre, Adelaide CBD', true),
  ('westfield-marion', 'Westfield Marion', '08 8358 4696', 'Westfield Marion, Oaklands Park', true),
  ('westfield-marion-foot-haven', 'Westfield Marion — Foot Haven', '08 8298 8218', 'Westfield Marion, Oaklands Park', true),
  ('westfield-west-lakes', 'Westfield West Lakes', '08 8235 2635', 'Westfield West Lakes, West Lakes', true),
  ('westfield-modbury', 'Westfield Modbury', '08 8264 6550', 'Westfield Modbury, Modbury', true),
  ('elizabeth-city-centre', 'Elizabeth City Centre', '08 8255 0878', 'Elizabeth City Centre, Elizabeth', true),
  ('arndale-shopping-centre', 'Arndale Shopping Centre', '08 8244 3322', 'Arndale Central, Kilkenny', true),
  ('golden-grove-village', 'Golden Grove Village', '08 8289 2842', 'Golden Grove Village, Golden Grove', true),
  ('port-adelaide-plaza', 'Port Adelaide Plaza', '08 8241 1312', 'Port Adelaide Plaza, Port Adelaide', true),
  ('newton-village', 'Newton Village', '08 8336 2440', 'Newton Village, Newton', true),
  ('mitcham-square', 'Mitcham Square', '08 8271 9918', 'Mitcham Square, Mitcham', true),
  ('colonnades-shopping-centre', 'Colonnades Shopping Centre', '08 8382 8883', 'Colonnades, Noarlunga Centre', true),
  ('burnside-village', 'Burnside Village', '08 8379 5888', 'Burnside Village, Glenside', true)
on conflict (slug) do update set
  name = excluded.name,
  phone = excluded.phone,
  address = excluded.address,
  active = excluded.active;

with default_hours(day_of_week, open_time, close_time) as (
  values
    (0, '11:00'::time, '17:00'::time),
    (1, '09:00'::time, '17:30'::time),
    (2, '09:00'::time, '17:30'::time),
    (3, '09:00'::time, '17:30'::time),
    (4, '09:00'::time, '21:00'::time),
    (5, '09:00'::time, '17:30'::time),
    (6, '09:00'::time, '17:00'::time)
)
insert into public.location_opening_hours (
  location_id, day_of_week, open_time, close_time, closed
)
select l.id, h.day_of_week, h.open_time, h.close_time, false
from public.locations l
cross join default_hours h
on conflict (location_id, day_of_week) do update set
  open_time = excluded.open_time,
  close_time = excluded.close_time,
  closed = excluded.closed;

insert into public.services (
  slug, category, name, duration_minutes, price_cents, active
) values
  ('relaxation-20', 'relaxation', 'Relaxation Massage — 20 min', 20, 4000, true),
  ('relaxation-30', 'relaxation', 'Relaxation Massage — 30 min', 30, 5500, true),
  ('relaxation-45', 'relaxation', 'Relaxation Massage — 45 min', 45, 8000, true),
  ('relaxation-60', 'relaxation', 'Relaxation Massage — 60 min', 60, 10000, true),
  ('relaxation-90', 'relaxation', 'Relaxation Massage — 90 min', 90, 15000, true),
  ('relaxation-120', 'relaxation', 'Relaxation Massage — 120 min', 120, 20000, true),
  ('deep-recovery-20', 'deep-recovery', 'Deep Recovery — 20 min', 20, 4000, true),
  ('deep-recovery-30', 'deep-recovery', 'Deep Recovery — 30 min', 30, 5500, true),
  ('deep-recovery-45', 'deep-recovery', 'Deep Recovery — 45 min', 45, 8000, true),
  ('deep-recovery-60', 'deep-recovery', 'Deep Recovery — 60 min', 60, 10000, true),
  ('deep-recovery-90', 'deep-recovery', 'Deep Recovery — 90 min', 90, 15000, true),
  ('foot-care-20', 'foot-care', 'Foot Care — 20 min', 20, 4000, true),
  ('foot-care-30', 'foot-care', 'Foot Care — 30 min', 30, 5500, true),
  ('foot-care-45', 'foot-care', 'Foot Care — 45 min', 45, 8000, true),
  ('foot-care-60', 'foot-care', 'Foot Care — 60 min', 60, 10000, true),
  ('foot-care-60-hands', 'foot-care', 'Foot Care — 60 min (incl. Hands Massage)', 60, 10000, true),
  ('foot-care-60-neck-shoulders', 'foot-care', 'Foot Care — 60 min (incl. Neck & Shoulders Massage)', 60, 10000, true),
  ('foot-care-90-neck-shoulders-back', 'foot-care', 'Foot Care — 90 min (incl. Neck, Shoulders & Back Massage)', 90, 15000, true),
  ('aromatherapy-45', 'aromatherapy', 'Aromatherapy Massage — 45 min', 45, 9000, true),
  ('aromatherapy-60', 'aromatherapy', 'Aromatherapy Massage — 60 min', 60, 12000, true),
  ('aromatherapy-90', 'aromatherapy', 'Aromatherapy Massage — 90 min', 90, 17000, true),
  ('aromatherapy-120', 'aromatherapy', 'Aromatherapy Massage — 120 min', 120, 22000, true),
  ('remedial-20', 'remedial-pregnancy', 'Remedial / Pregnancy Massage — 20 min', 20, 4000, true),
  ('remedial-30', 'remedial-pregnancy', 'Remedial / Pregnancy Massage — 30 min', 30, 5500, true),
  ('remedial-45', 'remedial-pregnancy', 'Remedial / Pregnancy Massage — 45 min', 45, 8000, true),
  ('remedial-60', 'remedial-pregnancy', 'Remedial / Pregnancy Massage — 60 min', 60, 10000, true),
  ('remedial-90', 'remedial-pregnancy', 'Remedial / Pregnancy Massage — 90 min', 90, 15000, true),
  ('remedial-120', 'remedial-pregnancy', 'Remedial / Pregnancy Massage — 120 min', 120, 20000, true),
  ('acupuncture-initial', 'acupuncture', 'Acupuncture — Initial', 60, 12000, true),
  ('acupuncture-followup', 'acupuncture', 'Acupuncture — Follow Up', 45, 10000, true),
  ('acupuncture-massage-60', 'acupuncture', 'Acupuncture & Massage — 60 min', 60, 15500, true),
  ('acupuncture-massage-90', 'acupuncture', 'Acupuncture & Massage — 90 min', 90, 20000, true),
  ('cosmetic-acupuncture-initial', 'acupuncture', 'Cosmetic Acupuncture — Initial', 60, 15000, true),
  ('cosmetic-acupuncture-followup', 'acupuncture', 'Cosmetic Acupuncture — Follow Up', 45, 12000, true),
  ('chinese-medicine-consultation', 'acupuncture', 'Chinese Medicine Consultation', 30, 6000, true),
  ('ear-candling-head-massage', 'additional-services', 'Ear Candling & Head Massage — 30 min', 30, 5500, true),
  ('fire-cupping', 'additional-services', 'Traditional Fire Cupping', 20, 5000, true),
  ('fire-cupping-massage-45', 'additional-services', 'Traditional Fire Cupping & Massage — 45 min', 45, 10000, true),
  ('fire-cupping-massage-60', 'additional-services', 'Traditional Fire Cupping & Massage — 60 min', 60, 12500, true),
  ('fire-cupping-massage-75', 'additional-services', 'Traditional Fire Cupping & Massage — 75 min', 75, 14500, true),
  ('deluxe-90', 'deluxe-customised', 'Whole Body & Foot Massage — 90 min', 90, 15000, true),
  ('deluxe-120', 'deluxe-customised', 'Whole Body & Foot Massage — 120 min', 120, 20000, true),
  ('deluxe-150', 'deluxe-customised', 'Whole Body & Foot Massage — 150 min', 150, 24500, true),
  ('deluxe-180', 'deluxe-customised', 'Whole Body & Foot Massage — 180 min', 180, 29000, true)
on conflict (slug) do update set
  category = excluded.category,
  name = excluded.name,
  duration_minutes = excluded.duration_minutes,
  price_cents = excluded.price_cents,
  active = excluded.active;

