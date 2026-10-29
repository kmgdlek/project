-- 쿠폰 기능용. Supabase → SQL Editor 에 붙여넣고 Run 하세요.

create table if not exists public.coupons (
  code           text primary key,
  discount_type  text    not null check (discount_type in ('percent', 'amount')),
  discount_value integer not null check (discount_value > 0),  -- percent: 1~100, amount: 원
  active         boolean not null default true,
  expires_at     timestamptz
);

-- RLS를 켜고 정책을 만들지 않는다 → 테이블 직접 조회 불가(쿠폰 코드 목록이 새지 않음)
alter table public.coupons enable row level security;

-- 코드를 정확히 입력한 경우에만 할인 정보를 돌려주는 함수
create or replace function public.get_coupon(p_code text)
returns table (code text, discount_type text, discount_value integer)
language sql
security definer
set search_path = public
as $$
  select c.code, c.discount_type, c.discount_value
  from public.coupons c
  where upper(c.code) = upper(trim(p_code))
    and c.active
    and (c.expires_at is null or c.expires_at > now());
$$;

revoke all on function public.get_coupon(text) from public;
grant execute on function public.get_coupon(text) to authenticated;

-- 샘플 쿠폰
insert into public.coupons (code, discount_type, discount_value) values
  ('WELCOME10', 'percent', 10),
  ('JEJU50',    'percent', 50),
  ('SAVE5000',  'amount',  5000)
on conflict (code) do nothing;
