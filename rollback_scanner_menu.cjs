const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const oldScannerMenuRegex = /<div className="absolute top-1\/2 -translate-y-1\/2 right-4 flex flex-col items-center gap-6 z-50">[\s\S]*?<\/div>\s*<\/div>\s*\)\}/;

const newScannerMenu = `<div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center gap-4 z-50">
              {isScanning && (
                <button 
                  disabled={isSwitching}
                  onClick={async () => {
                    if (isSwitching) return;
                    setIsSwitching(true);
                    try {
                      if (scannerRef.current) { try { await scannerRef.current.stop(); } catch(e) {} }
                      await new Promise(resolve => setTimeout(resolve, 300));
                      const nextMode = facingMode === 'environment' ? 'user' : 'environment';
                      await startScanner(nextMode);
                    } finally {
                      setIsSwitching(false);
                    }
                  }}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-full font-bold shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-all active:scale-95"
                  aria-label="렌즈 전환"
                >
                  <IconRefresh size={18} className={isSwitching ? 'animate-spin' : ''} />
                  {isSwitching ? '전환중...' : '렌즈 전환'}
                </button>
              )}

              {maxZoom > 1 && isScanning && (
                <div className="w-full max-w-[200px] flex items-center gap-3 bg-black/40 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-white/10">
                  <IconSearch size={14} className="text-white/70" aria-hidden="true" />
                  <input type="range" min="1" max={maxZoom} step="0.1" value={zoomLevel} onChange={handleZoomChange} aria-label="카메라 줌 배율" className="flex-1 accent-primary" />
                </div>
              )}
           </div>
        </div>
      )}`;

if(app.match(oldScannerMenuRegex)) {
  app = app.replace(oldScannerMenuRegex, newScannerMenu);
  fs.writeFileSync('src/App.tsx', app);
  console.log("Scanner menu rolled back successfully!");
} else {
  console.log("Regex not matched");
}
