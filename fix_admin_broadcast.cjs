const fs = require('fs');
let admin = fs.readFileSync('src/AdminPage.tsx', 'utf8');

const channelRefFix = `
  const adminChannelRef = useRef<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setChecking(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    
    // Admin 채널 구독 유지
    const channel = supabase.channel('wb-admin-actions');
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        adminChannelRef.current = channel;
      }
    });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);
`;

admin = admin.replace(/useEffect\(\(\) => \{\s*supabase\.auth\.getSession\(\)[\s\S]*?\}, \[\]\);/, channelRefFix);

// Fix sendNotice
admin = admin.replace(
  /supabase\.channel\('wb-admin-actions'\)\.send\(\{/g,
  `if (!adminChannelRef.current) return toast.error('서버와 연결 중입니다. 잠시 후 다시 시도해주세요.');\n    adminChannelRef.current.send({`
);

fs.writeFileSync('src/AdminPage.tsx', admin);
console.log("AdminPage broadcast fixed");
