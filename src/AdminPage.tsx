import React, { useEffect, useRef, useState } from 'react';
import { supabase, isAdminEmail } from './supabaseClient';
import { Toaster, toast } from 'sonner';
import { IconShieldLock, IconBrandGoogle, IconLogout, IconUsers, IconBug, IconTrash, IconFilter } from '@tabler/icons-react';

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
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

  useEffect(() => {
    if (checking) return;
    if (!session?.user?.email) { setIsAdmin(false); setAdminChecked(true); return; }
    setAdminChecked(false);
    isAdminEmail(session.user.email).then(v => { setIsAdmin(v); setAdminChecked(true); });
  }, [session?.user?.email, checking]);

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

  if (checking || (session && !adminChecked)) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Mesh Gradient Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-blue-500/30 blur-[120px] mix-blend-screen"></div>
          <div className="absolute top-[10%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-500/30 blur-[120px] mix-blend-screen"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-sm bg-white/10 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mb-6 shadow-glow">
            <IconShieldLock size={32} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">WebBarcode Admin</h2>
          <p className="text-slate-400 mb-8 text-sm">시스템 관리 및 디버그 분석을 위해<br/>권한이 있는 계정으로 로그인하세요.</p>
          <button onClick={login} className="w-full bg-white text-black hover:bg-slate-200 transition-colors py-3.5 px-4 rounded-xl font-bold tracking-wide flex items-center justify-center gap-3">
            <IconBrandGoogle size={20} />
            Google 계정으로 계속
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="relative z-10 w-full max-w-sm bg-red-500/10 backdrop-blur-2xl border border-red-500/20 p-8 rounded-[2rem] shadow-2xl flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mb-6">
            <IconShieldLock size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">접근 권한 없음</h2>
          <p className="text-slate-400 text-sm mb-6"><span className="text-slate-200 font-semibold">{session.user.email}</span><br/>계정은 관리자 권한이 없습니다.</p>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="w-full bg-white/10 hover:bg-white/20 text-white transition-colors py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
            다른 계정으로 로그인
          </button>
        </div>
      </div>
    );
  }

  const filteredLogs = levelFilter === 'all' ? logs : logs.filter(l => l.level === levelFilter);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans p-4 sm:p-6 md:p-8 relative overflow-hidden">
      <Toaster position="bottom-center" theme="dark" />
      
      {/* 2026 Admin Glassmorphism Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[0%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[150px] mix-blend-screen"></div>
        <div className="absolute bottom-[0%] right-[10%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[150px] mix-blend-screen"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-6 h-full">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-[2rem]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-gradient-to-tr from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 text-white">
              <IconShieldLock size={20} />
            </div>
            <div>
              <h1 className="font-black text-white text-xl tracking-tight leading-tight">Admin Console</h1>
              <div className="text-xs text-slate-400 font-mono">{session.user.email}</div>
            </div>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
            <IconLogout size={16} /> 로그아웃
          </button>
        </header>

        {/* Bento Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Visitors Widget */}
          <div className="md:col-span-1 flex flex-col gap-4">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">현재 활성 세션</p>
                <div className="text-4xl font-black text-white">{visitors.length}<span className="text-lg text-slate-500 ml-1 font-normal">명</span></div>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
                <IconUsers size={24} />
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] flex flex-col overflow-hidden flex-1 max-h-[400px]">
              <div className="p-4 border-b border-white/10 bg-white/5 font-bold flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> 실시간 접속자
              </div>
              <div className="overflow-y-auto custom-scrollbar p-2 flex-1">
                {visitors.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-10">접속 중인 사용자가 없습니다.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {visitors.map((v, i) => (
                      <div key={i} className="bg-white/5 border border-white/5 p-3 rounded-xl flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-white">{v.email || '익명 사용자'}</span>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-md font-mono text-slate-300">{v.session_id?.slice(0, 8)}</span>
                        </div>
                        <div className="text-xs text-slate-400 truncate">{v.path}</div>
                        <div className="text-[10px] text-slate-500 truncate">{v.user_agent}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logs Widget */}
          <div className="md:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] flex flex-col overflow-hidden h-[600px] md:h-auto">
            <div className="p-4 sm:p-5 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2 font-bold">
                <IconBug className="text-primary" size={20} /> 실시간 디버그 로그 
                <span className="bg-white/10 text-xs px-2 py-0.5 rounded-full text-slate-300 ml-1">{filteredLogs.length}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                  {(['all', 'info', 'warn', 'error'] as const).map(lv => (
                    <button
                      key={lv}
                      onClick={() => setLevelFilter(lv)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${levelFilter === lv ? (lv === 'error' ? 'bg-red-500 text-white' : lv === 'warn' ? 'bg-orange-500 text-white' : 'bg-primary text-white') : 'text-slate-400 hover:text-white'}`}
                    >{lv}</button>
                  ))}
                </div>
                <button onClick={clearLogs} className="ml-auto sm:ml-0 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors">
                  <IconTrash size={14} /> 지우기
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 bg-black/20">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                  <IconFilter size={32} className="opacity-20" />
                  <p className="text-sm">로그 데이터가 없습니다.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 font-mono text-[11px] sm:text-xs">
                  {filteredLogs.map(log => (
                    <div key={log.id} className={`p-3 rounded-xl border flex flex-col gap-1.5 break-all ${
                      log.level === 'error' ? 'bg-red-950/30 border-red-900/50 text-red-200' :
                      log.level === 'warn' ? 'bg-orange-950/30 border-orange-900/50 text-orange-200' :
                      'bg-white/5 border-white/5 text-slate-300'
                    }`}>
                      <div className="flex gap-2 items-start">
                        <span className="opacity-50 shrink-0 mt-0.5">{new Date(log.created_at).toLocaleTimeString()}</span>
                        <span className={`px-1.5 rounded text-[10px] font-bold uppercase shrink-0 mt-0.5 ${
                          log.level === 'error' ? 'bg-red-500/20 text-red-400' :
                          log.level === 'warn' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>{log.level}</span>
                        <span className="flex-1 leading-relaxed font-sans font-medium">{log.message}</span>
                      </div>
                      <div className="flex flex-col gap-1 pl-16">
                        <span className="opacity-40 flex items-center gap-2">
                          <span>ID: {log.session_id?.slice(0, 8)}</span>
                          <span>|</span>
                          <span className="truncate">{log.path}</span>
                        </span>
                        {log.meta && Object.keys(log.meta).length > 0 && (
                          <pre className="mt-1 p-2 bg-black/40 rounded-lg overflow-x-auto text-[10px] opacity-80 leading-snug custom-scrollbar">
                            {JSON.stringify(log.meta, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
