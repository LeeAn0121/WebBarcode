const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add states
app = app.replace(
  /const \[systemNotice, setSystemNotice\] = useState<{isOpen: boolean, message: string}>\(\{isOpen: false, message: ''\}\);/,
  `const [systemNotice, setSystemNotice] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ''});
  const [noticeHistory, setNoticeHistory] = useState<{message: string, date: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('noticeHistory') || '[]'); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('noticeHistory', JSON.stringify(noticeHistory)); }, [noticeHistory]);
  const [unreadNoticeCount, setUnreadNoticeCount] = useState<number>(0);
  const [isNoticeHistoryOpen, setIsNoticeHistoryOpen] = useState(false);`
);

// 2. Update the channelHook to push to noticeHistory
app = app.replace(
  /setSystemNotice\(\{ isOpen: true, message \}\);/,
  `setSystemNotice({ isOpen: true, message });
        setNoticeHistory(prev => [{message, date: new Date().toISOString()}, ...prev].slice(0, 50));
        setUnreadNoticeCount(prev => prev + 1);`
);

// 3. Add Bell Icon to Header
app = app.replace(
  /<button onClick=\{\(\) => setDarkMode\(!darkMode\)\} className="w-10 h-10 bg-white dark:bg-\[#1c1c1e\] text-slate-500 hover:text-primary flex items-center justify-center rounded-full shadow-sm transition-all">/,
  `<button onClick={() => { setIsNoticeHistoryOpen(true); setUnreadNoticeCount(0); }} className="relative w-10 h-10 bg-white dark:bg-[#1c1c1e] text-slate-500 hover:text-primary flex items-center justify-center rounded-full shadow-sm transition-all border border-transparent dark:border-white/5" title="알림">
              <IconBell size={18} />
              {unreadNoticeCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#f2f2f7] dark:border-black rounded-full"></span>}
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="w-10 h-10 bg-white dark:bg-[#1c1c1e] text-slate-500 hover:text-primary flex items-center justify-center rounded-full shadow-sm transition-all border border-transparent dark:border-white/5">`
);

// 4. Add NoticeHistoryModal JSX
const noticeHistoryModal = `
        {/* Notice History Panel */}
        {isNoticeHistoryOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsNoticeHistoryOpen(false)}>
            <div className="bg-[#f2f2f7] dark:bg-black w-full max-w-sm h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
              <div className="p-6 bg-white dark:bg-[#1c1c1e] border-b border-slate-100 dark:border-white/5 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2"><IconBell size={24} /> 알림 내역</h3>
                <button onClick={() => setIsNoticeHistoryOpen(false)} className="p-2 -m-2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                  <IconX size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-4">
                {noticeHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
                    <IconBellX size={40} className="text-slate-300 dark:text-slate-600" />
                    <span className="text-sm font-medium">새로운 알림이 없습니다.</span>
                  </div>
                ) : (
                  noticeHistory.map((notice, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#1c1c1e] p-5 rounded-2xl shadow-sm border border-transparent dark:border-white/5">
                      <div className="text-xs text-slate-400 mb-2 font-medium">{format(new Date(notice.date), 'yyyy년 MM월 dd일 HH:mm')}</div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{notice.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
`;

app = app.replace(/\{\/\* Modals \*\/\}/, '{/* Modals */}\n' + noticeHistoryModal);

// Ensure IconBell and IconBellX are imported
if (!app.includes('IconBell')) {
  app = app.replace(
    /import \{([^}]+)\} from '@tabler\/icons-react';/,
    "import {$1, IconBell, IconBellX } from '@tabler/icons-react';"
  );
}

fs.writeFileSync('src/App.tsx', app);
console.log("Added notice history panel");
