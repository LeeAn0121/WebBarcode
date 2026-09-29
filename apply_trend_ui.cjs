const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add Aurora Background behind the main wrapper
const originalWrapperStart = `<div className="w-full md:max-w-6xl max-w-md flex flex-col h-full overflow-hidden relative bg-[#f2f2f7] dark:bg-black md:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] md:border border-white/5 md:rounded-[3rem] transition-all">`;

const auroraWrapperStart = `
      {/* 🌌 오로라(Mesh) 그라데이션 배경 (공간 UI) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#f8f9fa] dark:bg-[#050505]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/30 dark:bg-purple-900/40 blur-[100px] animate-blob mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-blue-400/30 dark:bg-blue-900/40 blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] rounded-full bg-emerald-400/20 dark:bg-emerald-900/30 blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-screen"></div>
      </div>

      {/* Mobile Layout Wrapper - Glassmorphism */}
      <div className="w-full md:max-w-6xl max-w-md flex flex-col h-full overflow-hidden relative bg-white/60 dark:bg-black/60 backdrop-blur-3xl md:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] md:border border-white/40 dark:border-white/10 md:rounded-[3rem] transition-all z-10">`;

app = app.replace(originalWrapperStart, auroraWrapperStart);

// 2. Fix the Header to match Glassmorphism
app = app.replace(
  /<header className="bg-\[#f2f2f7\] dark:bg-black z-40 shrink-0 px-6 pt-12 pb-4 flex justify-between items-end border-none">/,
  `<header className="bg-white/30 dark:bg-black/30 backdrop-blur-md z-40 shrink-0 px-6 pt-12 pb-4 flex justify-between items-end border-b border-white/20 dark:border-white/5">`
);

// 3. Update Barcode List Items (Bento + Glass + Fluid)
// bg-white dark:bg-[#1c1c1e] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:scale-[0.98]
app = app.replace(
  /bg-white dark:bg-\[#1c1c1e\] shadow-\[0_2px_12px_rgba\(0,0,0,0\.03\)\] hover:scale-\[0\.98\]/g,
  `bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] fluid-spring hover:scale-[0.98] hover:shadow-[0_10px_40px_rgb(0,0,0,0.08)]`
);

// 4. Update Folder Items
// className="bg-white dark:bg-[#1c1c1e] p-4 rounded-[1.5rem]
app = app.replace(
  /className="bg-white dark:bg-\[#1c1c1e\] p-4 rounded-\[1\.5rem\] shadow-\[0_2px_12px_rgba\(0,0,0,0\.03\)\] hover:scale-\[0\.98\] transition-transform duration-300 flex flex-col gap-4 border border-transparent dark:border-white\/5"/g,
  `className="bg-white/70 dark:bg-white/5 backdrop-blur-xl p-4 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] fluid-spring hover:scale-[0.98] flex flex-col gap-4 border border-white/50 dark:border-white/10"`
);

// 5. Update Inner buttons inside Folder (Bento cells)
// bg-[#f2f2f7] dark:bg-black -> bg-white/50 dark:bg-black/50
app = app.replace(
  /bg-\[#f2f2f7\] dark:bg-black/g,
  `bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/5`
);

// 6. Fix Search Input
// bg-white dark:bg-[#1c1c1e] border-0 rounded-2xl
app = app.replace(
  /className="w-full bg-white dark:bg-\[#1c1c1e\] border-0 rounded-2xl pl-12 p-4 text-base font-medium focus:ring-2 focus:ring-primary outline-none transition-shadow shadow-sm"/,
  `className="w-full bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl pl-12 p-4 text-base font-bold focus:ring-4 focus:ring-primary/30 outline-none fluid-spring shadow-[0_8px_30px_rgb(0,0,0,0.04)]"`
);

// 7. Fix Scanner FAB (Hyper-fluid dynamic island style)
app = app.replace(
  /className="relative w-16 h-16 bg-gradient-to-tr from-primary to-purple-600 rounded-full shadow-2xl shadow-primary\/40 flex items-center justify-center text-white hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"/,
  `className="relative w-16 h-16 bg-gradient-to-tr from-primary to-purple-500 rounded-[1.5rem] shadow-[0_10px_40px_rgba(99,102,241,0.5)] flex items-center justify-center text-white fluid-spring hover:scale-110 active:scale-90 hover:rounded-full focus-visible:outline-none"`
);

// 8. Bottom Navigation
app = app.replace(
  /<nav className="fixed md:absolute bottom-0 left-0 right-0 bg-white\/90 dark:bg-\[#111111\]\/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 pb-safe z-40">/,
  `<nav className="fixed md:absolute bottom-6 left-6 right-6 md:left-1/2 md:-translate-x-1/2 md:w-[400px] bg-white/80 dark:bg-[#111111]/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.1)] p-2 z-40 fluid-spring">`
);

app = app.replace(
  /<div className="flex justify-around items-center h-16 px-2 md:px-6">/,
  `<div className="flex justify-around items-center h-14 px-2">`
);

// 9. Fix Filter pills
app = app.replace(
  /bg-white dark:bg-\[#1c1c1e\] text-slate-500 shadow-sm hover:bg-slate-50/g,
  `bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 text-slate-600 dark:text-slate-400 fluid-spring hover:scale-105 shadow-sm`
);
app = app.replace(
  /bg-black dark:bg-white text-white dark:text-black shadow-md/g,
  `bg-black dark:bg-white text-white dark:text-black fluid-spring scale-105 shadow-[0_8px_20px_rgba(0,0,0,0.15)]`
);


fs.writeFileSync('src/App.tsx', app);
console.log("App.tsx trendy UI applied");
