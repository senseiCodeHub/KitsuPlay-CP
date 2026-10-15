-- App release metadata used by the admin console and the public Flutter update endpoint.
create table if not exists public.app_updates (
  id uuid primary key default gen_random_uuid(),
  version text not null check (char_length(version) between 1 and 32),
  version_code integer not null check (version_code >= 0),
  title text not null default '' check (char_length(title) <= 160),
  body text not null default '' check (char_length(body) <= 8000),
  download_url text not null default '',
  force_update boolean not null default false,
  is_active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists app_updates_active_idx
  on public.app_updates (created_at desc)
  where is_active;

alter table public.app_updates enable row level security;

create policy "Anyone can read active app updates"
  on public.app_updates
  for select
  to anon, authenticated
  using (
    is_active
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );
