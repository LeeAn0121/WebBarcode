const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Remove isAdmin from line 243-244
app = app.replace(/  const ADMIN_EMAILS = \['leean0121@naver\.com', 'leean0121@gmail\.com'\];\n  const isAdmin = session\?\.user\?\.email && ADMIN_EMAILS\.includes\(session\.user\.email\);\n/, '');

// Add it after setSplashFadingOut
app = app.replace(
  /const \[splashFadingOut, setSplashFadingOut\] = useState\(false\);/,
  `const [splashFadingOut, setSplashFadingOut] = useState(false);\n  const ADMIN_EMAILS = ['leean0121@naver.com', 'leean0121@gmail.com'];\n  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);`
);

fs.writeFileSync('src/App.tsx', app);
console.log("Fixed isAdmin reference error");
