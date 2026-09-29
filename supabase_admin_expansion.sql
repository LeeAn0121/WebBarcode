-- RLS 무한 루프 없이 관리자 권한을 체크하기 위한 함수 생성
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  v_email text;
  v_is_admin boolean;
BEGIN
  v_email := auth.jwt() ->> 'email';
  IF v_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- RLS를 우회하여 조회 (SECURITY DEFINER와 동일한 효과를 내기 위해 단순 SELECT)
  SELECT EXISTS(SELECT 1 FROM public.admin_emails WHERE email = v_email) INTO v_is_admin;
  RETURN v_is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 정책 깔끔하게 리셋
DROP POLICY IF EXISTS "admin_emails_select_own" ON public.admin_emails;
DROP POLICY IF EXISTS "admin_emails_select_admin" ON public.admin_emails;
DROP POLICY IF EXISTS "admin_emails_insert" ON public.admin_emails;
DROP POLICY IF EXISTS "admin_emails_delete" ON public.admin_emails;

-- 1. SELECT (누구나 본인 것은 볼 수 있고, 관리자는 전부 볼 수 있음)
CREATE POLICY "admin_emails_select"
  ON public.admin_emails FOR SELECT
  TO authenticated
  USING (
    email = (auth.jwt() ->> 'email') OR public.is_admin()
  );

-- 2. INSERT (관리자만)
CREATE POLICY "admin_emails_insert"
  ON public.admin_emails FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 3. DELETE (관리자만)
CREATE POLICY "admin_emails_delete"
  ON public.admin_emails FOR DELETE
  TO authenticated
  USING (public.is_admin());
