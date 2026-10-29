-- 쿠폰 / 쿠폰함 기능용 (여러 번 실행해도 안전). Supabase → SQL Editor 에 붙여넣고 Run 하세요.

-- 1) 쿠폰 목록 (특산품 페이지에 노출)
create table if not exists public.coupons (
  code           text primary key,
  discount_type  text    not null check (discount_type in ('percent', 'amount')),
  discount_value integer not null check (discount_value > 0),  -- percent: 1~100, amount: 원
  active         boolean not null default true,
  expires_at     timestamptz
);
alter table public.coupons add column if not exists description text;

alter table public.coupons enable row level security;
drop policy if exists "active coupons are readable" on public.coupons;
create policy "active coupons are readable"
  on public.coupons for select
  using (active and (expires_at is null or expires_at > now()));

-- 이전 버전에서 만들었던 함수는 더 이상 쓰지 않음
drop function if exists public.get_coupon(text);

-- 2) 쿠폰함: 사용자가 받은 쿠폰
create table if not exists public.user_coupons (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  coupon_code text not null references public.coupons(code) on delete cascade,
  claimed_at  timestamptz not null default now(),
  primary key (user_id, coupon_code)
);
alter table public.user_coupons enable row level security;
drop policy if exists "users manage their own coupons" on public.user_coupons;
create policy "users manage their own coupons"
  on public.user_coupons for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3) 샘플 쿠폰
insert into public.coupons (code, discount_type, discount_value, description) values
  ('WELCOME10', 'percent', 10,   '신규 가입 10% 할인'),
  ('JEJU50',    'percent', 50,   '제주 특가 50% 할인'),
  ('SAVE5000',  'amount',  5000, '5,000원 즉시 할인')
on conflict (code) do update set description = excluded.description;

-- 4) API 스키마 캐시 새로고침
notify pgrst, 'reload schema';
