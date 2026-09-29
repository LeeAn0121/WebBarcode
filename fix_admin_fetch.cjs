const fs = require('fs');
let admin = fs.readFileSync('src/AdminPage.tsx', 'utf8');

// We will inject fetchNotices and call it inside the isAdmin useEffect
const oldUseEffect = /let mounted = true;\n    supabase\.from\('debug_logs'\)\.select\('\*'\)\.order\('created_at', \{ ascending: false \}\)\.limit\(200\)/;

const newUseEffect = `let mounted = true;
    
    // Fetch Notices
    supabase.from('notices').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          if (error.code === '42P01') {
            toast.error("'notices' 테이블이 없습니다. Supabase에서 테이블을 생성해주세요.");
          }
        } else if (data) {
          setNotices(data);
        }
      });

    // Fetch Logs
    supabase.from('debug_logs').select('*').order('created_at', { ascending: false }).limit(200)`;

admin = admin.replace(oldUseEffect, newUseEffect);

// Wait, I also need to make sure `fetchNotices` exists for `sendNotice`, `updateNotice`, `deleteNotice` to call.
// In `v2.38.0` I added `sendNotice`, `updateNotice`, `deleteNotice` which all call `fetchNotices();` at the end!
// Wait! If they call `fetchNotices();` and it was NEVER DEFINED, then sending a notice would throw `ReferenceError: fetchNotices is not defined` and crash the Admin Page!!!
