const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add isAdminEmail to imports
app = app.replace(
  /import \{ supabase, logDebug, getDebugSessionId \} from '\.\/supabaseClient';/,
  `import { supabase, logDebug, getDebugSessionId, isAdminEmail } from './supabaseClient';`
);

// 2. Change `const isAdmin` to a state
app = app.replace(
  /const ADMIN_EMAILS = \['leean0121@naver\.com', 'leean0121@gmail\.com'\];\n  const isAdmin = session\?\.user\?\.email && ADMIN_EMAILS\.includes\(session\.user\.email\);/,
  `const [isAdmin, setIsAdmin] = useState(false);`
);

// 3. Update isAdmin inside the session useEffect
const oldEffect = /setAuthChecked\(true\);\n    \}\);\n    const \{ data: \{ subscription \} \} = supabase\.auth\.onAuthStateChange\(\(_event, session\) => setSession\(session\)\);\n    return \(\) => subscription\.unsubscribe\(\);\n  \}, \[\]\);/;
const newEffect = `setAuthChecked(true);
      if (session?.user?.email) {
        isAdminEmail(session.user.email).then(setIsAdmin);
      } else {
        setIsAdmin(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email) {
        isAdminEmail(session.user.email).then(setIsAdmin);
      } else {
        setIsAdmin(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);`;
app = app.replace(oldEffect, newEffect);

fs.writeFileSync('src/App.tsx', app);
console.log("Fixed App.tsx isAdmin logic");
