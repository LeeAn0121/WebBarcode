const fs = require('fs');
let sw = fs.readFileSync('public/sw.js', 'utf8');

sw = sw.replace(
  /if \(event.request.method !== 'GET'\) return;/,
  \`if (event.request.method !== 'GET') return;\\n\\n  // 크롬 익스텐션 등 http/https가 아닌 요청은 캐싱에서 제외\\n  if (!event.request.url.startsWith('http')) return;\`
);

fs.writeFileSync('public/sw.js', sw);
console.log("sw.js fixed");
