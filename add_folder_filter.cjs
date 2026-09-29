const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const folderSelectUI = `
                    <div className="flex items-center gap-1 relative group">
                      <select
                        value={currentFolder}
                        onChange={(e) => setCurrentFolder(e.target.value)}
                        className="text-xl font-bold text-black dark:text-white tracking-tight bg-transparent border-none focus:ring-0 outline-none appearance-none cursor-pointer pr-6 hover:opacity-80 transition-opacity"
                        style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                      >
                        <option value="전체">모든 바코드</option>
                        {folders.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity">
                         <IconSearch size={16} className="rotate-90"/>
                      </div>
                      <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 shadow-sm">
                        {barcodes.filter(b => currentFolder === '전체' || (b.folder || '기본폴더') === currentFolder).length}
                      </span>
                    </div>`;

app = app.replace(
  /<div className="flex items-center gap-2">\s*<h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">전체 스캔<\/h2>\s*<span className="bg-primary\/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">\{barcodes\.length\}<\/span>\s*<\/div>/,
  folderSelectUI
);

// We need to use an icon that looks like a down arrow.
// Wait, we don't have IconChevronDown imported. Let's just use `<svg>` or `IconSearch` rotated isn't great.
// Let's use a raw SVG for the chevron down.
app = app.replace(
  /<IconSearch size=\{16\} className="rotate-90"\/>/,
  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>`
);

fs.writeFileSync('src/App.tsx', app);
console.log("Folder Filter UI added");
