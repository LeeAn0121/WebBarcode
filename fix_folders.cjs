const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

if (!app.includes('react-sortablejs')) {
  app = app.replace(
    /import React, \{ useState, useEffect, useMemo, useRef, useCallback \} from 'react';/,
    `import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';\nimport { ReactSortable } from 'react-sortablejs';`
  );
}

// Implement the sorting logic for subfoldersList using folderOrder
const subfoldersRegex = /const subfoldersList = Array\.from\(subfolderNames\)\.sort\(\);/;
const newSubfolders = `const subfoldersList = Array.from(subfolderNames).map(name => ({ id: name, name, fullPath: explorerPath ? \`\${explorerPath}/\${name}\` : name })).sort((a, b) => {
                  const idxA = folderOrder.indexOf(a.fullPath);
                  const idxB = folderOrder.indexOf(b.fullPath);
                  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                  if (idxA !== -1) return -1;
                  if (idxB !== -1) return 1;
                  return a.name.localeCompare(b.name);
                });`;

app = app.replace(subfoldersRegex, newSubfolders);

// In the App.tsx, we have a section:
// <div className={folderViewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-8" : "flex flex-col gap-3 pb-8"}>
// {/* Render Subfolders */}
// {subfoldersList.map(name => {
// Let's replace the whole Render Subfolders block.
const renderSubfoldersRegex = /\{subfoldersList\.map\(name => \{[\s\S]*?className="bg-white dark:bg-\[\#1c1c1e\] p-5 rounded-\[24px\] shadow-sm border border-slate-100\/50 dark:border-white\/5 flex flex-col justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white\/5 transition-all relative group"[\s\S]*?<\/div>\s*\);\s*\}\)\}/;

const newRenderSubfolders = `<ReactSortable 
                      list={subfoldersList}
                      setList={(newState) => {
                        // When order changes, update folderOrder
                        const newFullPaths = newState.map(item => item.fullPath);
                        setFolderOrder(prev => {
                          const others = prev.filter(p => !newFullPaths.includes(p));
                          const updated = [...newFullPaths, ...others];
                          localStorage.setItem('folderOrder', JSON.stringify(updated));
                          return updated;
                        });
                      }}
                      className={folderViewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6" : "flex flex-col gap-3 mb-6"}
                      animation={200}
                      delayOnTouchOnly={true}
                      delay={150}
                      ghostClass="opacity-40"
                    >
                    {subfoldersList.map(item => {
                      const { name, fullPath } = item;
                      const count = barcodes.filter(b => {
                        const bFolder = b.folder || '기본폴더';
                        return bFolder === fullPath || bFolder.startsWith(fullPath + '/');
                      }).length;

                      if (folderViewMode === 'list') {
                        return (
                          <div 
                            key={fullPath}
                            onClick={() => setExplorerPath(fullPath)}
                            className="bg-white dark:bg-[#1c1c1e] p-4 rounded-[20px] shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 transition-colors active:scale-95"
                          >
                            <div className="w-12 h-12 bg-[#f2f4f6] dark:bg-white/5 text-[#3182f6] rounded-[16px] flex items-center justify-center shrink-0">
                              <IconFolderFilled size={24} />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              <span className="font-bold text-slate-800 dark:text-slate-100">{name}</span>
                              <span className="text-xs text-slate-500 font-medium">항목 {count}개</span>
                            </div>
                            <div className="flex gap-1 items-center shrink-0">
                              <button onClick={(e) => { e.stopPropagation(); setFolderActionModal(fullPath); }} className="p-2 text-slate-400 hover:text-primary transition-colors bg-slate-50 dark:bg-white/5 rounded-full" title="설정">
                                <IconDotsVertical size={18} />
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={fullPath}
                          onClick={() => setExplorerPath(fullPath)}
                          className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[24px] shadow-sm border border-slate-100/50 dark:border-white/5 flex flex-col justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-all relative group"
                        >
                          <div className="flex justify-between items-start">
                            <IconFolderFilled size={40} className="text-[#3182f6]" />
                            <button onClick={(e) => { e.stopPropagation(); setFolderActionModal(fullPath); }} className="p-1.5 text-slate-400 hover:text-primary transition-colors bg-slate-50 dark:bg-white/5 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                              <IconDotsVertical size={16} />
                            </button>
                          </div>
                          <div className="flex flex-col mt-2">
                            <span className="font-bold text-slate-800 dark:text-slate-100 truncate">{name}</span>
                            <span className="text-xs text-slate-500 font-medium">{count} items</span>
                          </div>
                        </div>
                      );
                    })}
                    </ReactSortable>`;

app = app.replace(renderSubfoldersRegex, newRenderSubfolders);

fs.writeFileSync('src/App.tsx', app);
console.log("Sortable implemented");
