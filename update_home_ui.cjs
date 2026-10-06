const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update Header to add the new Search and Dropdown
const headerRegex = /<header className="bg-\[#f2f4f6\] dark:bg-black z-40 shrink-0 px-6 pt-12 pb-5 flex justify-between items-end border-none transition-all">[\s\S]*?<div>\s*<h1 className="font-bold text-\[28px\] tracking-tight text-black dark:text-white mb-2">\s*\{activeTab === 'folders' && '폴더 관리'\}\s*\{activeTab === 'settings' && '설정'\}\s*<\/h1>\s*<\/div>/;

const newHeader = `<header className="bg-[#f2f4f6] dark:bg-black z-40 shrink-0 px-6 pt-12 pb-5 flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-none transition-all">
          <div className="flex-1 w-full md:w-auto">
            <h1 className="font-bold text-[28px] tracking-tight text-black dark:text-white mb-2">
              {activeTab === 'folders' && '폴더 관리'}
              {activeTab === 'settings' && '설정'}
            </h1>
            {activeTab === 'home' && (
              <div className="flex items-center gap-2 w-full pr-2">
                <div className="relative shrink-0">
                  <select 
                    value={currentFolder} 
                    onChange={(e) => setCurrentFolder(e.target.value)}
                    className="bg-white dark:bg-[#1c1c1e] border-0 rounded-xl pl-3 pr-8 py-2.5 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer text-slate-700 dark:text-slate-200"
                  >
                    <option value="전체">전체 폴더</option>
                    {folders.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
                <div className="relative flex-1">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden="true" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="검색..." className="w-full bg-white dark:bg-[#1c1c1e] border-0 rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition-shadow shadow-sm" />
                </div>
              </div>
            )}
          </div>`;

app = app.replace(headerRegex, newHeader);

// 2. Remove the OLD search input and horizontal folder pills from the Content area
const oldSearchAndFoldersRegex = /<div className="relative">\s*<IconSearch className="absolute left-4 top-1\/2 -translate-y-1\/2 text-slate-400" size=\{18\} aria-hidden="true" \/>\s*<input id="barcode-search" type="text" value=\{searchQuery\} onChange=\{e => setSearchQuery\(e\.target\.value\)\} placeholder="바코드 번호 또는 메모 검색\.\.\." className="w-full bg-white dark:bg-\[#1c1c1e\] border-0 rounded-2xl pl-12 p-4 text-base font-medium focus:ring-2 focus:ring-primary outline-none transition-shadow shadow-sm" \/>\s*<\/div>\s*\{\/\* 폴더 탭 영역 \(가로 스크롤\) \*\/\}\s*<div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 px-1">\s*<button onClick=\{\(\) => setCurrentFolder\('전체'\)\} className=\{`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all \$\{currentFolder === '전체' \? 'bg-black dark:bg-white text-white dark:text-black shadow-md' : 'bg-white dark:bg-\[#1c1c1e\] text-slate-500 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800'\}\`\}>전체보기<\/button>\s*\{folders\.map\(f => \(\s*<button key=\{f\} onClick=\{\(\) => setCurrentFolder\(f\)\} className=\{`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all \$\{currentFolder === f \? 'bg-black dark:bg-white text-white dark:text-black shadow-md' : 'bg-white dark:bg-\[#1c1c1e\] text-slate-500 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800'\}\`\}>\{f\}<\/button>\s*\)\)\}\s*<\/div>/;

if (app.match(oldSearchAndFoldersRegex)) {
  app = app.replace(oldSearchAndFoldersRegex, "");
} else {
  console.log("Could not find the old search/folders section to remove");
}

fs.writeFileSync('src/App.tsx', app);
console.log("Updated!");
