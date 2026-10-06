const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove the old `camIndexOverride` logic and replace with facingMode
const oldStartScannerRegex = /const startScanner = async \(camIndexOverride\?: number\) => \{[\s\S]*?await scannerRef\.current\.start\([\s\S]*?targetDevice\.id,/;

const newStartScanner = `const startScanner = async (requestedFacingMode?: 'environment' | 'user') => {
    try {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (permErr: any) {
        console.warn("명시적 권한 요청 실패 (무시하고 계속 진행):", permErr);
        if (permErr.name === 'NotAllowedError') {
           throw permErr;
        }
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader", { formatsToSupport });
      }
      
      const targetFacingMode = requestedFacingMode || facingMode;
      
      let success = false;
      let lastErr = null;
      
      try {
        await scannerRef.current.start(
          { facingMode: targetFacingMode },`;

app = app.replace(oldStartScannerRegex, newStartScanner);

// 2. Remove the for-loop logic
const oldForLoopRegex = /\{ fps: 30,[\s\S]*?\}\);[\s\S]*?success = true;[\s\S]*?break;[\s\S]*?\} catch \(e\) \{[\s\S]*?currentIdx = \(currentIdx \+ 1\) % currentDevices\.length;[\s\S]*?\}[\s\S]*?\}/;

const newForLoop = `{
              fps: 30,
              qrbox: (w, h) => {
                const isMobile = window.innerWidth < 768;
                const minDimension = Math.min(w, h);
                const boxSize = isMobile ? Math.min(280, minDimension * 0.75) : Math.min(300, minDimension * 0.75);
                return { width: boxSize, height: boxSize };
              },
              aspectRatio: 1.0,
            },
            handleScanInner,
            (errorMessage) => { }
          );
          success = true;
          setFacingMode(targetFacingMode); // Save the successfully used mode
      } catch (e) {
          console.warn(\`\${targetFacingMode} 카메라 시작 실패:\`, e);
          lastErr = e;
      }`;

app = app.replace(oldForLoopRegex, newForLoop);


// 3. In the UI, change the "렌즈 전환" button to flip between "user" and "environment"
const oldFlipButtonRegex = /onClick=\{async \(\) => \{[\s\S]*?const currentIndex = parseInt\(selectedCamera \|\| "0"\);[\s\S]*?const nextIndex = \(currentIndex \+ 1\) % cameras\.length;[\s\S]*?await startScanner\(nextIndex\);[\s\S]*?\}\}/;

const newFlipButton = `onClick={async () => {
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
                  }}`;

app = app.replace(oldFlipButtonRegex, newFlipButton);


// 4. Change the condition `{isScanning && cameras.length > 1 && (` to just `{isScanning && (` since most phones have 2 facing modes
app = app.replace(/\{isScanning && cameras\.length > 1 && \(/g, '{isScanning && (');


// 5. Change the UI Layout so the Menu is on the side, and fix FAB overlapping.
// "카메라 촬영 버튼이 하단 메뉴바와 겹칩니다." (The FAB overlaps with the bottom menu bar).
// Actually, it's `bottom-20 right-6`. Let's change it to `bottom-24 right-6` to avoid the bottom menu.
app = app.replace(/<div className="absolute bottom-20 right-6 md:right-10 z-40">/g, '<div className="absolute bottom-28 right-6 md:bottom-10 md:right-10 z-40">');

// 6. "메뉴는 사이드로 빼고 UI&UX를 고려해서 수정해주세요"
// This means the bottom navigation bar (`<nav className="... shrink-0 z-50 pb-safe pt-2">`) should be a SIDEBAR on Desktop.
// Currently it's `<nav className="bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/5 shrink-0 z-50 pb-safe pt-2" ...>`
// We should wrap it in a flex container for the whole app.
// Wait! `w-full max-w-md mx-auto` or `max-w-5xl` is currently controlled by the root div.
// Let's modify the app layout!

fs.writeFileSync('src/App.tsx', app);
