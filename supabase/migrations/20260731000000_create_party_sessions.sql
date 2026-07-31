create table if not exists public.party_sessions (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.party_sessions enable row level security;

grant select, insert, update on public.party_sessions to anon;

create policy "Anyone can view the shared party session"
on public.party_sessions for select to anon using (true);

create policy "Anyone can create the shared party session"
on public.party_sessions for insert to anon with check (id = 'fiesta-principal');

create policy "Anyone can update the shared party session"
on public.party_sessions for update to anon
using (id = 'fiesta-principal')
with check (id = 'fiesta-principal');

alter publication supabase_realtime add table public.party_sessions;
