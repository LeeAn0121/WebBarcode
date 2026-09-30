const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const importRegex = /import \{([^}]+)\} from '@tabler\/icons-react';/;
const match = app.match(importRegex);

if (match && !match[1].includes('IconFolderFilled')) {
  app = app.replace(
    importRegex,
    "import {$1, IconFolderFilled} from '@tabler/icons-react';"
  );
  fs.writeFileSync('src/App.tsx', app);
  console.log('Fixed import');
} else {
  console.log('Import already exists or not found');
}
