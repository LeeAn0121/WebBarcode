const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// --- 1. State Additions ---
// Add autoRules, smart filter state, backup/restore, undo logic
const stateAdditions = `
  const [autoRules, setAutoRules] = useState<{startsWith: string, targetFolder: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('autoRules') || '[]'); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('autoRules', JSON.stringify(autoRules)); }, [autoRules]);

  const [smartFilter, setSmartFilter] = useState<'all' | 'today' | 'yesterday' | 'hasMemo'>('all');
  
  // PC 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력창에 포커스가 있을 때는 단축키 무시
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') (document.activeElement as HTMLElement).blur();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setActiveTab('home');
        setTimeout(() => document.getElementById('barcode-search')?.focus(), 100);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setActiveTab('folders');
        setTimeout(() => {
           // prompt is blocking, so just call the function if it was accessible, but since handleAddFolder is in scope, we can't easily trigger it unless we dispatch an event or bind it.
           // Actually, we can just dispatch a custom event.
           window.dispatchEvent(new CustomEvent('cmd-n-trigger'));
        }, 100);
      } else if (e.code === 'Space') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('cmd-space-trigger'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
`;
app = app.replace(/const \[smartFilter, setSmartFilter\] = useState/, 'const [dummy, setDummy] = useState'); // In case it exists
app = app.replace(/const \[enableSound, setEnableSound\] = useState/, stateAdditions + '\n  const [enableSound, setEnableSound] = useState');

