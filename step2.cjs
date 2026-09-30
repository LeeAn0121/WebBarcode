const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// The string replacement approach is safest.
app = app.replace(
  /setMoveModal\(\{ isOpen: true, ids: \[b\.id\], targetFolder: b\.folder \|\| '기본폴더' \}\)/g,
  "setMoveModal({ isOpen: true, ids: [b.id], targetFolder: b.folder || '기본폴더', type: 'barcode', sourceFolder: '' })"
);
app = app.replace(
  /setMoveModal\(\{ isOpen: true, ids: selectedIds, targetFolder: '기본폴더' \}\)/g,
  "setMoveModal({ isOpen: true, ids: selectedIds, targetFolder: '기본폴더', type: 'barcode', sourceFolder: '' })"
);
app = app.replace(
  /setMoveModal\(\{ isOpen: true, ids: \[item\.id\], targetFolder: item\.folder \|\| '기본폴더' \}\)/g,
  "setMoveModal({ isOpen: true, ids: [item.id], targetFolder: item.folder || '기본폴더', type: 'barcode', sourceFolder: '' })"
);

// We should also replace the setMoveModal onClick where it closes:
app = app.replace(
  /setMoveModal\(\{ \.\.\.moveModal, isOpen: false \}\)/g,
  "setMoveModal(prev => ({ ...prev, isOpen: false }))"
);

fs.writeFileSync('src/App.tsx', app);
