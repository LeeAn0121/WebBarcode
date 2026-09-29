import React, { useEffect, useRef, useState } from 'react';
import { supabase, isAdminEmail } from './supabaseClient';
import { Toaster, toast } from 'sonner';
import { IconRocket, IconEdit, IconShieldLock, IconBrandGoogle, IconLogout, IconUsers, IconBug, IconTrash, IconFilter } from '@tabler/icons-react';

type LogRow = { id: number; created_at: string; level: string; message: string; meta: any; session_id: string; user_agent: string; path: string; };
type PresenceInfo = { session_id: string; user_agent: string; path: string; email: string | null; online_at: string; };

export default function AdminPage() {
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [visitors, setVisitors] = useState<PresenceInfo[]>([]);
  const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [adminTab, setAdminTab] = useState<'visitors' | 'notices' | 'logs'>('visitors');
  const [noticeText, setNoticeText] = useState('');
  const [notices, setNotices] = useState<{id: string, message: string, created_at: string}[]>([]);
  const [editingNotice, setEditingNotice] = useState<{id: string, message: string} | null>(null);
  
  const sendNotice = async () => {
    if (!noticeText.trim()) return;
    if (!adminChannelRef.current) return toast.error('서버와 연결 중입니다. 잠시 후 다시 시도해주세요.');
    adminChannelRef.current.send({
      type: 'broadcast',
      event: 'admin_command',
      payload: { type: 'system_notice', message: noticeText }
    });
    toast.success('공지사항 전송됨');
    setNoticeText('');
  };
  
  const forceKick = (email: string) => {
    if (!window.confirm(`${email} 사용자를 강제 로그아웃 시킬까요?`)) return;
    if (!adminChannelRef.current) return toast.error('서버와 연결 중입니다. 잠시 후 다시 시도해주세요.');
    adminChannelRef.current.send({
      type: 'broadcast',
      event: 'admin_command',
      payload: { type: 'force_kick', target_email: email }
    });
    toast.success('강제 퇴장 명령 전송됨');
  };
  const logsRef = useRef<LogRow[]>([]);

  
  const adminChannelRef = useRef<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setChecking(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    
    // Admin 채널 구독 유지
    const channel = supabase.channel('wb-admin-actions');
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        adminChannelRef.current = channel;
      }
    });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
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
    supabase.from('debug_logs').select('*').order('created_at', { ascending: false }).limit(200)
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) { toast.error('로그 조회 실패: ' + error.message); return; }
        setLogs(data || []);
        logsRef.current = data || [];
      });
    const channel = supabase.channel('admin-debug-logs').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'debug_logs' }, (payload) => {
        const next = [payload.new as LogRow, ...logsRef.current].slice(0, 500);
        logsRef.current = next;
        setLogs(next);
      }).subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const presenceChannel = supabase.channel('wb-presence', { config: { presence: { key: 'admin-viewer-' + Math.random().toString(36).slice(2) } } });
    presenceChannel.on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const list: PresenceInfo[] = Object.values(state).flatMap((entries: any) => entries as PresenceInfo[]);
        setVisitors(list);
      }).subscribe();
    return () => { supabase.removeChannel(presenceChannel); };
  }, [isAdmin]);

  const login = async () => { await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } }); };
  const clearLogs = async () => {
    if (!window.confirm('전체 로그를 삭제할까요?')) return;
    const { error } = await supabase.from('debug_logs').delete().not('id', 'is', null);
    if (error) return toast.error('삭제 실패: ' + error.message);
    setLogs([]); logsRef.current = []; toast.success('로그 삭제됨');
  };

  if (checking || (session && !adminChecked)) return (
    <div className="min-h-screen bg-[#f2f2f7] dark:bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-black/10 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin"></div>
    </div>
  );

  if (!session) return (
    <div className="min-h-screen bg-[#f2f2f7] dark:bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] p-8 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.06)] flex flex-col items-center text-center">
        <IconShieldLock size={48} className="text-black dark:text-white mb-6" />
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">WebBarcode Admin</h2>
        <p className="text-slate-500 mb-8 text-sm">관리자 계정으로 로그인하세요.</p>
        <button onClick={login} className="w-full bg-[#f2f2f7] hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-black dark:text-white transition-colors py-4 rounded-2xl font-bold flex items-center justify-center gap-3">
          <IconBrandGoogle size={20} /> Google로 계속
        </button>
      </div>
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen bg-[#f2f2f7] dark:bg-black flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white dark:bg-[#1c1c1e] p-8 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.06)] flex flex-col items-center text-center">
        <IconShieldLock size={48} className="text-red-500 mb-6" />
        <h2 className="text-2xl font-bold text-black dark:text-white mb-2">접근 거부</h2>
        <p className="text-slate-500 text-sm mb-6"><span className="font-bold text-black dark:text-white">{session.user.email}</span><br/>계정은 관리자가 아닙니다.</p>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="w-full bg-[#f2f2f7] dark:bg-white/10 text-black dark:text-white transition-colors py-4 rounded-2xl font-bold">
          다른 계정으로 로그인
        </button>
      </div>
    </div>
  );

  const filteredLogs = levelFilter === 'all' ? logs : logs.filter(l => l.level === levelFilter);

  return (
    <div className="min-h-screen bg-[#f2f2f7] dark:bg-[#000000] text-slate-900 dark:text-white font-sans p-6 md:p-12">
      <Toaster position="top-center" />
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-4">
          <div>
            <h1 className="font-bold text-4xl tracking-tight mb-2">Admin Center</h1>
            <p className="text-slate-500 font-medium">현재 접속 계정: {session.user.email}</p>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="bg-white dark:bg-[#1c1c1e] hover:bg-slate-50 dark:hover:bg-[#2c2c2e] text-red-500 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-sm transition-all">
            <IconLogout size={18} /> 로그아웃
          </button>
        </header>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Admin Sidebar / Tabs */}
          <div className="md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
            <button 
              onClick={() => setAdminTab('visitors')} 
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all whitespace-nowrap ${adminTab === 'visitors' ? 'bg-white dark:bg-[#1c1c1e] text-blue-500 shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-white/5'}`}
            >
              <IconUsers size={20} /> 실시간 접속자
            </button>
            <button 
              onClick={() => setAdminTab('notices')} 
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all whitespace-nowrap ${adminTab === 'notices' ? 'bg-white dark:bg-[#1c1c1e] text-purple-500 shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-white/5'}`}
            >
              <IconRocket size={20} /> 공지사항 관리
            </button>
            <button 
              onClick={() => setAdminTab('logs')} 
              className={`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all whitespace-nowrap ${adminTab === 'logs' ? 'bg-white dark:bg-[#1c1c1e] text-green-500 shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-white/5'}`}
            >
              <IconBug size={20} /> 시스템 로그
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0 flex flex-col gap-8">
            
            {/* VISITORS TAB */}
            {adminTab === 'visitors' && (
              <section className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] fluid-spring animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">실시간 접속자 현황</h3>
                  <span className="text-4xl font-bold text-blue-500">{visitors.length}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {visitors.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">접속 중인 사용자가 없습니다.</div>
                  ) : visitors.map((v, i) => (
                    <div key={i} className="bg-[#f2f2f7] dark:bg-black p-4 rounded-2xl flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{v.email || '익명'}</span>
                          <span className="text-xs text-slate-400">{v.session_id?.slice(0,6)}</span>
                        </div>
                        {v.email && v.email !== session.user.email && (
                          <button onClick={() => forceKick(v.email!)} className="text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors">강제퇴장</button>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{v.path}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* NOTICES TAB */}
            {adminTab === 'notices' && (
              <section className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] fluid-spring flex flex-col max-h-[800px] animate-in fade-in slide-in-from-bottom-4 duration-300">
                <h3 className="text-xl font-bold mb-6 shrink-0 text-purple-600 dark:text-purple-400 flex items-center gap-2"><IconRocket size={24}/> 공지사항 관리</h3>
                
                {/* Write Form */}
                <div className="flex flex-col gap-3 mb-6 shrink-0 pb-6 border-b border-slate-100 dark:border-white/10">
                  <textarea 
                    value={noticeText} 
                    onChange={e => setNoticeText(e.target.value)} 
                    placeholder="새로운 공지사항을 입력하세요. (등록 시 접속자에게 실시간 전송)" 
                    className="w-full bg-[#f2f2f7] dark:bg-black rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 border border-transparent dark:border-white/5 resize-none h-24" 
                  />
                  <button onClick={sendNotice} className="bg-purple-600 text-white font-bold py-3.5 rounded-xl hover:bg-purple-700 transition-colors shadow-sm">
                    새 공지 등록 및 실시간 전송
                  </button>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
                  {notices.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">등록된 공지사항이 없습니다.</div>
                  ) : notices.map(notice => (
                    <div key={notice.id} className="bg-[#f2f2f7] dark:bg-black p-5 rounded-2xl flex flex-col gap-3 border border-transparent dark:border-white/5">
                      {editingNotice?.id === notice.id ? (
                        <div className="flex flex-col gap-3">
                          <textarea 
                            value={editingNotice.message} 
                            onChange={e => setEditingNotice({...editingNotice, message: e.target.value})}
                            className="w-full bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none h-24"
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingNotice(null)} className="px-4 py-2 rounded-lg text-sm font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors">취소</button>
                            <button onClick={updateNotice} className="px-4 py-2 rounded-lg text-sm font-bold bg-purple-500 text-white hover:bg-purple-600 transition-colors">저장</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start">
                            <span className="text-xs text-slate-400 font-medium">{new Date(notice.created_at).toLocaleDateString()} {new Date(notice.created_at).toLocaleTimeString()}</span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => setEditingNotice({id: notice.id, message: notice.message})} className="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors" title="수정">
                                <IconEdit size={18} />
                              </button>
                              <button onClick={() => deleteNotice(notice.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="삭제">
                                <IconTrash size={18} />
                              </button>
                            </div>
                          </div>
                          <p className="font-medium text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{notice.message}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* LOGS TAB */}
            {adminTab === 'logs' && (
              <section className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] fluid-spring flex flex-col h-[800px] animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-green-600 dark:text-green-400 flex items-center gap-2"><IconBug size={24}/> 시스템 로그</h3>
                    <span className="bg-[#f2f2f7] dark:bg-black px-3 py-1 rounded-full text-sm font-bold text-slate-500">{filteredLogs.length}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-[#f2f2f7] dark:bg-black p-1.5 rounded-xl overflow-x-auto custom-scrollbar w-full sm:w-auto">
                    {(['all', 'info', 'warn', 'error'] as const).map(lv => (
                      <button key={lv} onClick={() => setLevelFilter(lv)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${levelFilter === lv ? 'bg-white dark:bg-[#1c1c1e] shadow-sm text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                        {lv.toUpperCase()}
                      </button>
                    ))}
                    <button onClick={clearLogs} className="px-4 py-2 rounded-lg text-sm font-bold text-red-500 hover:bg-white dark:hover:bg-[#1c1c1e] transition-all ml-2 flex items-center gap-1 shrink-0">
                      <IconTrash size={16}/> 삭제
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-2">
                  {filteredLogs.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400">데이터가 없습니다.</div>
                  ) : filteredLogs.map(log => (
                    <div key={log.id} className="bg-[#f2f2f7] dark:bg-black p-5 rounded-2xl flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${log.level==='error'?'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400':log.level==='warn'?'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400':'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</span>
                        <span className="text-xs text-slate-400 ml-auto truncate hidden sm:block max-w-[200px]">{log.path}</span>
                      </div>
                      <p className="font-medium text-sm mt-1">{log.message}</p>
                      {log.meta && Object.keys(log.meta).length > 0 && (
                        <pre className="mt-2 text-[11px] bg-white dark:bg-[#1c1c1e] p-3 rounded-xl overflow-x-auto custom-scrollbar text-slate-500 border border-slate-100 dark:border-white/5">
                          {JSON.stringify(log.meta, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
