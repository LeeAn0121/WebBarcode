import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Toaster, toast } from 'sonner';
import * as XLSX from 'xlsx';
import packageJson from '../package.json';
import { 
  IconBarcode, IconMoon, IconSun, IconDownload, IconCamera, IconVolume, IconVolume3, 
  IconSearch, IconCopy, IconShare, IconMessagePlus, IconEdit, IconTrash, IconClock,
  IconFolder, IconFolderPlus, IconCloudUpload, IconCloudDownload, IconSettings, IconX, IconAlertTriangle, IconMenu2, IconHome, IconDatabase, IconDotsVertical, IconRocket, IconRefresh, IconExternalLink
} from '@tabler/icons-react';
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


const Auth = ({ supabase }: { supabase: any }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || '구글 로그인에 실패했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 px-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden">
        {/* 장식용 배경 요소 */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
        
        <div className="flex justify-center mb-6 relative z-10">
          <div className="w-16 h-16 bg-white dark:bg-slate-700 rounded-2xl flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-600">
            <IconBarcode size={32} className="text-primary" />
          </div>
        </div>
        
        <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2 relative z-10 tracking-tight">
          WebBarcode
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 relative z-10">
          나만의 바코드 관리 공간에 접속하세요
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-white font-bold rounded-xl shadow-sm transition-all relative z-10 group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {loading ? '연결 중...' : 'Google 계정으로 계속하기'}
        </button>
      </div>
    </div>
  );
};



