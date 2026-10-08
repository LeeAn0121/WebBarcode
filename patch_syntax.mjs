import fs from 'fs';
const appPath = 'E:/GITHUB/WebBarcode/src/App.tsx';
let lines = fs.readFileSync(appPath, 'utf8').split('\n');

// 1986 to 2017 is 32 lines. Let's confirm by reading the lines first.
let block = lines.slice(1986, 2018).join('\n');
console.log('Replacing:\n', block);

const correctBlock = `                    <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[24px] border border-slate-100/50 dark:border-white/5 flex flex-col gap-4 shadow-sm hover:shadow-lg transition-all">
                      <div className="flex items-center gap-3 text-pink-500">
                        <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-lg">
                          <IconBell size={24} aria-hidden="true" />
                        </div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">시스템 알림</h4>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">새 바코드 공유 및 공지사항 알림을 받습니다.</p>
                      <button onClick={() => {
                        if ('Notification' in window) {
                          Notification.requestPermission().then(perm => {
                            if(perm === 'granted') toast.success('알림 권한이 허용되었습니다.');
                            else toast.error('알림 권한이 거부/차단되었습니다.');
                          });
                        }
                      }} className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm focus-visible:outline-none">
                        알림 권한 요청
                      </button>
                    </div>

                    <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[24px] border border-slate-100/50 dark:border-white/5 flex flex-col gap-4 shadow-sm hover:shadow-lg transition-all">
                      <div className="flex items-center gap-3 text-amber-500">
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                          {darkMode ? <IconMoon size={24} aria-hidden="true" /> : <IconSun size={24} aria-hidden="true" />}
                        </div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">테마 설정</h4>
                      </div>`;

lines.splice(1986, 32, correctBlock);

fs.writeFileSync(appPath, lines.join('\n'), 'utf8');
console.log('Fixed syntax error!');
