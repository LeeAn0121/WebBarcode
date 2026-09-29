const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Ensure icons are imported
if (!app.includes('IconLayoutGrid')) {
  app = app.replace(
    /import \{([^}]+)\} from '@tabler\/icons-react';/,
    "import {$1, IconLayoutGrid, IconList} from '@tabler/icons-react';"
  );
}

// 2. Add state
app = app.replace(
  /const \[explorerPath, setExplorerPath\] = useState<string>\(''\);/,
  "const [explorerPath, setExplorerPath] = useState<string>('');\n  const [folderViewMode, setFolderViewMode] = useState<'grid' | 'list'>('grid');"
);

// 3. Add Toggle button next to Add Folder button
const oldToolbarRegex = /<button onClick=\{\(\) => \{\n\s*const newFolderName = prompt\('현재 위치에 새 폴더 생성:'\);[\s\S]*?<\/button>\s*<\/div>\s*<\/div>\s*<\/div>/;

const newToolbar = `<button onClick={() => setFolderViewMode(prev => prev === 'grid' ? 'list' : 'grid')} className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors flex items-center gap-1" title="보기 방식 변경">
                    {folderViewMode === 'grid' ? <IconList size={20} /> : <IconLayoutGrid size={20} />}
                  </button>
                  <button onClick={() => {
                    const newFolderName = prompt('현재 위치에 새 폴더 생성:');
                    if (newFolderName && newFolderName.trim()) {
                      const finalName = explorerPath ? \`\${explorerPath}/\${newFolderName.trim()}\` : newFolderName.trim();
                      setLocalFolders(prev => Array.from(new Set([...prev, finalName])));
                      setExplorerPath(finalName);
                      toast.success('폴더가 생성되었습니다.');
                    }
                  }} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors flex items-center gap-1" title="새 폴더">
                    <IconFolderPlus size={20} />
                  </button>
                </div>
              </div>
            </div>`;

app = app.replace(oldToolbarRegex, newToolbar);

// 4. Update the Grid/List render
const oldGridRegex = /<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-8">[\s\S]*?<\/div>\s*\);\s*\}\)\(\)\}\s*<\/div>\s*<\/div>\s*\)\}/;

const newGridList = `<div className={folderViewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-8" : "flex flex-col gap-3 pb-8"}>
                    {/* Render Subfolders */}
                    {subfoldersList.map(name => {
                      const fullPath = explorerPath ? \`\${explorerPath}/\${name}\` : name;
                      const count = barcodes.filter(b => {
                        const bFolder = b.folder || '기본폴더';
                        return bFolder === fullPath || bFolder.startsWith(fullPath + '/');
                      }).length;

                      if (folderViewMode === 'list') {
                        return (
                          <div 
                            key={fullPath}
                            onClick={() => setExplorerPath(fullPath)}
                            className="bg-white dark:bg-[#1c1c1e] p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 transition-colors active:scale-95"
                          >
                            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500 rounded-xl flex items-center justify-center shrink-0">
                              <IconFolder size={24} fill="currentColor" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{name}</h3>
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap shrink-0 pr-2">{count}개 항목</div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={fullPath}
                          onClick={() => setExplorerPath(fullPath)}
                          className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 flex flex-col items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 transition-colors active:scale-95"
                        >
                          <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500 rounded-2xl flex items-center justify-center">
                            <IconFolder size={32} fill="currentColor" />
                          </div>
                          <div className="text-center w-full">
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{name}</h3>
                            <p className="text-[10px] text-slate-400 font-medium">{count}개 항목</p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Render Files (Barcodes) */}
                    {files.map(b => {
                      if (folderViewMode === 'list') {
                        return (
                          <div 
                            key={b.id}
                            onClick={() => setActiveActionMenu(activeActionMenu === b.id ? null : b.id)}
                            className="bg-white dark:bg-[#1c1c1e] p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 transition-colors relative group overflow-hidden"
                          >
                            <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                              <IconBarcode size={24} />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <span className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{b.code}</span>
                              {b.memo && <span className="text-[11px] text-primary font-bold truncate mt-0.5">{b.memo}</span>}
                            </div>
                            
                            {/* Action Overlay for List Mode */}
                            {activeActionMenu === b.id && (
                              <div className="absolute inset-y-0 right-0 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-md flex items-center gap-2 px-4 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.1)] dark:shadow-none border-l border-slate-100 dark:border-white/5 animate-in slide-in-from-right-4 duration-200">
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(b.code); toast.success('복사됨'); setActiveActionMenu(null); }} className="p-2 bg-slate-100 dark:bg-black rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="복사"><IconCopy size={18} /></button>
                                <button onClick={(e) => { e.stopPropagation(); setMoveModal({ isOpen: true, ids: [b.id], targetFolder: b.folder || '기본폴더' }); setActiveActionMenu(null); }} className="p-2 bg-slate-100 dark:bg-black rounded-lg text-slate-600 dark:text-slate-300 hover:text-purple-500 hover:bg-purple-50 transition-colors" title="이동"><IconFolder size={18} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(b.id); setActiveActionMenu(null); }} className="p-2 bg-slate-100 dark:bg-black rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="삭제"><IconTrash size={18} /></button>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={b.id}
                          onClick={() => setActiveActionMenu(activeActionMenu === b.id ? null : b.id)}
                          className="bg-white dark:bg-[#1c1c1e] p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 flex flex-col justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 transition-colors relative group"
                        >
                          <div className="flex flex-col gap-1 items-center pt-2">
                            <IconBarcode size={32} className="text-slate-800 dark:text-slate-200" />
                            <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 mt-2 truncate w-full text-center">{b.code}</span>
                          </div>
                          {b.memo && <div className="text-[10px] text-primary font-bold text-center truncate w-full bg-primary/10 rounded-md px-1 py-0.5">{b.memo}</div>}
                          
                          {/* Action Overlay */}
                          {activeActionMenu === b.id && (
                            <div className="absolute inset-0 bg-white/90 dark:bg-[#1c1c1e]/90 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-2 p-2 z-10 animate-in fade-in duration-100">
                              <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(b.code); toast.success('복사됨'); setActiveActionMenu(null); }} className="w-10 h-10 bg-slate-100 dark:bg-black rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors" title="복사">
                                <IconCopy size={18} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setMoveModal({ isOpen: true, ids: [b.id], targetFolder: b.folder || '기본폴더' }); setActiveActionMenu(null); }} className="w-10 h-10 bg-slate-100 dark:bg-black rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-purple-500 hover:bg-purple-50 transition-colors" title="이동">
                                <IconFolder size={18} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(b.id); setActiveActionMenu(null); }} className="w-10 h-10 bg-slate-100 dark:bg-black rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors" title="삭제">
                                <IconTrash size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}`;

app = app.replace(oldGridRegex, newGridList);

fs.writeFileSync('src/App.tsx', app);
console.log("Added View Toggle (Grid/List) to Folders Tab");
