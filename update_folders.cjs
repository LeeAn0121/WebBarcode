const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add handleRenameFolder logic
const renameLogic = `
  const handleRenameFolder = async (oldName: string) => {
    if (oldName === '기본폴더') return toast.error('기본 폴더는 이름 변경이 불가능합니다.');
    const newName = prompt(\`'\${oldName}' 폴더의 새 이름을 입력하세요:\\n(경로 변경 시 '상위폴더/새이름' 형태로 입력)\`, oldName);
    if (!newName || newName === oldName) return;
    
    try {
      // 1. DB 바코드 업데이트
      const barcodesToUpdate = barcodes.filter(b => (b.folder || '기본폴더') === oldName);
      if (barcodesToUpdate.length > 0) {
        const ids = barcodesToUpdate.map(b => b.id);
        const { error } = await supabase.from('scans').update({ folder: newName }).in('id', ids);
        if (error) throw error;
      }
      
      // 2. 폴더 목록 업데이트
      setLocalFolders(prev => {
        const next = prev.filter(f => f !== oldName && f !== newName);
        next.push(newName);
        localStorage.setItem('folders', JSON.stringify(next));
        return next;
      });
      
      // 3. 현재 뷰 업데이트
      setBarcodes(prev => prev.map(b => (b.folder || '기본폴더') === oldName ? { ...b, folder: newName } : b));
      if (currentFolder === oldName) setCurrentFolder(newName);
      toast.success('폴더 이름이 변경되었습니다.');
    } catch(err) {
      toast.error('폴더 이름 변경 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteFolder = (folderName) => {`;
app = app.replace(/const handleDeleteFolder = \(folderName\) => \{/, renameLogic);

// 2. Replace the activeTab === 'folders' UI
const foldersUiRegex = /\{activeTab === 'folders' && \([\s\S]*?\{activeTab === 'settings' && \(/;

const newFoldersUi = `{activeTab === 'folders' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-6 pb-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-2xl tracking-tight text-black dark:text-white">폴더 트리</h2>
                <button onClick={handleAddFolder} className="bg-primary hover:bg-primaryHover text-white px-5 py-2.5 rounded-full font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-2">
                  <IconFolderPlus size={18} /> 새 폴더
                </button>
              </div>
              <p className="text-sm text-slate-500 font-medium bg-[#f2f2f7] dark:bg-white/5 p-4 rounded-2xl mb-6 leading-relaxed">
                <span className="text-primary font-bold">💡 팁:</span> 폴더 생성 시 <code className="bg-white dark:bg-black px-2 py-1 rounded-md text-black dark:text-white mx-1 font-mono shadow-sm">창고/1층/A구역</code> 처럼 슬래시를 넣으면 자동으로 계층형 트리가 구성됩니다.
              </p>
            </div>
            
            <div className="px-6 pb-8 flex flex-col gap-3">
              {folders.map(f => {
                const parts = f.split('/');
                const depth = parts.length - 1;
                const name = parts[parts.length - 1];
                const barcodeCount = barcodes.filter(b => (b.folder || '기본폴더') === f).length;
                return (
                  <div key={f} className="bg-white dark:bg-[#1c1c1e] p-4 rounded-[1.5rem] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:scale-[0.98] transition-transform duration-300 flex flex-col gap-4 border border-transparent dark:border-white/5" style={{ marginLeft: \`\${depth * 1.5}rem\` }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-12 h-12 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-2xl flex items-center justify-center shrink-0">
                          <IconFolder size={24} className="text-slate-600 dark:text-slate-300" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="font-bold text-lg text-black dark:text-white truncate">{name}</span>
                          <span className="text-sm font-bold text-primary">{barcodeCount}개 항목</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full pt-2 border-t border-slate-100 dark:border-white/5">
                      <button onClick={() => handleCreateInvite(f)} className="flex-1 py-2.5 bg-[#f2f2f7] hover:bg-emerald-50 dark:bg-black dark:hover:bg-emerald-900/20 text-slate-600 hover:text-emerald-600 dark:text-slate-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                        <IconShare size={16} /> 협업
                      </button>
                      <button onClick={() => handleShareFolder(f)} className="flex-1 py-2.5 bg-[#f2f2f7] hover:bg-blue-50 dark:bg-black dark:hover:bg-blue-900/20 text-slate-600 hover:text-blue-600 dark:text-slate-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                        <IconCopy size={16} /> 공유
                      </button>
                      {f !== '기본폴더' && (
                        <button onClick={() => handleRenameFolder(f)} className="flex-1 py-2.5 bg-[#f2f2f7] hover:bg-slate-200 dark:bg-black dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                          <IconEdit size={16} /> 이름
                        </button>
                      )}
                      {f !== '기본폴더' && (
                        <button onClick={() => handleDeleteFolder(f)} className="flex-1 py-2.5 bg-[#f2f2f7] hover:bg-red-50 dark:bg-black dark:hover:bg-red-900/20 text-slate-600 hover:text-red-600 dark:text-slate-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                          <IconTrash size={16} /> 삭제
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (`;

app = app.replace(foldersUiRegex, newFoldersUi);

fs.writeFileSync('src/App.tsx', app);
console.log("Folders tab updated");
