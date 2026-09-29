const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Extract the useEffect block
const useEffectRegex = /\s*\/\/ 공지사항 & 브로드캐스트 채널 리스너\s*useEffect\(\(\) => \{[\s\S]*?\}, \[session\?\.user\?\.email\]\);/;
const match = app.match(useEffectRegex);
if (match) {
  const useEffectStr = match[0];
  
  // 2. Remove it from its current position
  app = app.replace(useEffectStr, '');

  // 3. Insert it right AFTER `const [session, setSession] = useState<any>(null);`
  // Actually, let's insert it after `const [splashFadingOut, setSplashFadingOut] = useState(false);`
  app = app.replace(
    /(const \[splashFadingOut, setSplashFadingOut\] = useState\(false\);)/,
    `$1\n${useEffectStr}\n`
  );

  fs.writeFileSync('src/App.tsx', app);
  console.log("Fixed ReferenceError by moving useEffect below session initialization");
} else {
  console.log("Could not find the useEffect block to move");
}
