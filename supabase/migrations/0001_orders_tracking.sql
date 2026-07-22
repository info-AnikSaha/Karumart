-- =============================================================================
-- KaruMart — Orders, Automatic ID Generation & Real-time Tracking
-- Migration 0001
-- =============================================================================
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- It is idempotent-friendly for a fresh project. Assumes the `profiles` table
-- from README.md already exists.
--
-- Provides:
--   * order_status enum (full lifecycle)
--   * orders table with denormalized customer fields (no profiles join needed
--     for display or realtime)
--   * order_status_history audit trail
--   * order_number_counters for race-safe daily-reset numbering
--   * automatic order_number generation:  KM-YYMMDD-NNNN  (Asia/Dhaka day)
--   * automatic status-change logging + updated_at maintenance
--   * Supabase Realtime enabled on orders + order_status_history
--   * Row Level Security (admin full access, buyers see own orders)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Clean slate (makes this migration safely re-runnable)
-- ---------------------------------------------------------------------------
-- Drops the objects this migration owns. IMPORTANT: this also removes any
-- pre-existing `orders` table from the old README example schema (which used
-- `id SERIAL` / integer and is incompatible with the new uuid-based design).
-- The app only ever used mock order data, so no real orders are lost. If you
-- have real data in an old `orders` table, back it up before running this.
drop table if exists public.order_status_history cascade;
drop table if exists public.orders cascade;
drop table if exists public.order_number_counters cascade;
drop function if exists public.generate_order_number() cascade;
drop function if exists public.orders_set_updated_at() cascade;
drop function if exists public.log_order_status_change() cascade;

-- ---------------------------------------------------------------------------
-- Enum: order lifecycle
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type order_status as enum (
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'returned'
    );
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- Table: order_number_counters  (one row per day; drives the daily sequence)
-- ---------------------------------------------------------------------------
create table if not exists public.order_number_counters (
  date_key date primary key,
  last_seq int not null
);

-- ---------------------------------------------------------------------------
-- Table: orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text unique,                       -- set by trigger: KM-YYMMDD-NNNN
  customer_id       uuid references public.profiles(id) on delete set null,
  -- denormalized snapshot of the customer at order time (display + realtime,
  -- no join back to profiles required)
  customer_name     text,
  customer_email    text,
  customer_phone    text,
  shipping_address  text,
  -- line items: [{ product_id, name, quantity, price }]
  items             jsonb        not null default '[]'::jsonb,
  subtotal          numeric(10,2) not null default 0,
  shipping_fee      numeric(10,2) not null default 0,
  total_amount      numeric(10,2) not null default 0,
  status            order_status not null default 'pending',
  payment_method    text,
  payment_status    text         not null default 'unpaid',
  notes             text,
  created_at        timestamptz  not null default now(),
  updated_at        timestamptz  not null default now()
);

create index if not exists idx_orders_customer_id on public.orders (customer_id);
create index if not exists idx_orders_status      on public.orders (status);
create index if not exists idx_orders_created_at  on public.orders (created_at desc);

