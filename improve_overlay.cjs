const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const oldOverlayRegex = /<div className="absolute inset-y-0 right-0 bg-white\/95 dark:bg-\[\#1c1c1e\]\/95 backdrop-blur-md flex items-center gap-2 px-4 shadow-\[-10px_0_15px_-3px_rgba\(0,0,0,0\.1\)\] dark:shadow-none border-l border-slate-100 dark:border-white\/5 animate-in slide-in-from-right-4 duration-200">[\s\S]*?<\/div>/;

const newOverlay = `<div className="absolute inset-y-0 right-0 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-md flex items-center gap-2.5 px-5 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.1)] dark:shadow-none border-l border-slate-100 dark:border-white/5 animate-in slide-in-from-right-4 duration-200 rounded-r-[24px]">
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(b.code); toast.success('복사됨'); setActiveActionMenu(null); }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all active:scale-95" aria-label="복사">
                                  <IconCopy size={22} />
                                  <span className="text-[10px] font-bold">복사</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleEditMemo(b.id, b.memo); setActiveActionMenu(null); }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all active:scale-95" aria-label="메모">
                                  <IconMessagePlus size={22} />
                                  <span className="text-[10px] font-bold">메모</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setMoveModal({ isOpen: true, ids: [b.id], targetFolder: b.folder || '기본폴더', type: 'barcode', sourceFolder: '' }); setActiveActionMenu(null); }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all active:scale-95" aria-label="이동">
                                  <IconFolder size={22} />
                                  <span className="text-[10px] font-bold">이동</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(b.id); setActiveActionMenu(null); }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95" aria-label="삭제">
                                  <IconTrash size={22} />
                                  <span className="text-[10px] font-bold">삭제</span>
                                </button>
                              </div>`;

app = app.replace(oldOverlayRegex, newOverlay);

// We should also improve the Grid View overlay for consistency
const oldGridOverlayRegex = /<div className="absolute inset-0 bg-white\/90 dark:bg-\[\#1c1c1e\]\/90 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-2 p-2 z-10 animate-in fade-in duration-100">[\s\S]*?<\/div>/;

const newGridOverlay = `<div className="absolute inset-0 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-md rounded-[24px] flex flex-wrap content-center justify-center gap-2 p-3 z-10 animate-in zoom-in-95 duration-150">
                              <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(b.code); toast.success('복사됨'); setActiveActionMenu(null); }} className="flex flex-col items-center gap-1 w-[45%] py-2 text-slate-600 dark:text-slate-300 hover:text-blue-500 bg-slate-50 dark:bg-black/20 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-[14px] transition-all active:scale-95" aria-label="복사">
                                <IconCopy size={20} />
                                <span className="text-[10px] font-bold">복사</span>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleEditMemo(b.id, b.memo); setActiveActionMenu(null); }} className="flex flex-col items-center gap-1 w-[45%] py-2 text-slate-600 dark:text-slate-300 hover:text-emerald-500 bg-slate-50 dark:bg-black/20 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-[14px] transition-all active:scale-95" aria-label="메모">
                                <IconMessagePlus size={20} />
                                <span className="text-[10px] font-bold">메모</span>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setMoveModal({ isOpen: true, ids: [b.id], targetFolder: b.folder || '기본폴더', type: 'barcode', sourceFolder: '' }); setActiveActionMenu(null); }} className="flex flex-col items-center gap-1 w-[45%] py-2 text-slate-600 dark:text-slate-300 hover:text-purple-500 bg-slate-50 dark:bg-black/20 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-[14px] transition-all active:scale-95" aria-label="이동">
                                <IconFolder size={20} />
                                <span className="text-[10px] font-bold">이동</span>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(b.id); setActiveActionMenu(null); }} className="flex flex-col items-center gap-1 w-[45%] py-2 text-red-500 bg-slate-50 dark:bg-black/20 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-[14px] transition-all active:scale-95" aria-label="삭제">
                                <IconTrash size={20} />
                                <span className="text-[10px] font-bold">삭제</span>
                              </button>
                            </div>`;

app = app.replace(oldGridOverlayRegex, newGridOverlay);

fs.writeFileSync('src/App.tsx', app);
console.log("Overlay improved");
