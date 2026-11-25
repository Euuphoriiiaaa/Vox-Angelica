-- Run once in Supabase Dashboard > SQL Editor.
create table if not exists public.vox_state (
  id integer primary key check (id = 1),
  version bigint not null default 0,
  payload jsonb,
  updated_at timestamptz not null default now()
);
alter table public.vox_state enable row level security;
-- All data access is server-side through Vercel functions and the service-role key.
insert into public.vox_state (id,version,payload)
values (1,0,null) on conflict (id) do nothing;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('vox-files','vox-files',false,8388608,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;
