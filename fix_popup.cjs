const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove the popup from the list item rendering
// We need to match the block starting from {activeActionMenu === item.id && ( down to )}
const blockToRemove = /\{activeActionMenu === item\.id && \(\s*<\s*>\s*\{\/\* Mobile-friendly Bottom Sheet \/ Desktop Modal \*\/\}([\s\S]*?)<\/>\s*\)\}/;

content = content.replace(blockToRemove, '');

// 2. Add the popup to the global modal area.
// We'll insert it right after {/* Global Modals */} or before moveModal.isOpen
const globalPopup = `
        {/* Global Action Menu Popup */}
        {activeActionMenu && barcodes.find(b => b.id === activeActionMenu) && (() => {
          const item = barcodes.find(b => b.id === activeActionMenu)!;
          return (
            <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4 transition-all" onClick={() => setActiveActionMenu(null)} role="dialog" aria-modal="true" aria-label={\`\${item.code} 작업 메뉴\`}>
              <div className="bg-white dark:bg-[#1c1c1e] w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto my-3 sm:hidden"></div>
                <div className="px-6 pb-4 pt-2 flex flex-col">
                  <span className="font-mono font-bold text-xl text-black dark:text-white truncate">{item.code}</span>
                  <span className="text-sm font-bold text-slate-500 mt-1">{item.folder || '기본폴더'}</span>
                </div>
                <div className="flex flex-col p-3 pb-8 sm:pb-3" role="menu">
                  <button role="menuitem" onClick={() => { navigator.clipboard.writeText(item.code); toast.success('복사됨'); setActiveActionMenu(null); }} className="flex items-center gap-4 w-full p-4 font-bold text-black dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors"><IconCopy size={24} className="text-black dark:text-white" /> 복사하기</button>
                  <button role="menuitem" onClick={() => { handleShare(item); setActiveActionMenu(null); }} className="flex items-center gap-4 w-full p-4 font-bold text-black dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors"><IconShare size={24} className="text-black dark:text-white" /> 외부로 공유</button>
                  <button role="menuitem" onClick={() => { handleEditMemo(item.id, item.memo); setActiveActionMenu(null); }} className="flex items-center gap-4 w-full p-4 font-bold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-colors"><IconMessagePlus size={24} /> 메모 추가/수정</button>
                  <button role="menuitem" onClick={() => { setMoveModal({ isOpen: true, ids: [item.id], targetFolder: item.folder || '기본폴더' }); setActiveActionMenu(null); }} className="flex items-center gap-4 w-full p-4 font-bold text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-2xl transition-colors"><IconFolder size={24} /> 다른 폴더로 이동</button>
                  <button role="menuitem" onClick={() => { handleClone(item); setActiveActionMenu(null); }} className="flex items-center gap-4 w-full p-4 font-bold text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-2xl transition-colors"><IconCopy size={24} /> 이 바코드 복제하기</button>
                  <button role="menuitem" onClick={() => { handleEditCode(item.id, item.code); setActiveActionMenu(null); }} className="flex items-center gap-4 w-full p-4 font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-colors"><IconEdit size={24} /> 바코드 번호 수정</button>
                  <button role="menuitem" onClick={() => { handleDelete(item.id); setActiveActionMenu(null); }} className="flex items-center gap-4 w-full p-4 font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors"><IconTrash size={24} /> 삭제하기</button>
                </div>
              </div>
            </div>
          );
        })()}
`;

content = content.replace('{moveModal.isOpen && moveModal.ids.length > 0 && (', globalPopup + '\\n        {moveModal.isOpen && moveModal.ids.length > 0 && (');

fs.writeFileSync('src/App.tsx', content);
console.log("Popup fixed");
