-- RLS 권한 문제 수정 스크립트 (auth.users 조회 대신 JWT에서 직접 이메일 추출)

DROP POLICY IF EXISTS "debug_logs_select_admin_only" ON public.debug_logs;
DROP POLICY IF EXISTS "debug_logs_delete_admin_only" ON public.debug_logs;

CREATE POLICY "debug_logs_select_admin_only"
  ON public.debug_logs FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN (SELECT email FROM public.admin_emails)
  );

CREATE POLICY "debug_logs_delete_admin_only"
  ON public.debug_logs FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN (SELECT email FROM public.admin_emails)
  );

DROP POLICY IF EXISTS "admin_emails_select_admin_only" ON public.admin_emails;

CREATE POLICY "admin_emails_select_admin_only"
  ON public.admin_emails FOR SELECT
  TO authenticated
  USING (
    email = (auth.jwt() ->> 'email')
    OR 
    (auth.jwt() ->> 'email') IN (SELECT email FROM public.admin_emails)
  );
