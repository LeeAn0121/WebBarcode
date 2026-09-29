const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// We need a state for the Folder Action Menu Modal
app = app.replace(
  /const \[promptModal, setPromptModal\] = useState/,
  `const [folderActionModal, setFolderActionModal] = useState<string | null>(null);\n  const [promptModal, setPromptModal] = useState`
);

// REBUILD FOLDERS TAB
const oldFoldersTabRegex = /\{\/\* Tab: Folders \*\/\}[\s\S]*?\{\/\* Tab: Settings \*\/\}/;
const newFoldersTab = `{/* Tab: Folders */}
        {activeTab === 'folders' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-6 pb-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="font-bold text-3xl tracking-tight text-black dark:text-white mb-1">폴더 관리</h2>
                  <p className="text-sm font-medium text-slate-500">바코드를 체계적으로 분류하세요.</p>
                </div>
                <button onClick={handleAddFolder} className="w-12 h-12 bg-primary hover:bg-primaryHover text-white rounded-full font-bold shadow-lg shadow-primary/30 transition-transform active:scale-95 flex items-center justify-center fluid-spring">
                  <IconFolderPlus size={24} />
                </button>
              </div>
            </div>
            
            <div className="px-6 pb-32 grid grid-cols-2 gap-4">
              {folders.map(f => {
                const parts = f.split('/');
                const name = parts[parts.length - 1];
                const barcodeCount = barcodes.filter(b => (b.folder || '기본폴더') === f).length;
                return (
                  <div key={f} className="relative bg-white/70 dark:bg-white/5 backdrop-blur-xl p-5 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] fluid-spring hover:scale-[0.98] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] flex flex-col justify-between aspect-square border border-white/50 dark:border-white/10 group cursor-pointer" onClick={() => setFolderActionModal(f)}>
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                        <IconFolder size={24} />
                      </div>
                      <button className="p-2 -m-2 text-slate-400 hover:text-primary transition-colors focus-visible:outline-none">
                        <IconDotsVertical size={20} />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-black dark:text-white truncate mb-1">{name}</h3>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{barcodeCount}개 항목</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Settings */}`;
app = app.replace(oldFoldersTabRegex, newFoldersTab);

// REBUILD SETTINGS TAB
const oldSettingsTabRegex = /\{\/\* Tab: Settings \*\/\}[\s\S]*?\{\/\* Floating Action Button for Scanner \*\/\}/;
const newSettingsTab = `{/* Tab: Settings */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300 relative z-10">
            <div className="p-6 pb-4">
              <h2 className="font-bold text-3xl tracking-tight text-black dark:text-white mb-1">설정</h2>
              <p className="text-sm font-medium text-slate-500">앱 동작과 데이터를 관리합니다.</p>
            </div>
            
            <div className="px-6 pb-32 grid grid-cols-2 gap-4">
              
              {/* Bento: Auto Router (Wide) */}
              <div className="col-span-2 bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] fluid-spring hover:scale-[0.99]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                    <IconWand size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-black dark:text-white">자동 분류 규칙 (Auto-Router)</h3>
                    <p className="text-xs text-slate-500">특정 번호로 시작하면 자동으로 폴더 이동</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                  {autoRules.length === 0 && <div className="text-center py-4 text-sm text-slate-400 bg-black/5 dark:bg-white/5 rounded-2xl">등록된 규칙이 없습니다.</div>}
                  {autoRules.map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white dark:bg-[#1c1c1e] p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-2">
                         <span className="font-mono text-sm font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-1 rounded-md">{rule.startsWith}</span>
                         <span className="text-slate-400 text-xs">→</span>
                         <span className="text-sm font-bold truncate max-w-[100px]">{rule.targetFolder}</span>
                      </div>
                      <button onClick={() => setAutoRules(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 p-1"><IconX size={16}/></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => setPromptModal({ isOpen: true, title: '새 자동 분류 규칙', description: '규칙을 "시작번호,폴더명" 형식으로 입력하세요. (예: 880,한국상품)', placeholder: '880,한국상품', value: '', type: 'text', confirmText: '추가', onConfirm: (val) => { const parts = val.split(','); if(parts.length===2) setAutoRules(prev => [...prev, {startsWith: parts[0].trim(), targetFolder: parts[1].trim()}]); } })} className="w-full py-3 bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">
                  <IconPlus size={18} /> 새 규칙 추가
                </button>
              </div>

              {/* Bento: JSON Backup */}
              <div className="col-span-1 bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] fluid-spring hover:scale-105 flex flex-col justify-between cursor-pointer" onClick={handleBackup}>
                <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
                  <IconDownload size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-black dark:text-white mb-1">데이터 백업</h3>
                  <p className="text-xs text-slate-500">JSON 내보내기</p>
                </div>
              </div>

              {/* Bento: JSON Restore */}
              <div className="col-span-1 bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] fluid-spring hover:scale-105 flex flex-col justify-between cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-4">
                  <IconCloudUpload size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-black dark:text-white mb-1">데이터 복원</h3>
                  <p className="text-xs text-slate-500">JSON 불러오기</p>
                </div>
                <input type="file" ref={fileInputRef} onChange={handleRestore} accept=".json" className="hidden" />
              </div>

              {/* Bento: Excel Export (Wide) */}
              <div className="col-span-2 bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] fluid-spring hover:scale-[0.99] flex items-center justify-between cursor-pointer group" onClick={exportExcel}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/10 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center">
                    <IconFileExport size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-black dark:text-white mb-1">Excel 추출</h3>
                    <p className="text-xs text-slate-500">전체 스캔 기록 (.xlsx)</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors">
                  <IconDownload size={20} />
                </div>
              </div>

              {/* Bento: Danger Zone (Wide) */}
              <div className="col-span-2 bg-red-500/10 dark:bg-red-500/20 backdrop-blur-xl border border-red-500/30 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(239,68,68,0.1)] fluid-spring hover:scale-[0.99] flex flex-col gap-4 cursor-pointer group" onClick={handleDeleteAll}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center">
                    <IconAlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-600 dark:text-red-400 text-lg">초기화</h3>
                    <p className="text-xs text-red-500/70 dark:text-red-400/70">서버의 모든 데이터 영구 삭제</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Floating Action Button for Scanner */}`;
