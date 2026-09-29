-- WebBarcode 보안 강화용 RLS 설정 스크립트
-- Supabase 대시보드 > SQL Editor 에서 이 스크립트를 복사하여 실행해주세요.

-- 1. 디버그 로그 테이블 정책 수정 (관리자 이메일 테이블에 등록된 사용자만 조회 및 삭제 가능)
DROP POLICY IF EXISTS "debug_logs_select_authenticated" ON public.debug_logs;
DROP POLICY IF EXISTS "debug_logs_delete_authenticated" ON public.debug_logs;

CREATE POLICY "debug_logs_select_admin_only"
  ON public.debug_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_emails 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "debug_logs_delete_admin_only"
  ON public.debug_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_emails 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 2. 관리자 이메일 목록 또한 관리자만 조회 가능하도록 제한 강화
DROP POLICY IF EXISTS "admin_emails_select_authenticated" ON public.admin_emails;
DROP POLICY IF EXISTS "admin_emails_select_own" ON public.admin_emails;

CREATE POLICY "admin_emails_select_admin_only"
  ON public.admin_emails FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) 
    OR 
    EXISTS (
      SELECT 1 FROM public.admin_emails 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
