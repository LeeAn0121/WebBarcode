const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

const newFolderButtons = `
                    <div className="flex gap-2 w-full pt-2 border-t border-slate-100 dark:border-white/5">
                      <button onClick={() => {
                        const listToExport = barcodes.filter(b => (b.folder || '기본폴더') === f);
                        if (listToExport.length === 0) return toast.warning('데이터가 없습니다.');
                        const data = listToExport.map(item => ({ '바코드': item.code, '메모': item.memo || '', '스캔시간': item.created_at, '폴더': item.folder || '기본폴더' }));
                        const ws = XLSX.utils.json_to_sheet(data);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, 'Scans');
                        XLSX.writeFile(wb, \`\${f.replace(/\\//g, '_')}_barcodes.xlsx\`);
                        toast.success(\`'\${f}' 엑셀 추출 완료!\`);
                      }} className="flex-1 py-2.5 bg-[#f2f2f7] hover:bg-green-50 dark:bg-black dark:hover:bg-green-900/20 text-slate-600 hover:text-green-600 dark:text-slate-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                        <IconFileExport size={16} /> 엑셀
                      </button>
                      <button onClick={() => handleShareFolder(f)} className="flex-1 py-2.5 bg-[#f2f2f7] hover:bg-blue-50 dark:bg-black dark:hover:bg-blue-900/20 text-slate-600 hover:text-blue-600 dark:text-slate-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                        <IconCopy size={16} /> 공유
                      </button>
                      <button onClick={() => handleCreateInvite(f)} className="flex-1 py-2.5 bg-[#f2f2f7] hover:bg-emerald-50 dark:bg-black dark:hover:bg-emerald-900/20 text-slate-600 hover:text-emerald-600 dark:text-slate-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                        <IconShare size={16} /> 협업
                      </button>
                      {f !== '기본폴더' && (
                        <button onClick={() => handleRenameFolder(f)} className="flex-1 py-2.5 bg-[#f2f2f7] hover:bg-slate-200 dark:bg-black dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                          <IconEdit size={16} /> 이름
                        </button>
                      )}
                      {f !== '기본폴더' && (
                        <button onClick={() => handleDeleteFolder(f)} className="flex-1 py-2.5 bg-[#f2f2f7] hover:bg-red-50 dark:bg-black dark:hover:bg-red-900/20 text-slate-600 hover:text-red-600 dark:text-slate-400 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
                          <IconTrash size={16} /> 삭제
                        </button>
                      )}
                    </div>`;

app = app.replace(/<div className="flex gap-2 w-full pt-2 border-t border-slate-100 dark:border-white\/5">[\s\S]*?<\/div>/, newFolderButtons);

fs.writeFileSync('src/App.tsx', app);
console.log("Excel folder button added");
