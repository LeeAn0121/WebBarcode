const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Rename Prompt
const renamePromptRegex = /const newName = prompt\([\s\S]*?, oldName\);/;
const newRenamePrompt = `const baseName = oldName.split('/').pop() || oldName;
    const newBaseName = prompt(\`'\${baseName}' 폴더의 새 이름을 입력하세요:\`, baseName);
    if (!newBaseName || newBaseName === baseName) return;
    
    // Construct new full path
    const parts = oldName.split('/');
    parts.pop();
    parts.push(newBaseName.trim().replace(/\\//g, ''));
    const newName = parts.join('/');
    
    if (newName === oldName) return;`;
app = app.replace(renamePromptRegex, newRenamePrompt);


// 2. folderActionModal buttons
const actionButtonsStr = `<button onClick={() => { handleRenameFolder(folderActionModal); setFolderActionModal(null); }} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[20px] p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 fluid-spring">
                    <IconEdit size={28} />
                    <span className="font-bold text-sm">계층/이름 변경</span>
                  </button>`;

const newActionButtons = `<button onClick={() => { handleRenameFolder(folderActionModal); setFolderActionModal(null); }} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[20px] p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 fluid-spring">
                    <IconEdit size={28} />
                    <span className="font-bold text-sm">이름 변경</span>
                  </button>
                  <button onClick={() => { setMoveModal({ isOpen: true, ids: [], targetFolder: '기본폴더', type: 'folder', sourceFolder: folderActionModal }); setFolderActionModal(null); }} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-[20px] p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 fluid-spring">
                    <IconFolder size={28} />
                    <span className="font-bold text-sm">위치 이동</span>
                  </button>`;
app = app.replace(actionButtonsStr, newActionButtons);


// 3. moveModal UI
const startIndex = app.indexOf('{moveModal.isOpen');
let blockStr = '';
if(startIndex !== -1) {
    const endIndex = app.indexOf('{/* Mobile Bottom Tab Bar */}', startIndex);
    if(endIndex !== -1) {
        blockStr = app.substring(startIndex, endIndex);
    }
}

if(blockStr) {
const newModalUI = `{moveModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200" onClick={() => setMoveModal(prev => ({ ...prev, isOpen: false }))} role="dialog" aria-modal="true" aria-label="이동 위치 선택">
            <div className="bg-white dark:bg-[#1c1c1e] w-full sm:max-w-sm rounded-t-3xl sm:rounded-[24px] shadow-2xl p-6 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 flex flex-col max-h-[80svh]" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">이동할 위치 선택</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                {moveModal.type === 'barcode' ? \`선택한 바코드 \${moveModal.ids.length}개를 이동합니다.\` : \`'\${moveModal.sourceFolder.split('/').pop()}' 폴더를 이동합니다.\`}
              </p>

              <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 border border-slate-100/50 dark:border-white/5 rounded-[20px] p-2 bg-slate-50 dark:bg-black/20 flex flex-col gap-1">
                <button 
                  onClick={() => setMoveModal(prev => ({ ...prev, targetFolder: '기본폴더' }))}
                  className={\`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors \${moveModal.targetFolder === '기본폴더' ? 'bg-primary/10 text-primary font-bold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5'}\`}
                >
                  <IconHome size={20} /> <span className="text-left flex-1">최상위 폴더 (Home)</span>
                  {moveModal.targetFolder === '기본폴더' && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                </button>
                
                {folders.filter(f => f !== '기본폴더').map(f => {
                  const depth = f.split('/').length - 1;
                  const name = f.split('/').pop();
                  
                  // 폴더 본인이거나 자신의 하위 폴더로는 이동 불가
                  if (moveModal.type === 'folder' && (f === moveModal.sourceFolder || f.startsWith(moveModal.sourceFolder + '/'))) return null;

                  return (
                    <button 
                      key={f}
                      onClick={() => setMoveModal(prev => ({ ...prev, targetFolder: f }))}
                      style={{ paddingLeft: \`\${(depth * 1.5) + 1}rem\` }}
                      className={\`w-full flex items-center gap-3 pr-4 py-3 rounded-[16px] transition-colors \${moveModal.targetFolder === f ? 'bg-primary/10 text-primary font-bold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5'}\`}
                    >
                      <IconFolderFilled size={20} className={moveModal.targetFolder === f ? 'text-primary' : 'text-yellow-500'} /> 
                      <span className="text-left flex-1 truncate">{name}</span>
                      {moveModal.targetFolder === f && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 shrink-0">
                <button onClick={() => setMoveModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-[16px] transition-colors focus-visible:outline-none">취소</button>
                <button onClick={handleMoveFolderSubmit} className="flex-1 py-3.5 bg-primary hover:bg-primaryHover text-white font-bold rounded-[16px] shadow-[0_4px_12px_rgba(49,130,246,0.3)] transition-all focus-visible:outline-none active:scale-95">여기로 이동</button>
              </div>
            </div>
          </div>
        )}
        
        `;
    app = app.replace(blockStr, newModalUI);
}

fs.writeFileSync('src/App.tsx', app);
