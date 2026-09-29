const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Add a state for system notice
const noticeState = `
  const [systemNotice, setSystemNotice] = useState<{isOpen: boolean, message: string}>({isOpen: false, message: ''});
  const [smartFilter, setSmartFilter] = useState`;

app = app.replace(/const \[smartFilter, setSmartFilter\] = useState/, noticeState);

// Modify the listener
const listenerMod = `
    const adminChannel = supabase.channel('wb-admin-actions').on('broadcast', { event: 'admin_command' }, async (payload) => {
      const { type, target_email, message } = payload.payload;
      if (type === 'system_notice') {
        // 모바일/PC 모두가 확실히 볼 수 있도록 강제 모달 및 네이티브 진동(가능할경우) 호출
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        setSystemNotice({ isOpen: true, message });
        playSound('success', true); // 소리 알림
      }
      if (type === 'force_kick' && session?.user?.email === target_email) {
        alert('관리자에 의해 강제 로그아웃 되었습니다.');
        await supabase.auth.signOut();
        window.location.reload();
      }
    }).subscribe();`;

app = app.replace(/const adminChannel = supabase\.channel\('wb-admin-actions'\)[\s\S]*?\}\)\.subscribe\(\);/, listenerMod);

// Add the modal UI
const modalUI = `
        {/* System Notice Modal */}
        {systemNotice.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 animate-in fade-in duration-200" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-[#1c1c1e] w-full max-w-sm rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200 text-center flex flex-col items-center border-4 border-primary">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-6">
                <IconAlertTriangle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-black dark:text-white mb-4">시스템 공지</h3>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-8 font-medium break-keep whitespace-pre-wrap">{systemNotice.message}</p>
              <button onClick={() => setSystemNotice({ isOpen: false, message: '' })} className="w-full py-4 bg-primary hover:bg-primaryHover text-white font-bold rounded-2xl transition-colors shadow-lg shadow-primary/30">
                확인했습니다
              </button>
            </div>
          </div>
        )}
        
        {/* Share Modal */}`;

app = app.replace(/\{\/\* Share Modal \*\/\}/, modalUI);

fs.writeFileSync('src/App.tsx', app);
console.log("App.tsx broadcast modal added");