const formatsToSupport = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
];
function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches));
  const [barcodes, setBarcodes] = useState([]);
  const barcodesRef = useRef([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const lastScannedRef = useRef<{code: string, time: number} | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [currentFolder, setCurrentFolder] = useState('전체');
  const [activeTab, setActiveTab] = useState('home');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState<any>(null);
  const [moveModal, setMoveModal] = useState({ isOpen: false, item: null as any, targetFolder: '기본폴더' });
  const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', placeholder: '', value: '', type: 'text', description: '', confirmText: '확인', onConfirm: (val: string) => {} });
  const [session, setSession] = useState<any>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);
  const [updateInfo, setUpdateInfo] = useState(null);
  
  const [localFolders, setLocalFolders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('folders')) || []; }
    catch { return []; }
  });
  
  const scannerRef = useRef(null);
  const pendingInsertsRef = useRef(new Set());
  const videoTrackRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const fileInputRef = useRef(null);
  const currentFolderRef = useRef('전체');

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
    const checkUpdate = async () => {
      try {
        // Use raw.githubusercontent.com to completely bypass GitHub API rate limits (403 Forbidden)
        const res = await fetch('https://raw.githubusercontent.com/LeeAn0121/WebBarcode/master/package.json?t=' + new Date().getTime(), { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const currentVersion = packageJson.version;
        
        const isNewer = (oldV: string, newV: string) => {
          const a = oldV.split('.').map(Number);
          const b = newV.split('.').map(Number);
          for (let i = 0; i < 3; i++) {
            if (b[i] > a[i]) return true;
            if (b[i] < a[i]) return false;
          }
          return false;
        };
        
        if (data.version && isNewer(currentVersion, data.version)) {
          const firstSeenKey = `update_seen_v${data.version}`;
          let firstSeen = localStorage.getItem(firstSeenKey);
          
          if (!firstSeen) {
            firstSeen = new Date().getTime().toString();
            localStorage.setItem(firstSeenKey, firstSeen);
          }
          
          const now = new Date().getTime();
          const isReady = (now - parseInt(firstSeen)) > 90000; // Wait 1.5 minutes after first detection for GH Pages deploy
          
          if (isReady) {
            setUpdateInfo({
              version: `v${data.version}`,
              notes: "안정성 개선 및 새로운 기능이 추가된 최신 버전이 출시되었습니다.",
              url: `https://github.com/LeeAn0121/WebBarcode/releases/tag/v${data.version}`
            });
          }
        }
      } catch (err) {
        // silent
      }
    };
    
    checkUpdate();
    const intervalId = setInterval(checkUpdate, 300000); // Check every 5 minutes
    return () => clearInterval(intervalId);
  }, []);
  // 네이티브 스캐닝 엔진 보조 (초고속 하드웨어 가속)
  useEffect(() => {
    let nativeInterval: any;
    if (isScanning && 'BarcodeDetector' in window) {
      try {
        const detector = new (window as any).BarcodeDetector();
        let lastScannedTime = 0;
        nativeInterval = setInterval(async () => {
          // Prevent scanning if html5-qrcode is paused
          if (scannerRef.current && scannerRef.current.getState() !== 2) return;
          
          const now = Date.now();
          if (now - lastScannedTime < 1000) return; // 1 second throttle
          
          const video = document.querySelector('video');
          if (video && video.readyState >= 2) {
            try {
              const barcodes = await detector.detect(video);
              if (barcodes && barcodes.length > 0) {
                lastScannedTime = now;
                await handleScan(barcodes[0].rawValue);
              }
            } catch(e) {}
          }
        }, 150); // 150ms 마다 스캔 (매우 빠름)
      } catch(e) {}
    }
    return () => clearInterval(nativeInterval);
  }, [isScanning, barcodes]); // barcodes dependency needed so handleScan has latest state


  useEffect(() => {
    if (session?.user?.id) {
      fetchBarcodes();
    }

    const subscription = supabase
      .channel('public:barcodes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barcodes' }, payload => {
        // filter incoming payloads if needed, though RLS handles it.
        // If no RLS, we only accept if user_id matches session
        if (payload.new && payload.new.user_id && payload.new.user_id !== session?.user?.id) return;
        
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
  }, [session?.user?.id]);

  const fetchBarcodes = async () => {
    const { data, error } = await supabase.from('barcodes').select('*').eq('user_id', session?.user?.id).order('created_at', { ascending: false });
    if (!error && data) setBarcodes(data);
  };

  const handleScan = async (decodedText) => {
    const cleanText = decodedText.trim();
    
    // Pause the scanner completely to create a true delay between scans (only for live camera)
    if (true && scannerRef.current && scannerRef.current.getState() === 2) { // 2 = SCANNING
      scannerRef.current.pause(true); // true = pause scanning but keep video feed active
    }

    // Custom visual flash effect
    const readerEl = document.getElementById('reader-overlay');
    
    // Check duplicates per folder using ref to avoid stale closure
    const targetFolder = currentFolderRef.current === '전체' ? '기본폴더' : currentFolderRef.current;
    const isDuplicate = barcodesRef.current.some(b => b.code === cleanText && (b.folder || '기본폴더') === targetFolder) || pendingInsertsRef.current.has(cleanText);
    
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
      {
        setTimeout(() => {
          if (scannerRef.current && isScanning) scannerRef.current.resume();
        }, 1500);
      }
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

    const { error } = await supabase.from('barcodes').insert([{ code: cleanText, folder: targetFolder }]);
    
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
    {
      setTimeout(() => {
        if (scannerRef.current && isScanning) scannerRef.current.resume();
      }, 1500);
    }
  };

  const startScanner = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader", { formatsToSupport });
      }
      
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        // Filter out front cameras
        const rearDevices = devices.filter(d => {
          const lowerLabel = d.label.toLowerCase();
          return !lowerLabel.includes('front') && !lowerLabel.includes('전면');
        });
        
        // Use rear devices if found, otherwise fallback to all devices
        const availableCameras = rearDevices.length > 0 ? rearDevices : devices;
        setCameras(availableCameras);
        
        const rearCamera = availableCameras.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('후면'));
        const camId = selectedCamera || rearCamera?.id || availableCameras[0].id;
        setSelectedCamera(camId);
        
        try {
          await scannerRef.current.start(
            camId,
            { 
              fps: 15, 
              qrbox: { width: window.innerWidth < 400 ? 300 : 350, height: 120 },
              videoConstraints: {
                width: { min: 1280, ideal: 1920 },
                height: { min: 720, ideal: 1080 },
                advanced: [{ focusMode: "continuous" }]
              }
            },
            handleScan,
            () => {}
          );
        } catch (highResErr) {
          console.warn("고해상도/초점 강제 설정 실패, 일반 모드로 재시도합니다:", highResErr);
          await scannerRef.current.start(
            camId,
            { 
              fps: 10, 
              qrbox: { width: window.innerWidth < 400 ? 300 : 350, height: 120 }
            },
            handleScan,
            () => {}
          );
        }
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
    } catch (err: any) {
      console.error(err);
      let errMsg = "카메라를 시작할 수 없습니다. 브라우저 주소창 왼쪽의 자물쇠(🔒)를 눌러 권한을 재설정해주세요.";
      
      if (err.name === 'NotFoundError' || err.message?.includes('found')) {
        errMsg = "PC에 연결된 웹캠(카메라) 장치를 찾을 수 없습니다.";
      } else if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        errMsg = "카메라 권한이 차단되었습니다. 주소창의 자물쇠 아이콘을 눌러 권한을 허용해주세요.";
      } else if (!window.isSecureContext) {
        errMsg = "안전한 연결(HTTPS)이 아니어서 브라우저가 카메라 접근을 차단했습니다.";
      }
      
      const exactError = err.name ? `${err.name}: ${err.message}` : String(err);
      toast.error(`${errMsg} (상세: ${exactError})`, { duration: 10000 });
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

  
  const handleClone = async (item: any) => {
    try {
      const newItem = {
        code: item.code,
        memo: item.memo ? `${item.memo} (복제)` : '복제됨',
        folder: item.folder || '기본폴더',
        user_id: session?.user?.id,
        // created_at is handled by DB default
      };
      const { data, error } = await supabase.from('barcodes').insert([newItem]).select();
      if (error) throw error;
      if (data && data.length > 0) {
        setBarcodes(prev => [data[0], ...prev]);
        toast.success('바코드 복제 성공!');
      }
      setActiveActionMenu(null);
    } catch(e) {
      console.error(e);
      toast.error('바코드 복제에 실패했습니다.');
    }
  };

  const handleMoveFolderSubmit = async () => {
    if (!moveModal.item) return;
    try {
      const { error } = await supabase.from('barcodes').update({ folder: moveModal.targetFolder }).eq('id', moveModal.item.id);
      if (error) throw error;
      setBarcodes(prev => prev.map(b => b.id === moveModal.item.id ? { ...b, folder: moveModal.targetFolder } : b));
      toast.success('폴더 이동 완료!');
      setMoveModal({ isOpen: false, item: null, targetFolder: '기본폴더' });
      setActiveActionMenu(null);
    } catch(e) {
      console.error(e);
      toast.error('폴더 이동에 실패했습니다.');
    }
  };
