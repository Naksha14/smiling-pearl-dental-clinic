-- Run after your existing base schema if you already created it.
-- If starting fresh, this file contains the extra structures needed by the web app.

alter table public.profiles
  add column if not exists username text unique;

alter table public.profiles
  add column if not exists active boolean not null default true;

alter table public.patients
  add column if not exists opd_no text unique;

alter table public.patients
  add column if not exists deleted_at timestamptz;

alter table public.appointments
  add column if not exists deleted_at timestamptz;

alter table public.treatment_records
  add column if not exists deleted_at timestamptz;

alter table public.prescriptions
  add column if not exists opd_no text;

alter table public.prescriptions
  add column if not exists meal_guide_english text;

alter table public.prescriptions
  add column if not exists meal_guide_kannada text;

alter table public.prescriptions
  add column if not exists meal_guide_marathi text;

create table if not exists public.case_papers (
  id bigint generated always as identity primary key,
  patient_id bigint not null references public.patients(id) on delete cascade,
  doctor_id uuid references public.profiles(id) on delete set null,
  visit_date date not null default current_date,
  reason text,
  narrative text,
  oe text,
  adv_investigation text,
  investigation text,
  final_diagnosis text,
  rx_advised text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medicines (
  id bigint generated always as identity primary key,
  name text not null,
  brand_names text,
  strength text,
  dosage_form text,
  default_instructions text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prescription_items (
  id bigint generated always as identity primary key,
  prescription_id bigint not null references public.prescriptions(id) on delete cascade,
  medicine_id bigint references public.medicines(id) on delete set null,
  medicine_name text not null,
  strength text,
  dosage_form text,
  before_morning boolean not null default false,
  before_afternoon boolean not null default false,
  before_night boolean not null default false,
  after_morning boolean not null default false,
  after_afternoon boolean not null default false,
  after_night boolean not null default false,
  instructions_english text,
  instructions_kannada text,
  instructions_marathi text,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'general',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.patient_call_events (
  id bigint generated always as identity primary key,
  patient_id bigint not null references public.patients(id) on delete cascade,
  appointment_id bigint references public.appointments(id) on delete set null,
  doctor_id uuid references public.profiles(id) on delete set null,
  language text not null check (language in ('English','Kannada','Marathi')),
  voice_gender text not null default 'Female',
  message text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id bigint,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_case_papers_patient on public.case_papers(patient_id);
create index if not exists idx_medicines_name on public.medicines(name);
create index if not exists idx_prescription_items_prescription on public.prescription_items(prescription_id);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_call_events_created on public.patient_call_events(created_at desc);

alter table public.case_papers enable row level security;
alter table public.medicines enable row level security;
alter table public.prescription_items enable row level security;
alter table public.notifications enable row level security;
alter table public.patient_call_events enable row level security;
alter table public.audit_logs enable row level security;

alter table public.patient_call_events replica identity full;
