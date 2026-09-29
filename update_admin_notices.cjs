const fs = require('fs');
let admin = fs.readFileSync('src/AdminPage.tsx', 'utf8');

// 1. Add `notices` state
admin = admin.replace(
  /const \[noticeText, setNoticeText\] = useState\(''\);/,
  `const [noticeText, setNoticeText] = useState('');
  const [notices, setNotices] = useState<{id: string, message: string, created_at: string}[]>([]);
  const [editingNotice, setEditingNotice] = useState<{id: string, message: string} | null>(null);`
);

// 2. Fetch notices
admin = admin.replace(
  /const fetchLogs = async \(\) => \{/,
  `const fetchNotices = async () => {
    const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist
        toast.error("'notices' 테이블이 없습니다. Supabase에서 테이블을 생성해주세요.");
      } else {
        console.error(error);
      }
    } else if (data) {
      setNotices(data);
    }
  };

  const fetchLogs = async () => {`
);

// Call fetchNotices on mount
admin = admin.replace(
  /fetchLogs\(\);/,
  `fetchLogs();\n    fetchNotices();`
);

// 3. Update `sendNotice` to Insert into DB
admin = admin.replace(
  /const sendNotice = async \(\) => \{[\s\S]*?toast\.success\('공지가 전송되었습니다\.'\);\n  \};/,
  `const sendNotice = async () => {
    if (!noticeText.trim()) return;
    
    // 1. DB에 저장
    const { data, error } = await supabase.from('notices').insert([{ message: noticeText.trim() }]).select();
    if (error) {
      toast.error(error.message);
      return;
    }
    
    // 2. 현재 접속자에게 실시간 전송 (선택)
    await supabase.channel('wb-admin-actions').send({
      type: 'broadcast',
      event: 'admin_command',
      payload: { type: 'system_notice', message: noticeText.trim() }
    });
    
    toast.success('공지사항이 등록 및 전송되었습니다.');
    setNoticeText('');
    fetchNotices();
  };
  
  const updateNotice = async () => {
    if (!editingNotice || !editingNotice.message.trim()) return;
    const { error } = await supabase.from('notices').update({ message: editingNotice.message.trim() }).eq('id', editingNotice.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('공지사항이 수정되었습니다.');
    setEditingNotice(null);
    fetchNotices();
  };
  
  const deleteNotice = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('공지사항이 삭제되었습니다.');
    fetchNotices();
  };`
);

// 4. Update the "System Notice" section in the UI to be a full CRUD
const oldNoticeSectionRegex = /<section className="bg-white\/70 dark:bg-white\/5 backdrop-blur-xl border border-white\/50 dark:border-white\/10 rounded-\[2rem\] p-8 shadow-\[0_8px_30px_rgb\(0,0,0,0\.04\)\] fluid-spring hover:scale-\[0\.99\]">\s*<h3 className="text-xl font-bold mb-4">전체 시스템 공지<\/h3>\s*<div className="flex flex-col gap-3">\s*<textarea[\s\S]*?<\/div>\s*<\/section>/;

const newNoticeSection = `<section className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] fluid-spring hover:scale-[0.99] flex flex-col max-h-[700px]">
              <h3 className="text-xl font-bold mb-4 shrink-0">공지사항 관리</h3>
              
              {/* Write Form */}
              <div className="flex flex-col gap-3 mb-6 shrink-0 pb-6 border-b border-slate-100 dark:border-white/10">
                <textarea 
                  value={noticeText} 
                  onChange={e => setNoticeText(e.target.value)} 
                  placeholder="새로운 공지사항을 입력하세요." 
                  className="w-full bg-[#f2f2f7] dark:bg-black rounded-xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary resize-none h-20" 
                />
                <button onClick={sendNotice} className="bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
                  새 공지 등록 및 실시간 전송
                </button>
              </div>

              {/* History List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                {notices.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">등록된 공지사항이 없습니다.</div>
                ) : notices.map(notice => (
                  <div key={notice.id} className="bg-[#f2f2f7] dark:bg-black p-4 rounded-2xl flex flex-col gap-3 border border-transparent dark:border-white/5">
                    {editingNotice?.id === notice.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea 
                          value={editingNotice.message} 
                          onChange={e => setEditingNotice({...editingNotice, message: e.target.value})}
                          className="w-full bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-slate-800 rounded-lg p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary resize-none h-20"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingNotice(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 transition-colors">취소</button>
                          <button onClick={updateNotice} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors">저장</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start">
                          <span className="text-xs text-slate-400">{new Date(notice.created_at).toLocaleDateString()} {new Date(notice.created_at).toLocaleTimeString()}</span>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditingNotice({id: notice.id, message: notice.message})} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="수정">
                              <IconEdit size={16} />
                            </button>
                            <button onClick={() => deleteNotice(notice.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="삭제">
                              <IconTrash size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="font-medium text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{notice.message}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>`;

admin = admin.replace(oldNoticeSectionRegex, newNoticeSection);

fs.writeFileSync('src/AdminPage.tsx', admin);
console.log("Updated AdminPage.tsx");
