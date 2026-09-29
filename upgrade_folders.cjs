const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add folderOrder state
app = app.replace(
  /const \[folderViewMode, setFolderViewMode\] = useState<'grid' \| 'list'>\('grid'\);/,
  `const [folderViewMode, setFolderViewMode] = useState<'grid' | 'list'>('grid');
  const [folderOrder, setFolderOrder] = useState<string[]>(JSON.parse(localStorage.getItem('folderOrder') || '[]'));`
);

// 2. Modify `folders` array sorting
app = app.replace(
  /const folders = Array\.from\(new Set\(\['기본폴더', \.\.\.localFolders, \.\.\.barcodes\.map\(b => b\.folder\)\.filter\(Boolean\)\]\)\)\.sort\(\);/,
  `const folders = Array.from(new Set(['기본폴더', ...localFolders, ...barcodes.map(b => b.folder).filter(Boolean)]));
  folders.sort((a, b) => {
    const idxA = folderOrder.indexOf(a);
    const idxB = folderOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });`
);

// 3. Rewrite `handleRenameFolder` to be cascading
const oldRenameRegex = /const handleRenameFolder = async \(oldName: string\) => \{[\s\S]*?if \(currentFolder === oldName\) setCurrentFolder\(newName\);\n\s*toast\.success\('폴더 이름이 변경되었습니다\.'\);\n\s*\} catch \(error\) \{[\s\S]*?\}\n\s*\};/;

const newRename = `const handleRenameFolder = async (oldName: string) => {
    if (oldName === '기본폴더') return toast.error('기본 폴더는 이름 변경이 불가능합니다.');
    const newName = prompt(\`'\${oldName}' 폴더의 새 이름을 입력하세요:\\n(계층 변경 시 '상위폴더/새이름' 형태로 입력)\`, oldName);
    if (!newName || newName === oldName) return;
    
    try {
      const oldPrefix = oldName + '/';
      const newPrefix = newName + '/';
      
      // 1. DB 바코드 업데이트 (하위 폴더 포함)
      const barcodesToUpdate = barcodes.filter(b => {
        const f = b.folder || '기본폴더';
        return f === oldName || f.startsWith(oldPrefix);
      });
      
      if (barcodesToUpdate.length > 0) {
        const uniqueFolders = Array.from(new Set(barcodesToUpdate.map(b => b.folder || '기본폴더')));
        for (const f of uniqueFolders) {
          const updatedF = f === oldName ? newName : f.replace(oldPrefix, newPrefix);
          const ids = barcodesToUpdate.filter(b => (b.folder || '기본폴더') === f).map(b => b.id);
          const { error } = await supabase.from('scans').update({ folder: updatedF }).in('id', ids);
          if (error) throw error;
        }
      }
      
      // 2. 폴더 목록 업데이트 (하위 폴더 포함)
      setLocalFolders(prev => {
        const next = prev.map(f => {
          if (f === oldName) return newName;
          if (f.startsWith(oldPrefix)) return f.replace(oldPrefix, newPrefix);
          return f;
        });
        if (!next.includes(newName)) next.push(newName);
        const uniqueNext = Array.from(new Set(next));
        localStorage.setItem('folders', JSON.stringify(uniqueNext));
        return uniqueNext;
      });
      
      // 3. 현재 뷰 업데이트
      setBarcodes(prev => prev.map(b => {
        const f = b.folder || '기본폴더';
        if (f === oldName) return { ...b, folder: newName };
        if (f.startsWith(oldPrefix)) return { ...b, folder: f.replace(oldPrefix, newPrefix) };
        return b;
      }));
      
      // 4. 순서 상태 유지 업데이트
      setFolderOrder(prev => {
        const next = prev.map(f => {
          if (f === oldName) return newName;
          if (f.startsWith(oldPrefix)) return f.replace(oldPrefix, newPrefix);
          return f;
        });
        localStorage.setItem('folderOrder', JSON.stringify(next));
        return next;
      });

      if (currentFolder === oldName) setCurrentFolder(newName);
      if (explorerPath === oldName) setExplorerPath(newName);
      else if (explorerPath.startsWith(oldPrefix)) setExplorerPath(explorerPath.replace(oldPrefix, newPrefix));
      
      toast.success('폴더 계층 및 이름이 변경되었습니다.');
    } catch (error: any) {
      toast.error('변경 실패: ' + error.message);
    }
  };`;

app = app.replace(oldRenameRegex, newRename);

// 4. Add "Move Order" functions
app = app.replace(
  /const handleRenameFolder = async/,
  `const handleMoveOrder = (folder: string, direction: 'up' | 'down') => {
    setFolderOrder(prev => {
      // Initialize if empty
      let currentOrder = [...prev];
      if (currentOrder.length === 0) currentOrder = [...folders];
      
      const idx = currentOrder.indexOf(folder);
      if (idx === -1) return currentOrder;
      
      if (direction === 'up' && idx > 0) {
        [currentOrder[idx - 1], currentOrder[idx]] = [currentOrder[idx], currentOrder[idx - 1]];
      } else if (direction === 'down' && idx < currentOrder.length - 1) {
        [currentOrder[idx + 1], currentOrder[idx]] = [currentOrder[idx], currentOrder[idx + 1]];
      }
      
      localStorage.setItem('folderOrder', JSON.stringify(currentOrder));
      return currentOrder;
    });
  };\n\n  const handleRenameFolder = async`
);

// 5. Add Up/Down buttons to folderActionModal
// Wait, the action modal grid has exactly 4 buttons right now (Excel, Share, Collab, Rename).
// Let's add a second grid row for Order.
const actionButtonsRegex = /\{folderActionModal !== '기본폴더' && \(\n\s*<button onClick=\{\(\) => \{ handleRenameFolder\(folderActionModal\); setFolderActionModal\(null\); \}\}[\s\S]*?<\/button>\n\s*\)\}\n\s*<\/div>/;

const newActionButtons = `{folderActionModal !== '기본폴더' && (
                  <button onClick={() => { handleRenameFolder(folderActionModal); setFolderActionModal(null); }} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 fluid-spring">
                    <IconEdit size={28} />
                    <span className="font-bold text-sm">계층/이름 변경</span>
                  </button>
                )}
              </div>

              {folderActionModal !== '기본폴더' && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button onClick={() => handleMoveOrder(folderActionModal, 'up')} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-3 flex items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/30 text-slate-600 dark:text-slate-400 fluid-spring">
                    <span className="font-bold text-sm">⬆️ 앞으로 (위로)</span>
                  </button>
                  <button onClick={() => handleMoveOrder(folderActionModal, 'down')} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-3 flex items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/30 text-slate-600 dark:text-slate-400 fluid-spring">
                    <span className="font-bold text-sm">⬇️ 뒤로 (아래로)</span>
                  </button>
                </div>
              )}`;

app = app.replace(actionButtonsRegex, newActionButtons);

fs.writeFileSync('src/App.tsx', app);
console.log("Upgraded Folders: Cascading Rename and Reordering");
