const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<header className="bg-\[#f2f4f6\] dark:bg-black z-40 shrink-0 px-6 pt-12 pb-5 flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-none transition-all">/;
const newHeader = `<header className="bg-[#f2f4f6] dark:bg-black z-40 shrink-0 px-6 pt-12 pb-4 flex justify-between items-center gap-2 border-none transition-all">`;

app = app.replace(regex, newHeader);

// Adjust the left div to flex-1 and min-w-0 to allow input shrinking
app = app.replace(/<div className="flex-1 w-full md:w-auto">/, `<div className="flex-1 min-w-0">`);

// Hide the Version tag on very small screens to save space
app = app.replace(
  /<a href=\{`https:\/\/github\.com\/LeeAn0121\/WebBarcode\/releases\/tag\/v\$\{latestVersion\}`\} target="_blank"/,
  `<a href={\`https://github.com/LeeAn0121/WebBarcode/releases/tag/v\${latestVersion}\`} target="_blank" className="hidden sm:inline-block text-slate-500 hover:text-primary transition-colors font-mono text-[10px] bg-slate-200/50 dark:bg-white/10 px-2.5 py-1 rounded-full font-bold tracking-widest"`
);
// Need to remove the old className in the a tag to avoid duplicates!
app = app.replace(
  /className="hidden sm:inline-block text-slate-500 hover:text-primary transition-colors font-mono text-\[10px\] bg-slate-200\/50 dark:bg-white\/10 px-2\.5 py-1 rounded-full font-bold tracking-widest" rel="noopener noreferrer" className="text-slate-500 hover:text-primary transition-colors font-mono text-\[10px\] bg-slate-200\/50 dark:bg-white\/10 px-2\.5 py-1 rounded-full font-bold tracking-widest"/,
  `rel="noopener noreferrer" className="hidden sm:block text-slate-500 hover:text-primary transition-colors font-mono text-[10px] bg-slate-200/50 dark:bg-white/10 px-2.5 py-1 rounded-full font-bold tracking-widest"`
);


fs.writeFileSync('src/App.tsx', app);
console.log("Header flex updated");
