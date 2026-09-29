const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const oldRegex = /\{\/\* Notice History Panel \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;

const newModal = `{/* Notice History Popup */}
        {isNoticeHistoryOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsNoticeHistoryOpen(false)}>
            <div className="bg-[#f2f2f7] dark:bg-black w-full max-w-sm max-h-[80vh] rounded-[2rem] shadow-2xl flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 overflow-hidden border border-slate-100 dark:border-white/5" onClick={e => e.stopPropagation()}>
              <div className="p-5 bg-white dark:bg-[#1c1c1e] border-b border-slate-100 dark:border-white/5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                    <IconBell size={24} className="text-primary" /> 알림 내역
                  </h3>
                  {unreadNoticeCount > 0 && (
                    <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">{unreadNoticeCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadNoticeCount > 0 && (
                    <button onClick={() => setNoticeHistory(prev => prev.map(n => ({...n, read: true})))} className="text-xs font-bold text-slate-500 hover:text-primary transition-colors bg-slate-100 dark:bg-white/5 px-2 py-1.5 rounded-lg">
                      모두 읽음
                    </button>
                  )}
                  <button onClick={() => setIsNoticeHistoryOpen(false)} className="p-1 -m-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                    <IconX size={24} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
                {noticeHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
                    <IconBellX size={40} className="text-slate-300 dark:text-slate-600" />
                    <span className="text-sm font-medium">새로운 알림이 없습니다.</span>
                  </div>
                ) : (
                  noticeHistory.map((notice) => (
                    <div 
                      key={notice.id} 
                      onClick={() => {
                        if (!notice.read) {
                          setNoticeHistory(prev => prev.map(n => n.id === notice.id ? {...n, read: true} : n));
                        }
                      }}
                      className={\`p-4 rounded-2xl shadow-sm transition-colors cursor-pointer border \${notice.read ? 'bg-white dark:bg-[#1c1c1e] border-transparent dark:border-white/5 opacity-70' : 'bg-white dark:bg-[#1c1c1e] border-primary/30 dark:border-primary/50'}\`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs text-slate-400 font-medium">{format(new Date(notice.date), 'yyyy년 MM월 dd일 HH:mm')}</div>
                        {!notice.read && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                      </div>
                      <p className={\`text-sm font-medium leading-relaxed whitespace-pre-wrap \${notice.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200 font-bold'}\`}>{notice.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}`;

app = app.replace(oldRegex, newModal);
fs.writeFileSync('src/App.tsx', app);
console.log("Updated Notice History Modal to popup style");
