const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Backgrounds
app = app.replace(/bg-\[\#f2f2f7\]/g, 'bg-[#f5f5f7]');

// 2. Header (Remove background to let the app background flow, or make it blurred)
app = app.replace(
  /<header className="bg-\[\#f5f5f7\] dark:bg-black z-40 shrink-0 px-6 pt-12 pb-4 flex justify-between items-end border-none">/,
  '<header className="bg-[#f5f5f7]/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 z-40 shrink-0 px-6 pt-12 pb-4 flex justify-between items-end border-none transition-all">'
);

// 3. Bottom Nav
app = app.replace(
  /<nav className="fixed bottom-0 w-full max-w-md bg-white dark:bg-\[\#111111\] border-t border-slate-100 dark:border-white\/5 pb-safe z-50 flex justify-around">/,
  '<nav className="fixed bottom-0 w-full max-w-md bg-white/85 dark:bg-[#1c1c1e]/85 backdrop-blur-2xl border-t border-slate-200/50 dark:border-white/10 pb-safe z-50 flex justify-around shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">'
);

// 4. Scanner FAB
app = app.replace(
  /className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-lg -mt-6 border-4 border-\[\#f5f5f7\] dark:border-black transition-transform fluid-spring active:scale-90"/,
  'className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(49,130,246,0.4)] -mt-6 border-[6px] border-[#f5f5f7] dark:border-black transition-transform fluid-spring active:scale-90"'
);

// 5. Scanned Items List (Home)
app = app.replace(
  /className="bg-white dark:bg-\[\#1c1c1e\] p-5 rounded-\[1\.5rem\] shadow-\[0_8px_30px_rgb\(0,0,0,0\.04\)\] flex items-center gap-4 border border-transparent dark:border-white\/5 relative overflow-hidden group fluid-spring hover:scale-\[0\.98\]"/g,
  'className="bg-white dark:bg-darkCard p-5 rounded-[24px] shadow-apple flex items-center gap-4 border border-transparent dark:border-white/5 relative overflow-hidden group fluid-spring hover:scale-[0.98] transition-all"'
);

// 6. Settings Cards
app = app.replace(
  /className="bg-slate-50 dark:bg-black\/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"/g,
  'className="bg-white dark:bg-darkCard p-5 rounded-[20px] border border-slate-100/50 dark:border-white/5 flex flex-col gap-4 shadow-apple hover:shadow-lg transition-all"'
);
app = app.replace(
  /className="bg-green-50 dark:bg-green-900\/10 p-5 rounded-2xl border border-green-100 dark:border-green-800\/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm"/g,
  'className="bg-white dark:bg-darkCard p-5 rounded-[20px] border border-slate-100/50 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-apple"'
);
app = app.replace(
  /className="bg-purple-50 dark:bg-purple-900\/10 p-5 sm:p-6 rounded-2xl border border-purple-200 dark:border-purple-800\/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm"/g,
  'className="bg-white dark:bg-darkCard p-5 sm:p-6 rounded-[20px] border border-slate-100/50 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-apple"'
);
app = app.replace(
  /className="bg-red-50 dark:bg-red-900\/10 p-5 sm:p-6 rounded-2xl border border-red-200 dark:border-red-800\/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm"/g,
  'className="bg-white dark:bg-darkCard p-5 sm:p-6 rounded-[20px] border border-slate-100/50 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-apple"'
);

// 7. Folders Grid
app = app.replace(
  /className="bg-white dark:bg-\[\#1c1c1e\] p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white\/5 flex flex-col items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white\/10 transition-colors active:scale-95"/g,
  'className="bg-white dark:bg-darkCard p-4 rounded-[20px] shadow-apple border border-slate-100/50 dark:border-white/5 flex flex-col items-center gap-3 cursor-pointer hover:shadow-lg dark:hover:bg-white/5 transition-all active:scale-95"'
);

app = app.replace(
  /className="bg-white dark:bg-\[\#1c1c1e\] p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white\/5 flex flex-col justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white\/10 transition-colors relative group"/g,
  'className="bg-white dark:bg-darkCard p-4 rounded-[20px] shadow-apple border border-slate-100/50 dark:border-white/5 flex flex-col justify-between gap-3 cursor-pointer hover:shadow-lg dark:hover:bg-white/5 transition-all relative group"'
);

// 8. Typography polishes (Primary colors and text contrast)
app = app.replace(
  /text-slate-400 hover:text-primary transition-colors font-mono text-\[10px\] bg-slate-200\/50 dark:bg-white\/10 px-2 py-1 rounded-full font-bold tracking-widest/g,
  'text-slate-500 hover:text-primary transition-colors font-mono text-[10px] bg-slate-200/50 dark:bg-white/10 px-2.5 py-1 rounded-full font-bold tracking-widest'
);

// 9. Fix Nav Active text to Primary Color
app = app.replace(
  /className=\{\`flex flex-col items-center justify-center gap-1 py-2 w-20 transition-colors \$\{activeTab === 'home' \? 'text-black dark:text-white' : 'text-slate-400'\}\`\}/g,
  'className={`flex flex-col items-center justify-center gap-1 py-2 w-20 transition-all ${activeTab === \'home\' ? \'text-primary dark:text-primary scale-105\' : \'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300\'}`}'
);
app = app.replace(
  /className=\{\`flex flex-col items-center justify-center gap-1 py-2 w-20 transition-colors \$\{activeTab === 'folders' \? 'text-black dark:text-white' : 'text-slate-400'\}\`\}/g,
  'className={`flex flex-col items-center justify-center gap-1 py-2 w-20 transition-all ${activeTab === \'folders\' ? \'text-primary dark:text-primary scale-105\' : \'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300\'}`}'
);
app = app.replace(
  /className=\{\`flex flex-col items-center justify-center gap-1 py-2 w-20 transition-colors \$\{activeTab === 'settings' \? 'text-black dark:text-white' : 'text-slate-400'\}\`\}/g,
  'className={`flex flex-col items-center justify-center gap-1 py-2 w-20 transition-all ${activeTab === \'settings\' ? \'text-primary dark:text-primary scale-105\' : \'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300\'}`}'
);

fs.writeFileSync('src/App.tsx', app);
console.log("App.tsx Restyled manually");
