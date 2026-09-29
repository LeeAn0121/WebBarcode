const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const oldFoldersRegex = /\{activeTab === 'folders' && \([\s\S]*?\}\s*\)\s*\}\s*<\/div>\s*<\/div>\s*\)\}/;

const newFoldersTab = `{activeTab === 'folders' && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#f2f2f7] dark:bg-black animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Breadcrumb Header */}
            <div className="flex-none p-4 pb-2 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 z-10 sticky top-0 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar whitespace-nowrap text-lg font-bold text-slate-800 dark:text-white">
                  <button onClick={() => setExplorerPath('')} className="hover:text-primary transition-colors flex items-center gap-1">
                    <IconHome size={20} /> Home
                  </button>
                  {explorerPath.split('/').filter(Boolean).map((part, idx, arr) => {
                    const path = arr.slice(0, idx + 1).join('/');
                    return (
                      <React.Fragment key={path}>
                        <span className="text-slate-400">/</span>
                        <button onClick={() => setExplorerPath(path)} className="hover:text-primary transition-colors">
                          {part}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  {explorerPath !== '' && explorerPath !== '기본폴더' && (
                    <button onClick={() => setFolderActionModal(explorerPath)} className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
                      <IconEdit size={20} />
                    </button>
                  )}
                  <button onClick={() => {
                    const newFolderName = prompt('현재 위치에 새 폴더 생성:');
                    if (newFolderName && newFolderName.trim()) {
                      const finalName = explorerPath ? \`\${explorerPath}/\${newFolderName.trim()}\` : newFolderName.trim();
                      setLocalFolders(prev => Array.from(new Set([...prev, finalName])));
                      setExplorerPath(finalName);
                      toast.success('폴더가 생성되었습니다.');
                    }
                  }} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors flex items-center gap-1">
                    <IconFolderPlus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Folder & File Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2">
              {(() => {
                // Compute current directory contents
                const currentPrefix = explorerPath ? explorerPath + '/' : '';
                
                // 1. Subfolders
                const subfolderNames = new Set<string>();
                folders.forEach(f => {
                  if (explorerPath === '' && !f.includes('/')) {
                    if (f !== '기본폴더') subfolderNames.add(f);
                  } else if (f.startsWith(currentPrefix) && f !== explorerPath) {
                    const rest = f.replace(currentPrefix, '');
                    subfolderNames.add(rest.split('/')[0]);
                  }
                });
                // Ensure '기본폴더' is always at root
                if (explorerPath === '') subfolderNames.add('기본폴더');
                
                const subfoldersList = Array.from(subfolderNames).sort();

                // 2. Files (Barcodes in current folder)
                const currentFolderExact = explorerPath === '' ? '기본폴더' : explorerPath;
                const files = barcodes.filter(b => (b.folder || '기본폴더') === currentFolderExact);

                if (subfoldersList.length === 0 && files.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
                      <IconFolderOpen size={40} className="text-slate-300 dark:text-slate-600" />
                      <span className="text-sm font-medium">폴더가 비어있습니다.</span>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-8">
                    {/* Render Subfolders */}
                    {subfoldersList.map(name => {
                      const fullPath = explorerPath ? \`\${explorerPath}/\${name}\` : name;
                      // count how many items are in this folder or its subfolders
                      const count = barcodes.filter(b => {
                        const bFolder = b.folder || '기본폴더';
                        return bFolder === fullPath || bFolder.startsWith(fullPath + '/');
                      }).length;

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
                    {files.map(b => (
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
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}`;

app = app.replace(oldFoldersRegex, newFoldersTab);

fs.writeFileSync('src/App.tsx', app);
console.log("Rebuilt Windows Explorer Folders Tab");
