-- Dónde Comemos: tablas, permisos y funciones.
-- Pégalo entero en Supabase > SQL Editor > New query y pulsa Run.
-- Se puede ejecutar más de una vez sin romper nada.

create extension if not exists pgcrypto;

-- Perfiles (uno por usuario)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default 'Sin nombre',
  avatar text not null default '😋',
  color text not null default '#E8572A',
  created_at timestamptz not null default now()
);

-- Listas personales
create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles on delete cascade default auth.uid(),
  title text not null,
  description text not null default '',
  emoji text not null default '⭐',
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.list_entries (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists on delete cascade,
  place jsonb not null,
  added_by uuid not null references public.profiles on delete cascade default auth.uid(),
  pros text not null default '',
  cons text not null default '',
  recommendation text not null default '',
  score int not null default 0 check (score between 0 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.list_likes (
  list_id uuid not null references public.lists on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  primary key (list_id, user_id)
);

-- Grupos
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text not null default '🍻',
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_by uuid not null references public.profiles on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null references public.profiles on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_entries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  place jsonb not null,
  added_by uuid not null references public.profiles on delete cascade default auth.uid(),
  pros text not null default '',
  cons text not null default '',
  recommendation text not null default '',
  score int not null default 0 check (score between 0 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.entry_votes (
  entry_id uuid not null references public.group_entries on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  primary key (entry_id, user_id)
);

create table if not exists public.group_comments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  question text not null,
  created_by uuid not null references public.profiles on delete cascade default auth.uid(),
  closed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls on delete cascade,
  text text not null,
  position int not null default 0
);

create table if not exists public.poll_votes (
  poll_id uuid not null references public.polls on delete cascade,
  option_id uuid not null references public.poll_options on delete cascade,
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  primary key (poll_id, user_id)
);

-- Sitios donde ha estado cada usuario
create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade default auth.uid(),
  place jsonb not null,
  visited_at timestamptz not null default now()
);

-- ¿Es el usuario actual miembro del grupo? (security definer evita recursión en las políticas)
create or replace function public.is_member(g uuid) returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from group_members where group_id = g and user_id = auth.uid());
$$;

-- Crea el perfil automáticamente al registrarse
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Quien crea un grupo entra como miembro
create or replace function public.handle_new_group() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into group_members (group_id, user_id) values (new.id, new.created_by) on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created after insert on public.groups
  for each row execute function public.handle_new_group();

-- Unirse a un grupo con su código. Devuelve el id del grupo o null si el código no existe.
create or replace function public.join_group(code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare g uuid;
begin
  select id into g from groups where invite_code = upper(trim(code));
  if g is null then return null; end if;
  insert into group_members (group_id, user_id) values (g, auth.uid()) on conflict do nothing;
  return g;
end;
$$;

grant execute on function public.join_group(text) to authenticated;

-- Permisos (Row Level Security)
alter table public.profiles enable row level security;
alter table public.lists enable row level security;
alter table public.list_entries enable row level security;
alter table public.list_likes enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_entries enable row level security;
alter table public.entry_votes enable row level security;
alter table public.group_comments enable row level security;
alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_votes enable row level security;
alter table public.visits enable row level security;

do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Perfiles: los ve cualquiera con sesión; cada uno edita el suyo
create policy "profiles read" on public.profiles for select to authenticated using (true);
create policy "profiles update own" on public.profiles for update to authenticated using (id = auth.uid());

-- Listas: las públicas las ve todo el mundo; el dueño hace todo con las suyas
create policy "lists read" on public.lists for select to authenticated using (is_public or owner_id = auth.uid());
create policy "lists insert" on public.lists for insert to authenticated with check (owner_id = auth.uid());
create policy "lists update" on public.lists for update to authenticated using (owner_id = auth.uid());
create policy "lists delete" on public.lists for delete to authenticated using (owner_id = auth.uid());

create policy "entries read" on public.list_entries for select to authenticated
  using (exists (select 1 from lists l where l.id = list_id and (l.is_public or l.owner_id = auth.uid())));
create policy "entries write" on public.list_entries for all to authenticated
  using (exists (select 1 from lists l where l.id = list_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from lists l where l.id = list_id and l.owner_id = auth.uid()));

create policy "likes read" on public.list_likes for select to authenticated using (true);
create policy "likes insert" on public.list_likes for insert to authenticated with check (user_id = auth.uid());
create policy "likes delete" on public.list_likes for delete to authenticated using (user_id = auth.uid());

-- Grupos: solo los miembros ven y escriben
create policy "groups read" on public.groups for select to authenticated using (is_member(id) or created_by = auth.uid());
create policy "groups insert" on public.groups for insert to authenticated with check (created_by = auth.uid());
create policy "groups update" on public.groups for update to authenticated using (is_member(id));

create policy "members read" on public.group_members for select to authenticated using (is_member(group_id));
create policy "members leave" on public.group_members for delete to authenticated using (user_id = auth.uid());

create policy "gentries read" on public.group_entries for select to authenticated using (is_member(group_id));
create policy "gentries insert" on public.group_entries for insert to authenticated with check (is_member(group_id) and added_by = auth.uid());
create policy "gentries update" on public.group_entries for update to authenticated using (added_by = auth.uid());
create policy "gentries delete" on public.group_entries for delete to authenticated using (added_by = auth.uid());

create policy "evotes read" on public.entry_votes for select to authenticated
  using (exists (select 1 from group_entries e where e.id = entry_id and is_member(e.group_id)));
create policy "evotes insert" on public.entry_votes for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from group_entries e where e.id = entry_id and is_member(e.group_id)));
create policy "evotes delete" on public.entry_votes for delete to authenticated using (user_id = auth.uid());

create policy "comments read" on public.group_comments for select to authenticated using (is_member(group_id));
create policy "comments insert" on public.group_comments for insert to authenticated with check (is_member(group_id) and user_id = auth.uid());
create policy "comments delete" on public.group_comments for delete to authenticated using (user_id = auth.uid());

create policy "polls read" on public.polls for select to authenticated using (is_member(group_id));
create policy "polls insert" on public.polls for insert to authenticated with check (is_member(group_id) and created_by = auth.uid());
create policy "polls update" on public.polls for update to authenticated using (created_by = auth.uid());

create policy "options read" on public.poll_options for select to authenticated
  using (exists (select 1 from polls p where p.id = poll_id and is_member(p.group_id)));
create policy "options insert" on public.poll_options for insert to authenticated
  with check (exists (select 1 from polls p where p.id = poll_id and p.created_by = auth.uid()));

create policy "pvotes read" on public.poll_votes for select to authenticated
  using (exists (select 1 from polls p where p.id = poll_id and is_member(p.group_id)));
create policy "pvotes insert" on public.poll_votes for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from polls p where p.id = poll_id and is_member(p.group_id) and not p.closed));
create policy "pvotes delete" on public.poll_votes for delete to authenticated using (user_id = auth.uid());

create policy "visits own" on public.visits for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
