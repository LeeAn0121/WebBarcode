const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Restore original App.tsx
app = fs.readFileSync('src/App.tsx', 'utf8');

const headerRegex = /<header className="bg-\[\#f5f5f7\]\/80 dark:bg-black\/80 backdrop-blur-xl sticky top-0 z-40 shrink-0 px-6 pt-12 pb-4 flex justify-between items-end border-none transition-all">([\s\S]*?)<\/header>/;

app = app.replace(headerRegex, '<header className="absolute top-0 left-0 right-0 bg-[#f5f5f7]/85 dark:bg-black/85 backdrop-blur-2xl z-40 px-6 pt-12 pb-4 flex justify-between items-end border-b border-slate-200/50 dark:border-white/10 transition-all">$1</header>');

// Home tab padding
app = app.replace(
  /<div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col px-6 pt-2 pb-28 relative">/,
  '<div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col px-6 pt-32 pb-28 relative">'
);

// Folders tab padding
app = app.replace(
  /<div className="flex-1 flex flex-col min-h-0 bg-\[\#f5f5f7\] dark:bg-black animate-in fade-in slide-in-from-bottom-2 duration-300">/,
  '<div className="flex-1 flex flex-col min-h-0 bg-[#f5f5f7] dark:bg-black animate-in fade-in slide-in-from-bottom-2 duration-300 pt-28">'
);

// Settings tab padding
app = app.replace(
  /<div className="bg-white dark:bg-darkCard rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden min-h-\[500px\] animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">/,
  '<div className="flex-1 overflow-y-auto custom-scrollbar pt-28 pb-28 px-4 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">\n          <div className="bg-white dark:bg-darkCard rounded-[24px] shadow-apple border border-slate-100/50 dark:border-white/5 overflow-hidden min-h-[500px]">'
);

// Close the wrapper for settings tab
app = app.replace(
  /<\/section>\n\n            <\/div>\n          <\/div>\n        \)}/,
  '</section>\n\n            </div>\n          </div>\n          </div>\n        )}'
);

// Scanner overlay Fix - because scanner has absolute positioning, we don't want it to be covered.
// The scanner is conditionally rendered OVER everything.
// Actually, scanner renders conditionally over the tabs. It has `absolute inset-0 z-50`.
// Let's check where the scanner is.
// It's `<div className="fixed inset-0 z-50 flex flex-col md:flex-row bg-black/90 backdrop-blur-md">`
// So it covers everything nicely.

fs.writeFileSync('src/App.tsx', app);
console.log("Applied absolute translucent header");
