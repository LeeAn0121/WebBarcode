const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  /title="알림"/g,
  'title="공지사항"'
);

app = app.replace(
  /<IconBell size=\{24\} className="text-primary" \/> 알림 내역/,
  '<IconBell size={24} className="text-primary" /> 공지사항'
);

app = app.replace(
  /<span className="text-sm font-medium">새로운 알림이 없습니다\.<\/span>/,
  '<span className="text-sm font-medium">새로운 공지사항이 없습니다.</span>'
);

fs.writeFileSync('src/App.tsx', app);
console.log("Renamed 알림 to 공지사항");
