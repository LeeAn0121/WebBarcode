const fs = require('fs');

// 1. AdminPage.tsx
let admin = fs.readFileSync('src/AdminPage.tsx', 'utf8');

admin = admin.replace(
  /bg-white\/70 dark:bg-white\/5 backdrop-blur-xl border border-white\/50 dark:border-white\/10 shadow-\[0_8px_30px_rgb\(0,0,0,0\.04\)\]/g,
  'bg-white dark:bg-[#1c1c1e] border-none shadow-[0_2px_12px_rgba(0,0,0,0.03)]'
);
fs.writeFileSync('src/AdminPage.tsx', admin);

// 2. index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(
  /<div id="static-splash"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/,
  `<div id="static-splash" style="position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;background-color:#f2f2f7;transition:opacity 0.3s ease-out;overflow:hidden;">
      <style>
        @media (prefers-color-scheme: dark) { #static-splash { background-color: #000000 !important; } }
        @keyframes bounceIcon { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes loadBar { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
      </style>
      <div style="position:relative;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;">
        <div style="position:relative;width:96px;height:96px;border-radius:24px;box-shadow:0 12px 40px rgba(0,0,0,0.1);animation:bounceIcon 2s ease-in-out infinite;">
          <img src="/WebBarcode/icon.jpg" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:24px;position:relative;z-index:10;" />
        </div>
        <h1 style="font-size:24px;font-weight:900;letter-spacing:-0.025em;color:#000;font-family:system-ui,-apple-system,sans-serif;">WebBarcode</h1>
        <div style="width:48px;height:6px;border-radius:9999px;background-color:rgba(0,0,0,0.1);overflow:hidden;position:relative;">
          <div style="position:absolute;top:0;left:0;height:100%;width:40%;background-color:#6366f1;border-radius:9999px;animation:loadBar 1.2s ease-in-out infinite;"></div>
        </div>
      </div>
    </div>`
);
fs.writeFileSync('index.html', html);
console.log("Reverted AdminPage and index.html");
