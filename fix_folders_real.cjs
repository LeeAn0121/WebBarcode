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

app = app.replace(subfoldersStr, newSubfoldersStr);

// Now we need to close </ReactSortable> after the subfolders map ends, BEFORE files map starts.
const filesStr = `{/* Render Files */}`;
app = app.replace(filesStr, `</ReactSortable>\n                    {/* Render Files */}`);

// Also fix the name -> item logic. Since subfoldersList is now an array of objects!
// Wait! Previously `subfoldersList` was an array of strings. 
// My `fix_folders.cjs` ALREADY changed `subfoldersList` to be an array of objects!
// So `{subfoldersList.map(name => {` is passing the OBJECT as `name`!
// Let's check `App.tsx`!
