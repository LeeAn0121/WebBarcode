const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// A. Haptic Feedback Utility
const hapticUtility = `  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' = 'light') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'light') navigator.vibrate(10);
      else if (type === 'medium') navigator.vibrate(30);
      else if (type === 'heavy') navigator.vibrate(50);
      else if (type === 'success') navigator.vibrate([20, 50, 30]);
    }
  };\n`;
app = app.replace(/const \[activeTab, setActiveTab\] = useState<'home' \| 'folders' \| 'settings'>\('home'\);/, hapticUtility + `  const [activeTab, setActiveTab] = useState<'home' | 'folders' | 'settings'>('home');`);

// Add haptic to tab change
app = app.replace(/onClick=\{\(\) => setActiveTab\('home'\)\}/, `onClick={() => { setActiveTab('home'); triggerHaptic('light'); }}`);
app = app.replace(/onClick=\{\(\) => setActiveTab\('folders'\)\}/, `onClick={() => { setActiveTab('folders'); triggerHaptic('light'); }}`);
app = app.replace(/onClick=\{\(\) => setActiveTab\('settings'\)\}/, `onClick={() => { setActiveTab('settings'); triggerHaptic('light'); }}`);

// Add haptic to selection mode
app = app.replace(/setIsSelectionMode\(true\);\s*setSelectedIds\(\[id\]\);/, `setIsSelectionMode(true); setSelectedIds([id]); triggerHaptic('medium');`);
app = app.replace(/setSelectedIds\(prev => prev\.includes\(id\) \? prev\.filter\(i => i !== id\) : \[\.\.\.prev, id\]\);/, `setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); triggerHaptic('light');`);
app = app.replace(/toast\.success\('복사됨'\);/, `toast.success('복사됨'); triggerHaptic('success');`);
app = app.replace(/toast\.success\(`\$\{cleanData\.length\}개의 바코드 및 \$\{importedFolders\.length\}개의 폴더가 성공적으로 복원되었습니다\.`\);/, `toast.success(\`\${cleanData.length}개의 바코드 및 \${importedFolders.length}개의 폴더가 성공적으로 복원되었습니다.\`); triggerHaptic('success');`);
app = app.replace(/toast\.success\('바코드가 추가되었습니다\.'\);/, `toast.success('바코드가 추가되었습니다.'); triggerHaptic('success');`);


// B. Bottom Action Bar (Move from Top to Bottom)
const oldTopFloatingBarRegex = /fixed top-\[calc\(1rem\+env\(safe-area-inset-top\)\)\] left-1\/2 -translate-x-1\/2 w-\[90%\] max-w-md bg-slate-900\/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl z-50 flex items-center justify-between border border-slate-700 animate-in slide-in-from-top-5/;
const newBottomFloatingBar = `fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-slate-900/95 backdrop-blur-xl text-white rounded-[24px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 flex items-center justify-between border border-white/10 animate-in slide-in-from-bottom-8 duration-300`;
app = app.replace(oldTopFloatingBarRegex, newBottomFloatingBar);

// We should remove the old multi-select buttons inside the content area to prevent duplication, wait, the old one was in the content header.
// Let's hide the old buttons in the content header if isSelectionMode is true
const oldSelectionButtonsRegex = /\{isSelectionMode \? \(\s*<div className="flex gap-2">\s*\{selectedIds\.length > 0 && \(\s*<button onClick=\{async \(\) => \{[\s\S]*?\}\s*\)\s*:\s*\(\s*<button onClick=\{\(\) => setIsSelectionMode\(true\)\} className="text-sm font-bold text-slate-500 bg-slate-100 dark:bg-white\/10 px-3 py-1\.5 rounded-full transition-colors">다중 선택<\/button>\s*\)\}/;
app = app.replace(oldSelectionButtonsRegex, `
{!isSelectionMode && (
  <button onClick={() => { setIsSelectionMode(true); triggerHaptic('medium'); }} className="text-sm font-bold text-slate-500 bg-slate-100 dark:bg-white/10 px-4 py-1.5 rounded-full transition-colors shadow-sm active:scale-95">다중 선택</button>
)}
`);


// C. Empty State Illustration
const oldEmptyStateRegex = /<IconBarcode size=\{32\} className="text-slate-300 dark:text-slate-600" aria-hidden="true" \/>/;
const newEmptyState = `<div className="relative w-20 h-20 mb-2 flex items-center justify-center animate-[float_4s_ease-in-out_infinite]">
                          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                          <IconBarcode size={48} className="text-primary/70 relative z-10" aria-hidden="true" />
                        </div>`;
app = app.replace(oldEmptyStateRegex, newEmptyState);


fs.writeFileSync('src/App.tsx', app);
