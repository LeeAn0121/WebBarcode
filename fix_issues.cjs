const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix Splash component
const oldSplashRegex = /const Splash = \(\{ fadingOut \}: \{ fadingOut: boolean \}\) => \{[\s\S]*?<\/div>\s*\);\s*\};/;
const newSplash = `const Splash = ({ fadingOut }: { fadingOut: boolean }) => {
  return (
    <div className={\`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-300 ease-out overflow-hidden \${fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}\`}>
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/30 dark:bg-purple-900/40 blur-[80px] mix-blend-screen animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-blue-400/30 dark:bg-blue-900/40 blur-[80px] mix-blend-screen animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] rounded-full bg-emerald-400/20 dark:bg-emerald-900/30 blur-[80px] mix-blend-screen animate-blob animation-delay-4000"></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center gap-6 bg-black/40 border border-white/10 backdrop-blur-[40px] p-10 rounded-[40px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]">
        <div className="relative w-[88px] h-[88px] rounded-3xl shadow-[0_10px_40px_rgba(99,102,241,0.3)]">
          <img src={\`\${import.meta.env.BASE_URL}icon.jpg\`} alt="" className="w-full h-full object-cover rounded-3xl relative z-10" />
          <div className="absolute inset-0 rounded-3xl bg-primary z-0 animate-[pulseGlow_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-indigo-400 to-purple-400 text-transparent bg-clip-text">WebBarcode</h1>
        <div className="w-12 h-1.5 rounded-full bg-indigo-500/20 overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full w-[40%] bg-indigo-500 rounded-full animate-[loadBar_1.2s_ease-in-out_infinite]"></div>
        </div>
      </div>
    </div>
  );
};`;
app = app.replace(oldSplashRegex, newSplash);

// 2. Add adminChannel and Notification.requestPermission() inside App component
// We can just add the channel listener inside the existing useEffect that handles keydowns, or a new one.
const channelHook = `
  // 공지사항 & 브로드캐스트 채널 리스너
  useEffect(() => {
    // 알림 권한 요청
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const adminChannel = supabase.channel('wb-admin-actions').on('broadcast', { event: 'admin_command' }, async (payload) => {
      const { type, target_email, message } = payload.payload;
      if (type === 'system_notice') {
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        setSystemNotice({ isOpen: true, message });
        playSound('success', true);
        
        // 백그라운드이거나 최소화 상태일 때 시스템 알림 띄우기
        if ('Notification' in window && Notification.permission === 'granted') {
          if (document.hidden) {
            new Notification('시스템 공지사항', { body: message, icon: \`\${import.meta.env.BASE_URL}icon.jpg\` });
          }
        }
      }
      if (type === 'force_kick' && session?.user?.email === target_email) {
        alert('관리자에 의해 강제 로그아웃 되었습니다.');
        await supabase.auth.signOut();
        window.location.reload();
      }
    }).subscribe();

    return () => { supabase.removeChannel(adminChannel); };
  }, [session?.user?.email]);

  const [systemNotice, setSystemNotice] = useState`;

app = app.replace(/const \[systemNotice, setSystemNotice\] = useState/, channelHook);

// 3. Fix Folder Management UI (Icon Buttons instead of Text Buttons)
const oldFolderButtonsRegex = /<div className="flex gap-2 w-full pt-2 border-t border-slate-100 dark:border-white\/5">[\s\S]*?<\/div>\s*<\/div>\s*\);\s*\}\)\}/;

const newFolderButtons = `<div className="flex justify-around w-full pt-4 border-t border-slate-100 dark:border-white/5 gap-2">
                      <button onClick={() => {
                        const listToExport = barcodes.filter(b => (b.folder || '기본폴더') === f);
                        if (listToExport.length === 0) return toast.warning('데이터가 없습니다.');
                        const data = listToExport.map(item => ({ '바코드': item.code, '메모': item.memo || '', '스캔시간': item.created_at, '폴더': item.folder || '기본폴더' }));
                        const ws = XLSX.utils.json_to_sheet(data);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'Scans');
                        XLSX.writeFile(wb, \`\${f.replace(/\\//g, '_')}_barcodes.xlsx\`);
                        toast.success(\`'\${f}' 엑셀 추출 완료!\`);
                      }} className="w-12 h-12 bg-white/60 dark:bg-black/40 backdrop-blur-md hover:bg-green-50 dark:hover:bg-green-900/30 text-slate-600 hover:text-green-600 dark:text-slate-400 font-bold rounded-[1rem] transition-all flex items-center justify-center shadow-sm fluid-spring border border-transparent dark:border-white/5 hover:scale-105" title="엑셀 추출">
                        <IconFileExport size={20} />
                      </button>
                      <button onClick={() => handleShareFolder(f)} className="w-12 h-12 bg-white/60 dark:bg-black/40 backdrop-blur-md hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 hover:text-blue-600 dark:text-slate-400 font-bold rounded-[1rem] transition-all flex items-center justify-center shadow-sm fluid-spring border border-transparent dark:border-white/5 hover:scale-105" title="공유">
                        <IconCopy size={20} />
                      </button>
                      <button onClick={() => handleCreateInvite(f)} className="w-12 h-12 bg-white/60 dark:bg-black/40 backdrop-blur-md hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-600 hover:text-emerald-600 dark:text-slate-400 font-bold rounded-[1rem] transition-all flex items-center justify-center shadow-sm fluid-spring border border-transparent dark:border-white/5 hover:scale-105" title="협업">
                        <IconShare size={20} />
                      </button>
                      {f !== '기본폴더' && (
                        <button onClick={() => handleRenameFolder(f)} className="w-12 h-12 bg-white/60 dark:bg-black/40 backdrop-blur-md hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 font-bold rounded-[1rem] transition-all flex items-center justify-center shadow-sm fluid-spring border border-transparent dark:border-white/5 hover:scale-105" title="이름 변경">
                          <IconEdit size={20} />
                        </button>
                      )}
                      {f !== '기본폴더' && (
                        <button onClick={() => handleDeleteFolder(f)} className="w-12 h-12 bg-white/60 dark:bg-black/40 backdrop-blur-md hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-600 hover:text-red-500 dark:text-slate-400 font-bold rounded-[1rem] transition-all flex items-center justify-center shadow-sm fluid-spring border border-transparent dark:border-white/5 hover:scale-105" title="삭제">
                          <IconTrash size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}`;

app = app.replace(oldFolderButtonsRegex, newFolderButtons);

fs.writeFileSync('src/App.tsx', app);
console.log("Issues fixed in App.tsx");
