const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const subfoldersStr = `{/* Render Subfolders */}
                    {subfoldersList.map(name => {`;

const newSubfoldersStr = `{/* Render Subfolders */}
                    <ReactSortable
                      list={subfoldersList}
                      setList={(newState) => {
                        const newFullPaths = newState.map(item => item.fullPath);
                        setFolderOrder(prev => {
                          const others = prev.filter(p => !newFullPaths.includes(p));
                          const updated = [...newFullPaths, ...others];
                          localStorage.setItem('folderOrder', JSON.stringify(updated));
                          return updated;
                        });
                      }}
                      className={folderViewMode === 'grid' ? "contents" : "contents"}
                      animation={200}
                      delayOnTouchOnly={true}
                      delay={150}
                      ghostClass="opacity-40"
                    >
                    {subfoldersList.map(item => {
                      const name = item.name;
                      const fullPath = item.fullPath;`;

if(app.includes(subfoldersStr)) {
  app = app.replace(subfoldersStr, newSubfoldersStr);
}

app = app.replace('{/* Render Files (Barcodes) */}', '</ReactSortable>\n                    {/* Render Files (Barcodes) */}');

// Also fix `name` being used inside the subfolders map:
// `const fullPath = explorerPath ? \`\${explorerPath}/\${name}\` : name;`
// We should remove this line because `fullPath` is already assigned from `item.fullPath`.
const oldFullPathLine = "const fullPath = explorerPath ? `${explorerPath}/${name}` : name;";
app = app.replace(oldFullPathLine, "");

fs.writeFileSync('src/App.tsx', app);
console.log("ReactSortable wrapped");
