const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add `explorerPath` state
app = app.replace(
  /const \[folderActionModal, setFolderActionModal\] = useState<string \| null>\(null\);/,
  `const [folderActionModal, setFolderActionModal] = useState<string | null>(null);\n  const [explorerPath, setExplorerPath] = useState<string>('');`
);

// 2. Rewrite Folders Tab
const oldFoldersTabRegex = /\{\/\* Tab: Folders \*\/\}[\s\S]*?\{\/\* Tab: Settings \*\/\}/;

const newFoldersTab = `{/* Tab: Folders (Windows Explorer Style) */}
        {activeTab === 'folders' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar animate-in fade-in duration-200 flex flex-col bg-white dark:bg-[#111111]">
            
            {/* Explorer Toolbar / Breadcrumbs */}
            <div className="bg-[#f2f2f7] dark:bg-black p-3 md:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20 shadow-sm">
              <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar whitespace-nowrap hide-scrollbar flex-1 mr-4">
                <button onClick={() => setExplorerPath('')} className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <IconHome size={20} />
                </button>
                <span className="text-slate-400 font-bold mx-1">/</span>
                
                {explorerPath.split('/').filter(Boolean).map((part, index, arr) => {
                  const pathSoFar = arr.slice(0, index + 1).join('/');
                  return (
                    <React.Fragment key={pathSoFar}>
                      <button onClick={() => setExplorerPath(pathSoFar)} className="px-3 py-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors font-bold text-sm text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                        {part}
                      </button>
                      {index < arr.length - 1 && <span className="text-slate-400 font-bold mx-1">/</span>}
                    </React.Fragment>
                  );
                })}
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                {explorerPath !== '' && (
                  <button onClick={() => setExplorerPath(explorerPath.split('/').slice(0, -1).join('/'))} className="p-2 bg-white dark:bg-[#1c1c1e] text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-colors border border-slate-200 dark:border-white/5" title="상위 폴더로">
                    <IconArrowUp size={20} />
                  </button>
                )}
                <button onClick={handleAddFolder} className="p-2 bg-primary text-white rounded-xl hover:bg-primaryHover shadow-sm transition-colors flex items-center gap-1 font-bold text-sm px-3" title="새 폴더">
                  <IconFolderPlus size={18} /> <span className="hidden sm:inline">새 폴더</span>
                </button>
              </div>
            </div>

            {/* Explorer Content Area */}
            <div className="flex-1 p-2 md:p-4 pb-24">
              {(() => {
                // 현재 경로에 존재하는 하위 폴더 계산
                const subFolders = new Set<string>();
                let hasBaseFolder = false;
                
                folders.forEach(f => {
                  if (explorerPath === '') {
                    if (f === '기본폴더') {
                      hasBaseFolder = true;
                    } else {
                      subFolders.add(f.split('/')[0]);
                    }
                  } else {
                    if (f.startsWith(explorerPath + '/')) {
                      const remaining = f.substring(explorerPath.length + 1);
                      subFolders.add(remaining.split('/')[0]);
                    }
                  }
                });

                const folderList = Array.from(subFolders).sort();
                if (explorerPath === '' && !folderList.includes('기본폴더') && hasBaseFolder) {
                  folderList.unshift('기본폴더'); // Root일 때 기본폴더 항상 맨 앞에
                }
                
                // 현재 경로에 있는 파일(바코드) 계산
                const fileList = barcodes.filter(b => {
                  const bFolder = b.folder || '기본폴더';
                  return explorerPath === '' ? bFolder === '기본폴더' : bFolder === explorerPath;
                });

                if (folderList.length === 0 && fileList.length === 0) {
                  return (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                      <IconFolderOpen size={48} className="mb-3 text-slate-300 dark:text-slate-600" />
                      <p className="font-medium text-sm">폴더가 비어 있습니다.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {/* Folders First */}
                    {folderList.map(folderName => {
                      const fullPath = explorerPath ? \`\${explorerPath}/\${folderName}\` : folderName;
                      // 하위 아이템 개수 (폴더 내부 전체)
                      const childCount = barcodes.filter(b => (b.folder || '기본폴더') === fullPath || (b.folder || '기본폴더').startsWith(fullPath + '/')).length;
                      
                      return (
                        <div key={fullPath} className="group flex flex-col items-center justify-center p-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-[#1c1c1e] transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-800 relative select-none" onClick={() => setExplorerPath(fullPath)}>
                          <div className="w-16 h-16 mb-2 relative">
                            <IconFolder size={64} className="text-yellow-400 drop-shadow-sm transition-transform group-hover:scale-105" fill="currentColor" />
                          </div>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center w-full truncate px-1">{folderName}</span>
                          <span className="text-xs font-medium text-slate-400 mt-0.5">{childCount}개 항목</span>
                          
                          {/* Folder Action Menu Button */}
                          <button onClick={(e) => { e.stopPropagation(); setFolderActionModal(fullPath); }} className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                            <IconDotsVertical size={16} />
                          </button>
                        </div>
                      );
                    })}

                    {/* Files (Barcodes) Second */}
                    {fileList.map(file => {
                      const isSelected = selectedIds.includes(file.id);
                      return (
                        <div key={file.id} className={\`group flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer transition-colors border \${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-slate-100 dark:hover:bg-[#1c1c1e] border-transparent hover:border-slate-200 dark:hover:border-slate-800'} relative select-none\`} onClick={(e) => {
                          if (isSelectionMode) {
                            e.stopPropagation();
                            toggleSelection(file.id);
                          } else {
                            // 일반 클릭 시 홈 탭의 해당 바코드로 스크롤하거나 단순 하이라이트 (여기선 클립보드 복사)
                            navigator.clipboard.writeText(file.code);
                            toast.success('바코드가 복사되었습니다.');
                          }
                        }} onContextMenu={(e) => {
                          e.preventDefault();
                          if(!isSelectionMode) setIsSelectionMode(true);
                          toggleSelection(file.id);
                        }}>
                          <div className="w-16 h-16 mb-2 relative flex items-center justify-center bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <IconBarcode size={32} className="text-slate-600 dark:text-slate-400 transition-transform group-hover:scale-110" />
                          </div>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 text-center w-full truncate px-1 font-mono">{file.code}</span>
                          <span className="text-xs font-medium text-slate-400 mt-0.5 truncate w-full text-center px-1">{file.memo || '메모 없음'}</span>
                          
                          {isSelectionMode && (
                            <div className="absolute top-2 left-2">
                              <div className={\`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors \${isSelected ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'}\`}>
                                {isSelected && <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                              </div>
                            </div>
                          )}
                          
                          {!isSelectionMode && (
                            <button onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === file.id ? null : file.id); }} className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                              <IconDotsVertical size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Tab: Settings */}`;
app = app.replace(oldFoldersTabRegex, newFoldersTab);

// Import IconArrowUp and IconFolderOpen if missing
if (!app.includes('IconArrowUp')) {
  app = app.replace(
    /import \{([^}]+)\} from '@tabler\/icons-react';/,
    "import {$1, IconArrowUp, IconFolderOpen } from '@tabler/icons-react';"
  );
}

fs.writeFileSync('src/App.tsx', app);
console.log("Rewrote folders tab to Windows Explorer style!");
