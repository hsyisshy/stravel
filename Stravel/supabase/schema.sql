-- Enable extension for UUID generation (if not already enabled)
create extension if not exists pgcrypto;

-- groups
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  departure_date date not null,
  return_date date not null,
  meeting_point text not null,
  guide_name text not null,
  guide_phone text not null,
  notes text default '',
  admin_token text not null unique,
  created_at timestamptz not null default now()
);

-- participants (travelers)
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  name text not null,
  phone text not null,
  notes text default '',
  joined_at timestamptz not null default now()
);

create index if not exists idx_participants_group_id on public.participants(group_id);

-- announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  content text not null,
  pinned boolean not null default false,
  published_at timestamptz not null default now()
);

create index if not exists idx_announcements_group_id on public.announcements(group_id);
create index if not exists idx_announcements_published_at on public.announcements(published_at desc);

-- itinerary items
create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  item_date date not null,
  item_time time not null,
  title text not null,
  location text not null,
  description text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_itinerary_group_id on public.itinerary_items(group_id);
create index if not exists idx_itinerary_datetime on public.itinerary_items(item_date, item_time);

-- photos (image file in storage, URL in DB)
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  image_url text not null,
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_photos_group_id on public.photos(group_id);

-- attendance events
create table if not exists public.attendance_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_attendance_events_group_id on public.attendance_events(group_id);

-- attendance records
create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  event_id uuid not null references public.attendance_events(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  arrived boolean not null default false,
  unique (event_id, participant_id)
);

create index if not exists idx_attendance_records_group_id on public.attendance_records(group_id);
create index if not exists idx_attendance_records_event_id on public.attendance_records(event_id);

-- Optional: RLS (disabled by default for fast MVP migration)
-- alter table public.groups enable row level security;
-- alter table public.participants enable row level security;
-- alter table public.announcements enable row level security;
-- alter table public.itinerary_items enable row level security;
-- alter table public.photos enable row level security;
-- alter table public.attendance_events enable row level security;
-- alter table public.attendance_records enable row level security;

-- Storage bucket setup (run in SQL editor)
insert into storage.buckets (id, name, public)
values ('group-photos', 'group-photos', true)
on conflict (id) do nothing;

-- Public read policy for photo objects
drop policy if exists "Public can read group photos" on storage.objects;
create policy "Public can read group photos"
on storage.objects
for select
using (bucket_id = 'group-photos');

-- Public upload policy for MVP (no auth)
drop policy if exists "Public can upload group photos" on storage.objects;
create policy "Public can upload group photos"
on storage.objects
for insert
with check (bucket_id = 'group-photos');
