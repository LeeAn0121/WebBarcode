const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update Notice History state type to include 'id' and 'read'
app = app.replace(
  /const \[noticeHistory, setNoticeHistory\] = useState<\{message: string, date: string\}\[\]>\(\(\) => \{/,
  `const [noticeHistory, setNoticeHistory] = useState<{id: string, message: string, date: string, read: boolean}[]>(() => {`
);

// 2. We don't need `unreadNoticeCount` state anymore. We can derive it.
// Let's replace `const [unreadNoticeCount, setUnreadNoticeCount] = useState<number>(0);`
app = app.replace(
  /const \[unreadNoticeCount, setUnreadNoticeCount\] = useState<number>\(0\);/,
  `const unreadNoticeCount = noticeHistory.filter(n => !n.read).length;`
);

// 3. Remove `setSystemNotice` and the systemNotice UI
// Let's just remove the state first:
app = app.replace(
  /const \[systemNotice, setSystemNotice\] = useState<\{isOpen: boolean, message: string\}>\(\{isOpen: false, message: ''\}\);\n/,
  ''
);

// 4. Update the receiver to push with id and read: false
app = app.replace(
  /setSystemNotice\(\{ isOpen: true, message \}\);\n\s*setNoticeHistory\(prev => \[\{message, date: new Date\(\)\.toISOString\(\)\}, \.\.\.prev\]\.slice\(0, 50\)\);\n\s*setUnreadNoticeCount\(prev => prev \+ 1\);/,
  `// setSystemNotice({ isOpen: true, message }); // Removed modal popup
        setNoticeHistory(prev => [{id: Math.random().toString(36).substring(2, 9), message, date: new Date().toISOString(), read: false}, ...prev].slice(0, 50));`
);

// 5. Update the Header Icon (remove `setUnreadNoticeCount(0)`)
app = app.replace(
  /setIsNoticeHistoryOpen\(true\); setUnreadNoticeCount\(0\);/,
  `setIsNoticeHistoryOpen(true);`
);

// 6. Update the NoticeHistoryModal UI
const oldNoticeModalRegex = /\{\/\* Notice History Panel \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*\)\}/;

const newNoticeModal = `{/* Notice History Panel */}
        {isNoticeHistoryOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsNoticeHistoryOpen(false)}>
            <div className="bg-[#f2f2f7] dark:bg-black w-full max-w-sm h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
              <div className="p-6 bg-white dark:bg-[#1c1c1e] border-b border-slate-100 dark:border-white/5 flex justify-between items-center shrink-0">
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
                  <button onClick={() => setIsNoticeHistoryOpen(false)} className="p-2 -m-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
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
                      className={\`p-5 rounded-2xl shadow-sm transition-colors cursor-pointer border \${notice.read ? 'bg-white dark:bg-[#1c1c1e] border-transparent dark:border-white/5 opacity-70' : 'bg-white dark:bg-[#1c1c1e] border-primary/30 dark:border-primary/50'}\`}
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

app = app.replace(oldNoticeModalRegex, newNoticeModal);

// 7. Remove the System Notice Modal JSX entirely
const sysNoticeRegex = /\{\/\* System Notice Modal \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
app = app.replace(sysNoticeRegex, '');

fs.writeFileSync('src/App.tsx', app);
console.log("Updated notice history with read/unread");
