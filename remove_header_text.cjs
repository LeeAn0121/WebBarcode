const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  /\{activeTab === 'home' && '내 바코드'\}/g,
  ""
);

app = app.replace(
  /\{activeTab === 'home' && <p className="text-sm font-medium text-slate-500">스캔과 관리를 가장 빠르고 편하게\.<\/p>\}/g,
  ""
);

fs.writeFileSync('src/App.tsx', app);
console.log("Header text removed");
