import fs from 'fs';
const appPath = 'E:/GITHUB/WebBarcode/src/App.tsx';
let code = fs.readFileSync(appPath, 'utf8');

// remove old toaster
code = code.replace(/<Toaster position="bottom-center" theme=\{darkMode \? 'dark' : 'light'\} \/>\n/g, '');

// wrap main return in fragment and add new toaster
const mainReturnRegex = /(return \(\s*)<div className="flex h-\[100svh\] bg-slate-100 dark:bg-\[#050505\] overflow-hidden text-slate-800 dark:text-slate-100 justify-center md:p-6 lg:p-8">/g;

code = code.replace(mainReturnRegex, `$1<>\n      <Toaster position="top-center" richColors theme={darkMode ? 'dark' : 'light'} style={{ zIndex: 99999 }} />\n      <div className="flex h-[100svh] bg-slate-100 dark:bg-[#050505] overflow-hidden text-slate-800 dark:text-slate-100 justify-center md:p-6 lg:p-8">`);

// add closing fragment
const closingRegex = /(<\/div>\s*)\)(;|)\s*$/;
code = code.replace(closingRegex, `    </>\n  );`);

fs.writeFileSync(appPath, code, 'utf8');
console.log('Toaster moved to root level with top-center position and richColors!');
