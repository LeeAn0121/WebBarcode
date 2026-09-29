const fs = require('fs');
let admin = fs.readFileSync('src/AdminPage.tsx', 'utf8');

// 1. Add admin state and functions
admin = admin.replace(
  /const \[levelFilter, setLevelFilter\] = useState<'all' | 'info' | 'warn' | 'error'>\('all'\);/,
  `const [levelFilter, setLevelFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [noticeText, setNoticeText] = useState('');
  
  const sendNotice = async () => {
    if (!noticeText.trim()) return;
    supabase.channel('wb-admin-actions').send({
      type: 'broadcast',
      event: 'admin_command',
      payload: { type: 'system_notice', message: noticeText }
    });
    toast.success('공지사항 전송됨');
    setNoticeText('');
  };
  
  const forceKick = (email: string) => {
    if (!window.confirm(\`\${email} 사용자를 강제 로그아웃 시킬까요?\`)) return;
    supabase.channel('wb-admin-actions').send({
      type: 'broadcast',
      event: 'admin_command',
      payload: { type: 'force_kick', target_email: email }
    });
    toast.success('강제 퇴장 명령 전송됨');
  };`
);

// 2. Add System Notice Box and Kick Button to Visitors
admin = admin.replace(
  /<div className="flex justify-between items-center">\s*<span className="font-bold">\{v.email \|\| '익명'\}<\/span>\s*<span className="text-xs text-slate-400">\{v.session_id\?\.slice\(0,6\)\}<\/span>\s*<\/div>/g,
  `<div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{v.email || '익명'}</span>
                        <span className="text-xs text-slate-400">{v.session_id?.slice(0,6)}</span>
                      </div>
                      {v.email && v.email !== session.user.email && (
                        <button onClick={() => forceKick(v.email!)} className="text-xs font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-md hover:bg-red-200 transition-colors">강제퇴장</button>
                      )}
                    </div>`
);

// 3. Add System Notice UI right below visitors
admin = admin.replace(
  /<\/div>\s*<\/section>\s*<\/div>/,
  `</div>
            </section>
            
            <section className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <h3 className="text-xl font-bold mb-4">전체 시스템 공지</h3>
              <div className="flex flex-col gap-3">
                <textarea value={noticeText} onChange={e => setNoticeText(e.target.value)} placeholder="접속 중인 모든 사용자에게 알림을 보냅니다." className="w-full bg-[#f2f2f7] dark:bg-black rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary resize-none h-24" />
                <button onClick={sendNotice} className="bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">공지사항 팝업 전송</button>
              </div>
            </section>
          </div>`
);

fs.writeFileSync('src/AdminPage.tsx', admin);
console.log("AdminPage.tsx features added");
