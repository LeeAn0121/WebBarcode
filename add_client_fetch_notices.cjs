const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const newUseEffect = `
  // Fetch Notices on load
  useEffect(() => {
    const fetchGlobalNotices = async () => {
      const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(50);
      if (!error && data) {
        setNoticeHistory(prev => {
          const prevMap = new Map(prev.map(p => [p.id, p]));
          return data.map(dbNotice => {
            const existing = prevMap.get(dbNotice.id);
            return {
              id: dbNotice.id,
              message: dbNotice.message,
              date: dbNotice.created_at,
              read: existing ? existing.read : false
            };
          });
        });
      }
    };
    fetchGlobalNotices();
  }, []);
`;

app = app.replace(
  /const \[isNoticeHistoryOpen, setIsNoticeHistoryOpen\] = useState\(false\);/,
  "const [isNoticeHistoryOpen, setIsNoticeHistoryOpen] = useState(false);\n" + newUseEffect
);

fs.writeFileSync('src/App.tsx', app);
console.log("Added client fetch");
