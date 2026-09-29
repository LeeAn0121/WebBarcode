-- WebBarcode 관리자 디버깅용 테이블
-- Supabase 대시보드 > SQL Editor 에서 실행하세요.

create table if not exists public.debug_logs (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  level text not null default 'info',
  message text not null,
  meta jsonb,
  session_id text,
  user_agent text,
  path text
);

alter table public.debug_logs enable row level security;

-- 누구나(anon) 로그를 남길 수 있음 (클라이언트에서 디버깅 로그 전송용)
drop policy if exists "debug_logs_insert_anon" on public.debug_logs;
create policy "debug_logs_insert_anon"
  on public.debug_logs for insert
  to anon, authenticated
  with check (true);

-- 로그인한 사용자만 조회 가능 (관리자 페이지에서 앱 코드로 이메일 재검증도 함께 수행)
drop policy if exists "debug_logs_select_authenticated" on public.debug_logs;
create policy "debug_logs_select_authenticated"
  on public.debug_logs for select
  to authenticated
  using (true);

-- 로그인한 사용자는 로그 삭제 가능 (관리자 페이지 '전체삭제' 버튼용)
drop policy if exists "debug_logs_delete_authenticated" on public.debug_logs;
create policy "debug_logs_delete_authenticated"
  on public.debug_logs for delete
  to authenticated
  using (true);

-- 오래된 로그 자동 정리를 원하면 아래처럼 주기적으로 실행 (선택)
-- delete from public.debug_logs where created_at < now() - interval '14 days';
