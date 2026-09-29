const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Define ADMIN_EMAILS and isAdmin state
app = app.replace(
  /const \[activeTab, setActiveTab\] = useState\('home'\);/,
  `const [activeTab, setActiveTab] = useState('home');
  const ADMIN_EMAILS = ['leean0121@naver.com', 'leean0121@gmail.com'];
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);`
);

// 2. Add an Admin Section in the Settings Tab
const oldDeleteSectionRegex = /\{\/\* 위험 영역 \*\/\}/;
const newDeleteSection = `{/* 관리자 메뉴 (관리자에게만 표시) */}
              {isAdmin && (
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">시스템 관리</h3>
                  <div className="bg-purple-50 dark:bg-purple-900/10 p-5 rounded-2xl border border-purple-100 dark:border-purple-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors" onClick={() => window.location.href = import.meta.env.BASE_URL + 'admin'}>
                    <div className="flex items-start gap-4">
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-lg text-sm text-purple-600 dark:text-purple-400 shrink-0">
                        <IconRocket size={24} aria-hidden="true"/>
                      </div>
                      <div>
                        <h4 className="font-bold text-purple-700 dark:text-purple-400 text-lg">Admin Center (관리자 전용)</h4>
                        <p className="text-sm text-purple-600/80 dark:text-purple-400/80 mt-1 leading-relaxed">공지사항 관리, 로그 확인, 접속자 모니터링</p>
                      </div>
                    </div>
                    <button className="w-full sm:w-auto shrink-0 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2">
                      관리자 페이지 이동
                    </button>
                  </div>
                </section>
              )}

              {/* 위험 영역 */}`;

app = app.replace(oldDeleteSectionRegex, newDeleteSection);

fs.writeFileSync('src/App.tsx', app);
console.log("Added Admin Menu to Settings");
