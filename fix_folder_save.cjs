const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const targetRegex = /onClick=\{\(\) => \{\s*const newFolderName = prompt\('현재 위치에 새 폴더 생성:'\);\s*if \(newFolderName && newFolderName\.trim\(\)\) \{\s*const finalName = explorerPath \? \`\$\{explorerPath\}\/\$\{newFolderName\.trim\(\)\}\` : newFolderName\.trim\(\);\s*setLocalFolders\(prev => Array\.from\(new Set\(\[\.\.\.prev, finalName\]\)\)\);\s*setExplorerPath\(finalName\);\s*toast\.success\('폴더가 생성되었습니다\.'\);\s*\}\s*\}\}/;

const newClickStr = `onClick={() => {
                    const newFolderName = prompt('현재 위치에 새 폴더 생성:');
                    if (newFolderName && newFolderName.trim()) {
                      const finalName = explorerPath ? \`\${explorerPath}/\${newFolderName.trim()}\` : newFolderName.trim();
                      setLocalFolders(prev => {
                        const next = Array.from(new Set([...prev, finalName]));
                        localStorage.setItem('folders', JSON.stringify(next));
                        return next;
                      });
                      
                      setFolderOrder(prev => {
                        if (!prev.includes(finalName)) {
                          const next = [...prev, finalName];
                          localStorage.setItem('folderOrder', JSON.stringify(next));
                          return next;
                        }
                        return prev;
                      });
                      
                      setExplorerPath(finalName);
                      toast.success('폴더가 생성되었습니다.');
                    }
                  }}`;

if(app.match(targetRegex)) {
  app = app.replace(targetRegex, newClickStr);
  fs.writeFileSync('src/App.tsx', app);
  console.log("Folder save fixed");
} else {
  console.log("Regex didn't match");
}