// Bind the custom events
app = app.replace(/useEffect\(\(\) => \{\s*if \(session && !scanning\)/, `
  useEffect(() => {
    const onNewFolder = () => handleAddFolder();
    const onScan = () => { setIsScannerModalOpen(true); startScanner(); };
    window.addEventListener('cmd-n-trigger', onNewFolder);
    window.addEventListener('cmd-space-trigger', onScan);
    return () => { window.removeEventListener('cmd-n-trigger', onNewFolder); window.removeEventListener('cmd-space-trigger', onScan); };
  }, [folders]);
  useEffect(() => {
    if (session && !scanning)`);

// --- 2. Undo Logic (Delete) ---
// Find handleDelete
const newDelete = `
  const handleDelete = async (id: string) => {
    const itemToDelete = barcodes.find(b => b.id === id);
    if (!itemToDelete) return;
    
    // 1. 낙관적 UI 업데이트 (먼저 화면에서 지움)
    setBarcodes(prev => prev.filter(b => b.id !== id));
    
    // 2. 5초 뒤에 실제 DB 삭제 실행할 타이머 설정
    const timeoutId = setTimeout(async () => {
      await supabase.from('scans').delete().eq('id', id);
    }, 5000);
    
    // 3. 토스트 및 취소 버튼 표시
    toast.success('바코드가 삭제되었습니다.', {
      action: {
        label: '되돌리기 (Undo)',
        onClick: () => {
          clearTimeout(timeoutId);
          setBarcodes(prev => [itemToDelete, ...prev].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
          toast('삭제가 취소되었습니다.');
        }
      },
      duration: 5000
    });
  };
`;
app = app.replace(/const handleDelete = async \(id\) => \{[\s\S]*?toast\.success\('바코드 삭제됨'\);\s*\n\s*\}/, newDelete);
app = app.replace(/const handleDelete = async \(id: string\) => \{[\s\S]*?toast\.success\('바코드 삭제됨'\);\s*\n\s*\}/, newDelete);

// --- 3. Smart Filters Logic ---
app = app.replace(/const filteredBarcodes = barcodes\.filter\(item => \{/, `
  const filteredBarcodes = barcodes.filter(item => {
    // Smart Filter Check
    if (smartFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      if (!item.created_at.startsWith(today)) return false;
    } else if (smartFilter === 'yesterday') {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (!item.created_at.startsWith(yesterday)) return false;
    } else if (smartFilter === 'hasMemo') {
      if (!item.memo || item.memo.trim() === '') return false;
    }
`);

// Add Smart Filter UI below search bar
app = app.replace(/<\/div>\s*<\/div>\s*<div className="flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar max-h-\[55vh\] lg:max-h-none lg:h-full">/g, 
`</div>
  {/* 스마트 필터 영역 */}
  <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
    <button onClick={() => setSmartFilter('all')} className={\`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all \${smartFilter === 'all' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-[#1c1c1e] text-slate-500 shadow-sm'}\`}>전체 보기</button>
    <button onClick={() => setSmartFilter('today')} className={\`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all \${smartFilter === 'today' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-[#1c1c1e] text-slate-500 shadow-sm'}\`}>오늘 스캔</button>
    <button onClick={() => setSmartFilter('yesterday')} className={\`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all \${smartFilter === 'yesterday' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-[#1c1c1e] text-slate-500 shadow-sm'}\`}>어제 스캔</button>
    <button onClick={() => setSmartFilter('hasMemo')} className={\`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all \${smartFilter === 'hasMemo' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-[#1c1c1e] text-slate-500 shadow-sm'}\`}>📝 메모 있음</button>
  </div>
</div>
<div className="flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar max-h-[55vh] lg:max-h-none lg:h-full">`
);


// --- 4. Auto-Classification Logic ---
app = app.replace(/let targetFolder = currentFolder === '전체' \? '기본폴더' : currentFolder;/, `
        let targetFolder = currentFolder === '전체' ? '기본폴더' : currentFolder;
        
        // 자동 분류 규칙 적용 (Auto-Classification)
        for (const rule of autoRules) {
          if (code.startsWith(rule.startsWith)) {
            targetFolder = rule.targetFolder;
            toast.success(\`자동 규칙에 의해 '\${targetFolder}'(으)로 분류되었습니다.\`, {icon: '✨'});
            break;
          }
        }
`);

// Add Auto-Classification UI and Backup/Restore UI to Settings
const settingsAdditions = `
                <section className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                  <h3 className="font-bold text-lg mb-2">자동 분류 규칙 (Auto-Router)</h3>
                  <p className="text-sm text-slate-500 bg-[#f2f2f7] dark:bg-black p-3 rounded-xl mb-2">스캔된 바코드가 특정 문자로 시작하면 지정된 폴더로 자동 이동시킵니다.</p>
                  
                  {autoRules.map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#f2f2f7] dark:bg-black p-3 rounded-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">[{rule.startsWith}]</span>
                        <span className="text-sm text-slate-500">시작 시 ➡️</span>
                        <span className="font-bold">{rule.targetFolder}</span>
                      </div>
                      <button onClick={() => setAutoRules(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 font-bold text-sm bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg">삭제</button>
                    </div>
                  ))}
                  
                  <button onClick={() => {
                    const prefix = prompt('어떤 글자로 시작하는 바코드를 분류할까요? (예: 880)');
                    if (!prefix) return;
                    const folder = prompt(\`'\${prefix}'(으)로 시작하는 바코드를 어느 폴더로 넣을까요?\`);
                    if (!folder) return;
                    setAutoRules(prev => [...prev, { startsWith: prefix, targetFolder: folder }]);
                    if (!folders.includes(folder)) {
                       setLocalFolders(prev => [...prev, folder]);
                       localStorage.setItem('folders', JSON.stringify([...folders, folder]));
                    }
                    toast.success('자동 분류 규칙이 추가되었습니다.');
                  }} className="w-full bg-[#f2f2f7] dark:bg-black hover:bg-slate-200 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl transition-colors mt-2">
                    + 새 분류 규칙 추가하기
                  </button>
                </section>
                
                <section className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                  <h3 className="font-bold text-lg mb-2 flex justify-between items-center">
                    데이터 스냅샷 및 엑셀
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={exportExcel} className="flex flex-col items-center justify-center gap-2 bg-[#f2f2f7] dark:bg-black hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-500 font-bold py-4 rounded-2xl transition-colors">
                      <IconFileExport size={24} /> 엑셀 다운로드
                    </button>
                    <label className="flex flex-col items-center justify-center gap-2 bg-[#f2f2f7] dark:bg-black hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-500 font-bold py-4 rounded-2xl transition-colors cursor-pointer">
                      <IconFileImport size={24} /> 엑셀 가져오기
                      <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        toast.info('엑셀 가져오는 중...');
                        try {
                           const XLSX = await import('xlsx');
                           const reader = new FileReader();
                           reader.onload = async (evt) => {
                             const bstr = evt.target?.result;
                             const wb = XLSX.read(bstr, {type:'binary'});
                             const wsname = wb.SheetNames[0];
                             const ws = wb.Sheets[wsname];
                             const data = XLSX.utils.sheet_to_json(ws);
                             
                             let successCount = 0;
                             for (const row of data) {
                               const code = row['바코드'] || row['code'] || row['barcode'];
                               const memo = row['메모'] || row['memo'] || '';
                               const folder = row['폴더'] || row['folder'] || '기본폴더';
                               if (code) {
                                 const newScan = { code: String(code), memo: String(memo), folder: String(folder), session_id: 'excel-import', user_agent: navigator.userAgent, path: window.location.pathname, user_id: session?.user?.id || null };
                                 const { error } = await supabase.from('scans').insert(newScan);
                                 if (!error) successCount++;
                               }
                             }
                             toast.success(\`\${successCount}개의 데이터를 가져왔습니다.\`);
                             window.location.reload();
                           };
                           reader.readAsBinaryString(file);
                        } catch(err) { toast.error('엑셀 파싱 실패'); }
                      }} />
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button onClick={() => {
                       const backupData = { barcodes, folders: localFolders, autoRules, exportDate: new Date().toISOString() };
                       const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
                       const url = URL.createObjectURL(blob);
                       const a = document.createElement('a'); a.href = url; a.download = \`webbarcode_backup_\${new Date().getTime()}.json\`; a.click();
                       toast.success('백업 파일이 저장되었습니다.');
                    }} className="flex flex-col items-center justify-center gap-2 bg-[#f2f2f7] dark:bg-black hover:bg-slate-200 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-bold py-4 rounded-2xl transition-colors">
                      <IconDownload size={24} /> 백업 생성 (.json)
                    </button>
                    <label className="flex flex-col items-center justify-center gap-2 bg-[#f2f2f7] dark:bg-black hover:bg-slate-200 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-bold py-4 rounded-2xl transition-colors cursor-pointer">
                      <IconUpload size={24} /> 백업 복구 (.json)
                      <input type="file" accept=".json" className="hidden" onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (!file) return;
                         if (!window.confirm('기존 데이터가 덮어씌워지거나 섞일 수 있습니다. 정말 백업 파일을 불러오시겠습니까?')) return;
                         const reader = new FileReader();
                         reader.onload = async (evt) => {
                           try {
                             const data = JSON.parse(evt.target?.result as string);
                             if (data.folders) { setLocalFolders(data.folders); localStorage.setItem('folders', JSON.stringify(data.folders)); }
                             if (data.autoRules) { setAutoRules(data.autoRules); }
                             if (data.barcodes && Array.isArray(data.barcodes)) {
                                toast.info('클라우드에 데이터를 병합 중입니다...');
                                const inserts = data.barcodes.map((b:any) => ({ code: b.code, memo: b.memo, folder: b.folder, created_at: b.created_at, user_id: session?.user?.id || null }));
                                await supabase.from('scans').insert(inserts);
                                toast.success('복구 완료! 앱을 새로고침합니다.');
                                setTimeout(() => window.location.reload(), 1500);
                             }
                           } catch (err) { toast.error('백업 파일이 올바르지 않습니다.'); }
                         };
                         reader.readAsText(file);
                      }} />
                    </label>
                  </div>
                </section>
`;

app = app.replace(/<section className="bg-white dark:bg-\[#1c1c1e\] rounded-\[2rem\] p-6 shadow-\[0_2px_12px_rgba\(0,0,0,0\.03\)\] flex flex-col gap-4">\s*<h3 className="font-bold text-lg mb-2">데이터 관리<\/h3>/, settingsAdditions + '\n<section className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-4"><h3 className="font-bold text-lg mb-2">기타 데이터 관리</h3>');

fs.writeFileSync('src/App.tsx', app);
console.log("All massive features implemented!");
