const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add IconSettings to imports
if (!app.includes('IconSettings')) {
  app = app.replace(
    /import \{([^}]+)\} from '@tabler\/icons-react';/,
    "import {$1, IconSettings} from '@tabler/icons-react';"
  );
}

// 2. Replace "데이터 및 시스템 설정" with "설정"
app = app.replace(
  /<h2 className="font-bold flex items-center gap-2 text-xl"><IconDatabase className="text-primary" size=\{24\} aria-hidden="true" \/> 데이터 및 시스템 설정<\/h2>/,
  '<h2 className="font-bold flex items-center gap-2 text-xl"><IconSettings className="text-primary" size={24} aria-hidden="true" /> 설정</h2>'
);

// 3. Replace IconDatabase with IconSettings in the bottom navigation bar
app = app.replace(
  /<IconDatabase size=\{26\} stroke=\{activeTab === 'settings' \? 2\.5 : 1\.5\} \/>\n\s*<span className="text-\[10px\] font-bold">설정<\/span>/,
  '<IconSettings size={26} stroke={activeTab === \'settings\' ? 2.5 : 1.5} />\n              <span className="text-[10px] font-bold">설정</span>'
);

fs.writeFileSync('src/App.tsx', app);
console.log("Updated Settings Icon and Title");
