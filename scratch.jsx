  return (
    <>
      <Toaster position="bottom-center" theme={darkMode ? 'dark' : 'light'} />
      <header className="bg-white/80 dark:bg-darkCard/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-purple-500 text-white p-2 rounded-xl shadow-glow">
              <Barcode />
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                WebBarcode 
                <a 
                  href={`https://github.com/LeeAn0121/WebBarcode/releases`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-primary hover:border-primary/50 text-[10px] px-1.5 py-0.5 rounded font-mono border border-slate-200 dark:border-slate-600 transition-colors"
                  title="릴리즈 노트 보기"
                >
                  v{packageJson.version}
                </a>
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-darkCard w-full max-w-sm rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800 dark:text-slate-100"><Settings size={18} className="text-slate-500"/> 설정</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full p-1"><X size={20} /></button>
            </div>
            
            <div className="p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              
              {/* 폴더 관리 섹션 (트리 구조) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">폴더 트리 관리</h4>
                  <button onClick={handleAddFolder} className="text-primary hover:text-primaryHover text-xs font-bold flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
                    <FolderPlus size={14}/> 새 폴더
                  </button>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl p-3 flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {folders.map(f => {
                    const parts = f.split('/');
                    const depth = parts.length - 1;
                    const name = parts[parts.length - 1];
                    const barcodeCount = barcodes.filter(b => (b.folder || '기본폴더') === f).length;
                    return (
                      <div key={f} className="flex justify-between items-center hover:bg-slate-200/50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors group" style={{ marginLeft: `${depth * 16}px` }}>
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Folder size={14} className="text-slate-400 shrink-0" />
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate" title={f}>{name}</span>
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded-full">{barcodeCount}</span>
                        </div>
                        {f !== '기본폴더' && (
                          <button onClick={() => handleDeleteFolder(f)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                            <Trash2 size={14}/>
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">데이터 내보내기/가져오기</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleBackup} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl transition-colors">
                    <DownloadCloud size={24} className="text-blue-500" />
                    <span className="text-xs font-medium">데이터 백업 (JSON)</span>
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl transition-colors">
                    <UploadCloud size={24} className="text-indigo-500" />
                    <span className="text-xs font-medium">데이터 복원 (JSON)</span>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleRestore} accept=".json" className="hidden" />
                </div>
                
                <button onClick={exportExcel} className="w-full flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-100 dark:border-green-800/50 text-green-700 dark:text-green-400 rounded-2xl transition-colors">
                  <Download size={18} />
                  <span className="text-sm font-medium">엑셀(Excel) 내보내기</span>
                </button>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider text-red-500">위험 구역</h4>
                <button onClick={handleDeleteAll} className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 rounded-2xl transition-colors">
                  <AlertTriangle size={18} />
                  <span className="text-sm font-bold">전체 기록 삭제</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        
        {/* Scanner Section */}
        <section className="w-full lg:w-5/12 flex flex-col gap-4">
          <div className="bg-white dark:bg-darkCard rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden relative">
            <div className="p-4 border-b border-slate-50 dark:border-slate-700/50 flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2"><Camera className="text-primary" size={20} /> 카메라 스캔</h2>
              <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-primary rounded-full">
                {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>
            </div>
            
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col items-center">
              {!isScanning ? (
                <button onClick={startScanner} className="bg-primary hover:bg-primaryHover text-white py-3 px-6 rounded-2xl shadow-glow w-full max-w-xs flex justify-center items-center gap-2 mb-4 font-semibold">
                  <Camera size={18} /> 스캐너 켜기
                </button>
              ) : (
                <button onClick={stopScanner} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 py-3 px-6 rounded-2xl w-full max-w-xs flex justify-center items-center gap-2 mb-4 font-medium transition-colors">
                  중지
                </button>
              )}

              {cameras.length > 1 && isScanning && (
                <select value={selectedCamera} onChange={(e) => { setSelectedCamera(e.target.value); stopScanner(); setTimeout(startScanner, 100); }} className="mb-4 w-full max-w-xs p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm">
                  {cameras.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              )}

              {maxZoom > 1 && isScanning && (
                <div className="w-full max-w-xs flex items-center gap-3 mb-4 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-400">Zoom</span>
                  <input type="range" min="1" max={maxZoom} step="0.1" value={zoomLevel} onChange={handleZoomChange} className="flex-1 accent-primary" />
                </div>
              )}
              
              <div className="w-full relative rounded-2xl overflow-hidden bg-slate-900 min-h-[250px]">
                <div id="reader" className="w-full"></div>
                {/* Custom Highlight Overlay */}
                <div id="reader-overlay" className="absolute inset-4 rounded-xl border-2 ring-4 ring-primary/50 border-dashed border-white/50 pointer-events-none transition-all duration-300"></div>
                
                {!isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900/90 z-10">
                    <Barcode size={48} className="opacity-30 mb-2" />
                    <p className="text-sm font-medium">카메라를 켜주세요</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* List Section */}
        <section className="w-full lg:w-7/12 flex flex-col flex-1">
          <div className="bg-white dark:bg-darkCard rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col h-full min-h-[500px]">
            <div className="p-4 border-b border-slate-50 dark:border-slate-700/50">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold flex items-center gap-2">스캔 기록</h2>
                  <div className="relative">
                    <select value={currentFolder} onChange={(e) => setCurrentFolder(e.target.value)} className="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold px-3 py-1.5 pr-6 rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer">
                      {folders.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1.5 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                  <button onClick={handleAddFolder} className="text-slate-400 hover:text-primary transition-colors p-1" title="새 폴더">
                    <FolderPlus size={16} />
                  </button>
                </div>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">{barcodes.filter(b => (b.folder || '기본폴더') === currentFolder).length}건</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="바코드 번호 또는 메모 검색..." className="w-full bg-slate-50 dark:bg-slate-900/50 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl pl-10 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/30">
              <div className="space-y-3">
                {filteredBarcodes.filter(b => (b.folder || '기본폴더') === currentFolder).map(item => (
                  <div key={item.id} className="bg-white dark:bg-darkCard p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 transition-all hover:shadow-md group item-enter">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-3 overflow-hidden flex-1">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Barcode size={24} />
                        </div>
                        <div className="overflow-hidden flex flex-col justify-center">
                          <p className="font-mono font-semibold text-lg truncate text-slate-800 dark:text-slate-100">{item.code}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12}/> {format(new Date(item.created_at), 'HH:mm:ss')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0">
                        <button onClick={() => { navigator.clipboard.writeText(item.code); toast.success('복사됨'); }} className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-white dark:hover:bg-slate-800" title="복사"><Copy size={16}/></button>
                        <button onClick={() => handleShare(item)} className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-white dark:hover:bg-slate-800" title="공유"><Share2 size={16}/></button>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        <button onClick={() => handleEditMemo(item.id, item.memo)} className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-white dark:hover:bg-slate-800" title="메모"><MessageSquarePlus size={16}/></button>
                        <button onClick={() => handleEditCode(item.id, item.code)} className="p-1.5 text-slate-400 hover:text-green-500 rounded-lg hover:bg-white dark:hover:bg-slate-800" title="수정"><Edit3 size={16}/></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white dark:hover:bg-slate-800" title="삭제"><Trash2 size={16}/></button>
                      </div>
                    </div>
                    {item.memo && (
                      <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 flex gap-2 border border-slate-100 dark:border-slate-800">
                        <p className="text-sm text-slate-600 dark:text-slate-300 break-all">{item.memo}</p>
                      </div>
                    )}
                  </div>
                ))}
                
                {filteredBarcodes.length === 0 && (
                  <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                    <p className="text-sm">기록이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
