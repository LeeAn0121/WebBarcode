const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove the weird absolute header and restore the standard flex-col layout.
const headerAbsoluteRegex = /<header className="absolute top-0 left-0 right-0 bg-\[\#f5f5f7\]\/85 dark:bg-black\/85 backdrop-blur-2xl z-40 px-6 pt-12 pb-4 flex justify-between items-end border-b border-slate-200\/50 dark:border-white\/10 transition-all">/;
app = app.replace(headerAbsoluteRegex, '<header className="bg-[#f2f4f6] dark:bg-black z-40 shrink-0 px-6 pt-12 pb-5 flex justify-between items-end border-none transition-all">');

// 2. Fix the padding of the tab containers
app = app.replace(/<div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col px-6 pt-32 pb-28 relative">/, '<div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col px-5 pt-2 pb-28 relative">');
app = app.replace(/<div className="absolute inset-0 flex flex-row bg-\[\#f5f5f7\] dark:bg-black animate-in fade-in slide-in-from-bottom-2 duration-300 pt-\[104px\] pb-24">/, '<div className="flex-1 flex flex-row min-h-0 bg-[#f2f4f6] dark:bg-black animate-in fade-in slide-in-from-bottom-2 duration-300">');
app = app.replace(/<div className="flex-1 overflow-y-auto custom-scrollbar pt-28 pb-28 px-4 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">/, '<div className="flex-1 overflow-y-auto custom-scrollbar pt-4 pb-28 px-5 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">');

// 3. Toss specific background
app = app.replace(/bg-\[\#f5f5f7\]/g, 'bg-[#f2f4f6]');
app = app.replace(/appleBg/g, 'tossBg');

// 4. Clean up shadows. Toss rarely uses shadows for list items, just white cards on gray bg.
app = app.replace(/shadow-apple/g, 'shadow-sm border border-slate-100/50 dark:border-white/5');
app = app.replace(/shadow-soft/g, 'shadow-sm');

// 5. Bottom Nav: Solid white or very subtle blur.
const bottomNavRegex = /<nav className="fixed bottom-0 w-full max-w-md bg-white\/85 dark:bg-\[\#1c1c1e\]\/85 backdrop-blur-2xl border-t border-slate-200\/50 dark:border-white\/10 pb-safe z-50 flex justify-around shadow-\[0_-4px_24px_rgba\(0,0,0,0\.02\)\]">/;
app = app.replace(bottomNavRegex, '<nav className="fixed bottom-0 w-full max-w-md bg-white/95 dark:bg-[#111111]/95 backdrop-blur-xl border-t border-slate-100 dark:border-white/5 pb-safe pt-2 z-50 flex justify-around shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">');

// 6. Typography: Toss headings are bold and simple.
app = app.replace(/font-extrabold text-4xl/g, 'font-bold text-[28px]');
app = app.replace(/font-mono text-lg tracking-tight font-bold text-black/g, 'font-mono text-[17px] tracking-tight font-bold text-slate-900');

// 7. Remove the weird yellow folders from tree view. They look out of place in a Toss/Apple style app.
app = app.replace(/<IconFolderFilled size=\{18\} className="text-yellow-500" \/>/g, '<IconFolderFilled size={20} className="text-[#3182f6]" />');
app = app.replace(/<IconFolderFilled size=\{24\} className="text-yellow-500 drop-shadow-sm" \/>/g, '<IconFolderFilled size={28} className="text-[#3182f6]" />');
app = app.replace(/<IconFolderFilled size=\{40\} className="text-yellow-500 drop-shadow-sm" \/>/g, '<IconFolderFilled size={40} className="text-[#3182f6]" />');
app = app.replace(/<IconFolderFilled size=\{20\} className=\{moveModal\.targetFolder === f \? 'text-primary' : 'text-yellow-500'\} \/>/g, '<IconFolderFilled size={24} className={moveModal.targetFolder === f ? "text-primary" : "text-slate-300 dark:text-slate-600"} />');

// 8. Folders Grid Items
app = app.replace(/rounded-\[20px\]/g, 'rounded-[24px]');
app = app.replace(/rounded-\[24px\]/g, 'rounded-[24px]');
app = app.replace(/className="bg-white dark:bg-darkCard p-4 rounded-\[24px\]/g, 'className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[24px]');
app = app.replace(/className="bg-white dark:bg-darkCard p-5 rounded-\[24px\]/g, 'className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[24px]');

// 9. Scanner FAB: Toss uses very clean solid colors.
app = app.replace(/shadow-\[0_8px_24px_rgba\(49,130,246,0\.4\)\] -mt-6 border-\[6px\] border-\[\#f5f5f7\]/g, 'shadow-[0_8px_20px_rgba(49,130,246,0.3)] -mt-6 border-[6px] border-[#f2f4f6]');

// 10. Update Tailwind Config
let tw = fs.readFileSync('tailwind.config.js', 'utf8');
tw = tw.replace(/appleBg: '\#f5f5f7'/g, "tossBg: '#f2f4f6'");
fs.writeFileSync('tailwind.config.js', tw);

fs.writeFileSync('src/App.tsx', app);
console.log("Toss Revert Applied");
