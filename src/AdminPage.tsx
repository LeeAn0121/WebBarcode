import React, { useEffect, useRef, useState } from 'react';
import { supabase, ADMIN_EMAILS } from './supabaseClient';
import { Toaster, toast } from 'sonner';

type LogRow = {
  id: number;
  created_at: string;
  level: string;
  message: string;
  meta: any;
  session_id: string;
  user_agent: string;
  path: string;
};

type PresenceInfo = {
  session_id: string;
  user_agent: string;
  path: string;
  email: string | null;
  online_at: string;
};

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [visitors, setVisitors] = useState<PresenceInfo[]>([]);
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const logsRef = useRef<LogRow[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setChecking(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = !!session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  useEffect(() => {
    if (!isAdmin) return;

    let mounted = true;
    supabase
      .from('debug_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) { toast.error('로그 조회 실패: ' + error.message); return; }
        setLogs(data || []);
        logsRef.current = data || [];
      });

    const channel = supabase
      .channel('admin-debug-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debug_logs' }, (payload) => {
        const next = [payload.new as LogRow, ...logsRef.current].slice(0, 500);
        logsRef.current = next;
        setLogs(next);
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const presenceChannel = supabase.channel('wb-presence', {
      config: { presence: { key: 'admin-viewer-' + Math.random().toString(36).slice(2) } },
    });
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const list: PresenceInfo[] = Object.values(state).flatMap((entries: any) => entries as PresenceInfo[]);
        setVisitors(list);
      })
      .subscribe();
    return () => { supabase.removeChannel(presenceChannel); };
  }, [isAdmin]);

  const login = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
  };

  const clearLogs = async () => {
    if (!window.confirm('전체 로그를 삭제할까요?')) return;
    const { error } = await supabase.from('debug_logs').delete().not('id', 'is', null);
    if (error) return toast.error('삭제 실패: ' + error.message);
    setLogs([]);
    logsRef.current = [];
    toast.success('로그 삭제됨');
  };

  if (checking) {
    return <div style={{ padding: 24, fontFamily: 'monospace' }}>로딩중...</div>;
  }

  if (!session) {
    return (
      <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
        <h2>WebBarcode Admin</h2>
        <p>로그인이 필요합니다.</p>
        <button onClick={login} style={{ padding: '8px 16px' }}>Google로 로그인</button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
        <h2>접근 권한 없음</h2>
        <p>{session.user.email} 계정은 관리자가 아닙니다.</p>
      </div>
    );
  }

  const filteredLogs = levelFilter === 'all' ? logs : logs.filter(l => l.level === levelFilter);

  return (
    <div style={{ fontFamily: 'monospace', background: '#0b0f14', color: '#d6e2f0', minHeight: '100vh', padding: 16 }}>
      <Toaster position="bottom-center" theme="dark" />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>WebBarcode Admin</h2>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} style={{ background: '#1c2733', color: '#d6e2f0', border: '1px solid #33475a', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
          로그아웃
        </button>
      </div>

      <section style={{ marginBottom: 24 }}>
        <h3>실시간 접속자 ({visitors.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #33475a' }}>
                <th style={{ padding: 6 }}>세션ID</th>
                <th style={{ padding: 6 }}>이메일</th>
                <th style={{ padding: 6 }}>경로</th>
                <th style={{ padding: 6 }}>UA</th>
                <th style={{ padding: 6 }}>접속시각</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map((v, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1c2733' }}>
                  <td style={{ padding: 6 }}>{v.session_id?.slice(0, 10)}</td>
                  <td style={{ padding: 6 }}>{v.email || '-'}</td>
                  <td style={{ padding: 6 }}>{v.path}</td>
                  <td style={{ padding: 6, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.user_agent}</td>
                  <td style={{ padding: 6 }}>{v.online_at ? new Date(v.online_at).toLocaleTimeString() : '-'}</td>
                </tr>
              ))}
              {visitors.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 12, color: '#7a8ba0' }}>현재 접속자 없음</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>실시간 디버그 로그 ({filteredLogs.length})</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['all', 'info', 'warn', 'error'] as const).map(lv => (
              <button
                key={lv}
                onClick={() => setLevelFilter(lv)}
                style={{
                  background: levelFilter === lv ? '#33475a' : '#1c2733',
                  color: '#d6e2f0', border: '1px solid #33475a', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12,
                }}
              >{lv}</button>
            ))}
            <button onClick={clearLogs} style={{ background: '#5a1c1c', color: '#f0d6d6', border: '1px solid #7a3333', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
              전체삭제
            </button>
          </div>
        </div>
        <div style={{ maxHeight: '60vh', overflowY: 'auto', border: '1px solid #1c2733', borderRadius: 8 }}>
          {filteredLogs.map(log => (
            <div key={log.id} style={{
              padding: '8px 10px',
              borderBottom: '1px solid #141b23',
              fontSize: 12,
              color: log.level === 'error' ? '#ff8080' : log.level === 'warn' ? '#ffd080' : '#9fd6ff',
            }}>
              <div>
                <span style={{ color: '#7a8ba0' }}>{new Date(log.created_at).toLocaleTimeString()}</span>
                {' '}
                <b>[{log.level}]</b> {log.message}
                {' '}
                <span style={{ color: '#556577' }}>({log.session_id?.slice(0, 8)} · {log.path})</span>
              </div>
              {log.meta && Object.keys(log.meta).length > 0 && (
                <pre style={{ margin: '4px 0 0', color: '#7a8ba0', whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(log.meta, null, 0)}
                </pre>
              )}
            </div>
          ))}
          {filteredLogs.length === 0 && (
            <div style={{ padding: 16, color: '#7a8ba0' }}>로그 없음</div>
          )}
        </div>
      </section>
    </div>
  );
}
