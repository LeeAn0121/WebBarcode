-- RLS 무한 루프(Infinite Recursion) 에러 수정 스크립트

-- 1. 무한 루프를 유발했던 잘못된 정책 삭제
DROP POLICY IF EXISTS "admin_emails_select_admin_only" ON public.admin_emails;
DROP POLICY IF EXISTS "admin_emails_select_own" ON public.admin_emails;
DROP POLICY IF EXISTS "admin_emails_select_authenticated" ON public.admin_emails;

-- 2. 관리자 이메일 테이블에 대한 조회 권한 수정 (무한 루프 방지)
-- 자신의 이메일과 일치하는 행만 조회할 수 있도록 심플하게 허용합니다.
CREATE POLICY "admin_emails_select_own"
  ON public.admin_emails FOR SELECT
  TO authenticated
  USING (
    email = (auth.jwt() ->> 'email')
  );

-- ※ debug_logs 테이블의 권한은 이전 스크립트에서 정상적으로 반영되었으므로 다시 실행할 필요 없습니다.
