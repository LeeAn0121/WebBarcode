const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

if (!app.includes('import { ReactSortable } from \'react-sortablejs\';')) {
  app = app.replace(
    /import React, \{ useState, useEffect, useRef \} from 'react';/,
    `import React, { useState, useEffect, useRef } from 'react';\nimport { ReactSortable } from 'react-sortablejs';`
  );
  fs.writeFileSync('src/App.tsx', app);
  console.log("Import added");
} else {
  console.log("Import already exists");
}
