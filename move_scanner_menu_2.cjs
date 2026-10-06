const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const oldScannerMenuRegex = /<div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black\/80 to-transparent flex flex-col items-center gap-4 z-50">[\s\S]*?<\/div>\s*<\/div>\s*\)\}/;

const newScannerMenu = `<div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col items-center gap-6 z-50">
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
                  className="w-12 h-12 flex items-center justify-center bg-black/40 backdrop-blur-md text-white rounded-full shadow-lg border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-all active:scale-90"
                  aria-label="렌즈 전환"
                >
                  <IconRefresh size={22} className={isSwitching ? 'animate-spin' : ''} />
                </button>
              )}

              {maxZoom > 1 && isScanning && (
                <div className="flex flex-col items-center gap-3 bg-black/40 backdrop-blur-md px-2 py-4 rounded-full shadow-lg border border-white/10 h-48">
                  <span className="text-white/80 text-[10px] font-bold">{(zoomLevel).toFixed(1)}x</span>
                  <input 
                    type="range" 
                    min="1" 
                    max={maxZoom} 
                    step="0.1" 
                    value={zoomLevel} 
                    onChange={handleZoomChange} 
                    aria-label="카메라 줌 배율" 
                    className="flex-1 accent-primary w-2 h-full appearance-none bg-transparent [&::-webkit-slider-runnable-track]:w-1 [&::-webkit-slider-runnable-track]:bg-white/20 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:-ml-1.5" 
                    style={{ writingMode: 'bt-lr', WebkitAppearance: 'slider-vertical' }}
                  />
                  <IconSearch size={14} className="text-white/70 mt-2" aria-hidden="true" />
                </div>
              )}
           </div>
        </div>
      )}`;

if(app.match(oldScannerMenuRegex)) {
  app = app.replace(oldScannerMenuRegex, newScannerMenu);
  fs.writeFileSync('src/App.tsx', app);
  console.log("Scanner menu moved");
} else {
  console.log("Regex not matched");
}
