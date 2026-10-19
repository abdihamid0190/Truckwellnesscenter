-- Driver posts: profiles, truck parking votes, tips, reports and blocks.
-- Run this once in the Supabase SQL editor (or with `supabase db push`).

-- Public driver handles. A profile is created right after first sign-in,
-- when the driver picks a handle and agrees to the community rules.
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  handle text not null unique
    check (char_length(handle) between 3 and 20 and handle ~ '^[A-Za-z0-9_]+$'),
  accepted_rules_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- One vote per driver per gym; voting again replaces the old vote.
create table public.parking_votes (
  gym_id text not null,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  can_park boolean not null,
  voted_at timestamptz not null default now(),
  primary key (gym_id, user_id)
);

create table public.tips (
  id bigint generated always as identity primary key,
  gym_id text not null,
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  body text not null check (char_length(btrim(body)) between 2 and 280),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index tips_gym_id_created_at_idx on public.tips (gym_id, created_at desc);

create table public.reports (
  tip_id bigint not null references public.tips on delete cascade,
  reporter_id uuid not null default auth.uid() references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tip_id, reporter_id)
);

create table public.blocks (
  blocker_id uuid not null default auth.uid() references public.profiles on delete cascade,
  blocked_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.profiles enable row level security;
alter table public.parking_votes enable row level security;
alter table public.tips enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

create policy "Handles are public" on public.profiles
  for select using (true);
create policy "Drivers create their own profile" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));

create policy "Votes are public" on public.parking_votes
  for select using (true);
create policy "Drivers cast their own vote" on public.parking_votes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Drivers change their own vote" on public.parking_votes
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Hidden tips and tips from drivers you blocked are left out.
create policy "Tips are public unless hidden or blocked" on public.tips
  for select using (
    not hidden
    and not exists (
      select 1 from public.blocks
      where blocker_id = (select auth.uid()) and blocked_id = tips.user_id
    )
  );
create policy "Drivers post their own tips" on public.tips
  for insert to authenticated with check (user_id = (select auth.uid()) and not hidden);
create policy "Drivers delete their own tips" on public.tips
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Drivers file their own reports" on public.reports
  for insert to authenticated with check (reporter_id = (select auth.uid()));

create policy "Drivers see their own blocks" on public.blocks
  for select to authenticated using (blocker_id = (select auth.uid()));
create policy "Drivers block for themselves" on public.blocks
  for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy "Drivers unblock for themselves" on public.blocks
  for delete to authenticated using (blocker_id = (select auth.uid()));

-- A tip disappears for everyone once three drivers report it. It stays in
-- the table so you can review it in the Supabase dashboard.
create function public.hide_reported_tip() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.reports where tip_id = new.tip_id) >= 3 then
    update public.tips set hidden = true where id = new.tip_id;
  end if;
  return new;
end;
$$;

create trigger hide_reported_tip after insert on public.reports
  for each row execute function public.hide_reported_tip();

-- Lets a driver delete their account from inside the app, which Apple
-- requires. Their profile, votes, tips, reports and blocks go with it.
create function public.delete_my_account() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
revoke execute on function public.hide_reported_tip() from public, anon, authenticated;
