const fs = require('fs');
let admin = fs.readFileSync('src/AdminPage.tsx', 'utf8');

admin = admin.replace(
  /payload: \{ type: 'system_notice', message: noticeText\.trim\(\) \}/,
  `payload: { type: 'system_notice', message: noticeText.trim(), id: data[0].id, date: data[0].created_at }`
);
fs.writeFileSync('src/AdminPage.tsx', admin);

let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(
  /const \{ type, target_email, message \} = payload\.payload;/,
  `const { type, target_email, message, id: noticeId, date: noticeDate } = payload.payload;`
);
app = app.replace(
  /setNoticeHistory\(prev => \[\{id: Math\.random\(\)\.toString\(36\)\.substring\(2, 9\), message, date: new Date\(\)\.toISOString\(\), read: false\}, \.\.\.prev\]\.slice\(0, 50\)\);/,
  `setNoticeHistory(prev => [{id: noticeId || Math.random().toString(36).substring(2, 9), message, date: noticeDate || new Date().toISOString(), read: false}, ...prev].slice(0, 50));`
);
fs.writeFileSync('src/App.tsx', app);
console.log("Updated ID broadcast logic");
