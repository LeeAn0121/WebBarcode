const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const startScanner = async \(requestedFacingMode\?: 'environment' \| 'user'\) => \{[\s\S]*?logDebug\('error', '카메라 시작 최종 실패', \{ errName, errMsgTxt \}\);\n    \}\n  \};\n  const stopScanner = \(\) => \{/m;

const newStartScanner = `const startScanner = async (requestedFacingMode?: 'environment' | 'user') => {
    try {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (permErr: any) {
        console.warn("명시적 권한 요청 실패:", permErr);
        if (permErr.name === 'NotAllowedError') {
           throw permErr;
        }
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader", { formatsToSupport });
      }
      
      const targetFacingMode = requestedFacingMode || facingMode;
      
      try {
        await scannerRef.current.start(
          { facingMode: targetFacingMode },
          {
            fps: 30,
            qrbox: (w, h) => {
              const minDim = Math.min(w, h);
              const size = Math.min(280, minDim * 0.75);
              return { width: size, height: size };
            },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          handleScanInner,
          () => {}
        );
        
        setIsScanning(true);
        setFacingMode(targetFacingMode);
        logDebug('info', '카메라 시작 성공', { facingMode: targetFacingMode });
      } catch (err: any) {
        console.warn(\`\${targetFacingMode} 카메라 시작 실패:\`, err);
        throw err;
      }
      
      // Setup Zoom if available
      setTimeout(() => {
        const videoEl = document.querySelector('#reader video') as HTMLVideoElement;
        if (videoEl && videoEl.srcObject) {
          const stream = videoEl.srcObject as MediaStream;
          const track = stream.getVideoTracks()[0];
          if (track) {
            videoTrackRef.current = track;
            const capabilities = track.getCapabilities ? track.getCapabilities() : null;
            if (capabilities && capabilities.zoom) {
              setMaxZoom(capabilities.zoom.max);
              setZoomLevel(track.getSettings().zoom || 1);
            }
          }
        }
      }, 500);

    } catch (err: any) {
      console.error(err);
      const errName = err?.name || "UnknownError";
      const errMsgTxt = err?.message || "";
      let toastMsg = \`카메라 시작 실패 (\${errName})\`;
      
      if (errName === 'NotAllowedError' || errMsgTxt.includes('Permission') || errName === 'NotSupportedError') {
        toastMsg = "카메라 권한이 거부/차단 상태입니다. 브라우저 주소창 왼쪽의 🔒자물쇠(또는 ⓘ 아이콘)를 눌러 카메라 권한을 '허용'으로 변경 후 새로고침 해주세요!";
      } else if (errName === 'NotReadableError' || errMsgTxt.includes('in use')) {
        toastMsg = "카메라가 이미 다른 앱이나 탭에서 사용 중입니다. 백그라운드 앱을 종료해주세요.";
      } else if (errName === 'TypeError') {
        toastMsg = \`지원하지 않는 브라우저이거나 시스템 오류입니다. (\${errMsgTxt})\`;
      }
      
      toast.error(toastMsg);
    }
  };
  const stopScanner = () => {`;

if (app.match(regex)) {
  app = app.replace(regex, newStartScanner);
  fs.writeFileSync('src/App.tsx', app);
  console.log("startScanner fixed successfully!");
} else {
  console.log("regex failed again!");
}
