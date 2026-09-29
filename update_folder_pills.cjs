const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove the `<select>` and put back a clean heading
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
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                      </div>
                      <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 shadow-sm">
                        {barcodes.filter(b => currentFolder === '전체' || (b.folder || '기본폴더') === currentFolder).length}
                      </span>
                    </div>`;

// Replace it with a nice heading
const cleanHeading = `
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-black dark:text-white tracking-tight">
                        {currentFolder === '전체' ? '모든 바코드' : currentFolder}
                      </h2>
                      <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {barcodes.filter(b => currentFolder === '전체' || (b.folder || '기본폴더') === currentFolder).length}
                      </span>
                    </div>`;

app = app.replace(folderSelectUI, cleanHeading);

// 2. Replace the Smart Filter pills with Folder pills
const smartFilterPills = `
  {/* 스마트 필터 영역 */}
  <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
    <button onClick={() => setSmartFilter('all')} className={\`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all \${smartFilter === 'all' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-[#1c1c1e] text-slate-500 shadow-sm'}\`}>전체 보기</button>
    <button onClick={() => setSmartFilter('today')} className={\`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all \${smartFilter === 'today' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-[#1c1c1e] text-slate-500 shadow-sm'}\`}>오늘 스캔</button>
    <button onClick={() => setSmartFilter('yesterday')} className={\`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all \${smartFilter === 'yesterday' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-[#1c1c1e] text-slate-500 shadow-sm'}\`}>어제 스캔</button>
    <button onClick={() => setSmartFilter('hasMemo')} className={\`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all \${smartFilter === 'hasMemo' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-white dark:bg-[#1c1c1e] text-slate-500 shadow-sm'}\`}>📝 메모 있음</button>
  </div>`;

const folderPills = `
  {/* 폴더 탭 영역 (가로 스크롤) */}
  <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 px-1">
    <button onClick={() => setCurrentFolder('전체')} className={\`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all \${currentFolder === '전체' ? 'bg-black dark:bg-white text-white dark:text-black shadow-md' : 'bg-white dark:bg-[#1c1c1e] text-slate-500 shadow-sm hover:bg-slate-50'}\`}>전체보기</button>
    {folders.map(f => (
      <button key={f} onClick={() => setCurrentFolder(f)} className={\`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all \${currentFolder === f ? 'bg-black dark:bg-white text-white dark:text-black shadow-md' : 'bg-white dark:bg-[#1c1c1e] text-slate-500 shadow-sm hover:bg-slate-50'}\`}>{f}</button>
    ))}
  </div>`;

app = app.replace(smartFilterPills, folderPills);

fs.writeFileSync('src/App.tsx', app);
console.log("Folder pills updated!");
