const fs = require('fs');

// 1. App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Remove Aurora Background
app = app.replace(
  /\{\/\* 🌌 오로라\(Mesh\) 그라데이션 배경[\s\S]*?<\/div>/,
  ''
);

// Revert Layout Wrapper
app = app.replace(
  /className="w-full md:max-w-6xl max-w-md flex flex-col h-full overflow-hidden relative bg-white\/60 dark:bg-black\/60 backdrop-blur-3xl md:shadow-\[0_40px_100px_-20px_rgba\(0,0,0,0\.4\)\] md:border border-white\/40 dark:border-white\/10 md:rounded-\[3rem\] transition-all z-10"/,
  'className="w-full md:max-w-6xl max-w-md flex flex-col h-full overflow-hidden relative bg-[#f2f2f7] dark:bg-black md:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] md:border border-white/5 md:rounded-[3rem] transition-all z-10"'
);

// Revert Header
app = app.replace(
  /className="bg-white\/30 dark:bg-black\/30 backdrop-blur-md z-40 shrink-0 px-6 pt-12 pb-4 flex justify-between items-end border-b border-white\/20 dark:border-white\/5"/,
  'className="bg-[#f2f2f7] dark:bg-black z-40 shrink-0 px-6 pt-12 pb-4 flex justify-between items-end border-none"'
);

// Revert Barcode Item Cards
app = app.replace(
  /bg-white\/70 dark:bg-white\/5 backdrop-blur-xl border border-white\/50 dark:border-white\/10 shadow-\[0_8px_30px_rgb\(0,0,0,0\.04\)\] fluid-spring hover:scale-\[0\.98\] hover:shadow-\[0_10px_40px_rgb\(0,0,0,0\.08\)\]/g,
  'bg-white dark:bg-[#1c1c1e] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:scale-[0.98] border border-transparent dark:border-white/5'
);

// Revert Bottom Nav
app = app.replace(
  /<nav className="fixed md:absolute bottom-6 left-6 right-6 md:left-1\/2 md:-translate-x-1\/2 md:w-\[400px\] bg-white\/80 dark:bg-\[#111111\]\/80 backdrop-blur-2xl border border-white\/50 dark:border-white\/10 rounded-full shadow-\[0_20px_40px_rgba\(0,0,0,0\.1\)\] p-2 z-40 fluid-spring">/,
  '<nav className="fixed md:absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-[#111111]/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 pb-safe z-40">'
);
app = app.replace(
  /<div className="flex justify-around items-center h-14 px-2">/,
  '<div className="flex justify-around items-center h-16 px-2 md:px-6">'
);

// Revert Search Input
app = app.replace(
  /className="w-full bg-white\/70 dark:bg-white\/5 backdrop-blur-xl border border-white\/50 dark:border-white\/10 rounded-2xl pl-12 p-4 text-base font-bold focus:ring-4 focus:ring-primary\/30 outline-none fluid-spring shadow-\[0_8px_30px_rgb\(0,0,0,0\.04\)\]"/,
  'className="w-full bg-white dark:bg-[#1c1c1e] border-0 rounded-2xl pl-12 p-4 text-base font-medium focus:ring-2 focus:ring-primary outline-none transition-shadow shadow-sm"'
);

// Revert Folder Pills
app = app.replace(
  /bg-white\/70 dark:bg-white\/5 backdrop-blur-xl border border-white\/50 dark:border-white\/10 text-slate-600 dark:text-slate-400 fluid-spring hover:scale-105 shadow-sm/g,
  'bg-white dark:bg-[#1c1c1e] text-slate-500 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800'
);
app = app.replace(
  /bg-black dark:bg-white text-white dark:text-black fluid-spring scale-105 shadow-\[0_8px_20px_rgba\(0,0,0,0\.15\)\]/g,
  'bg-black dark:bg-white text-white dark:text-black shadow-md'
);

// REBUILD FOLDERS AND SETTINGS (Back to clean Toss list style, not grid!)
const oldFoldersTabRegex = /\{\/\* Tab: Folders \*\/\}[\s\S]*?\{\/\* Tab: Settings \*\/\}/;
const newFoldersTab = `{/* Tab: Folders */}
        {activeTab === 'folders' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-6 pb-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-2xl tracking-tight text-black dark:text-white">폴더 관리</h2>
                <button onClick={handleAddFolder} className="bg-primary hover:bg-primaryHover text-white px-5 py-2.5 rounded-full font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-2">
                  <IconFolderPlus size={18} /> 새 폴더
                </button>
              </div>
            </div>
            
            <div className="px-6 pb-24 flex flex-col gap-4">
              {folders.map(f => {
                const parts = f.split('/');
                const depth = parts.length - 1;
                const name = parts[parts.length - 1];
                const barcodeCount = barcodes.filter(b => (b.folder || '기본폴더') === f).length;
                return (
                  <div key={f} className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[1.5rem] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:scale-[0.99] transition-transform duration-300 flex flex-col gap-4 border border-transparent dark:border-white/5" style={{ marginLeft: \`\${depth * 1.5}rem\` }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-12 h-12 bg-[#f2f2f7] dark:bg-black rounded-2xl flex items-center justify-center shrink-0">
                          <IconFolder size={24} className="text-primary" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-bold text-lg text-black dark:text-white truncate">{name}</span>
                          <span className="text-sm font-bold text-slate-500">{barcodeCount}개 항목</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-around w-full pt-4 border-t border-slate-100 dark:border-white/5 gap-2">
                      <button onClick={() => {
                        const listToExport = barcodes.filter(b => (b.folder || '기본폴더') === f);
                        if (listToExport.length === 0) return toast.warning('데이터가 없습니다.');
                        const data = listToExport.map(item => ({ '바코드': item.code, '메모': item.memo || '', '스캔시간': item.created_at, '폴더': item.folder || '기본폴더' }));
                        const ws = XLSX.utils.json_to_sheet(data);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'Scans');
                        XLSX.writeFile(wb, \`\${f.replace(/\\//g, '_')}_barcodes.xlsx\`);
                        toast.success(\`'\${f}' 엑셀 추출 완료!\`);
                      }} className="w-12 h-12 bg-[#f2f2f7] dark:bg-black hover:bg-green-50 dark:hover:bg-green-900/30 text-slate-600 hover:text-green-600 dark:text-slate-400 font-bold rounded-2xl transition-colors flex items-center justify-center shadow-sm" title="엑셀 추출">
                        <IconFileExport size={20} />
                      </button>
                      <button onClick={() => handleShareFolder(f)} className="w-12 h-12 bg-[#f2f2f7] dark:bg-black hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 hover:text-blue-600 dark:text-slate-400 font-bold rounded-2xl transition-colors flex items-center justify-center shadow-sm" title="공유">
                        <IconCopy size={20} />
                      </button>
                      <button onClick={() => handleCreateInvite(f)} className="w-12 h-12 bg-[#f2f2f7] dark:bg-black hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-600 hover:text-emerald-600 dark:text-slate-400 font-bold rounded-2xl transition-colors flex items-center justify-center shadow-sm" title="협업">
                        <IconShare size={20} />
                      </button>
                      {f !== '기본폴더' && (
                        <button onClick={() => handleRenameFolder(f)} className="w-12 h-12 bg-[#f2f2f7] dark:bg-black hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 font-bold rounded-2xl transition-colors flex items-center justify-center shadow-sm" title="이름 변경">
                          <IconEdit size={20} />
                        </button>
                      )}
                      {f !== '기본폴더' && (
                        <button onClick={() => handleDeleteFolder(f)} className="w-12 h-12 bg-[#f2f2f7] dark:bg-black hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-600 hover:text-red-500 dark:text-slate-400 font-bold rounded-2xl transition-colors flex items-center justify-center shadow-sm" title="삭제">
                          <IconTrash size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Settings */}`;
app = app.replace(oldFoldersTabRegex, newFoldersTab);

const oldSettingsTabRegex = /\{\/\* Tab: Settings \*\/\}[\s\S]*?\{\/\* Floating Action Button for Scanner \*\/\}/;
const newSettingsTab = `{/* Tab: Settings */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-6 pb-2">
              <h2 className="font-bold text-2xl tracking-tight text-black dark:text-white mb-6">설정</h2>
            </div>
            
            <div className="px-6 pb-24 flex flex-col gap-6">
              
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">자동 분류 규칙</h3>
                <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-2xl border border-transparent dark:border-white/5 shadow-sm">
                  <div className="flex flex-col gap-3 max-h-40 overflow-y-auto custom-scrollbar mb-4">
                    {autoRules.length === 0 && <div className="text-sm text-slate-400">등록된 규칙이 없습니다.</div>}
                    {autoRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-[#f2f2f7] dark:bg-black p-3 rounded-xl">
                        <div className="flex items-center gap-2">
                           <span className="font-mono text-sm font-bold text-primary">{rule.startsWith}</span>
                           <span className="text-slate-400 text-xs">→</span>
                           <span className="text-sm font-bold">{rule.targetFolder}</span>
                        </div>
                        <button onClick={() => setAutoRules(prev => prev.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600"><IconX size={16}/></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setPromptModal({ isOpen: true, title: '새 자동 분류 규칙', description: '규칙을 "시작번호,폴더명" 형식으로 입력하세요. (예: 880,한국상품)', placeholder: '880,한국상품', value: '', type: 'text', confirmText: '추가', onConfirm: (val) => { const parts = val.split(','); if(parts.length===2) setAutoRules(prev => [...prev, {startsWith: parts[0].trim(), targetFolder: parts[1].trim()}]); } })} className="w-full py-3 bg-[#f2f2f7] dark:bg-black hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300">
                    <IconPlus size={18} /> 새 규칙 추가
                  </button>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">데이터 백업/복원</h3>
                <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-transparent dark:border-white/5 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2c2c2e] transition-colors rounded-t-2xl" onClick={handleBackup}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-lg"><IconDownload size={20}/></div>
                      <span className="font-bold">JSON 내보내기</span>
                    </div>
                  </div>
                  <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2c2c2e] transition-colors rounded-b-2xl" onClick={() => fileInputRef.current?.click()}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-lg"><IconCloudUpload size={20}/></div>
                      <span className="font-bold">JSON 불러오기</span>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleRestore} accept=".json" className="hidden" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">엑셀 출력</h3>
                <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-2xl border border-transparent dark:border-white/5 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2c2c2e] transition-colors" onClick={exportExcel}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-lg"><IconFileExport size={20}/></div>
                    <span className="font-bold">Excel (.xlsx) 다운로드</span>
                  </div>
                </div>
              </section>

              <section className="space-y-4 pt-4">
                <div className="bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center justify-between cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors" onClick={handleDeleteAll}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/50 text-red-500 rounded-lg"><IconAlertTriangle size={20}/></div>
                    <span className="font-bold text-red-600 dark:text-red-400">데이터 영구 삭제</span>
                  </div>
                </div>
              </section>

            </div>
          </div>
        )}

        {/* Floating Action Button for Scanner */}`;
app = app.replace(oldSettingsTabRegex, newSettingsTab);

// Revert Splash in App.tsx
app = app.replace(
  /const Splash = \(\{ fadingOut \}: \{ fadingOut: boolean \}\) => \{[\s\S]*?<\/div>\s*\);\s*\};/,
  `const Splash = ({ fadingOut }: { fadingOut: boolean }) => {
  return (
    <div className={\`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f2f2f7] dark:bg-black transition-opacity duration-300 ease-out overflow-hidden \${fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}\`}>
      <div className="relative z-10 flex flex-col items-center justify-center gap-6">
        <div className="relative w-24 h-24 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.1)]">
          <img src={\`\${import.meta.env.BASE_URL}icon.jpg\`} alt="" className="w-full h-full object-cover rounded-3xl relative z-10" />
          <div className="absolute inset-0 rounded-3xl bg-primary z-0 animate-ping opacity-50"></div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-black dark:text-white">WebBarcode</h1>
        <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full w-[40%] bg-primary rounded-full animate-[loadBar_1.2s_ease-in-out_infinite]"></div>
        </div>
      </div>
    </div>
  );
};`
);

// Remove the Folder Action Modal from Modals section
app = app.replace(/\{\/\* Folder Action Modal \*\/\}[\s\S]*?\{\/\* Modals \*\/\}/, '{/* Modals */}');

fs.writeFileSync('src/App.tsx', app);
console.log("Reverted App.tsx to Toss style");