app = app.replace(oldSettingsTabRegex, newSettingsTab);

// FOLDER ACTION MODAL
const folderActionModalUI = `{/* Folder Action Modal */}
        {folderActionModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setFolderActionModal(null)}>
            <div className="bg-white/80 dark:bg-[#111111]/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-6 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
              <h3 className="text-xl font-bold text-center text-black dark:text-white mb-6">'{folderActionModal.split('/').pop()}' 관리</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button onClick={() => {
                  const listToExport = barcodes.filter(b => (b.folder || '기본폴더') === folderActionModal);
                  if (listToExport.length === 0) return toast.warning('데이터가 없습니다.');
                  const data = listToExport.map(item => ({ '바코드': item.code, '메모': item.memo || '', '스캔시간': item.created_at, '폴더': item.folder || '기본폴더' }));
                  const ws = XLSX.utils.json_to_sheet(data);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Scans');
                  XLSX.writeFile(wb, \`\${folderActionModal.replace(/\\//g, '_')}_barcodes.xlsx\`);
                  toast.success(\`'\${folderActionModal}' 엑셀 추출 완료!\`);
                  setFolderActionModal(null);
                }} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/30 text-slate-600 hover:text-green-600 dark:text-slate-400 fluid-spring">
                  <IconFileExport size={28} />
                  <span className="font-bold text-sm">엑셀 추출</span>
                </button>

                <button onClick={() => { handleShareFolder(folderActionModal); setFolderActionModal(null); }} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 hover:text-blue-600 dark:text-slate-400 fluid-spring">
                  <IconCopy size={28} />
                  <span className="font-bold text-sm">공유 링크</span>
                </button>

                <button onClick={() => { handleCreateInvite(folderActionModal); setFolderActionModal(null); }} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-600 hover:text-emerald-600 dark:text-slate-400 fluid-spring">
                  <IconShare size={28} />
                  <span className="font-bold text-sm">팀 협업</span>
                </button>

                {folderActionModal !== '기본폴더' && (
                  <button onClick={() => { handleRenameFolder(folderActionModal); setFolderActionModal(null); }} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 fluid-spring">
                    <IconEdit size={28} />
                    <span className="font-bold text-sm">이름 변경</span>
                  </button>
                )}
              </div>
              
              {folderActionModal !== '기본폴더' && (
                <button onClick={() => { handleDeleteFolder(folderActionModal); setFolderActionModal(null); }} className="w-full bg-red-50 dark:bg-red-900/20 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                  <IconTrash size={20} /> 폴더 삭제
                </button>
              )}
            </div>
          </div>
        )}`;

app = app.replace(/\{\/\* Modals \*\/\}/, `{/* Modals */}\n        ${folderActionModalUI}`);

fs.writeFileSync('src/App.tsx', app);
console.log("Folders and Settings rebuilt");
