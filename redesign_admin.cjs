const fs = require('fs');
let admin = fs.readFileSync('src/AdminPage.tsx', 'utf8');

// Add activeAdminTab state
admin = admin.replace(
  /const \[levelFilter, setLevelFilter\] = useState<'all' \| 'info' \| 'warn' \| 'error'>\('all'\);/,
  `const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');\n  const [adminTab, setAdminTab] = useState<'visitors' | 'notices' | 'logs'>('visitors');`
);

// Replace the grid layout with Tabs + Content
const oldGridRegex = /<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/;

const newLayout = `<div className="flex flex-col md:flex-row gap-8">
          
          {/* Admin Sidebar / Tabs */}
          <div className="md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
            <button 
              onClick={() => setAdminTab('visitors')} 
              className={\`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all whitespace-nowrap \${adminTab === 'visitors' ? 'bg-white dark:bg-[#1c1c1e] text-blue-500 shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-white/5'}\`}
            >
              <IconUsers size={20} /> 실시간 접속자
            </button>
            <button 
              onClick={() => setAdminTab('notices')} 
              className={\`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all whitespace-nowrap \${adminTab === 'notices' ? 'bg-white dark:bg-[#1c1c1e] text-purple-500 shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-white/5'}\`}
            >
              <IconRocket size={20} /> 공지사항 관리
            </button>
            <button 
              onClick={() => setAdminTab('logs')} 
              className={\`flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all whitespace-nowrap \${adminTab === 'logs' ? 'bg-white dark:bg-[#1c1c1e] text-green-500 shadow-sm' : 'text-slate-500 hover:bg-white/50 dark:hover:bg-white/5'}\`}
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
                      <button key={lv} onClick={() => setLevelFilter(lv)} className={\`px-4 py-2 rounded-lg text-sm font-bold transition-all \${levelFilter === lv ? 'bg-white dark:bg-[#1c1c1e] shadow-sm text-slate-800 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}\`}>
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
                        <span className={\`text-xs font-bold px-2 py-1 rounded-md \${log.level==='error'?'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400':log.level==='warn'?'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400':'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}\`}>
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
}`;

admin = admin.replace(oldGridRegex, newLayout);

// Ensure IconEdit is imported in AdminPage.tsx
if (!admin.includes('IconEdit')) {
  admin = admin.replace(
    /import \{([^}]+)\} from '@tabler\/icons-react';/,
    "import {$1, IconEdit} from '@tabler/icons-react';"
  );
}

fs.writeFileSync('src/AdminPage.tsx', admin);
console.log("Redesigned AdminPage to use Tabs");
