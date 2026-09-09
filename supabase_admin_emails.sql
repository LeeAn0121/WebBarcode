create table if not exists public.admin_emails (
  email text primary key
);

alter table public.admin_emails enable row level security;

-- 로그인한 사용자는 "자기 이메일이 admin_emails에 있는지"만 조회 가능 (전체 목록 노출 안 됨)
drop policy if exists "admin_emails_select_own" on public.admin_emails;
create policy "admin_emails_select_own"
  on public.admin_emails for select
  to authenticated
  using (email = (auth.jwt() ->> 'email'));

delete from public.admin_emails where email = 'koolsignpad@gmail.com';
insert into public.admin_emails (email) values ('jggen0401@gmail.com')
  on conflict (email) do nothing;
