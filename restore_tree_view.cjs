const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// The current App container wrapper is:
// <div className={`w-full mx-auto bg-[#f2f4f6] dark:bg-[#000000] h-[100svh] flex flex-col relative shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 sm:rounded-[2.5rem] transition-all duration-500 ease-in-out ${activeTab === 'folders' ? 'max-w-5xl' : 'max-w-md'}`}>
// Yes, it still expands to max-w-5xl! But the Tree View is gone!

const currentFolderTabRegex = /\{activeTab === 'folders' && \(\n\s*<div className="flex-1 flex flex-col min-h-0 bg-\[\#f2f4f6\] dark:bg-black animate-in fade-in slide-in-from-bottom-2 duration-300">([\s\S]*?)\n\s*<\/div>\n\s*\)\}\n\s*\{activeTab === 'settings' && \(/;

const treeViewHtml = `{activeTab === 'folders' && (
          <div className="flex-1 flex flex-row min-h-0 bg-[#f2f4f6] dark:bg-black animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* Desktop Sidebar Tree View */}
            <div className="hidden md:flex w-72 shrink-0 border-r border-slate-200/50 dark:border-white/10 flex-col bg-white/40 dark:bg-black/40 backdrop-blur-xl">
              <div className="p-5 pb-2 font-bold text-lg text-slate-800 dark:text-slate-200 border-b border-transparent">
                탐색기
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-1">
                <button 
                  onClick={() => setExplorerPath('')}
                  className={\`w-full flex items-center gap-2 px-3 py-2.5 rounded-[14px] transition-all text-sm \${explorerPath === '' ? 'bg-[#3182f6]/10 text-[#3182f6] font-bold shadow-sm' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 font-medium'}\`}
                >
                  <IconHome size={18} /> Home
                </button>
                
                {folders.filter(f => f !== '기본폴더').map(f => {
                  const depth = f.split('/').length - 1;
                  const name = f.split('/').pop();
                  const isExact = explorerPath === f;
                  
                  return (
                    <button 
                      key={f}
                      onClick={() => setExplorerPath(f)}
                      style={{ paddingLeft: \`\${(depth * 1.2) + 0.75}rem\` }}
                      className={\`w-full flex items-center gap-2 pr-3 py-2 rounded-[14px] transition-all text-sm \${isExact ? 'bg-[#3182f6]/10 text-[#3182f6] font-bold shadow-sm' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 font-medium'}\`}
                    >
                      {isExact ? <IconFolderOpen size={18} /> : <IconFolderFilled size={18} className="text-[#3182f6]" />}
                      <span className="truncate">{name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">
              $1
            </div>

          </div>
        )}
        
        {activeTab === 'settings' && (`;

const match = app.match(currentFolderTabRegex);
if(match) {
  app = app.replace(currentFolderTabRegex, treeViewHtml.replace('$1', match[1]));
}

fs.writeFileSync('src/App.tsx', app);
console.log("Restored Tree View");
