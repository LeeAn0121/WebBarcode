const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix 'scans' -> 'barcodes'
app = app.replace(/supabase\.from\('scans'\)/g, "supabase.from('barcodes')");

// 2. moveModal state
app = app.replace(
  /const \[moveModal, setMoveModal\] = useState\(\{ isOpen: false, ids: \[\] as string\[\], targetFolder: '기본폴더' \}\);/,
  "const [moveModal, setMoveModal] = useState({ isOpen: false, ids: [] as string[], targetFolder: '기본폴더', type: 'barcode' as 'barcode' | 'folder', sourceFolder: '' });"
);

// 3. handleMoveFolderSubmit
const oldMoveSubmitRegex = /const handleMoveFolderSubmit = async \(\) => \{[\s\S]*?toast\.error\('폴더 이동에 실패했습니다\.'\);\n\s*\}\n\s*\};/;

const newMoveSubmit = `const handleMoveFolderSubmit = async () => {
    try {
      if (moveModal.type === 'barcode') {
        if (moveModal.ids.length === 0) return;
        const { error } = await supabase.from('barcodes').update({ folder: moveModal.targetFolder }).in('id', moveModal.ids);
        if (error) throw error;
        setBarcodes(prev => prev.map(b => moveModal.ids.includes(b.id) ? { ...b, folder: moveModal.targetFolder } : b));
        toast.success(\`\${moveModal.ids.length}개 항목 이동 완료!\`);
      } else if (moveModal.type === 'folder') {
        const oldName = moveModal.sourceFolder;
        const newName = moveModal.targetFolder === '기본폴더' ? oldName.split('/').pop()! : \`\${moveModal.targetFolder}/\${oldName.split('/').pop()}\`;
        
        if (oldName === newName) {
          setMoveModal(prev => ({ ...prev, isOpen: false }));
          return;
        }

        const oldPrefix = oldName + '/';
        const newPrefix = newName + '/';
        
        // 1. DB 업데이트
        const barcodesToUpdate = barcodes.filter(b => {
          const f = b.folder || '기본폴더';
          return f === oldName || f.startsWith(oldPrefix);
        });
        
        if (barcodesToUpdate.length > 0) {
          const uniqueFolders = Array.from(new Set(barcodesToUpdate.map(b => b.folder || '기본폴더')));
          for (const f of uniqueFolders) {
            const updatedF = f === oldName ? newName : f.replace(oldPrefix, newPrefix);
            const ids = barcodesToUpdate.filter(b => (b.folder || '기본폴더') === f).map(b => b.id);
            const { error } = await supabase.from('barcodes').update({ folder: updatedF }).in('id', ids);
            if (error) throw error;
          }
        }
        
        // 2. 상태 업데이트
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
        
        setBarcodes(prev => prev.map(b => {
          const f = b.folder || '기본폴더';
          if (f === oldName) return { ...b, folder: newName };
          if (f.startsWith(oldPrefix)) return { ...b, folder: f.replace(oldPrefix, newPrefix) };
          return b;
        }));
        
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
        
        toast.success('폴더 위치가 이동되었습니다.');
      }
      
      setMoveModal(prev => ({ ...prev, isOpen: false }));
      setActiveActionMenu(null);
      setIsSelectionMode(false);
      setSelectedIds([]);
    } catch(e: any) {
      console.error(e);
      toast.error('이동에 실패했습니다: ' + e.message);
    }
  };`;

app = app.replace(oldMoveSubmitRegex, newMoveSubmit);
fs.writeFileSync('src/App.tsx', app);
