-- Tables + RLS + Storage policies
create table if not exists public.projects (
  id text primary key,
  title text not null,
  department text not null,
  sponsor text,
  type text not null,
  impact text not null,
  effort text not null,
  description text,
  cost_sar numeric,
  expected_savings_sar numeric,
  attachments jsonb not null default '[]'::jsonb,
  status text not null,
  completion_pct integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.ideas (
  id text primary key,
  title text not null,
  owner text,
  department text,
  benefit_note text,
  effort_note text,
  stage text not null,
  created_at timestamptz not null default now()
);
alter table public.projects enable row level security;
alter table public.ideas    enable row level security;
drop policy if exists "projects all" on public.projects;
create policy "projects all" on public.projects for all to public using (true) with check (true);
drop policy if exists "ideas all" on public.ideas;
create policy "ideas all" on public.ideas for all to public using (true) with check (true);

-- Storage bucket 'attachments' (public) and policies
insert into storage.buckets (id, name, public)
select 'attachments', 'attachments', true
where not exists (select 1 from storage.buckets where id = 'attachments');

drop policy if exists "attachments public read" on storage.objects;
create policy "attachments public read" on storage.objects for select to public using (bucket_id = 'attachments');

drop policy if exists "attachments public upload" on storage.objects;
create policy "attachments public upload" on storage.objects for insert to public with check (bucket_id = 'attachments');

drop policy if exists "attachments public delete" on storage.objects;
create policy "attachments public delete" on storage.objects for delete to public using (bucket_id = 'attachments');

drop policy if exists "attachments public update" on storage.objects;
create policy "attachments public update" on storage.objects for update to public using (bucket_id = 'attachments') with check (bucket_id = 'attachments');
