const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const filesRegex = /\{files\.map\(\(b, idx\) => \{[\s\S]*?className="bg-white dark:bg-\[\#1c1c1e\] p-5 rounded-\[24px\] shadow-sm border border-slate-100\/50 dark:border-white\/5 flex flex-col justify-between gap-3 cursor-pointer hover:shadow-lg dark:hover:bg-white\/5 transition-all relative group"[\s\S]*?<\/div>\s*\);\s*\}\)\}/;

const match = app.match(filesRegex);
if(match) {
  console.log("Files map found!");
} else {
  console.log("Files map NOT found!");
}
