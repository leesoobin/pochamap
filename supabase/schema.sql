-- 위치 테이블
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('chicken_skewer', 'bungeobbang', 'takoyaki')),
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  price text,
  hours text,
  description text,
  status text not null default 'approved' check (status in ('approved', 'closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 제보 테이블
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  location_id uuid references locations(id) on delete set null,
  type text not null check (type in ('chicken_skewer', 'bungeobbang', 'takoyaki')),
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  price text,
  hours text,
  description text,
  photo_url text,
  reporter_memo text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- updated_at 자동 갱신
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger locations_updated_at
  before update on locations
  for each row execute function update_updated_at();

-- RLS 설정
alter table locations enable row level security;
alter table reports enable row level security;

-- 위치: 누구나 승인된 것 조회 가능
create policy "locations_select" on locations
  for select using (status = 'approved');

-- 위치: 인증된 사용자(관리자)만 모든 작업 가능
create policy "locations_admin" on locations
  for all using (auth.role() = 'authenticated');

-- 제보: 누구나 삽입 가능
create policy "reports_insert" on reports
  for insert with check (true);

-- 제보: 인증된 사용자(관리자)만 조회/수정 가능
create policy "reports_admin" on reports
  for all using (auth.role() = 'authenticated');

-- 스토리지 버킷 (사진 업로드용) - Supabase 대시보드에서 'report-photos' 버킷 생성 필요
