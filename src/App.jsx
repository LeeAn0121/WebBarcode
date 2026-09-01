import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5Qrcode } from 'html5-qrcode';
import { Toaster, toast } from 'sonner';
import * as XLSX from 'xlsx';
import packageJson from '../package.json';
import { 
  Barcode, Moon, Sun, Download, Camera, Volume2, VolumeX, 
  Search, Copy, Share2, MessageSquarePlus, Edit3, Trash2, Clock,
  Folder, FolderPlus, UploadCloud, DownloadCloud, Settings, X, AlertTriangle, Menu, Home, Database, Github
} from 'lucide-react';
import { format } from 'date-fns';

const SUPABASE_URL = 'https://otxmccqqpfirmytlrchl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90eG1jY3FxcGZpcm15dGxyY2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxOTIxNDUsImV4cCI6MjEwMzc2ODE0NX0.ZklBr-UroChsHlT9MggagEny_lRKE6yyWFb3RKVVKqY';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function playSound(type = 'success', isSoundEnabled) {
  if (!isSoundEnabled) return;
  try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      if (type === 'success') {
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); 
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.01);
          gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'duplicate') {
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
          gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
          oscillator.start(audioCtx.currentTime);
          oscillator.stop(audioCtx.currentTime + 0.3);
      }
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
  } catch(e) {
      console.warn("Web Audio API not supported", e);
  }
}

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [barcodes, setBarcodes] = useState([]);
  const barcodesRef = useRef([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [currentFolder, setCurrentFolder] = useState('기본폴더');
  const [activeTab, setActiveTab] = useState('home');
  
  const [localFolders, setLocalFolders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('folders')) || []; }
    catch { return []; }
  });
  
  const scannerRef = useRef(null);
  const pendingInsertsRef = useRef(new Set());
  const videoTrackRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const fileInputRef = useRef(null);
  const currentFolderRef = useRef('기본폴더');

  // Derived unique folders from barcodes and local
  const folders = Array.from(new Set(['기본폴더', ...localFolders, ...barcodes.map(b => b.folder).filter(Boolean)])).sort();

  // Sync state to ref for callbacks
  useEffect(() => {
    barcodesRef.current = barcodes;
    currentFolderRef.current = currentFolder;
  }, [barcodes, currentFolder]);

  // Theme toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Supabase Realtime & Fetch
  useEffect(() => {
    fetchBarcodes();

    const subscription = supabase
      .channel('public:barcodes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barcodes' }, payload => {
        if (payload.eventType === 'INSERT') {
          setBarcodes(prev => {
            if (prev.some(b => b.id === payload.new.id || b.code === payload.new.code)) return prev;
            return [payload.new, ...prev];
          });
        } else if (payload.eventType === 'UPDATE') {
          setBarcodes(prev => prev.map(b => b.id === payload.new.id ? payload.new : b));
        } else if (payload.eventType === 'DELETE') {
          setBarcodes(prev => prev.filter(b => b.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchBarcodes = async () => {
    const { data, error } = await supabase.from('barcodes').select('*').order('created_at', { ascending: false });
    if (!error && data) setBarcodes(data);
  };

  const handleScan = async (decodedText) => {
    const cleanText = decodedText.trim();
    
    // Pause the scanner completely to create a true delay between scans
    if (scannerRef.current && scannerRef.current.getState() === 2) { // 2 = SCANNING
      scannerRef.current.pause(true); // true = pause scanning but keep video feed active
    }

    // Custom visual flash effect
    const readerEl = document.getElementById('reader-overlay');
    
    // Check duplicates per folder using ref to avoid stale closure
    const isDuplicate = barcodesRef.current.some(b => b.code === cleanText && (b.folder || '기본폴더') === currentFolderRef.current) || pendingInsertsRef.current.has(cleanText);
    
    if (isDuplicate) {
      playSound('duplicate', isSoundEnabled);
      toast.error(`이미 등록된 바코드입니다: ${cleanText}`);
      
      if (readerEl) {
        readerEl.classList.remove('ring-primary/50');
        readerEl.classList.add('ring-red-500', 'bg-red-500/10');
        setTimeout(() => {
          readerEl.classList.remove('ring-red-500', 'bg-red-500/10');
          readerEl.classList.add('ring-primary/50');
        }, 300);
      }
      
      // Resume scanner after delay
      setTimeout(() => {
        if (scannerRef.current && isScanning) scannerRef.current.resume();
      }, 1500);
      return;
    }

    pendingInsertsRef.current.add(cleanText);
    playSound('success', isSoundEnabled);
    if (navigator.vibrate) navigator.vibrate(50);
    
    if (readerEl) {
      readerEl.classList.remove('ring-primary/50');
      readerEl.classList.add('ring-green-500', 'bg-green-500/10');
      setTimeout(() => {
        readerEl.classList.remove('ring-green-500', 'bg-green-500/10');
        readerEl.classList.add('ring-primary/50');
      }, 300);
    }

    const { error } = await supabase.from('barcodes').insert([{ code: cleanText, folder: currentFolderRef.current }]);
    
    if (error) {
      console.error(error);
      if (error.code === '42703' || (error.message && error.message.includes('folder'))) {
        toast.error("데이터베이스에 'folder' 컬럼이 없습니다. Supabase 설정을 확인해주세요!");
      } else {
        toast.error('데이터 저장 실패');
      }
      pendingInsertsRef.current.delete(cleanText);
    } else {
      setTimeout(() => pendingInsertsRef.current.delete(cleanText), 3000);
    }

    // Resume scanner after delay
    setTimeout(() => {
      if (scannerRef.current && isScanning) scannerRef.current.resume();
    }, 1500);
  };

  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }
      
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        setCameras(devices);
        const rearCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('후면'));
        const camId = selectedCamera || rearCamera?.id || devices[0].id;
        setSelectedCamera(camId);
        
        await scannerRef.current.start(
          camId,
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          handleScan,
          () => {} // ignore scan failures
        );
        setIsScanning(true);
        
        // Setup Zoom if available
        setTimeout(() => {
          const videoEl = document.querySelector('#reader video');
          if (videoEl && videoEl.srcObject) {
            const track = videoEl.srcObject.getVideoTracks()[0];
            if (track) {
              videoTrackRef.current = track;
              const capabilities = track.getCapabilities ? track.getCapabilities() : null;
              if (capabilities && capabilities.zoom) {
                setMaxZoom(capabilities.zoom.max);
                setZoomLevel(track.getSettings().zoom || 1);
              }
            }
          }
        }, 500);

      } else {
        toast.error("카메라를 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error(err);
      toast.error("카메라를 시작할 수 없습니다. 권한을 확인해주세요.");
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && isScanning) {
      scannerRef.current.stop().then(() => {
        setIsScanning(false);
      }).catch(console.error);
    }
  };

  const handleZoomChange = (e) => {
    const newZoom = parseFloat(e.target.value);
    setZoomLevel(newZoom);
    if (videoTrackRef.current) {
      videoTrackRef.current.applyConstraints({
        advanced: [{ zoom: newZoom }]
      }).catch(console.warn);
    }
  };

  const exportExcel = () => {
    if (barcodes.length === 0) return toast.warning('내보낼 데이터가 없습니다.');
    const data = barcodes.map(item => ({
      '바코드': item.code,
      '메모': item.memo || '',
      '스캔시간': format(new Date(item.created_at || Date.now()), 'yyyy-MM-dd HH:mm:ss')
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    ws['!cols'] = [{wch:25}, {wch:30}, {wch:25}];
    XLSX.utils.book_append_sheet(wb, ws, "Scans");
    XLSX.writeFile(wb, `WebBarcode_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const handleDelete = async (id) => {
    if (confirm('삭제하시겠습니까?')) {
      const { error } = await supabase.from('barcodes').delete().eq('id', id);
      if (error) toast.error(error.message);
      else toast.success('삭제되었습니다.');
    }
  };

  const handleEditCode = async (id, currentCode) => {
    const newCode = prompt('바코드 번호 수정:', currentCode);
    if (newCode && newCode.trim() !== '' && newCode !== currentCode) {
      const { error } = await supabase.from('barcodes').update({ code: newCode.trim() }).eq('id', id);
      if (error) toast.error(error.message);
      else toast.success('수정되었습니다.');
    }
  };

  const handleEditMemo = async (id, currentMemo) => {
    const newMemo = prompt('메모 (비워두면 삭제):', currentMemo || '');
    if (newMemo !== null && newMemo !== currentMemo) {
      const { error } = await supabase.from('barcodes').update({ memo: newMemo.trim() }).eq('id', id);
      if (error) toast.error(error.message);
      else toast.success('메모가 저장되었습니다.');
    }
  };

  const handleAddFolder = () => {
    const newFolder = prompt('새 폴더 이름을 입력하세요\n(팁: "창고/A구역" 처럼 슬래시(/)를 넣으면 트리 구조로 관리됩니다):');
    if (newFolder && newFolder.trim() !== '') {
      const folderName = newFolder.trim();
      setCurrentFolder(folderName);
      setLocalFolders(prev => {
        const next = [...prev, folderName];
        localStorage.setItem('folders', JSON.stringify(next));
        return next;
      });
      toast.success(`'${folderName}' 폴더가 생성되었습니다.`);
    }
  };

  const handleDeleteFolder = (folderName) => {
    if (folderName === '기본폴더') return toast.error('기본 폴더는 삭제할 수 없습니다.');
    const hasBarcodes = barcodes.some(b => (b.folder || '기본폴더') === folderName);
    if (hasBarcodes) return toast.error('바코드가 들어있는 폴더는 삭제할 수 없습니다. 먼저 바코드를 지워주세요.');
    
    if (confirm(`'${folderName}' 폴더를 삭제하시겠습니까?`)) {
      setLocalFolders(prev => {
        const next = prev.filter(f => f !== folderName);
        localStorage.setItem('folders', JSON.stringify(next));
        return next;
      });
      if (currentFolder === folderName) setCurrentFolder('기본폴더');
      toast.success('폴더가 삭제되었습니다.');
    }
  };

  const handleDeleteAll = async () => {
    const codeConfirm = prompt('정말로 모든 바코드 스캔 기록을 삭제하시겠습니까?\n삭제를 원하시면 "삭제합니다"를 입력해주세요.');
    if (codeConfirm === '삭제합니다') {
      const { error } = await supabase.from('barcodes').delete().not('code', 'is', null);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('모든 스캔 기록이 삭제되었습니다.');
        setBarcodes([]);
      }
    } else if (codeConfirm !== null) {
      toast.warning('입력한 문구가 일치하지 않아 취소되었습니다.');
    }
  };

  const handleBackup = () => {
    if (barcodes.length === 0) return toast.warning('백업할 데이터가 없습니다.');
    const dataStr = JSON.stringify(barcodes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WebBarcode_Backup_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('백업 파일이 다운로드 되었습니다.');
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (!Array.isArray(importedData)) throw new Error('Invalid format');
        
        // Remove id and created_at if necessary to avoid conflicts, or just let Supabase handle it if we are restoring to an empty DB.
        // For safety, we'll strip 'id' so it generates new ones, and insert.
        const cleanData = importedData.map(item => ({
          code: item.code,
          memo: item.memo,
          folder: item.folder || '기본폴더',
          created_at: item.created_at || new Date().toISOString()
        }));

        const { error } = await supabase.from('barcodes').insert(cleanData);
        if (error) throw error;
        
        toast.success(`${cleanData.length}개의 데이터가 성공적으로 복원되었습니다.`);
        fetchBarcodes();
      } catch (err) {
        console.error(err);
        toast.error('복원 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset input
  };

  const handleShare = async (item) => {
    const timeStr = format(new Date(item.created_at || Date.now()), 'HH:mm:ss');
    let text = `[WebBarcode]\n바코드: ${item.code}\n시간: ${timeStr}`;
    if (item.memo) text += `\n메모: ${item.memo}`;
    text += `\n\n확인: ${window.location.origin}#${item.id}`;
    
    if (navigator.share) {
      try { await navigator.share({ text }); } catch (e) {}
    } else {
      navigator.clipboard.writeText(text);
      toast.success('복사되었습니다.');
    }
  };

  const filteredBarcodes = barcodes.filter(b => 
    b.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (b.memo && b.memo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <Toaster position="bottom-center" theme={darkMode ? 'dark' : 'light'} />

      {/* Header */}
      <header className="bg-white/90 dark:bg-darkCard/90 backdrop-blur-lg shadow-sm border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          
          {/* Top Row: Logo & Dark Mode */}
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary to-purple-500 text-white p-2 rounded-xl shadow-glow">
                <Barcode size={20} />
              </div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                WebBarcode 
                <a href={`https://github.com/LeeAn0121/WebBarcode/releases/tag/v${packageJson.version}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-primary hover:border-primary/50 text-[10px] px-1.5 py-0.5 rounded font-mono border border-slate-200 dark:border-slate-600 transition-colors" title="릴리즈 노트 보기">
                  <Github size={12}/> v{packageJson.version}
                </a>
              </h1>
            </div>
            
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="다크모드 전환">
              {darkMode ? <Sun size={20}/> : <Moon size={20}/>}
            </button>
          </div>
          
          {/* Bottom Row: Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-3 pt-1 md:pt-0 sm:gap-4 hide-scrollbar">
            <button onClick={() => setActiveTab('home')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'home' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-100' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 scale-95 hover:scale-100'}`}>
              <Home size={18}/> <span className="text-sm">스캐너 홈</span>
            </button>
            <button onClick={() => setActiveTab('folders')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'folders' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-100' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 scale-95 hover:scale-100'}`}>
              <Folder size={18}/> <span className="text-sm">폴더 관리</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-primary text-white shadow-md shadow-primary/20 scale-100' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 scale-95 hover:scale-100'}`}>
              <Database size={18}/> <span className="text-sm">데이터 설정</span>
            </button>
          </div>
          
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        
        {/* Tab: Home (Scanner & List) */}
        {activeTab === 'home' && (
          <div className="flex flex-col lg:flex-row gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="w-full lg:w-5/12 flex flex-col gap-4">
              <div className="bg-white dark:bg-darkCard rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden relative">
                <div className="p-4 border-b border-slate-50 dark:border-slate-700/50 flex justify-between items-center">
                  <h2 className="font-bold flex items-center gap-2"><Camera className="text-primary" size={20} /> 카메라 스캔</h2>
                  <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-primary rounded-full hover:bg-indigo-100 transition-colors">
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
                    <select value={selectedCamera} onChange={(e) => { setSelectedCamera(e.target.value); stopScanner(); setTimeout(startScanner, 100); }} className="mb-4 w-full max-w-xs p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium shadow-sm">
                      {cameras.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  )}

                  {maxZoom > 1 && isScanning && (
                    <div className="w-full max-w-xs flex items-center gap-3 mb-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <span className="text-xs font-bold text-slate-400">Zoom</span>
                      <input type="range" min="1" max={maxZoom} step="0.1" value={zoomLevel} onChange={handleZoomChange} className="flex-1 accent-primary" />
                    </div>
                  )}
                  
                  <div className="w-full relative rounded-2xl overflow-hidden bg-slate-900 min-h-[250px] sm:min-h-[300px]">
                    <div id="reader" className="w-full"></div>
                    <div id="reader-overlay" className="absolute inset-4 rounded-xl border-2 ring-4 ring-primary/50 border-dashed border-white/50 pointer-events-none transition-all duration-300"></div>
                    
                    {!isScanning && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900/90 z-10">
                        <Barcode size={48} className="opacity-30 mb-3" />
                        <p className="text-sm font-medium">카메라를 켜주세요</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="w-full lg:w-7/12 flex flex-col flex-1">
              <div className="bg-white dark:bg-darkCard rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col h-full min-h-[500px]">
                <div className="p-4 border-b border-slate-50 dark:border-slate-700/50">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                    <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                      <h2 className="font-bold flex items-center gap-2"><Barcode size={18}/> 스캔 기록</h2>
                      <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">{barcodes.filter(b => (b.folder || '기본폴더') === currentFolder).length}건</span>
                    </div>
                    
                    <div className="relative w-full sm:w-auto">
                      <select value={currentFolder} onChange={(e) => setCurrentFolder(e.target.value)} className="w-full sm:w-[160px] appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold px-4 py-2.5 pr-10 rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer shadow-sm">
                        {folders.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="바코드 번호 또는 메모 검색..." className="w-full bg-slate-50 dark:bg-slate-900/50 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl pl-11 p-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow" />
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
                          
                          <div className="flex flex-wrap items-center justify-end gap-1 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800 max-w-[140px] sm:max-w-none shrink-0">
                            <button onClick={() => { navigator.clipboard.writeText(item.code); toast.success('복사됨'); }} className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-white dark:hover:bg-slate-800" title="복사"><Copy size={16}/></button>
                            <button onClick={() => handleShare(item)} className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-white dark:hover:bg-slate-800" title="공유"><Share2 size={16}/></button>
                            <div className="hidden sm:block w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
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
                    
                    {filteredBarcodes.filter(b => (b.folder || '기본폴더') === currentFolder).length === 0 && (
                      <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                        <p className="text-sm">기록이 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Tab: Folders */}
        {activeTab === 'folders' && (
          <div className="bg-white dark:bg-darkCard rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-slate-50 dark:border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-900/30">
              <h2 className="font-bold flex items-center gap-2 text-xl"><Folder className="text-primary" size={24} /> 폴더 트리 관리</h2>
              <button onClick={handleAddFolder} className="w-full sm:w-auto bg-primary hover:bg-primaryHover text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-primary/20 transition-colors">
                <FolderPlus size={18}/> 새 폴더 생성하기
              </button>
            </div>
            
            <div className="flex-1 p-4 sm:p-6 flex flex-col gap-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30">💡 폴더 이름을 <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded text-primary font-bold shadow-sm">창고/1층/A구역</code> 처럼 지으면 자동으로 트리 구조로 관리됩니다.</p>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-2 sm:p-4 flex flex-col gap-2 flex-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {folders.map(f => {
                  const parts = f.split('/');
                  const depth = parts.length - 1;
                  const name = parts[parts.length - 1];
                  const barcodeCount = barcodes.filter(b => (b.folder || '기본폴더') === f).length;
                  return (
                    <div key={f} className="flex justify-between items-center hover:bg-white dark:hover:bg-darkCard p-3 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group" style={{ marginLeft: `${depth * 16}px` }}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Folder size={18} className="text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate" title={f}>{name}</span>
                        <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-primary font-bold px-2.5 py-1 rounded-lg whitespace-nowrap">{barcodeCount}개</span>
                      </div>
                      {f !== '기본폴더' && (
                        <button onClick={() => handleDeleteFolder(f)} className="text-slate-400 hover:text-red-500 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors shrink-0" title="폴더 삭제">
                          <Trash2 size={16}/>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-darkCard rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/30">
              <h2 className="font-bold flex items-center gap-2 text-xl"><Database className="text-primary" size={24} /> 데이터 및 시스템 설정</h2>
            </div>
            
            <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full flex flex-col gap-10">
              
              {/* 내보내기 영역 */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">데이터 백업 및 복원</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 text-blue-500">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-xl">
                        <DownloadCloud size={24} />
                      </div>
                      <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">JSON 백업</h4>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">현재 앱에 저장된 모든 바코드 데이터를 JSON 파일로 안전하게 다운로드합니다.</p>
                    <button onClick={handleBackup} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors shadow-sm">백업 파일 다운로드</button>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 text-indigo-500">
                      <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2.5 rounded-xl">
                        <UploadCloud size={24} />
                      </div>
                      <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">JSON 복원</h4>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">이전에 백업해 둔 JSON 파일을 업로드하여 데이터를 덮어쓰기 없이 복구합니다.</p>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-colors shadow-sm">백업 파일 업로드</button>
                    <input type="file" ref={fileInputRef} onChange={handleRestore} accept=".json" className="hidden" />
                  </div>
                </div>
              </section>

              {/* 엑셀 영역 */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">엑셀 출력</h3>
                <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-2xl border border-green-100 dark:border-green-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl text-green-600 dark:text-green-400 shrink-0">
                      <Download size={24}/>
                    </div>
                    <div>
                      <h4 className="font-bold text-green-700 dark:text-green-400 text-lg">Excel (.xlsx) 변환</h4>
                      <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1 leading-relaxed">스캔된 모든 기록을 엑셀 형식으로 추출합니다.</p>
                    </div>
                  </div>
                  <button onClick={exportExcel} className="w-full sm:w-auto shrink-0 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-sm">
                    엑셀 파일로 추출
                  </button>
                </div>
              </section>

              {/* 위험 구역 */}
              <section className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest border-b border-red-100 dark:border-red-900/30 pb-2 flex items-center gap-2"><AlertTriangle size={16}/> 위험 구역</h3>
                <div className="bg-red-50 dark:bg-red-900/10 p-5 sm:p-6 rounded-2xl border border-red-200 dark:border-red-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
                  <div>
                    <h4 className="font-bold text-red-600 dark:text-red-400 text-lg">모든 데이터 삭제</h4>
                    <p className="text-sm text-red-500/80 dark:text-red-400/80 mt-1 leading-relaxed">이 작업은 되돌릴 수 없습니다. 서버의 모든 데이터가 영구 삭제됩니다.</p>
                  </div>
                  <button onClick={handleDeleteAll} className="w-full sm:w-auto shrink-0 bg-white dark:bg-slate-800 border-2 border-red-500 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white font-bold py-3 px-6 rounded-xl transition-colors">
                    영구 삭제 진행
                  </button>
                </div>
              </section>

            </div>
          </div>
        )}

      </main>
    </>
  );
}
