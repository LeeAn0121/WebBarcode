const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const oldDeleteSectionRegex = /\{\/\* 위험 구역 \*\/\}/;
const newDeleteSection = `{/* 관리자 메뉴 (관리자에게만 표시) */}
              {isAdmin && (
                <section className="space-y-4 pt-4">
                  <h3 className="text-sm font-semibold text-purple-500 uppercase tracking-widest border-b border-purple-100 dark:border-purple-900/30 pb-2 flex items-center gap-2">
                    <IconRocket size={16} aria-hidden="true"/> 시스템 관리 (Admin)
                  </h3>
                  <div className="bg-purple-50 dark:bg-purple-900/10 p-5 sm:p-6 rounded-2xl border border-purple-200 dark:border-purple-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
                    <div>
                      <h4 className="font-bold text-purple-600 dark:text-purple-400 text-lg">Admin Center</h4>
                      <p className="text-sm text-purple-500/80 dark:text-purple-400/80 mt-1 leading-relaxed">공지사항 관리, 전체 로그 모니터링 및 실시간 접속자 현황 등을 확인합니다.</p>
                    </div>
                    <button onClick={() => window.location.href = import.meta.env.BASE_URL + 'admin'} className="w-full sm:w-auto shrink-0 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2">
                      관리자 페이지 진입
                    </button>
                  </div>
                </section>
              )}

              {/* 위험 구역 */}`;

app = app.replace(oldDeleteSectionRegex, newDeleteSection);
fs.writeFileSync('src/App.tsx', app);
console.log("Added admin menu safely");