const handleEditMemo = (id, currentMemo) => {
    setPromptModal({
      isOpen: true,
      title: '메모 추가/수정',
      description: '바코드에 대한 메모를 입력하세요. 비워두면 삭제됩니다.',
      placeholder: '예: 유통기한 2026-09-02',
      value: currentMemo || '',
      type: 'text',
      confirmText: '저장하기',
      onConfirm: async (newMemo) => {
        if (newMemo !== currentMemo) {
          const { error } = await supabase.from('barcodes').update({ memo: newMemo.trim() }).eq('id', id);
          if (error) toast.error(error.message);
          else toast.success('메모가 저장되었습니다.');
        }
      }
    });
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
    if (barcodes.length === 0 && localFolders.length === 0) return toast.warning('백업할 데이터가 없습니다.');
    const backupData = {
      version: 2,
      barcodes: barcodes,
      localFolders: localFolders
    };
    const dataStr = JSON.stringify(backupData, null, 2);
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
        const parsed = JSON.parse(event.target.result);
        let importedBarcodes = [];
        let importedFolders = [];

        if (Array.isArray(parsed)) {
          importedBarcodes = parsed;
        } else if (parsed.version >= 2) {
          importedBarcodes = parsed.barcodes || [];
          importedFolders = parsed.localFolders || [];
        } else {
          throw new Error('Invalid format');
        }
        
        const cleanData = importedBarcodes.map(item => ({
          code: item.code,
          memo: item.memo,
          folder: item.folder || '기본폴더',
          created_at: item.created_at || new Date().toISOString()
        }));

        if (cleanData.length > 0) {
          const { error } = await supabase.from('barcodes').insert(cleanData);
          if (error) throw error;
        }
        
        if (importedFolders.length > 0) {
          const mergedFolders = Array.from(new Set([...localFolders, ...importedFolders]));
          setLocalFolders(mergedFolders);
          localStorage.setItem('folders', JSON.stringify(mergedFolders));
        }

        toast.success(`${cleanData.length}개의 바코드 및 ${importedFolders.length}개의 폴더가 성공적으로 복원되었습니다.`);
        fetchBarcodes();
      } catch (err) {
        console.error(err);
        toast.error('복원 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
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

  const renderFormattedCode = (c) => {
    if (c && c.length === 17 && /^[a-zA-Z0-9]+$/.test(c)) {
      return (
        <span className="inline-flex items-center">
          <span>{c.substring(0, 11)}</span>
          <span className="text-slate-300 dark:text-slate-600 mx-1">-</span>
          <span className="text-primary">{c.substring(11)}</span>
        </span>
      );
    }
    return c;
  };

  
  if (!session) {
    return (
      <>
        <Toaster position="top-center" richColors />
        <Auth supabase={supabase} />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden text-slate-800 dark:text-slate-100">
      <Toaster position="bottom-center" theme={darkMode ? 'dark' : 'light'} />
      
      {/* Update Available Modal */}
      {updateInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"></div>
          <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 p-6 sm:p-8 max-w-sm w-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-purple-500 to-pink-500"></div>
            
            <div className="flex flex-col items-center text-center gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-full text-primary">
                <IconRocket size={40} className="animate-bounce" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">업데이트 가능</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">새로운 기능이 추가된 최신 버전이 출시되었습니다!</p>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 py-2.5 px-5 rounded-xl border border-slate-100 dark:border-slate-700 w-full justify-center">
                <span className="font-mono text-slate-400 line-through text-sm">v{packageJson.version}</span>
                <span className="text-slate-300">→</span>
                <span className="font-mono font-bold text-primary text-base">{updateInfo.version}</span>
              </div>

              <div className="flex flex-col w-full gap-2 mt-2">
                <button onClick={() => { window.location.href = window.location.pathname + '?v=' + updateInfo.version; }} className="w-full bg-primary hover:bg-primaryHover text-white font-bold py-3 rounded-lg text-sm transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2">
                  <IconRefresh size={18} /> 지금 새로고침
                </button>
                <a href={updateInfo.url} target="_blank" rel="noopener noreferrer" className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                  <IconExternalLink size={18} /> 릴리즈 노트 보기
                </a>
                <button onClick={() => setUpdateInfo(null)} className="w-full bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium py-2 rounded-lg text-sm transition-colors mt-1">
                  나중에 하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Desktop Sidebar (Left) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-darkCard border-r border-slate-200 dark:border-slate-800 z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-purple-500 text-white p-2 rounded-lg shadow-glow">
            <IconBarcode size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">WebBarcode</h1>
            <a href={`https://github.com/LeeAn0121/WebBarcode/releases/tag/v${packageJson.version}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-primary flex items-center gap-1 mt-0.5 transition-colors" title="릴리즈 노트 보기">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.18-.3 6.5-1.5 6.5-7.1 0-1.5-.5-2.8-1.4-3.8.1-.3.6-1.8-.1-3.8 0 0-1.2-.4-3.9 1.4a13 13 0 0 0-7 0C6 2.3 4.8 2.7 4.8 2.7.1 4.7.6 6.2.7 6.5.1 7.5-.4 8.8-.4 10.3c0 5.6 3.3 6.8 6.5 7.1-.8.8-1 2-1 3.2V22" /><path d="M9 22v-4a4.8 4.8 0 0 1 1-3.03" /></svg>
              v{packageJson.version}
            </a>
          </div>
        </div>
        
        <nav className="flex-1 px-4 flex flex-col gap-2 mt-2">
          <button onClick={() => setActiveTab('home')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'home' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <IconHome size={20} className={activeTab === 'home' ? 'animate-pulse' : ''} /> 스캐너 홈
          </button>
          <button onClick={() => setActiveTab('folders')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'folders' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <IconFolder size={20} className={activeTab === 'folders' ? 'animate-pulse' : ''} /> 폴더 관리
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'settings' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
            <IconDatabase size={20} className={activeTab === 'settings' ? 'animate-pulse' : ''} /> 데이터 설정
          </button>
        </nav>

        <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
          <button onClick={() => setDarkMode(!darkMode)} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            {darkMode ? <IconSun size={20}/> : <IconMoon size={20}/>}
            <span>{darkMode ? '라이트 모드' : '다크 모드'}</span>
          </button>
          
          {session?.user && (
            <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex items-center justify-between shadow-sm mt-1">
              <div className="flex items-center gap-3 overflow-hidden">
                <img 
                  src={session.user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp'} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 shrink-0 object-cover"
                />
                <div className="flex flex-col truncate">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
                    {session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0]}
                  </span>
                  <span className="text-xs text-slate-500 truncate mt-0.5">{session.user.email}</span>
                </div>
              </div>
              <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0 ml-2" title="로그아웃">
                <IconExternalLink size={18} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Layout Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Mobile Header (Top) */}
        <header className="md:hidden bg-white/90 dark:bg-darkCard/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-40 sticky top-0 px-4 py-3 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-primary to-purple-500 text-white p-1.5 rounded-lg shadow-glow">
              <IconBarcode size={18} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">WebBarcode</h1>
          </div>
          <div className="flex items-center gap-4">
            <a href={`https://github.com/LeeAn0121/WebBarcode/releases/tag/v${packageJson.version}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-primary transition-colors shrink-0 flex items-center gap-1.5 font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
              <svg className="shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.18-.3 6.5-1.5 6.5-7.1 0-1.5-.5-2.8-1.4-3.8.1-.3.6-1.8-.1-3.8 0 0-1.2-.4-3.9 1.4a13 13 0 0 0-7 0C6 2.3 4.8 2.7 4.8 2.7.1 4.7.6 6.2.7 6.5.1 7.5-.4 8.8-.4 10.3c0 5.6 3.3 6.8 6.5 7.1-.8.8-1 2-1 3.2V22" /><path d="M9 22v-4a4.8 4.8 0 0 1 1-3.03" /></svg>
              v{packageJson.version}
            </a>
            <button onClick={() => setDarkMode(!darkMode)} className="text-slate-500 hover:text-primary transition-colors shrink-0">
              {darkMode ? <IconSun size={20}/> : <IconMoon size={20}/>}
            </button>
            {session?.user && (
              <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="shrink-0 rounded-full border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm" title="로그아웃">
                <img 
                  src={session.user.user_metadata?.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp'} 
                  alt="Profile" 
                  className="w-7 h-7 object-cover"
                />
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto w-full h-full pb-32 md:pb-0">
            {/* Tab: Home (Scanner & List) */}
        {activeTab === 'home' && (
          <div className="flex flex-col lg:flex-row gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="w-full lg:w-5/12 flex flex-col gap-4">
              <div className="bg-white dark:bg-darkCard rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden relative">
                <div className="p-4 border-b border-slate-50 dark:border-slate-700/50 flex justify-between items-center">
                  <h2 className="font-bold flex items-center gap-2"><IconCamera className="text-primary" size={20} /> 카메라 스캔</h2>
                  <div className="flex gap-2">
                    <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-primary rounded-full hover:bg-indigo-100 transition-colors">
                      {isSoundEnabled ? <IconVolume size={16} /> : <IconVolume3 size={16} />}
                    </button>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col items-center">
                  {!isScanning ? (
                    <button onClick={startScanner} className="bg-primary hover:bg-primaryHover text-white py-3 px-6 rounded-2xl shadow-glow w-full max-w-xs flex justify-center items-center gap-2 mb-4 font-semibold">
                      <IconCamera size={18} /> 스캐너 켜기
                    </button>
                  ) : (
                    <button onClick={stopScanner} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 py-3 px-6 rounded-2xl w-full max-w-xs flex justify-center items-center gap-2 mb-4 font-medium transition-colors">
                      중지
                    </button>
                  )}

                  {cameras.length > 1 && isScanning && (
                    <select value={selectedCamera} onChange={(e) => { setSelectedCamera(e.target.value); stopScanner(); setTimeout(startScanner, 100); }} className="mb-4 w-full max-w-xs p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium shadow-sm">
                      {cameras.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  )}

                  {maxZoom > 1 && isScanning && (
                    <div className="w-full max-w-xs flex items-center gap-3 mb-4 bg-white dark:bg-slate-800 p-2.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 shadow-sm">
                      <span className="text-xs font-bold text-slate-400">Zoom</span>
                      <input type="range" min="1" max={maxZoom} step="0.1" value={zoomLevel} onChange={handleZoomChange} className="flex-1 accent-primary" />
                    </div>
                  )}
                  
                  <div className="w-full relative rounded-2xl overflow-hidden bg-slate-900 min-h-[250px] sm:min-h-[300px]">
                    
                    <div id="reader" className="w-full"></div>
                    <div id="reader-overlay" className="absolute inset-4 rounded-xl border-2 ring-4 ring-primary/50 border-dashed border-white/50 pointer-events-none transition-all duration-300"></div>
                    
                    {!isScanning && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900/90 z-10">
                        <IconBarcode size={48} className="opacity-30 mb-3" />
                        <p className="text-sm font-medium">카메라를 켜주세요</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="w-full lg:w-7/12 flex flex-col flex-1">
              <div className="bg-white dark:bg-darkCard rounded-3xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col lg:h-full lg:min-h-[500px]">
                <div className="p-4 border-b border-slate-50 dark:border-slate-700/50">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
                    <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                      <h2 className="font-bold flex items-center gap-2"><IconBarcode size={18}/> 스캔 기록</h2>
                      <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">{barcodes.filter(b => currentFolder === '전체' || (b.folder || '기본폴더') === currentFolder).length}건</span>
                    </div>
                    
                    <div className="relative w-full sm:w-auto">
                      <select value={currentFolder} onChange={(e) => setCurrentFolder(e.target.value)} className="w-full sm:w-[160px] appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold px-4 py-2.5 pr-10 rounded-xl text-primary focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer shadow-sm">
                        <option value="전체">전체 (All)</option>
                        {folders.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="바코드 번호 또는 메모 검색..." className="w-full bg-slate-50 dark:bg-slate-900/50 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl pl-11 p-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-shadow" />
                  </div>
                </div>
                
                <div className="flex-1 p-4 bg-slate-50/50 dark:bg-slate-900/30 overflow-visible lg:overflow-y-auto lg:custom-scrollbar">
                  <div className="space-y-3">
                    {filteredBarcodes.filter(b => currentFolder === '전체' || (b.folder || '기본폴더') === currentFolder).map(item => (
                      <div key={item.id} className="relative bg-white dark:bg-darkCard p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700/50 transition-all hover:shadow-sm flex items-center justify-between gap-3 group">
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <div className="h-8 w-8 shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-primary flex items-center justify-center transition-transform group-hover:scale-105">
                            <IconBarcode size={20} />
                          </div>
                          <div className="flex flex-col flex-1 overflow-hidden">
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-mono font-bold text-base text-slate-800 dark:text-slate-100 truncate">{renderFormattedCode(item.code)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs mt-0.5">
                              <span className="text-slate-400 flex items-center gap-1 shrink-0"><IconClock size={10}/> {format(new Date(item.created_at), 'HH:mm:ss')}</span>
                              {item.memo && (
                                <span className="truncate text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-700/50">
                                  {item.memo}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="shrink-0 relative">
                          <button 
                            onClick={() => setActiveActionMenu(activeActionMenu === item.id ? null : item.id)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="작업 메뉴 열기"
                          >
                            <IconDotsVertical size={20} />
                          </button>
                          
                          {activeActionMenu === item.id && (
                            <>
                              {/* Mobile-friendly Bottom Sheet / Desktop Modal */}
                              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4 transition-all" onClick={() => setActiveActionMenu(null)}>
                                <div className="bg-white dark:bg-slate-800 w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                                  <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto my-3 sm:hidden"></div>
                                  <div className="px-6 pb-2 pt-2 border-b border-slate-100 dark:border-slate-700 flex flex-col">
                                    <span className="font-mono font-bold text-lg text-slate-800 dark:text-slate-100 truncate">{item.code}</span>
                                    <span className="text-xs text-slate-500 mb-2">{item.folder || '기본폴더'}</span>
                                  </div>
                                  <div className="flex flex-col p-2 max-h-[70vh] overflow-y-auto">
                                    <button onClick={() => { navigator.clipboard.writeText(item.code); toast.success('복사됨'); setActiveActionMenu(null); }} className="flex items-center gap-3 w-full p-3.5 text-base sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"><IconCopy size={20} className="text-primary"/> 복사하기</button>
                                    <button onClick={() => handleShare(item)} className="flex items-center gap-3 w-full p-3.5 text-base sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"><IconShare size={20} className="text-primary"/> 외부로 공유</button>
                                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2"></div>
                                    <button onClick={() => { handleEditMemo(item.id, item.memo); setActiveActionMenu(null); }} className="flex items-center gap-3 w-full p-3.5 text-base sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"><IconMessagePlus size={20} className="text-blue-500"/> 메모 추가/수정</button>
                                    <button onClick={() => { setMoveModal({ isOpen: true, item, targetFolder: item.folder || '기본폴더' }); setActiveActionMenu(null); }} className="flex items-center gap-3 w-full p-3.5 text-base sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"><IconFolder size={20} className="text-emerald-500"/> 다른 폴더로 이동</button>
                                    <button onClick={() => handleClone(item)} className="flex items-center gap-3 w-full p-3.5 text-base sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"><IconCopy size={20} className="text-amber-500"/> 이 바코드 복제하기</button>
                                    <button onClick={() => { handleEditCode(item.id, item.code); setActiveActionMenu(null); }} className="flex items-center gap-3 w-full p-3.5 text-base sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors"><IconEdit size={20} className="text-slate-500"/> 바코드 번호 수정</button>
                                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-2"></div>
                                    <button onClick={() => { handleDelete(item.id); setActiveActionMenu(null); }} className="flex items-center gap-3 w-full p-3.5 text-base sm:text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"><IconTrash size={20}/> 삭제하기</button>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {filteredBarcodes.filter(b => currentFolder === '전체' || (b.folder || '기본폴더') === currentFolder).length === 0 && (
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
              <h2 className="font-bold flex items-center gap-2 text-xl"><IconFolder className="text-primary" size={24} /> 폴더 트리 관리</h2>
              <button onClick={handleAddFolder} className="w-full sm:w-auto bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg text-sm text-sm font-bold flex items-center justify-center gap-2 shadow-sm shadow-primary/20 transition-colors">
                <IconFolderPlus size={18}/> 새 폴더 생성하기
              </button>
            </div>
            
            <div className="flex-1 p-4 sm:p-6 flex flex-col gap-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg text-sm border border-blue-100 dark:border-blue-800/30">💡 폴더 이름을 <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded text-primary font-bold shadow-sm">창고/1층/A구역</code> 처럼 지으면 자동으로 트리 구조로 관리됩니다.</p>
              
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-2 sm:p-4 flex flex-col gap-2 flex-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {folders.map(f => {
                  const parts = f.split('/');
                  const depth = parts.length - 1;
                  const name = parts[parts.length - 1];
                  const barcodeCount = barcodes.filter(b => (b.folder || '기본폴더') === f).length;
                  return (
                    <div key={f} className="flex justify-between items-center hover:bg-white dark:hover:bg-darkCard p-2.5 rounded-lg text-sm transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group" style={{ marginLeft: `${depth * 16}px` }}>
                      <div className="flex items-center gap-3 overflow-hidden">
                        <IconFolder size={18} className="text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate" title={f}>{name}</span>
                        <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-primary font-bold px-2.5 py-1 rounded-lg whitespace-nowrap">{barcodeCount}개</span>
                      </div>
                      {f !== '기본폴더' && (
                        <button onClick={() => handleDeleteFolder(f)} className="text-slate-400 hover:text-red-500 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-900/30 p-2 rounded-lg transition-colors shrink-0" title="폴더 삭제">
                          <IconTrash size={16}/>
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
              <h2 className="font-bold flex items-center gap-2 text-xl"><IconDatabase className="text-primary" size={24} /> 데이터 및 시스템 설정</h2>
            </div>
            
            <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full flex flex-col gap-10">
              
              {/* 내보내기 영역 */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">데이터 백업 및 복원</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 text-blue-500">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                        <IconCloudDownload size={24} />
                      </div>
                      <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">JSON 백업</h4>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">현재 앱에 저장된 모든 바코드 데이터를 JSON 파일로 안전하게 다운로드합니다.</p>
                    <button onClick={handleBackup} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded-lg text-sm transition-colors shadow-sm">백업 파일 다운로드</button>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 text-indigo-500">
                      <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                        <IconCloudUpload size={24} />
                      </div>
                      <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">JSON 복원</h4>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">이전에 백업해 둔 JSON 파일을 업로드하여 데이터를 덮어쓰기 없이 복구합니다.</p>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 rounded-lg text-sm transition-colors shadow-sm">백업 파일 업로드</button>
                    <input type="file" ref={fileInputRef} onChange={handleRestore} accept=".json" className="hidden" />
                  </div>
                </div>
              </section>

              {/* 엑셀 영역 */}
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">엑셀 출력</h3>
                <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-2xl border border-green-100 dark:border-green-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-lg text-sm text-green-600 dark:text-green-400 shrink-0">
                      <IconDownload size={24}/>
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
                <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest border-b border-red-100 dark:border-red-900/30 pb-2 flex items-center gap-2"><IconAlertTriangle size={16}/> 위험 구역</h3>
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
          </div>
        </main>

        {/* Modals */}
        {promptModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPromptModal({ ...promptModal, isOpen: false })}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{promptModal.title}</h3>
              {promptModal.description && <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">{promptModal.description}</p>}
              <input 
                type={promptModal.type} 
                autoFocus
                value={promptModal.value}
                onChange={(e) => setPromptModal({ ...promptModal, value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    promptModal.onConfirm(promptModal.value);
                    setPromptModal({ ...promptModal, isOpen: false });
                  }
                }}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none mb-6"
                placeholder={promptModal.placeholder}
              />
              <div className="flex gap-3">
                <button onClick={() => setPromptModal({ ...promptModal, isOpen: false })} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors">취소</button>
                <button onClick={() => { promptModal.onConfirm(promptModal.value); setPromptModal({ ...promptModal, isOpen: false }); }} className="flex-1 py-3 bg-primary hover:bg-primaryHover text-white font-bold rounded-xl shadow-md transition-all">{promptModal.confirmText}</button>
              </div>
            </div>
          </div>
        )}

        {moveModal.isOpen && moveModal.item && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setMoveModal({ ...moveModal, isOpen: false })}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">폴더 이동</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">선택한 바코드를 이동할 폴더를 선택하세요.</p>
              
              <div className="relative mb-6">
                <select 
                  value={moveModal.targetFolder}
                  onChange={(e) => setMoveModal({ ...moveModal, targetFolder: e.target.value })}
                  className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 pr-10 text-sm font-medium focus:ring-2 focus:ring-primary outline-none text-slate-700 dark:text-slate-200"
                >
                  {folders.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <IconFolder size={18} />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setMoveModal({ ...moveModal, isOpen: false })} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors">취소</button>
                <button onClick={handleMoveFolderSubmit} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all">이동하기</button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden bg-white/95 dark:bg-darkCard/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 fixed bottom-0 left-0 right-0 z-50 pb-safe">
          <div className="flex justify-around items-center px-1 pt-1.5 pb-1">
            <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-0.5 p-1 w-14 transition-colors ${activeTab === 'home' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
              <div className={`p-1 rounded-full ${activeTab === 'home' ? 'bg-primary/10' : ''}`}><IconHome size={20} /></div>
              <span className="text-[10px] font-medium leading-none">홈</span>
            </button>
            <button onClick={() => setActiveTab('folders')} className={`flex flex-col items-center gap-0.5 p-1 w-14 transition-colors ${activeTab === 'folders' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
              <div className={`p-1 rounded-full ${activeTab === 'folders' ? 'bg-primary/10' : ''}`}><IconFolder size={20} /></div>
              <span className="text-[10px] font-medium leading-none">폴더</span>
            </button>
            <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-0.5 p-1 w-14 transition-colors ${activeTab === 'settings' ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
              <div className={`p-1 rounded-full ${activeTab === 'settings' ? 'bg-primary/10' : ''}`}><IconDatabase size={20} /></div>
              <span className="text-[10px] font-medium leading-none">설정</span>
            </button>
          </div>
        </nav>
        
      </div>
    </div>
  );
}

export default App;
