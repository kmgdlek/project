-- 주문 기능용 (여러 번 실행해도 안전). Supabase → SQL Editor 에 붙여넣고 Run 하세요.
-- 선행: cart.sql, coupons.sql 이 먼저 실행되어 있어야 합니다.

-- 1) 주문
create table if not exists public.orders (
  id             bigint generated always as identity primary key,
  user_id        uuid    not null references auth.users(id) on delete cascade,
  recipient_name text    not null,
  phone          text    not null,
  address        text    not null,
  subtotal       integer not null check (subtotal >= 0),
  discount       integer not null default 0 check (discount >= 0),
  total          integer not null check (total >= 0),
  coupon_code    text,
  status         text    not null default '주문완료',
  created_at     timestamptz not null default now()
);
create index if not exists orders_user_id_idx on public.orders(user_id, created_at desc);

-- 2) 주문 상품 (주문 시점의 이름/가격을 복사해 둔다)
create table if not exists public.order_items (
  id         bigint generated always as identity primary key,
  order_id   bigint  not null references public.orders(id) on delete cascade,
  product_id bigint  references public.products(id) on delete set null,
  name       text    not null,
  price      integer not null check (price >= 0),
  quantity   integer not null check (quantity > 0)
);
create index if not exists order_items_order_id_idx on public.order_items(order_id);

-- 3) RLS: 본인 주문만 조회. 직접 insert/update 정책은 만들지 않는다(아래 함수로만 생성).
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "users read their own orders" on public.orders;
create policy "users read their own orders"
  on public.orders for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users read their own order items" on public.order_items;
create policy "users read their own order items"
  on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- 4) 주문 생성 함수: 금액·쿠폰을 서버가 직접 계산하고, 한 트랜잭션에서 주문 생성 + 장바구니 비우기
create or replace function public.place_order(
  p_name text, p_phone text, p_address text, p_coupon text default null
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  uid     uuid := auth.uid();
  v_sub   integer;
  v_disc  integer := 0;
  v_cpn   public.coupons%rowtype;
  v_order bigint;
begin
  if uid is null then raise exception '로그인이 필요합니다.'; end if;
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_phone), '') = '' or coalesce(trim(p_address), '') = '' then
    raise exception '받는 분, 연락처, 배송지를 모두 입력해 주세요.';
  end if;

  select coalesce(sum(p.price * c.quantity), 0)::integer into v_sub
  from public.cart_items c join public.products p on p.id = c.product_id
  where c.user_id = uid;
  if v_sub = 0 then raise exception '장바구니가 비어 있습니다.'; end if;

  if p_coupon is not null then
    select c.* into v_cpn
    from public.coupons c
    join public.user_coupons uc on uc.coupon_code = c.code and uc.user_id = uid
    where c.code = p_coupon and c.active and (c.expires_at is null or c.expires_at > now());
    if not found then raise exception '사용할 수 없는 쿠폰입니다.'; end if;
    v_disc := least(
      v_sub,
      case when v_cpn.discount_type = 'percent'
           then floor(v_sub * v_cpn.discount_value / 100.0)::integer
           else v_cpn.discount_value end
    );
  end if;

  insert into public.orders (user_id, recipient_name, phone, address, subtotal, discount, total, coupon_code)
  values (uid, trim(p_name), trim(p_phone), trim(p_address), v_sub, v_disc, v_sub - v_disc, p_coupon)
  returning id into v_order;

  insert into public.order_items (order_id, product_id, name, price, quantity)
  select v_order, p.id, p.name, p.price, c.quantity
  from public.cart_items c join public.products p on p.id = c.product_id
  where c.user_id = uid;

  delete from public.cart_items where user_id = uid;
  if p_coupon is not null then   -- 사용한 쿠폰은 쿠폰함에서 소진
    delete from public.user_coupons where user_id = uid and coupon_code = p_coupon;
  end if;

  return v_order;
end;
$$;

revoke all on function public.place_order(text, text, text, text) from public;
grant execute on function public.place_order(text, text, text, text) to authenticated;

notify pgrst, 'reload schema';
