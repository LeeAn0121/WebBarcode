const fs = require('fs');
let admin = fs.readFileSync('src/AdminPage.tsx', 'utf8');

const originalWrapperStart = `<div className="w-full md:max-w-6xl max-w-md flex flex-col h-full overflow-hidden relative bg-[#f2f2f7] dark:bg-black md:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] md:border border-white/5 md:rounded-[3rem] transition-all">`;

const auroraWrapperStart = `
      {/* 🌌 오로라(Mesh) 그라데이션 배경 (공간 UI) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-[#f8f9fa] dark:bg-[#050505]">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/30 dark:bg-indigo-900/40 blur-[100px] animate-blob mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] rounded-full bg-rose-400/30 dark:bg-rose-900/40 blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[50%] rounded-full bg-blue-400/20 dark:bg-blue-900/30 blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-screen"></div>
      </div>

      <div className="w-full md:max-w-6xl max-w-md flex flex-col h-full overflow-hidden relative bg-white/60 dark:bg-black/60 backdrop-blur-3xl md:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] md:border border-white/40 dark:border-white/10 md:rounded-[3rem] transition-all z-10">`;

admin = admin.replace(originalWrapperStart, auroraWrapperStart);

// Header
admin = admin.replace(
  /<header className="bg-\[#f2f2f7\] dark:bg-black z-40 shrink-0 px-8 pt-12 pb-6 flex justify-between items-end border-none">/,
  `<header className="bg-white/30 dark:bg-black/30 backdrop-blur-md z-40 shrink-0 px-8 pt-12 pb-6 flex justify-between items-end border-b border-white/20 dark:border-white/5">`
);

// Stat Cards
admin = admin.replace(
  /bg-white dark:bg-\[#1c1c1e\] rounded-\[2rem\] p-6 shadow-\[0_4px_20px_rgba\(0,0,0,0\.03\)\]/g,
  `bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] fluid-spring hover:scale-[0.98]`
);

// Sections
admin = admin.replace(
  /bg-white dark:bg-\[#1c1c1e\] rounded-\[2rem\] p-8 shadow-\[0_4px_20px_rgba\(0,0,0,0\.03\)\]/g,
  `bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] fluid-spring hover:scale-[0.99]`
);

fs.writeFileSync('src/AdminPage.tsx', admin);
console.log("AdminPage trendy UI applied");
