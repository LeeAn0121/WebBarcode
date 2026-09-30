const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === item.id ? null : item.id); }}
                              className="p-2.5 -m-0.5 text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                              aria-label={\`\${item.code} 작업 메뉴 열기\`}
                              aria-haspopup="menu"
                              aria-expanded={activeActionMenu === item.id}
                            >
                              <IconDotsVertical size={20} />
                            </button>
                          )}`;

const replaceStr = `) : null}`;

app = app.replace(targetStr, replaceStr);

// Now we need to insert the sliding menu right before the closing `</div>` of the item.
const itemEndRegex = /<\/div>\n\s*<\/div>\n\s*\)\)\}\n\s*\{filteredBarcodes/g;

// Wait, actually I just want to append the menu after `<div className="shrink-0 relative">...</div>`.
// Let's replace the whole `shrink-0 relative` div:
const oldDivStr = `<div className="shrink-0 relative">
                          
                          {isSelectionMode ? (
                            <div className={\`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors \${selectedIds.includes(item.id) ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'}\`}>
                              {selectedIds.includes(item.id) && <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                            </div>
                          ) : null}

                          
                          
                        </div>`;

const newDivStr = `<div className="shrink-0 relative z-20 mr-2">
                          {isSelectionMode && (
                            <div className={\`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors \${selectedIds.includes(item.id) ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'}\`}>
                              {selectedIds.includes(item.id) && <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                            </div>
                          )}
                        </div>

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

app = app.replace(oldDivStr, newDivStr);

fs.writeFileSync('src/App.tsx', app);
