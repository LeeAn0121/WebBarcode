const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const systemNoticeUI = `
        {/* System Notice Modal */}
        {systemNotice.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300" role="dialog" aria-modal="true" aria-label="시스템 공지사항">
            <div className="bg-white dark:bg-[#111111] w-full max-w-sm rounded-[2rem] shadow-2xl p-6 md:p-8 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 border border-slate-100 dark:border-white/10" onClick={e => e.stopPropagation()}>
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mb-2 shadow-inner">
                  <IconAlertTriangle size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white">시스템 공지사항</h3>
                <p className="text-base text-slate-600 dark:text-slate-300 mb-4 whitespace-pre-wrap leading-relaxed">{systemNotice.message}</p>
                <button onClick={() => setSystemNotice({ ...systemNotice, isOpen: false })} className="w-full py-4 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl shadow-lg hover:scale-[0.98] active:scale-95 transition-all text-lg">
                  확인
                </button>
              </div>
            </div>
          </div>
        )}`;

app = app.replace(/\{\/\* Modals \*\/\}/, '{/* Modals */}\n' + systemNoticeUI);

fs.writeFileSync('src/App.tsx', app);
console.log("Added systemNotice UI");
