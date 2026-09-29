const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Replace the Mobile Header (Top)
content = content.replace(
  /\{\/\* Mobile Header \(Top\) \*\/\}([\s\S]*?)<\/header>/,
  `{/* Mobile Header (Top) - Toss/Wallet Style */}
        <header className="bg-[#f2f2f7] dark:bg-black z-40 shrink-0 px-6 pt-12 pb-4 flex justify-between items-end border-none">
          <div>
            <h1 className="font-bold text-3xl tracking-tight text-black dark:text-white mb-1">
              {activeTab === 'home' && '내 바코드'}
              {activeTab === 'folders' && '폴더 관리'}
              {activeTab === 'settings' && '설정'}
            </h1>
            {activeTab === 'home' && <p className="text-sm font-medium text-slate-500">스캔과 관리를 가장 빠르고 편하게.</p>}
          </div>
          <div className="flex items-center gap-3 pb-1">
            <a href={\`https://github.com/LeeAn0121/WebBarcode/releases/tag/v\${latestVersion}\`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors font-mono text-[10px] bg-slate-200/50 dark:bg-white/10 px-2 py-1 rounded-full font-bold tracking-widest">
              V{latestVersion}
            </a>
            <button onClick={() => setDarkMode(!darkMode)} className="w-10 h-10 bg-white dark:bg-[#1c1c1e] text-slate-500 hover:text-primary flex items-center justify-center rounded-full shadow-sm transition-all">
              {darkMode ? <IconSun size={18}/> : <IconMoon size={18}/>}
            </button>
          </div>
        </header>`
);

// 2. Replace the list container and list items to look like Toss cards
content = content.replace(
  /<div className="p-4 border-b border-slate-50 dark:border-slate-700\/50">([\s\S]*?)<\/div>\s*<\/div>\s*<div className="flex-1 p-4 bg-slate-50\/50 dark:bg-black\/30 overflow-y-auto custom-scrollbar max-h-\[55vh\] lg:max-h-none lg:h-full">([\s\S]*?)<div className="space-y-3">/,
  `<div className="px-6 py-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">전체 스캔</h2>
                      <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{barcodes.length}</span>
                    </div>
                    {isSelectionMode ? (
                       <button onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }} className="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full transition-colors">취소</button>
                    ) : (
                       <button onClick={() => setIsSelectionMode(true)} className="text-sm font-bold text-slate-500 bg-slate-100 dark:bg-white/10 px-3 py-1.5 rounded-full transition-colors">다중 선택</button>
                    )}
                  </div>
                  <div className="relative">
                    <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} aria-hidden="true" />
                    <input id="barcode-search" type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="바코드 번호 또는 메모 검색..." className="w-full bg-white dark:bg-[#1c1c1e] border-0 rounded-2xl pl-12 p-4 text-base font-medium focus:ring-2 focus:ring-primary outline-none transition-shadow shadow-sm" />
                  </div>
                </div>
                
                <div className="flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar max-h-[55vh] lg:max-h-none lg:h-full">
                  <div className="space-y-4">`
);

// 3. Replace List item classes
content = content.replace(
  /className={\`relative p-3 sm:p-4 rounded-xl shadow-sm border transition-all flex items-center justify-between gap-3 group cursor-pointer ([\s\S]*?)bg-white dark:bg-darkCard border-slate-100 dark:border-slate-700\/50 hover:shadow-md([\s\S]*?)\`}/,
  `className={\`relative p-5 rounded-[1.5rem] transition-all duration-300 flex items-center justify-between gap-4 group cursor-pointer \${idx < 8 ? 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300 ease-out' : ''} \${
    selectedIds.includes(item.id)
      ? 'bg-primary/5 ring-2 ring-primary dark:bg-primary/20'
      : 'bg-white dark:bg-[#1c1c1e] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:scale-[0.98]'
  }\`}`
);

// 4. Replace the bottom scanner button to be a massive floating pill
content = content.replace(
  /\{activeTab === 'home' && \(\s*<div className="flex justify-center shrink-0 py-4 z-40 bg-white\/80 dark:bg-darkCard\/80 backdrop-blur-sm border-t border-slate-50 dark:border-slate-800">([\s\S]*?)<\/button>\s*<\/div>\s*\)\}/,
  `{activeTab === 'home' && (
              <div className="absolute bottom-24 left-0 right-0 flex justify-center z-40 pointer-events-none">
                <button 
                  onClick={() => { setIsScannerModalOpen(true); startScanner(); }}
                  className="pointer-events-auto bg-black dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 transition-all flex items-center gap-3 px-8 py-4 rounded-full shadow-[0_16px_32px_rgba(0,0,0,0.2)] dark:shadow-[0_16px_32px_rgba(255,255,255,0.1)] active:scale-95 group"
                >
                  <IconScan size={24} className="group-hover:rotate-12 transition-transform" />
                  <span className="font-bold text-lg tracking-wide">스캔하기</span>
                </button>
              </div>
            )}`
);

// 5. Replace bottom nav to be seamless Apple style
content = content.replace(
  /<nav className="bg-white\/95 dark:bg-darkCard\/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shrink-0 z-50 pb-safe" aria-label="주 메뉴">([\s\S]*?)<\/nav>/,
  `<nav className="bg-[#f2f2f7] dark:bg-black shrink-0 z-50 pb-safe pt-2" aria-label="주 메뉴">
          <div className="flex justify-around items-center px-4 pb-2">
            <button onClick={() => setActiveTab('home')} className={\`flex flex-col items-center justify-center gap-1 py-2 w-20 transition-colors \${activeTab === 'home' ? 'text-black dark:text-white' : 'text-slate-400'}\`}>
              <IconHome size={26} stroke={activeTab === 'home' ? 2.5 : 1.5} />
              <span className="text-[10px] font-bold">홈</span>
            </button>
            <button onClick={() => setActiveTab('folders')} className={\`flex flex-col items-center justify-center gap-1 py-2 w-20 transition-colors \${activeTab === 'folders' ? 'text-black dark:text-white' : 'text-slate-400'}\`}>
              <IconFolder size={26} stroke={activeTab === 'folders' ? 2.5 : 1.5} />
              <span className="text-[10px] font-bold">폴더</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={\`flex flex-col items-center justify-center gap-1 py-2 w-20 transition-colors \${activeTab === 'settings' ? 'text-black dark:text-white' : 'text-slate-400'}\`}>
              <IconDatabase size={26} stroke={activeTab === 'settings' ? 2.5 : 1.5} />
              <span className="text-[10px] font-bold">설정</span>
            </button>
          </div>
        </nav>`
);

// 6. Fix "w-8 h-8" icon in list to be larger
content = content.replace(
  /<div className="h-8 w-8 shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-900\/30 text-primary flex items-center justify-center transition-transform group-hover:scale-105">/g,
  `<div className="h-12 w-12 shrink-0 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] text-black dark:text-white flex items-center justify-center transition-transform group-hover:scale-110">`
);

fs.writeFileSync('src/App.tsx', content);
console.log("App.tsx replaced.");
