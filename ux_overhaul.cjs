const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Home Tab Barcode List Readability (Increase font sizes and contrast)
app = app.replace(
  /<span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 truncate">\{b\.code\}<\/span>/g,
  '<span className="font-mono text-lg tracking-tight font-bold text-black dark:text-white truncate">{b.code}</span>'
);
app = app.replace(
  /\{b\.memo && <span className="text-\[11px\] text-primary font-bold truncate mt-0\.5">\{b\.memo\}<\/span>\}/g,
  '{b.memo && <span className="text-sm text-primary font-medium truncate mt-0.5">{b.memo}</span>}'
);

// 2. Global Action Menu Popup Redesign (From tall list to iOS style Grid)
const oldActionMenuRegex = /<div className="flex flex-col p-3 pb-8 sm:pb-3" role="menu">([\s\S]*?)<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\);\n\s*\}\)\(\)\}/;

const newActionMenu = `<div className="px-5 pb-8 sm:pb-5">
                  {/* Primary Actions Grid */}
                  <div className="grid grid-cols-4 gap-3 mb-4" role="menu">
                    <button role="menuitem" onClick={() => { navigator.clipboard.writeText(item.code); toast.success('복사됨'); setActiveActionMenu(null); }} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-[18px] transition-all active:scale-95 text-slate-700 dark:text-slate-200">
                      <IconCopy size={26} />
                      <span className="text-[11px] font-bold">복사</span>
                    </button>
                    <button role="menuitem" onClick={() => { handleShare(item); setActiveActionMenu(null); }} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-[18px] transition-all active:scale-95 text-slate-700 dark:text-slate-200">
                      <IconShare size={26} />
                      <span className="text-[11px] font-bold">공유</span>
                    </button>
                    <button role="menuitem" onClick={() => { setMoveModal({ isOpen: true, ids: [item.id], targetFolder: item.folder || '기본폴더', type: 'barcode', sourceFolder: '' }); setActiveActionMenu(null); }} className="flex flex-col items-center justify-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-[18px] transition-all active:scale-95 text-emerald-600 dark:text-emerald-400">
                      <IconFolder size={26} />
                      <span className="text-[11px] font-bold">이동</span>
                    </button>
                    <button role="menuitem" onClick={() => { handleDelete(item.id); setActiveActionMenu(null); }} className="flex flex-col items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-[18px] transition-all active:scale-95 text-red-500 dark:text-red-400">
                      <IconTrash size={26} />
                      <span className="text-[11px] font-bold">삭제</span>
                    </button>
                  </div>

                  {/* Secondary Actions List */}
                  <div className="flex flex-col gap-1" role="menu">
                    <button role="menuitem" onClick={() => { handleEditMemo(item.id, item.memo); setActiveActionMenu(null); }} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-colors text-slate-700 dark:text-slate-200 font-bold">
                      <div className="flex items-center gap-3"><IconMessagePlus size={20} className="text-blue-500" /> 메모 추가 및 수정</div>
                      <IconChevronRight size={18} className="text-slate-400" />
                    </button>
                    <button role="menuitem" onClick={() => { handleEditCode(item.id, item.code); setActiveActionMenu(null); }} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-colors text-slate-700 dark:text-slate-200 font-bold">
                      <div className="flex items-center gap-3"><IconEdit size={20} className="text-amber-500" /> 바코드 번호 직접 수정</div>
                      <IconChevronRight size={18} className="text-slate-400" />
                    </button>
                    <button role="menuitem" onClick={() => { handleClone(item); setActiveActionMenu(null); }} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-colors text-slate-700 dark:text-slate-200 font-bold">
                      <div className="flex items-center gap-3"><IconCopy size={20} className="text-slate-500" /> 이 바코드 그대로 복제</div>
                      <IconChevronRight size={18} className="text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}`;

app = app.replace(oldActionMenuRegex, newActionMenu);

// 3. Scanner FAB position/size. Is it too small or hard to reach?
// className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(49,130,246,0.4)] -mt-6 border-[6px] border-[#f5f5f7] dark:border-black transition-transform fluid-spring active:scale-90"
// Actually, w-16 h-16 is 64px, which is a great size. Maybe we should make the icon inside larger.
app = app.replace(/<IconScan size=\{30\} \/>/g, '<IconScan size={36} stroke={2} />');

// 4. Contrast in Settings Tab
// <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">
app = app.replace(/text-slate-500 uppercase tracking-widest border-b/g, 'text-slate-800 dark:text-slate-300 font-bold uppercase tracking-widest border-b');

// 5. Breadcrumb Text contrast
app = app.replace(/<span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-\[150px\] sm:max-w-\[200px\]">/g, '<span className="font-extrabold text-black dark:text-white truncate max-w-[150px] sm:max-w-[200px]">');


// 6. Fix Folders Icon in Tree view: Add text-black dark:text-white for better contrast
app = app.replace(
  /className=\{\`w-full flex items-center gap-2 pr-3 py-2 rounded-xl transition-colors text-sm \$\{isExact \? 'bg-primary\/10 text-primary font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white\/5'\}\`\}/g,
  "className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-[14px] transition-all text-sm ${isExact ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 font-medium'}`}"
);

// 7. Make the top title larger
app = app.replace(
  /<h1 className="font-bold text-3xl tracking-tight text-black dark:text-white mb-1">/g,
  '<h1 className="font-extrabold text-4xl tracking-tight text-black dark:text-white mb-2">'
);

fs.writeFileSync('src/App.tsx', app);
console.log("UX Overhaul applied");
