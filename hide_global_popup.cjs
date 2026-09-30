const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// I will disable the Global Popup from showing automatically when activeActionMenu is set.
// Instead, I'll introduce `activeGlobalMenu` state.
app = app.replace(
  /const \[activeActionMenu, setActiveActionMenu\] = useState<string \| null>\(null\);/,
  `const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);\n  const [activeGlobalMenu, setActiveGlobalMenu] = useState<string | null>(null);`
);

// Update Global Popup to use activeGlobalMenu
app = app.replace(
  /\{activeTab === 'home' && activeActionMenu && barcodes\.find\(b => b\.id === activeActionMenu\) && \(\(\) => \{[\s\S]*?const item = barcodes\.find\(b => b\.id === activeActionMenu\)!(?:;)?/,
  `{activeGlobalMenu && barcodes.find(b => b.id === activeGlobalMenu) && (() => {
          const item = barcodes.find(b => b.id === activeGlobalMenu)!;`
);

app = app.replace(
  /setActiveActionMenu\(null\)/g,
  `{setActiveActionMenu(null); setActiveGlobalMenu(null);}`
);

// Change the Global Popup close button:
app = app.replace(
  /onClick=\{\(\) => setActiveActionMenu\(null\)\}/g,
  `onClick={() => setActiveGlobalMenu(null)}`
);


// Now add the "More" button to all inline overlays!
const moreBtnHtml = `
                            <button onClick={(e) => { e.stopPropagation(); setActiveGlobalMenu(b?.id || item?.id); setActiveActionMenu(null); }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all active:scale-95" aria-label="더보기">
                              <IconDotsVertical size={22} />
                              <span className="text-[10px] font-bold">더보기</span>
                            </button>`;

// I'll append it before the </div> of the inline overlays.
app = app.replace(/<span className="text-\[10px\] font-bold">삭제<\/span>\n\s*<\/button>\n\s*<\/div>/g, `<span className="text-[10px] font-bold">삭제</span>\n                                </button>${moreBtnHtml}\n                              </div>`);

fs.writeFileSync('src/App.tsx', app);
console.log("Global popup separated");
