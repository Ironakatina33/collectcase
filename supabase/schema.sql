-- Mythara database schema
-- Apply this in Supabase SQL editor (one shot).

-- ===== EXTENSIONS =====
create extension if not exists "uuid-ossp";

-- ===== PROFILES =====
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (length(username) between 3 and 20),
  coins bigint not null default 500,
  gems int not null default 5,
  xp int not null default 0,
  level int not null default 1,
  wins int not null default 0,
  losses int not null default 0,
  draws int not null default 0,
  pity_mythic int not null default 0,
  last_daily timestamptz,
  created_at timestamptz not null default now()
);

-- ===== USER CREATURES (the "cards" players actually own) =====
create table if not exists public.user_creatures (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  creature_id text not null,
  rarity text not null,
  level int not null default 1 check (level between 1 and 100),
  xp int not null default 0,
  shiny boolean not null default false,
  locked boolean not null default false,
  obtained_at timestamptz not null default now()
);
create index if not exists user_creatures_user_idx on public.user_creatures(user_id);
create index if not exists user_creatures_creature_idx on public.user_creatures(creature_id);

-- ===== MARKET =====
create table if not exists public.market_listings (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  user_creature_id uuid not null references public.user_creatures(id) on delete cascade,
  creature_id text not null,
  rarity text not null,
  level int not null,
  price bigint not null check (price > 0),
  status text not null default 'open' check (status in ('open','sold','cancelled')),
  buyer_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index if not exists market_status_idx on public.market_listings(status);
create unique index if not exists market_open_per_card on public.market_listings(user_creature_id) where status = 'open';

-- ===== TRADES =====
create table if not exists public.trades (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  sender_offer uuid[] not null default '{}',
  receiver_offer uuid[] not null default '{}',
  sender_coins bigint not null default 0,
  receiver_coins bigint not null default 0,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create index if not exists trades_receiver_idx on public.trades(receiver_id);
create index if not exists trades_sender_idx on public.trades(sender_id);

-- ===== BATTLES =====
create table if not exists public.battles (
  id uuid primary key default uuid_generate_v4(),
  p1_id uuid not null references public.profiles(id) on delete cascade,
  p2_id uuid references public.profiles(id),
  p1_creature uuid not null references public.user_creatures(id) on delete cascade,
  p2_creature_id text,
  winner text not null check (winner in ('p1','p2','draw')),
  rewards_coins int not null default 0,
  rewards_xp int not null default 0,
  log jsonb not null,
  mode text not null default 'pve' check (mode in ('pve','pvp')),
  created_at timestamptz not null default now()
);
create index if not exists battles_p1_idx on public.battles(p1_id);

-- ===== ACTIVITY (recent feed) =====
create table if not exists public.activity (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists activity_user_idx on public.activity(user_id, created_at desc);

-- ===== ROW LEVEL SECURITY =====
alter table public.profiles enable row level security;
alter table public.user_creatures enable row level security;
alter table public.market_listings enable row level security;
alter table public.trades enable row level security;
alter table public.battles enable row level security;
alter table public.activity enable row level security;

-- Profiles: anyone authed can read; user can update their own
drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select using (true);
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);

-- user_creatures: read own; mutate own (server-side functions handle transfers)
drop policy if exists "uc read" on public.user_creatures;
create policy "uc read" on public.user_creatures for select using (true);
drop policy if exists "uc self mutate" on public.user_creatures;
create policy "uc self mutate" on public.user_creatures for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- market: read all, insert own listings, update own
drop policy if exists "market read" on public.market_listings;
create policy "market read" on public.market_listings for select using (true);
drop policy if exists "market self insert" on public.market_listings;
create policy "market self insert" on public.market_listings for insert with check (auth.uid() = seller_id);
drop policy if exists "market self update" on public.market_listings;
create policy "market self update" on public.market_listings for update using (auth.uid() = seller_id);

-- trades: parties can see them, only sender can insert
drop policy if exists "trades visible" on public.trades;
create policy "trades visible" on public.trades for select using (auth.uid() in (sender_id, receiver_id));
drop policy if exists "trades sender insert" on public.trades;
create policy "trades sender insert" on public.trades for insert with check (auth.uid() = sender_id);
drop policy if exists "trades parties update" on public.trades;
create policy "trades parties update" on public.trades for update using (auth.uid() in (sender_id, receiver_id));

-- battles: read all (for spectating leaderboards), insert own
drop policy if exists "battles read" on public.battles;
create policy "battles read" on public.battles for select using (true);
drop policy if exists "battles self insert" on public.battles;
create policy "battles self insert" on public.battles for insert with check (auth.uid() = p1_id);

-- activity: read all, insert own
drop policy if exists "activity read" on public.activity;
create policy "activity read" on public.activity for select using (true);
drop policy if exists "activity self insert" on public.activity;
create policy "activity self insert" on public.activity for insert with check (auth.uid() = user_id);

-- ===== AUTOMATIC PROFILE CREATION =====
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_username text;
  final_username text;
  i int := 0;
begin
  base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'));
  if length(base_username) < 3 then
    base_username := 'dresseur' || floor(random()*9000+1000)::text;
  end if;
  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    i := i + 1;
    final_username := base_username || i::text;
  end loop;

  insert into public.profiles (id, username) values (new.id, final_username);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== TRADE EXECUTION RPC =====
create or replace function public.execute_trade(p_trade_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  t public.trades%rowtype;
  caller uuid := auth.uid();
begin
  select * into t from public.trades where id = p_trade_id for update;
  if not found then raise exception 'Trade introuvable'; end if;
  if t.status <> 'pending' then raise exception 'Échange déjà clos'; end if;
  if caller is null or caller <> t.receiver_id then raise exception 'Seul le destinataire peut accepter'; end if;

  -- Verify ownership of all offered cards by their respective parties
  if exists (
    select 1 from public.user_creatures
    where id = any(t.sender_offer) and user_id <> t.sender_id
  ) then raise exception 'Cartes du proposeur invalides'; end if;

  if exists (
    select 1 from public.user_creatures
    where id = any(t.receiver_offer) and user_id <> t.receiver_id
  ) then raise exception 'Cartes du destinataire invalides'; end if;

  -- Verify funds
  if (select coins from public.profiles where id = t.sender_id) < t.sender_coins then
    raise exception 'Fonds insuffisants côté proposeur';
  end if;
  if (select coins from public.profiles where id = t.receiver_id) < t.receiver_coins then
    raise exception 'Fonds insuffisants côté destinataire';
  end if;

  -- Swap cards
  if array_length(t.sender_offer, 1) > 0 then
    update public.user_creatures set user_id = t.receiver_id where id = any(t.sender_offer);
  end if;
  if array_length(t.receiver_offer, 1) > 0 then
    update public.user_creatures set user_id = t.sender_id where id = any(t.receiver_offer);
  end if;

  -- Swap coins
  update public.profiles set coins = coins - t.sender_coins + t.receiver_coins where id = t.sender_id;
  update public.profiles set coins = coins - t.receiver_coins + t.sender_coins where id = t.receiver_id;

  update public.trades set status = 'accepted', closed_at = now() where id = p_trade_id;
end;
$$;

grant execute on function public.execute_trade(uuid) to authenticated;

-- ===== MARKET BUY RPC =====
create or replace function public.buy_listing(p_listing_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  l public.market_listings%rowtype;
  buyer uuid := auth.uid();
  buyer_coins bigint;
begin
  select * into l from public.market_listings where id = p_listing_id for update;
  if not found then raise exception 'Annonce introuvable'; end if;
  if l.status <> 'open' then raise exception 'Annonce déjà clôturée'; end if;
  if buyer is null then raise exception 'Non authentifié'; end if;
  if buyer = l.seller_id then raise exception 'Tu ne peux pas acheter ta propre annonce'; end if;

  select coins into buyer_coins from public.profiles where id = buyer;
  if buyer_coins < l.price then raise exception 'Fonds insuffisants'; end if;

  -- Verify the card still belongs to seller
  if not exists (select 1 from public.user_creatures where id = l.user_creature_id and user_id = l.seller_id) then
    raise exception 'Carte indisponible';
  end if;

  update public.profiles set coins = coins - l.price where id = buyer;
  update public.profiles set coins = coins + l.price where id = l.seller_id;
  update public.user_creatures set user_id = buyer, locked = false where id = l.user_creature_id;
  update public.market_listings
    set status = 'sold', buyer_id = buyer, closed_at = now()
    where id = p_listing_id;
end;
$$;

grant execute on function public.buy_listing(uuid) to authenticated;

-- ===== LEADERBOARD VIEW =====
create or replace view public.leaderboard as
select
  p.id,
  p.username,
  p.level,
  p.xp,
  p.wins,
  p.losses,
  p.coins,
  (select count(distinct creature_id) from public.user_creatures uc where uc.user_id = p.id) as unique_creatures,
  (select count(*) from public.user_creatures uc where uc.user_id = p.id) as total_creatures
from public.profiles p;

grant select on public.leaderboard to anon, authenticated;
