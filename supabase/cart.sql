-- 장바구니 기능용 테이블. Supabase → SQL Editor 에 붙여넣고 Run 하세요.

-- 1) 상품
create table if not exists public.products (
  id          bigint generated always as identity primary key,
  name        text    not null,
  description text,
  price       integer not null check (price >= 0),   -- 원 단위
  image_url   text,
  created_at  timestamptz not null default now()
);

-- 2) 장바구니 (사용자 1명이 같은 상품을 한 줄로 관리)
create table if not exists public.cart_items (
  id         bigint generated always as identity primary key,
  user_id    uuid   not null default auth.uid() references auth.users(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  quantity   integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index if not exists cart_items_user_id_idx on public.cart_items(user_id);

-- 3) RLS: 상품은 누구나 조회, 장바구니는 본인 것만 읽기/쓰기
alter table public.products   enable row level security;
alter table public.cart_items enable row level security;

drop policy if exists "products are readable by everyone" on public.products;
create policy "products are readable by everyone"
  on public.products for select using (true);

drop policy if exists "users manage their own cart" on public.cart_items;
create policy "users manage their own cart"
  on public.cart_items for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4) 샘플 상품 (선택)
insert into public.products (name, description, price, image_url) values
  ('한라봉 3kg',     '새콤달콤한 제주 한라봉',        24000, null),
  ('감귤 5kg',       '겨울 제철 노지 감귤',           15000, null),
  ('흑돼지 오겹살',  '제주 흑돼지 500g',              28000, null),
  ('돌하르방 기념품','현무암 돌하르방 미니어처',       12000, null);
