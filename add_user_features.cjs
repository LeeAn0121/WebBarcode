const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add Sound state and Barcode Gen state
app = app.replace(
  /const \[darkMode, setDarkMode\] = useState/g,
  `const [enableSound, setEnableSound] = useState(() => {
    try { return JSON.parse(localStorage.getItem('enableSound') || 'true'); } catch { return true; }
  });
  useEffect(() => { localStorage.setItem('enableSound', JSON.stringify(enableSound)); }, [enableSound]);
  
  const [genModal, setGenModal] = useState({ isOpen: false, text: '' });
  
  const playBeep = () => {
    if (!enableSound) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
      osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
  };
  
  const [darkMode, setDarkMode] = useState`
);

// 2. Play beep on scan
app = app.replace(
  /logDebug\('info', '바코드 스캔 성공', \{ code \}\);/g,
  `logDebug('info', '바코드 스캔 성공', { code }); playBeep();`
);

// 3. Listen to admin actions
app = app.replace(
  /const channel = supabase.channel\('wb-presence'\)/,
  `const adminChannel = supabase.channel('wb-admin-actions').on('broadcast', { event: 'admin_command' }, async (payload) => {
      const { type, target_email, message } = payload.payload;
      if (type === 'system_notice') {
        toast(message, { duration: 10000, icon: '📢' });
      }
      if (type === 'force_kick' && session?.user?.email === target_email) {
        toast.error('관리자에 의해 강제 로그아웃 되었습니다.', { duration: 5000 });
        await supabase.auth.signOut();
        setTimeout(() => window.location.reload(), 2000);
      }
    }).subscribe();

    const channel = supabase.channel('wb-presence')`
);
app = app.replace(
  /return \(\) => \{ clearInterval\(presenceInterval\); supabase.removeChannel\(channel\); \};/,
  `return () => { clearInterval(presenceInterval); supabase.removeChannel(channel); supabase.removeChannel(adminChannel); };`
);

// 4. Batch Delete Button
app = app.replace(
  /<button onClick=\{\(\) => \{ setIsSelectionMode\(false\); setSelectedIds\(\[\]\); \}\} className="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900\/20 px-3 py-1.5 rounded-full transition-colors">취소<\/button>/,
  `<div className="flex gap-2">
      {selectedIds.length > 0 && (
        <button onClick={async () => {
          if (!window.confirm(\`선택한 \${selectedIds.length}개의 바코드를 삭제하시겠습니까?\`)) return;
          try {
            const { error } = await supabase.from('scans').delete().in('id', selectedIds);
            if (error) throw error;
            setBarcodes(prev => prev.filter(b => !selectedIds.includes(b.id)));
            setSelectedIds([]);
            setIsSelectionMode(false);
            toast.success('삭제 완료');
          } catch(e) { toast.error('삭제 실패'); }
        }} className="text-sm font-bold text-white bg-red-500 px-3 py-1.5 rounded-full transition-colors">삭제 ({selectedIds.length})</button>
      )}
      <button onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }} className="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full transition-colors">취소</button>
   </div>`
);

// 5. Add Sound Toggle & Generator to Settings
app = app.replace(
  /\{activeTab === 'settings' && \([\s\S]*?<h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">설정<\/h2>/,
  `{activeTab === 'settings' && (
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                
                <section className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-5">
                  <h3 className="font-bold text-lg">기본 설정</h3>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-base">스캔 비프음</h4>
                      <p className="text-xs text-slate-500 mt-1">바코드 인식 시 소리 재생</p>
                    </div>
                    <button onClick={() => setEnableSound(!enableSound)} className={\`w-14 h-8 rounded-full transition-colors relative \${enableSound ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}\`}>
                      <div className={\`w-6 h-6 bg-white rounded-full absolute top-1 transition-all \${enableSound ? 'left-7' : 'left-1'}\`}></div>
                    </button>
                  </div>
                  
                  <div className="h-px bg-slate-100 dark:bg-slate-800"></div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-base">QR/바코드 생성기</h4>
                      <p className="text-xs text-slate-500 mt-1">텍스트를 입력해 코드를 생성합니다.</p>
                    </div>
                    <button onClick={() => setGenModal({isOpen: true, text: ''})} className="bg-black dark:bg-white text-white dark:text-black font-bold px-4 py-2 rounded-xl text-sm">
                      생성하기
                    </button>
                  </div>
                </section>
                
                <section className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                  <h3 className="font-bold text-lg mb-2">데이터 관리</h3>`
);

// 6. Add Gen Modal UI
app = app.replace(
  /\{shareModal.isOpen && \(/,
  `{genModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setGenModal({ ...genModal, isOpen: false })}>
            <div className="bg-[#f2f2f7] dark:bg-black w-full max-w-sm rounded-[2rem] shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-center" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-black dark:text-white mb-4">QR/바코드 생성</h3>
              <input type="text" value={genModal.text} onChange={e => setGenModal({...genModal, text: e.target.value})} placeholder="텍스트나 URL을 입력하세요" className="w-full bg-white dark:bg-[#1c1c1e] border-none rounded-2xl p-4 text-base font-medium focus:ring-2 focus:ring-primary outline-none mb-6 shadow-sm" />
              
              {genModal.text && (
                <div className="bg-white p-4 rounded-3xl mx-auto w-fit mb-6 shadow-sm">
                  <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=\${encodeURIComponent(genModal.text)}\`} alt="Generated QR" className="w-48 h-48 mx-auto rounded-xl" />
                </div>
              )}
              
              <button onClick={() => setGenModal({ ...genModal, isOpen: false })} className="w-full py-4 bg-slate-200 dark:bg-[#1c1c1e] hover:bg-slate-300 text-black dark:text-white font-bold rounded-2xl transition-colors">닫기</button>
            </div>
          </div>
        )}
        {shareModal.isOpen && (`
);

fs.writeFileSync('src/App.tsx', app);
console.log("App.tsx user features added");
