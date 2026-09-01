import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5Qrcode } from 'html5-qrcode';
import { Toaster, toast } from 'sonner';
import * as XLSX from 'xlsx';
import packageJson from '../package.json';
import { 
  Barcode, Moon, Sun, Download, Camera, Volume2, VolumeX, 
  Search, Copy, Share2, MessageSquarePlus, Edit3, Trash2, Clock
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
  
  const scannerRef = useRef(null);
  const pendingInsertsRef = useRef(new Set());
  const videoTrackRef = useRef(null);
  const lastScanTimeRef = useRef(0);

  // Sync state to ref for callbacks
  useEffect(() => {
    barcodesRef.current = barcodes;
  }, [barcodes]);

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
    
    // Check duplicates using ref to avoid stale closure
    const isDuplicate = barcodesRef.current.some(b => b.code === cleanText) || pendingInsertsRef.current.has(cleanText);
    
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

    const { error } = await supabase.from('barcodes').insert([{ code: cleanText }]);
    
    if (error) {
      console.error(error);
      toast.error('데이터 저장 실패');
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
      <header className="bg-white/80 dark:bg-darkCard/80 backdrop-blur-md shadow-sm border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-purple-500 text-white p-2 rounded-xl shadow-glow">
              <Barcode />
            </div>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                WebBarcode <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] px-1.5 py-0.5 rounded font-mono border border-slate-200 dark:border-slate-600">v{packageJson.version}</span>
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={exportExcel} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg hover:border-green-500 hover:text-green-500 transition-colors text-sm font-medium">
              <Download size={16} /> <span className="hidden sm:inline">엑셀</span>
            </button>
          </div>
        </div>
      </header>

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
                <h2 className="font-bold flex items-center gap-2">스캔 히스토리</h2>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">{barcodes.length}건</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="바코드 번호 또는 메모 검색..." className="w-full bg-slate-50 dark:bg-slate-900/50 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl pl-10 p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/30">
              <div className="space-y-3">
                {filteredBarcodes.map(item => (
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