-- ---------------------------------------------------------------------------
-- Table: order_status_history  (immutable audit trail)
-- ---------------------------------------------------------------------------
create table if not exists public.order_status_history (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders(id) on delete cascade,
  from_status order_status,
  to_status   order_status not null,
  changed_by  uuid references public.profiles(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists idx_order_status_history_order_id
  on public.order_status_history (order_id, created_at);

-- =============================================================================
-- Trigger function: generate order_number  (BEFORE INSERT, SECURITY DEFINER)
-- =============================================================================
-- Race-safe: the ON CONFLICT ... DO UPDATE locks the day's counter row, so
-- concurrent same-day inserts serialize and each receives a distinct last_seq.
-- SECURITY DEFINER lets it write order_number_counters even though that table's
-- RLS blocks all client roles.
create or replace function public.generate_order_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date := (now() at time zone 'Asia/Dhaka')::date;  -- computed once
  v_seq  int;
begin
  insert into public.order_number_counters (date_key, last_seq)
    values (v_date, 1)
    on conflict (date_key)
      do update set last_seq = public.order_number_counters.last_seq + 1
    returning last_seq into v_seq;

  -- Always authoritative; ignore any client-supplied order_number.
  new.order_number := 'KM-' || to_char(v_date, 'YYMMDD') || '-' || lpad(v_seq::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists trg_orders_set_number on public.orders;
create trigger trg_orders_set_number
  before insert on public.orders
  for each row
  execute function public.generate_order_number();

-- =============================================================================
-- Trigger function: maintain updated_at  (BEFORE UPDATE)
-- =============================================================================
create or replace function public.orders_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row
  execute function public.orders_set_updated_at();

-- =============================================================================
-- Trigger function: log status changes  (AFTER INSERT/UPDATE, SECURITY DEFINER)
-- =============================================================================
-- BEFORE INSERT (order_number) always runs before this AFTER trigger, so the
-- row — and its order_number — already exist when we log. SECURITY DEFINER
-- keeps client-side RLS on order_status_history from blocking the write.
create or replace function public.log_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
      values (new.id, null, new.status, auth.uid());
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.order_status_history (order_id, from_status, to_status, changed_by)
      values (new.id, old.status, new.status, auth.uid());
  end if;
  return null;  -- AFTER trigger return value is ignored
end;
$$;

drop trigger if exists trg_orders_log_status on public.orders;
create trigger trg_orders_log_status
  after insert or update on public.orders
  for each row
  execute function public.log_order_status_change();

-- =============================================================================
-- Realtime
-- =============================================================================
-- REPLICA IDENTITY FULL so UPDATE payloads include the previous row values
-- (needed by the tracking timeline to show from -> to transitions).
alter table public.orders replica identity full;

-- Add tables to the Supabase realtime publication (guarded against re-runs).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'order_status_history'
  ) then
    alter publication supabase_realtime add table public.order_status_history;
  end if;
end$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================
-- Helper: is the current user an admin? SECURITY DEFINER + STABLE avoids
-- recursive RLS evaluation against profiles inside every policy.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- orders --------------------------------------------------------------------
alter table public.orders enable row level security;

drop policy if exists orders_admin_all  on public.orders;
drop policy if exists orders_buyer_read on public.orders;

create policy orders_admin_all on public.orders
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy orders_buyer_read on public.orders
  for select
  using ((select auth.uid()) = customer_id);

-- order_status_history ------------------------------------------------------
alter table public.order_status_history enable row level security;

drop policy if exists osh_admin_all  on public.order_status_history;
drop policy if exists osh_buyer_read on public.order_status_history;

create policy osh_admin_all on public.order_status_history
  for all
  using (public.is_admin())
  with check (public.is_admin());

create policy osh_buyer_read on public.order_status_history
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_status_history.order_id
        and o.customer_id = (select auth.uid())
    )
  );

-- order_number_counters -----------------------------------------------------
-- RLS on with NO client policies: nothing but the SECURITY DEFINER trigger
-- can touch it.
alter table public.order_number_counters enable row level security;

-- =============================================================================
-- Seed data (demo parity with the previous mock orders)
-- =============================================================================
-- Inserted without order_number so the trigger assigns real KM-YYMMDD-NNNN ids.
insert into public.orders
  (customer_name, customer_email, customer_phone, shipping_address, items, subtotal, shipping_fee, total_amount, status, payment_method, payment_status)
values
  ('Rahim Ahmed',      'rahim@example.com',    '01712345678', 'Dhaka, Bangladesh',      '[{"name":"Handloom Cotton Saree","quantity":1,"price":2500}]'::jsonb, 2500, 0,  2500, 'delivered',        'cod',    'paid'),
  ('Fatima Begum',     'fatima@example.com',   '01812345678', 'Chittagong, Bangladesh', '[{"name":"Organic Wild Honey","quantity":2,"price":850}]'::jsonb,     1700, 0,  1700, 'processing',       'bkash',  'paid'),
  ('Karim Miah',       'karim@example.com',    '01912345678', 'Sylhet, Bangladesh',     '[{"name":"Bamboo Craft Basket","quantity":1,"price":1200}]'::jsonb,   1200, 60, 1260, 'shipped',          'cod',    'unpaid'),
  ('Nasrin Akter',     'nasrin@example.com',   '01612345678', 'Rajshahi, Bangladesh',   '[{"name":"Terracotta Water Pot","quantity":3,"price":650}]'::jsonb,   1950, 0,  1950, 'delivered',        'nagad',  'paid'),
  ('Jamal Uddin',      'jamal@example.com',    '01512345678', 'Khulna, Bangladesh',     '[{"name":"Jute Shopping Bag","quantity":5,"price":450}]'::jsonb,      2250, 0,  2250, 'cancelled',        'cod',    'unpaid'),
  ('Sultana Parvin',   'sultana@example.com',  '01798765432', 'Comilla, Bangladesh',    '[{"name":"Handmade Soap Set","quantity":2,"price":550}]'::jsonb,      1100, 60, 1160, 'confirmed',        'bkash',  'paid'),
  ('Mostafiz Rahman',  'mostafiz@example.com', '01898765432', 'Rangpur, Bangladesh',    '[{"name":"Pure Mustard Oil","quantity":4,"price":280}]'::jsonb,       1120, 0,  1120, 'out_for_delivery', 'cod',    'unpaid'),
  ('Rahima Khatun',    'rahima@example.com',   '01711223344', 'Dinajpur, Bangladesh',   '[{"name":"Clay Dinner Set","quantity":1,"price":3200}]'::jsonb,       3200, 0,  3200, 'pending',          'bkash',  'unpaid')
on conflict do nothing;
