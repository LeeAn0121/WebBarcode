create table if not exists public.admin_emails (
  email text primary key
);

alter table public.admin_emails enable row level security;

-- 로그인한 사용자는 admin_emails 목록을 조회 가능 (이메일 목록 자체는 민감정보 아님)
drop policy if exists "admin_emails_select_own" on public.admin_emails;
drop policy if exists "admin_emails_select_authenticated" on public.admin_emails;
create policy "admin_emails_select_authenticated"
  on public.admin_emails for select
  to authenticated
  using (true);

delete from public.admin_emails where email = 'koolsignpad@gmail.com';
insert into public.admin_emails (email) values ('jggen0401@gmail.com')
  on conflict (email) do nothing;
