const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Change default state to 'list'
app = app.replace(
  /const \[folderViewMode, setFolderViewMode\] = useState<'list' \| 'grid'>\('grid'\);/,
  "const [folderViewMode, setFolderViewMode] = useState<'list' | 'grid'>('list');"
);
// Also in case it reads from localStorage:
app = app.replace(
  /const \[folderViewMode, setFolderViewMode\] = useState<'list' \| 'grid'>\(\(localStorage\.getItem\('folderViewMode'\) as 'list' \| 'grid'\) \|\| 'grid'\);/,
  "const [folderViewMode, setFolderViewMode] = useState<'list' | 'grid'>('list');"
);

// 2. Remove the Toggle Button
const toggleBtnRegex = /<button onClick=\{\(\) => setFolderViewMode\(prev => prev === 'grid' \? 'list' : 'grid'\)\}[\s\S]*?<\/button>/;
app = app.replace(toggleBtnRegex, "");

fs.writeFileSync('src/App.tsx', app);
console.log("Forced List Mode");
