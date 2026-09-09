import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://otxmccqqpfirmytlrchl.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90eG1jY3FxcGZpcm15dGxyY2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxOTIxNDUsImV4cCI6MjEwMzc2ODE0NX0.ZklBr-UroChsHlT9MggagEny_lRKE6yyWFb3RKVVKqY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 관리자 여부는 Supabase의 admin_emails 테이블로 관리 (코드 수정 없이 DB에서 추가/삭제 가능)
export async function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const { data, error } = await supabase
    .from('admin_emails')
    .select('email')
    .eq('email', email)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

const SESSION_ID_KEY = 'wb_debug_session_id';
export function getDebugSessionId() {
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

// debug_logs 테이블에 로그 적재 (테이블 없으면 조용히 무시)
export async function logDebug(level: 'info' | 'warn' | 'error', message: string, meta: Record<string, any> = {}) {
  try {
    await supabase.from('debug_logs').insert([{
      level,
      message,
      meta,
      session_id: getDebugSessionId(),
      user_agent: navigator.userAgent,
      path: window.location.pathname,
    }]);
  } catch (e) {
    // 로깅 실패는 무시 (테이블 미생성 등)
  }
}
