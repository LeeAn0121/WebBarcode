const fs = require('fs');
let admin = fs.readFileSync('src/AdminPage.tsx', 'utf8');

// 1. We need a `fetchNotices` function that we can call
const fetchNoticesFunc = `
  const fetchNotices = async () => {
    const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    if (error) {
      if (error.code === '42P01') toast.error("'notices' 테이블이 없습니다. Supabase에서 테이블을 생성해주세요.");
    } else if (data) {
      setNotices(data);
    }
  };
`;

// Insert `fetchNotices` before `const sendNotice`
admin = admin.replace(
  /const sendNotice = async \(\) => \{/,
  `${fetchNoticesFunc}\n  const sendNotice = async () => {`
);

// 2. Call `fetchNotices` in the isAdmin useEffect
const oldEffectStart = /let mounted = true;\n\s*\/\/ Fetch Notices/;
admin = admin.replace(
  oldEffectStart,
  `let mounted = true;\n    fetchNotices();\n    // Fetch Notices`
);

// 3. Rewrite `sendNotice`, `updateNotice`, `deleteNotice`
const oldSendNoticeBlock = /const sendNotice = async \(\) => \{[\s\S]*?setNoticeText\(''\);\n  \};/;
const newCrudBlock = `const sendNotice = async () => {
    if (!noticeText.trim()) return;
    
    // 1. DB에 저장
    const { data, error } = await supabase.from('notices').insert([{ message: noticeText.trim() }]).select();
    if (error) {
      toast.error(error.message);
      return;
    }
    
    // 2. 현재 접속자에게 실시간 전송 (선택)
    if (adminChannelRef.current && data && data.length > 0) {
      adminChannelRef.current.send({
        type: 'broadcast',
        event: 'admin_command',
        payload: { type: 'system_notice', message: noticeText.trim(), id: data[0].id, date: data[0].created_at }
      });
    }
    
    toast.success('공지사항이 등록 및 전송되었습니다.');
    setNoticeText('');
    fetchNotices();
  };

  const updateNotice = async () => {
    if (!editingNotice || !editingNotice.message.trim()) return;
    const { error } = await supabase.from('notices').update({ message: editingNotice.message.trim() }).eq('id', editingNotice.id);
    if (error) return toast.error(error.message);
    toast.success('공지사항이 수정되었습니다.');
    setEditingNotice(null);
    fetchNotices();
  };

  const deleteNotice = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('공지사항이 삭제되었습니다.');
    fetchNotices();
  };`;

admin = admin.replace(oldSendNoticeBlock, newCrudBlock);

fs.writeFileSync('src/AdminPage.tsx', admin);
console.log("Fixed Admin Notice CRUD functions");
