const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  /<div className="w-full max-w-md mx-auto bg-\[\#f5f5f7\] dark:bg-\[\#000000\] h-\[100svh\] flex flex-col relative shadow-2xl overflow-hidden ring-1 ring-black\/5 dark:ring-white\/10 sm:rounded-\[2\.5rem\] transition-all">/,
  '<div className={`w-full mx-auto bg-[#f5f5f7] dark:bg-[#000000] h-[100svh] flex flex-col relative shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 sm:rounded-[2.5rem] transition-all duration-500 ease-in-out ${activeTab === \'folders\' ? \'max-w-5xl\' : \'max-w-md\'}`}>'
);

if (!app.includes('IconFolderFilled')) {
  app = app.replace(
    /import \{([^}]+)\} from '@tabler\/icons-react';/,
    "import {$1, IconFolderFilled, IconHome} from '@tabler/icons-react';"
  );
}

// Update the folder tab container inside
const targetToReplace = `<div className="absolute inset-0 flex flex-col bg-[#f5f5f7] dark:bg-black animate-in fade-in slide-in-from-bottom-2 duration-300 pt-[104px] pb-24">`;
const treeViewSidebar = `<div className="absolute inset-0 flex flex-row bg-[#f5f5f7] dark:bg-black animate-in fade-in slide-in-from-bottom-2 duration-300 pt-[104px] pb-24">
            
            {/* Desktop Sidebar Tree View */}
            <div className="hidden md:flex w-72 shrink-0 border-r border-slate-200/50 dark:border-white/10 flex-col bg-white/40 dark:bg-black/40 backdrop-blur-xl">
              <div className="p-5 pb-2 font-bold text-lg text-slate-800 dark:text-slate-200 border-b border-transparent">
                탐색기
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-1">
                <button 
                  onClick={() => setExplorerPath('')}
                  className={\`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl font-medium transition-colors text-sm \${explorerPath === '' ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}\`}
                >
                  <IconHome size={18} /> Home
                </button>
                
                {folders.filter(f => f !== '기본폴더').map(f => {
                  const depth = f.split('/').length - 1;
                  const name = f.split('/').pop();
                  const isSelected = explorerPath === f || explorerPath.startsWith(f + '/');
                  const isExact = explorerPath === f;
                  
                  return (
                    <button 
                      key={f}
                      onClick={() => setExplorerPath(f)}
                      style={{ paddingLeft: \`\${(depth * 1.2) + 0.75}rem\` }}
                      className={\`w-full flex items-center gap-2 pr-3 py-2 rounded-xl transition-colors text-sm \${isExact ? 'bg-primary/10 text-primary font-bold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}\`}
                    >
                      {isExact ? <IconFolderOpen size={18} /> : <IconFolderFilled size={18} className="text-yellow-500" />}
                      <span className="truncate">{name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">`;

app = app.replace(targetToReplace, treeViewSidebar);

// We need to add `</div>` at the end of the folder tab
// Find where the folder tab ends:
// It ends with `)}` right after `activeTab === 'settings'`. So we need to find the `)}` before `activeTab === 'settings'`
const endFolderRegex = /<\/div>\n\s*\)\}\n\s*\{activeTab === 'settings' && \(/;
app = app.replace(endFolderRegex, '</div>\n          </div>\n        )}\n        \n        {activeTab === \'settings\' && (');


// Update grid/list folder icons to use Filled yellow folder for that Windows feel
app = app.replace(
  /<IconFolder size=\{24\} fill="currentColor" \/>/g,
  '<IconFolderFilled size={24} className="text-yellow-500 drop-shadow-sm" />'
);
app = app.replace(
  /<IconFolder size=\{32\} fill="currentColor" \/>/g,
  '<IconFolderFilled size={40} className="text-yellow-500 drop-shadow-sm" />'
);
app = app.replace(
  /<div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900\/30 text-yellow-500 rounded-2xl flex items-center justify-center">/g,
  '<div className="w-16 h-16 flex items-center justify-center">'
);

fs.writeFileSync('src/App.tsx', app);
