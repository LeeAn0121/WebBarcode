const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');
const importRegex = /import \{([^}]+)\} from '@tabler\/icons-react';/;
app = app.replace(
  importRegex,
  "import {$1, IconChevronRight} from '@tabler/icons-react';"
);
fs.writeFileSync('src/App.tsx', app);
