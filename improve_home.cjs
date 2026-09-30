const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. In Home Tab, replace the handleItemClick logic to trigger activeActionMenu
// Find the div for Home tab items
const homeItemRegex = /onClick=\{\(e\) => handleItemClick\(item\.id, '', e\)\}\s*style=\{idx < 8 \? \{ animationDelay: \`\$\{idx \* 30\}ms\`, animationFillMode: 'backwards' \} : undefined\}\s*className=\{\`relative p-5 rounded-\[1\.5rem\] transition-all duration-300 flex items-center justify-between gap-4 group cursor-pointer/g;

app = app.replace(
  homeItemRegex,
  `onClick={(e) => {
                        if (isSelectionMode || e.ctrlKey || e.metaKey || e.shiftKey) {
                          handleItemClick(item.id, '', e);
                        } else {
                          setActiveActionMenu(activeActionMenu === item.id ? null : item.id);
                        }
                      }}
                      style={idx < 8 ? { animationDelay: \`\${idx * 30}ms\`, animationFillMode: 'backwards' } : undefined}
                      className={\`relative p-5 rounded-[1.5rem] transition-all duration-300 flex items-center justify-between gap-4 group cursor-pointer overflow-hidden`
);

// 2. Remove the IconDotsVertical button and inject the new Overlay
// We search for the <div className="shrink-0 relative"> ... </div> section.
const dotsButtonRegex = /<div className="shrink-0 relative">\s*\{isSelectionMode \? \([\s\S]*?\}<\/svg>\}<\/div>\s*\) : \(\s*<button[\s\S]*?<IconDotsVertical size=\{20\} \/>\s*<\/button>\s*\)\}\s*<\/div>/;

const newOverlayAndSelection = `
                        {isSelectionMode && (
                          <div className="shrink-0 relative z-20 mr-2">
                            <div className={\`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors \${selectedIds.includes(item.id) ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'}\`}>
                              {selectedIds.includes(item.id) && <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                            </div>
                          </div>
                        )}

                        {!isSelectionMode && activeActionMenu === item.id && (
                          <div className="absolute inset-y-0 right-0 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-md flex items-center gap-2.5 px-5 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.1)] dark:shadow-none border-l border-slate-100 dark:border-white/5 animate-in slide-in-from-right-4 duration-200 rounded-r-[24px]">
                            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.code); toast.success('복사됨'); setActiveActionMenu(null); }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all active:scale-95" aria-label="복사">
                              <IconCopy size={22} />
                              <span className="text-[10px] font-bold">복사</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleEditMemo(item.id, item.memo); setActiveActionMenu(null); }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all active:scale-95" aria-label="메모">
                              <IconMessagePlus size={22} />
                              <span className="text-[10px] font-bold">메모</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setMoveModal({ isOpen: true, ids: [item.id], targetFolder: item.folder || '기본폴더', type: 'barcode', sourceFolder: '' }); setActiveActionMenu(null); }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all active:scale-95" aria-label="이동">
                              <IconFolder size={22} />
                              <span className="text-[10px] font-bold">이동</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); setActiveActionMenu(null); }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95" aria-label="삭제">
                              <IconTrash size={22} />
                              <span className="text-[10px] font-bold">삭제</span>
                            </button>
                          </div>
                        )}`;

app = app.replace(dotsButtonRegex, newOverlayAndSelection);

fs.writeFileSync('src/App.tsx', app);
console.log("Home Tab Improved");
