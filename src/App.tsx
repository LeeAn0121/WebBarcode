import React, { useState, useEffect, useRef } from 'react';
import { ReactSortable } from 'react-sortablejs';
import JsBarcode from 'jsbarcode';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Toaster, toast } from 'sonner';
import * as XLSX from 'xlsx';
import packageJson from '../package.json';
import {
  IconBarcode, IconMoon, IconSun, IconDownload, IconCamera, IconVolume, IconVolume3,
  IconSearch, IconCopy, IconScissors, IconShare, IconMessagePlus, IconEdit, IconTrash, IconClock,
  IconFolder, IconFolderPlus, IconCloudUpload, IconFileExport, IconFileImport, IconUpload, IconCloudDownload, IconSettings, IconX, IconAlertTriangle, IconMenu2, IconHome, IconDatabase, IconDotsVertical, IconRocket, IconRefresh, IconExternalLink, IconLink
, IconArrowUp, IconBell, IconBellX, IconFolderOpen , IconLayoutGrid, IconList, IconFolderFilled, IconChevronRight} from '@tabler/icons-react';
import { format } from 'date-fns';
import { supabase, logDebug, getDebugSessionId, isAdminEmail } from './supabaseClient';

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
    <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-black px-4 animate-in fade-in zoom-in-95 duration-500 ease-out">
      <div className="w-full max-w-sm bg-white dark:bg-[#111111] rounded-3xl shadow-xl p-8 border border-slate-100 dark:border-slate-700 text-center relative overflow-hidden">
        {/* 장식용 배경 요소 */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
        
        <div className="flex justify-center mb-6 relative z-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-600 overflow-hidden">
            <img src={`${import.meta.env.BASE_URL}icon.jpg`} alt="Logo" className="w-full h-full object-cover" />
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
          className="w-full flex items-center justify-center gap-3 py-3.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 text-slate-700 dark:text-white font-bold tracking-wide rounded-xl shadow-sm transition-all relative z-10 group"
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



const Splash = ({ fadingOut }: { fadingOut: boolean }) => {
  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f2f4f6] dark:bg-black transition-opacity duration-300 ease-out overflow-hidden ${fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="relative z-10 flex flex-col items-center justify-center gap-6">
        <div className="relative w-24 h-24 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.1)]">
          <img src={`${import.meta.env.BASE_URL}icon.jpg`} alt="" className="w-full h-full object-cover rounded-3xl relative z-10" />
          <div className="absolute inset-0 rounded-3xl bg-primary z-0 animate-ping opacity-50"></div>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-black dark:text-white">WebBarcode</h1>
        <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full w-[40%] bg-primary rounded-full animate-[loadBar_1.2s_ease-in-out_infinite]"></div>
        </div>
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
  
  const [autoRules, setAutoRules] = useState<{startsWith: string, targetFolder: string}[]>(() => {
    try { return JSON.parse(localStorage.getItem('autoRules') || '[]'); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('autoRules', JSON.stringify(autoRules)); }, [autoRules]);

    const [noticeHistory, setNoticeHistory] = useState<{id: string, message: string, date: string, read: boolean}[]>(() => {
    try { return JSON.parse(localStorage.getItem('noticeHistory') || '[]'); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('noticeHistory', JSON.stringify(noticeHistory)); }, [noticeHistory]);
  const unreadNoticeCount = noticeHistory.filter(n => !n.read).length;
  const [isNoticeHistoryOpen, setIsNoticeHistoryOpen] = useState(false);

  // Fetch Notices on load
  useEffect(() => {
    const fetchGlobalNotices = async () => {
      const { data, error } = await supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(50);
      if (!error && data) {
        setNoticeHistory(prev => {
          const prevMap = new Map(prev.map(p => [p.id, p]));
          return data.map(dbNotice => {
            const existing = prevMap.get(dbNotice.id);
            return {
              id: dbNotice.id,
              message: dbNotice.message,
              date: dbNotice.created_at,
              read: existing ? existing.read : false
            };
          });
        });
      }
    };
    fetchGlobalNotices();
  }, []);

  const [smartFilter, setSmartFilter] = useState<'all' | 'today' | 'yesterday' | 'hasMemo'>('all');
  
  // PC 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력창에 포커스가 있을 때는 단축키 무시
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') (document.activeElement as HTMLElement).blur();
        return;
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setActiveTab('home');
        setTimeout(() => document.getElementById('barcode-search')?.focus(), 100);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setActiveTab('folders');
        setTimeout(() => {
           // prompt is blocking, so just call the function if it was accessible, but since handleAddFolder is in scope, we can't easily trigger it unless we dispatch an event or bind it.
           // Actually, we can just dispatch a custom event.
           window.dispatchEvent(new CustomEvent('cmd-n-trigger'));
        }, 100);
      } else if (e.code === 'Space') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('cmd-space-trigger'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [enableSound, setEnableSound] = useState(() => {
    try { return JSON.parse(localStorage.getItem('enableSound') || 'true'); } catch { return true; }
  });
  useEffect(() => { localStorage.setItem('enableSound', JSON.stringify(enableSound)); }, [enableSound]);
  
  const [genModal, setGenModal] = useState({ isOpen: false, text: '' });
  
  const playBeep = () => {
    if (!enableSound) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
      osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
  };
  
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [barcodes, setBarcodes] = useState([]);
  const barcodesRef = useRef([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const lastScannedRef = useRef<{code: string, time: number}>({ code: '', time: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [facingMode, setFacingMode] = useState<'environment'|'user'>('environment');
  const [isSwitching, setIsSwitching] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('전체');
  const [activeTab, setActiveTab] = useState('home');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [activeActionMenu, setActiveActionMenu] = useState<any>(null);
  const [activeGlobalMenu, setActiveGlobalMenu] = useState<any>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const pressTimerRef = useRef<any>(null);
  const [moveModal, setMoveModal] = useState({ isOpen: false, ids: [] as string[], targetFolder: '기본폴더', type: 'barcode' as 'barcode' | 'folder', sourceFolder: '' });
  const [shareModal, setShareModal] = useState({ isOpen: false, url: '', title: '', description: '', shareText: '' });
  const [shareConfig, setShareConfig] = useState({ isOpen: false, type: '', folderName: '', item: null as any, expireHours: 1 });
  const [collabFolders, setCollabFolders] = useState<{owner_id: string, folder_name: string}[]>([]);
  const [loadingShare, setLoadingShare] = useState(false);
  const [folderActionModal, setFolderActionModal] = useState<string | null>(null);
  const [explorerPath, setExplorerPath] = useState<string>('');
  const [folderViewMode, setFolderViewMode] = useState<'grid' | 'list'>('list');
  const [folderOrder, setFolderOrder] = useState<string[]>(JSON.parse(localStorage.getItem('folderOrder') || '[]'));
  const [promptModal, setPromptModal] = useState({ isOpen: false, title: '', placeholder: '', value: '', type: 'text', description: '', confirmText: '확인', onConfirm: (val: string) => {} });
  const [session, setSession] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFadingOut, setSplashFadingOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);


  
  
  // 공지사항 & 브로드캐스트 채널 리스너
  useEffect(() => {
    // 알림 권한 요청
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const adminChannel = supabase.channel('wb-admin-actions').on('broadcast', { event: 'admin_command' }, async (payload) => {
      const { type, target_email, message, id: noticeId, date: noticeDate } = payload.payload;
      if (type === 'system_notice') {
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        // setSystemNotice({ isOpen: true, message }); // Removed modal popup
        setNoticeHistory(prev => [{id: noticeId || Math.random().toString(36).substring(2, 9), message, date: noticeDate || new Date().toISOString(), read: false}, ...prev].slice(0, 50));
        playSound('success', true);
        
        // 백그라운드이거나 최소화 상태일 때 시스템 알림 띄우기
        if ('Notification' in window && Notification.permission === 'granted') {
          if (document.hidden) {
            new Notification('시스템 공지사항', { body: message, icon: `${import.meta.env.BASE_URL}icon.jpg` });
          }
        }
      }
      if (type === 'force_kick' && session?.user?.email === target_email) {
        alert('관리자에 의해 강제 로그아웃 되었습니다.');
        await supabase.auth.signOut();
        window.location.reload();
      }
    }).subscribe();

    return () => { supabase.removeChannel(adminChannel); };
  }, [session?.user?.email]);


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthChecked(true);
      if (session?.user?.email) {
        isAdminEmail(session.user.email).then(setIsAdmin);
      } else {
        setIsAdmin(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.email) {
        isAdminEmail(session.user.email).then(setIsAdmin);
      } else {
        setIsAdmin(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // 스플래시: 인증 확인 완료 시 최소 노출시간(스캔 연출) 확보 후 페이드아웃 & 언마운트
  useEffect(() => {
    if (!authChecked) return;
    const fadeTimer = setTimeout(() => setSplashFadingOut(true), 400);
    const hideTimer = setTimeout(() => setSplashVisible(false), 700);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, [authChecked]);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [latestVersion, setLatestVersion] = useState(packageJson.version);
  
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
  const folders = Array.from(new Set(['기본폴더', ...localFolders, ...barcodes.map(b => b.folder).filter(Boolean)]));
  folders.sort((a, b) => {
    const idxA = folderOrder.indexOf(a);
    const idxB = folderOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

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

  // ESC 키로 열려있는 모달/시트/선택모드 닫기 (키보드 접근성)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (promptModal.isOpen) setPromptModal(prev => ({ ...prev, isOpen: false }));
      else if (shareConfig.isOpen) setShareConfig(prev => ({ ...prev, isOpen: false }));
      else if (shareModal.isOpen) setShareModal({ isOpen: false, url: '', title: '', description: '', shareText: '' });
      else if (moveModal.isOpen) setMoveModal(prev => ({ ...prev, isOpen: false }));
      else if (activeActionMenu !== null) {setActiveActionMenu(null); setActiveGlobalMenu(null);}
      else if (isSelectionMode) { setIsSelectionMode(false); setSelectedIds([]); }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [promptModal.isOpen, shareConfig.isOpen, shareModal.isOpen, moveModal.isOpen, activeActionMenu, isSelectionMode]);

  // Supabase Realtime & Fetch
  useEffect(() => {
    const checkUpdate = async () => {
      try {
        // Use raw.githubusercontent.com to completely bypass GitHub API rate limits (403 Forbidden)
        const res = await fetch('https://raw.githubusercontent.com/LeeAn0121/WebBarcode/master/package.json?t=' + new Date().getTime(), { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const currentVersion = packageJson.version;
        if (data.version) {
          setLatestVersion(data.version);
        }
        
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
  // html5-qrcode가 이미 안정적으로 디코딩하므로 중복 디코딩을 유발하던
  // native BarcodeDetector 병행 실행은 제거함 (에러 노이즈 + 중복 handleScan 원인)


  useEffect(() => {
    if (session?.user?.id) {
      fetchBarcodes();
      fetchCollabFolders();
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

  // 관리자 페이지(/admin)에서 실시간 접속자 파악용 presence
  useEffect(() => {
    const channel = supabase.channel('wb-presence', {
      config: { presence: { key: getDebugSessionId() } },
    });
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          session_id: getDebugSessionId(),
          user_agent: navigator.userAgent,
          path: window.location.pathname,
          email: session?.user?.email || null,
          online_at: new Date().toISOString(),
        });
      }
    });
    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.email]);


  const fetchCollabFolders = async () => {
    if (!session?.user?.id) return;
    const { data } = await supabase.from('folder_guests').select('owner_id, folder_name').eq('guest_id', session.user.id);
    if (data) setCollabFolders(data);
  };

  const fetchBarcodes = async () => {
    const { data, error } = await supabase.from('barcodes').select('*').eq('user_id', session?.user?.id).order('created_at', { ascending: false });
    if (!error && data) setBarcodes(data);
  };

  const handleScan = async (decodedText) => {
    try {
      await handleScanInner(decodedText);
    } catch (e: any) {
      console.error(e);
      logDebug('error', 'handleScan 예외', { error: e?.message, stack: e?.stack });
    }
  };

  const handleScanInner = async (decodedText) => {
    const cleanText = decodedText.trim();
    const now = Date.now();
    logDebug('info', '스캔 디코딩 성공', { code: cleanText });

    // 쿨다운(Debounce): 같은 바코드는 3초, 다른 바코드라도 1초 쿨다운을 적용해 연속 스캔 폭주 방지
    const isSameCode = lastScannedRef.current.code === cleanText;
    const cooldownPeriod = isSameCode ? 3000 : 1000;
    
    if (now - lastScannedRef.current.time < cooldownPeriod) {
      return; // 쿨다운 중 무시 (멈춤 없이 스무스하게 넘어감)
    }
    
    lastScannedRef.current = { code: cleanText, time: now };
    


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

    const { error } = await supabase.from('barcodes').insert([{ code: cleanText, folder: targetFolder, user_id: session?.user?.id }]);

    if (error) {
      console.error(error);
      logDebug('error', '바코드 저장 실패', { code: cleanText, errorCode: error.code, errorMsg: error.message });
      if (error.code === '42703' || (error.message && error.message.includes('folder'))) {
        toast.error("데이터베이스에 'folder' 컬럼이 없습니다. Supabase 설정을 확인해주세요!");
      } else {
        toast.error('데이터 저장 실패');
      }
      pendingInsertsRef.current.delete(cleanText);
    } else {
      logDebug('info', '바코드 저장 성공', { code: cleanText });
      setTimeout(() => pendingInsertsRef.current.delete(cleanText), 3000);
    }


  };

  const startScanner = async (requestedFacingMode?: 'environment' | 'user') => {
    try {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (permErr: any) {
        console.warn("명시적 권한 요청 실패:", permErr);
        if (permErr.name === 'NotAllowedError') {
           throw permErr;
        }
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader", { formatsToSupport });
      }
      
      const targetFacingMode = requestedFacingMode || facingMode;
      
      try {
        await scannerRef.current.start(
          { facingMode: targetFacingMode },
          {
            fps: 30,
            qrbox: (w, h) => {
              const minDim = Math.min(w, h);
              const size = Math.min(280, minDim * 0.75);
              return { width: size, height: size };
            },
            aspectRatio: 1.0,
            disableFlip: false,
          },
          handleScanInner,
          () => {}
        );
        
        setIsScanning(true);
        setFacingMode(targetFacingMode);
        logDebug('info', '카메라 시작 성공', { facingMode: targetFacingMode });
      } catch (err: any) {
        console.warn(`${targetFacingMode} 카메라 시작 실패:`, err);
        throw err;
      }
      
      // Setup Zoom if available
      setTimeout(() => {
        const videoEl = document.querySelector('#reader video') as HTMLVideoElement;
        if (videoEl && videoEl.srcObject) {
          const stream = videoEl.srcObject as MediaStream;
          const track = stream.getVideoTracks()[0];
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

    } catch (err: any) {
      console.error(err);
      const errName = err?.name || "UnknownError";
      const errMsgTxt = err?.message || "";
      let toastMsg = `카메라 시작 실패 (${errName})`;
      
      if (errName === 'NotAllowedError' || errMsgTxt.includes('Permission') || errName === 'NotSupportedError') {
        toastMsg = "카메라 권한이 거부/차단 상태입니다. 브라우저 주소창 왼쪽의 🔒자물쇠(또는 ⓘ 아이콘)를 눌러 카메라 권한을 '허용'으로 변경 후 새로고침 해주세요!";
      } else if (errName === 'NotReadableError' || errMsgTxt.includes('in use')) {
        toastMsg = "카메라가 이미 다른 앱이나 탭에서 사용 중입니다. 백그라운드 앱을 종료해주세요.";
      } else if (errName === 'TypeError') {
        toastMsg = `지원하지 않는 브라우저이거나 시스템 오류입니다. (${errMsgTxt})`;
      }
      
      toast.error(toastMsg);
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
    const listToExport = currentFolder === '전체' ? barcodes : barcodes.filter(b => (b.folder || '기본폴더') === currentFolder);
    if (listToExport.length === 0) return toast.warning('내보낼 데이터가 없습니다.');
    const data = listToExport.map(item => ({
      '바코드': item.code,
      '메모': item.memo || '',
      '스캔시간': format(new Date(item.created_at || Date.now()), 'yyyy-MM-dd HH:mm:ss'),
      '폴더': item.folder || '기본폴더'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    ws['!cols'] = [{wch:25}, {wch:30}, {wch:25}];
    XLSX.utils.book_append_sheet(wb, ws, "Scans");
    XLSX.writeFile(wb, `WebBarcode_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const handleMultiDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`선택한 ${selectedIds.length}개의 바코드를 정말 삭제하시겠습니까?`)) {
      const { error } = await supabase.from('barcodes').delete().in('id', selectedIds);
      if (error) {
        toast.error('삭제 실패: ' + error.message);
      } else {
        toast.success(`${selectedIds.length}개가 삭제되었습니다.`);
        setIsSelectionMode(false);
        setSelectedIds([]);
      }
    }
  };

  const handlePointerDown = (id: string) => {
    if (isSelectionMode) return;
    pressTimerRef.current = setTimeout(() => {
      setIsSelectionMode(true); setSelectedIds([id]); triggerHaptic('medium');
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500); // 500ms long press
  };

  const handlePointerUp = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  const handleItemClick = (id: string, originalUrl: string, e: React.MouseEvent) => {
    if (isSelectionMode || e.ctrlKey || e.metaKey || e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); triggerHaptic('light');
    } else {
      // Normal click behavior (if any) - originally they could click to open links if memo has link
    }
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
      {setActiveActionMenu(null); setActiveGlobalMenu(null);}
    } catch(e) {
      console.error(e);
      toast.error('바코드 복제에 실패했습니다.');
    }
  };


  
  const handleReceiveInvite = async (inviteId: string) => {
    setLoadingShare(true);
    try {
      const { data: invite, error } = await supabase.from('folder_invites').select('*').eq('id', inviteId).single();
      if (error || !invite) throw new Error('유효하지 않거나 만료된 초대입니다.');
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) throw new Error('기간이 만료된 초대 링크입니다.');
      
      if (invite.owner_id === session?.user?.id) {
        throw new Error('내 자신의 폴더에는 이미 권한이 있습니다.');
      }

      const confirm = window.confirm(`'${invite.folder_name}' 폴더의 실시간 협업에 참여하시겠습니까?\n(참여 후 나와 상대방이 스캔하는 바코드가 실시간으로 공유됩니다)`);
      if (!confirm) return;

      const { error: joinErr } = await supabase.from('folder_guests').insert({
        owner_id: invite.owner_id,
        folder_name: invite.folder_name,
        guest_id: session?.user?.id
      });
      
      // Ignore unique constraint error if already joined
      if (joinErr && !joinErr.message.includes('unique constraint')) throw joinErr;

      toast.success('협업 폴더에 성공적으로 참여했습니다!');
      
      if (!folders.includes(invite.folder_name)) {
        const updated = [...folders, invite.folder_name];
        setLocalFolders(updated);
        localStorage.setItem('folders', JSON.stringify(updated));
      }
      
      fetchCollabFolders();
      fetchBarcodes();
    } catch(e: any) {
      toast.error(e.message || '초대 수락 실패');
    } finally {
      window.location.hash = '';
      setLoadingShare(false);
    }
  };

  const handleCreateInvite = (folderName: string) => {
    if (!session?.user?.id) return toast.error('로그인이 필요합니다.');
    setShareConfig({ isOpen: true, type: 'invite', folderName, item: null, expireHours: 1 });
  };

  
  const processShareConfig = async () => {
    setLoadingShare(true);
    const expires_at = new Date(Date.now() + shareConfig.expireHours * 60 * 60 * 1000).toISOString();
    
    try {
      if (shareConfig.type === 'invite') {
        const { data, error } = await supabase.from('folder_invites').insert({
          owner_id: session.user.id,
          folder_name: shareConfig.folderName,
          expires_at
        }).select('id').single();
        if (error) throw error;

        const inviteUrl = `${window.location.origin}${window.location.pathname}#invite=${data.id}`;
        const shareText = `📦 [WebBarcode] 실시간 협업 초대 도착!\n\n📂 대상 폴더: '${shareConfig.folderName}'\n⏳ 만료: ${shareConfig.expireHours}시간 후\n\n아래 링크나 첨부된 QR을 열어 실시간으로 함께 작업하세요!\n👉 ${inviteUrl}`;
        
        setShareModal({
          isOpen: true,
          url: inviteUrl,
          title: `'${shareConfig.folderName}' 협업 초대`,
          description: `만료시간: ${shareConfig.expireHours}시간 후\n이 QR/링크를 동료가 스캔하면 폴더를 실시간으로 공유합니다.`,
          shareText
        });
      } else {
        const isFolder = shareConfig.type === 'share_folder';
        const items = isFolder 
          ? barcodes.filter(b => (b.folder || '기본폴더') === shareConfig.folderName)
          : [shareConfig.item];
        
        const payload = items.map(item => ({ code: item.code, memo: item.memo }));
        const { data, error } = await supabase.from('shared_links').insert([{
          owner_id: session.user.id,
          folder_name: isFolder ? shareConfig.folderName : '단일 바코드',
          barcodes_data: payload,
          expires_at
        }]).select('id').single();
        if (error) throw error;

        const shareUrl = `${window.location.origin}${window.location.pathname}#share=${data.id}`;
        
        let shareText = `📦 [WebBarcode] 공유 데이터 도착!\n`;
        if (!isFolder && shareConfig.item) {
           const item = shareConfig.item;
           const timeStr = format(new Date(item.created_at || Date.now()), 'HH:mm:ss');
           shareText += `\n📌 바코드: ${item.code}`;
           shareText += `\n⏰ 스캔시간: ${timeStr}`;
           if (item.memo) shareText += `\n📝 메모: ${item.memo}`;
        } else {
           shareText += `\n📂 항목: '${shareConfig.folderName}' 폴더 (${items.length}개)`;
        }
        shareText += `\n⏳ 만료: ${shareConfig.expireHours}시간 후\n\n👉 확인 링크: ${shareUrl}`;

        setShareModal({ 
          isOpen: true, 
          url: shareUrl, 
          title: isFolder ? `'${shareConfig.folderName}' 폴더 공유` : '바코드 공유하기', 
          description: `만료시간: ${shareConfig.expireHours}시간 후\n데이터를 복사하여 전달합니다.`,
          shareText
        });
      }
      setShareConfig({ ...shareConfig, isOpen: false });
    } catch(e) {
      toast.error('링크 생성 실패. (expires_at 컬럼을 추가하는 SQL을 실행하셨나요?)');
    } finally {
      setLoadingShare(false);
    }
  };


  const handleReceiveShare = async (shareId: string) => {
    setLoadingShare(true);
    try {
      const { data, error } = await supabase.from('shared_links').select('*').eq('id', shareId).single();
      if (error || !data) throw new Error('유효하지 않거나 만료된 링크입니다.');
      if (data.expires_at && new Date(data.expires_at) < new Date()) throw new Error('기간이 만료된 공유 링크입니다.');
      
      const confirm = window.confirm(`'${data.folder_name}' 폴더와 ${data.barcodes_data.length}개의 바코드를 내 계정으로 가져오시겠습니까?\n(이미 등록된 동일한 바코드는 제외됩니다)`);
      if (!confirm) {
        window.location.hash = '';
        return;
      }

      // Check existing to avoid duplicates
      const existingCodes = new Set(barcodesRef.current.map(b => b.code));
      const inserts = data.barcodes_data
        .filter((b: any) => !existingCodes.has(b.code))
        .map((b: any) => ({
          code: b.code,
          memo: b.memo,
          folder: data.folder_name,
          user_id: session?.user?.id
        }));

      if (inserts.length === 0) {
        toast.error('모두 이미 존재하는 바코드입니다.');
      } else {
        const { error: insertErr } = await supabase.from('barcodes').insert(inserts);
        if (insertErr) throw insertErr;
        
        toast.success(`${inserts.length}개의 바코드를 성공적으로 가져왔습니다!`);
        
        if (!folders.includes(data.folder_name)) {
           const updatedFolders = [...folders, data.folder_name];
           setLocalFolders(updatedFolders);
           localStorage.setItem('folders', JSON.stringify(updatedFolders));
        }
        
        fetchBarcodes();
      }
    } catch(e: any) {
      toast.error(e.message || '가져오기 실패');
    } finally {
      window.location.hash = '';
      setLoadingShare(false);
    }
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#share=') && session?.user?.id && !loadingShare) {
       const shareId = hash.replace('#share=', '');
       handleReceiveShare(shareId);
    } else if (hash.startsWith('#invite=') && session?.user?.id && !loadingShare) {
       const inviteId = hash.replace('#invite=', '');
       handleReceiveInvite(inviteId);
    }
  }, [session, window.location.hash]);

  const handleShareFolder = (folderName: string) => {
    if (!session?.user?.id) return toast.error('로그인이 필요합니다.');
    const items = barcodes.filter(b => (b.folder || '기본폴더') === folderName);
    if (items.length === 0) return toast.error('빈 폴더는 공유할 수 없습니다.');
    setShareConfig({ isOpen: true, type: 'share_folder', folderName, item: null, expireHours: 1 });
  };

  const handleMoveFolderSubmit = async () => {
    try {
      if (moveModal.type === 'barcode') {
        if (moveModal.ids.length === 0) return;
        const { error } = await supabase.from('barcodes').update({ folder: moveModal.targetFolder }).in('id', moveModal.ids);
        if (error) throw error;
        setBarcodes(prev => prev.map(b => moveModal.ids.includes(b.id) ? { ...b, folder: moveModal.targetFolder } : b));
        toast.success(`${moveModal.ids.length}개 항목 이동 완료!`);
      } else if (moveModal.type === 'folder') {
        const oldName = moveModal.sourceFolder;
        const newName = moveModal.targetFolder === '기본폴더' ? oldName.split('/').pop()! : `${moveModal.targetFolder}/${oldName.split('/').pop()}`;
        
        if (oldName === newName) {
          setMoveModal(prev => ({ ...prev, isOpen: false }));
          return;
        }

        const oldPrefix = oldName + '/';
        const newPrefix = newName + '/';
        
        // 1. DB 업데이트
        const barcodesToUpdate = barcodes.filter(b => {
          const f = b.folder || '기본폴더';
          return f === oldName || f.startsWith(oldPrefix);
        });
        
        if (barcodesToUpdate.length > 0) {
          const uniqueFolders = Array.from(new Set(barcodesToUpdate.map(b => b.folder || '기본폴더')));
          for (const f of uniqueFolders) {
            const updatedF = f === oldName ? newName : f.replace(oldPrefix, newPrefix);
            const ids = barcodesToUpdate.filter(b => (b.folder || '기본폴더') === f).map(b => b.id);
            const { error } = await supabase.from('barcodes').update({ folder: updatedF }).in('id', ids);
            if (error) throw error;
          }
        }
        
        // 2. 상태 업데이트
        setLocalFolders(prev => {
          const next = prev.map(f => {
            if (f === oldName) return newName;
            if (f.startsWith(oldPrefix)) return f.replace(oldPrefix, newPrefix);
            return f;
          });
          if (!next.includes(newName)) next.push(newName);
          const uniqueNext = Array.from(new Set(next));
          localStorage.setItem('folders', JSON.stringify(uniqueNext));
          return uniqueNext;
        });
        
        setBarcodes(prev => prev.map(b => {
          const f = b.folder || '기본폴더';
          if (f === oldName) return { ...b, folder: newName };
          if (f.startsWith(oldPrefix)) return { ...b, folder: f.replace(oldPrefix, newPrefix) };
          return b;
        }));
        
        setFolderOrder(prev => {
          const next = prev.map(f => {
            if (f === oldName) return newName;
            if (f.startsWith(oldPrefix)) return f.replace(oldPrefix, newPrefix);
            return f;
          });
          localStorage.setItem('folderOrder', JSON.stringify(next));
          return next;
        });

        if (currentFolder === oldName) setCurrentFolder(newName);
        if (explorerPath === oldName) setExplorerPath(newName);
        else if (explorerPath.startsWith(oldPrefix)) setExplorerPath(explorerPath.replace(oldPrefix, newPrefix));
        
        toast.success('폴더 위치가 이동되었습니다.');
      }
      
      setMoveModal(prev => ({ ...prev, isOpen: false }));
      {setActiveActionMenu(null); setActiveGlobalMenu(null);}
      setIsSelectionMode(false);
      setSelectedIds([]);
    } catch(e: any) {
      console.error(e);
      toast.error('이동에 실패했습니다: ' + e.message);
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

  
  const handleMoveOrder = (folder: string, direction: 'up' | 'down') => {
    setFolderOrder(prev => {
      // Initialize if empty
      let currentOrder = [...prev];
      if (currentOrder.length === 0) currentOrder = [...folders];
      
      const idx = currentOrder.indexOf(folder);
      if (idx === -1) return currentOrder;
      
      if (direction === 'up' && idx > 0) {
        [currentOrder[idx - 1], currentOrder[idx]] = [currentOrder[idx], currentOrder[idx - 1]];
      } else if (direction === 'down' && idx < currentOrder.length - 1) {
        [currentOrder[idx + 1], currentOrder[idx]] = [currentOrder[idx], currentOrder[idx + 1]];
      }
      
      localStorage.setItem('folderOrder', JSON.stringify(currentOrder));
      return currentOrder;
    });
  };

  const handleRenameFolder = async (oldName: string) => {
    if (oldName === '기본폴더') return toast.error('기본 폴더는 이름 변경이 불가능합니다.');
    const baseName = oldName.split('/').pop() || oldName;
    const newBaseName = prompt(`'${baseName}' 폴더의 새 이름을 입력하세요:`, baseName);
    if (!newBaseName || newBaseName === baseName) return;
    
    // Construct new full path
    const parts = oldName.split('/');
    parts.pop();
    parts.push(newBaseName.trim().replace(/\//g, ''));
    const newName = parts.join('/');
    
    if (newName === oldName) return;
    if (!newName || newName === oldName) return;
    
    try {
      // 1. DB 바코드 업데이트
      const barcodesToUpdate = barcodes.filter(b => (b.folder || '기본폴더') === oldName);
      if (barcodesToUpdate.length > 0) {
        const ids = barcodesToUpdate.map(b => b.id);
        const { error } = await supabase.from('barcodes').update({ folder: newName }).in('id', ids);
        if (error) throw error;
      }
      
      // 2. 폴더 목록 업데이트
      setLocalFolders(prev => {
        const next = prev.filter(f => f !== oldName && f !== newName);
        next.push(newName);
        localStorage.setItem('folders', JSON.stringify(next));
        return next;
      });
      
      // 3. 현재 뷰 업데이트
      setBarcodes(prev => prev.map(b => (b.folder || '기본폴더') === oldName ? { ...b, folder: newName } : b));
      if (currentFolder === oldName) setCurrentFolder(newName);
      toast.success('폴더 이름이 변경되었습니다.');
    } catch(err) {
      toast.error('폴더 이름 변경 중 오류가 발생했습니다.');
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

        toast.success(`${cleanData.length}개의 바코드 및 ${importedFolders.length}개의 폴더가 성공적으로 복원되었습니다.`); triggerHaptic('success');
        fetchBarcodes();
      } catch (err) {
        console.error(err);
        toast.error('복원 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleShare = (item) => {
    if (!session?.user?.id) return toast.error('로그인이 필요합니다.');
    setShareConfig({ isOpen: true, type: 'share_item', folderName: '', item, expireHours: 1 });
    {setActiveActionMenu(null); setActiveGlobalMenu(null);}
  };

  const filteredBarcodes = barcodes.filter(b => 
    b.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (b.memo && b.memo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderFormattedCode = (c) => {
    if (!c) return '';
    if (c.length >= 8 && /^[a-zA-Z0-9]+$/.test(c)) {
      const prefix = c.substring(0, c.length - 6);
      const suffix = c.substring(c.length - 6);
      return (
        <span className="font-mono tracking-tight">
          <span className="text-slate-400 dark:text-slate-500 font-medium">{prefix}</span>
          {prefix && <span className="text-slate-300 dark:text-slate-600 mx-1">-</span>}
          <span className="text-primary dark:text-[#3182f6] font-extrabold">{suffix}</span>
        </span>
      );
    }
    return <span className="font-mono font-bold">{c}</span>;
  };

  
  if (!session) {
    return (
      <>
        <Toaster position="top-center" richColors />
        {splashVisible && <Splash fadingOut={splashFadingOut} />}
        <Auth supabase={supabase} />
      </>
    );
  }

  return (
    <div className="flex h-[100svh] bg-slate-100 dark:bg-[#050505] overflow-hidden text-slate-800 dark:text-slate-100 justify-center md:p-6 lg:p-8">
      {splashVisible && <Splash fadingOut={splashFadingOut} />}
      <Toaster position="bottom-center" theme={darkMode ? 'dark' : 'light'} />
      
      {/* Update Available Modal */}
      {updateInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="업데이트 알림">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 ease-out"></div>
          <div className="relative bg-white dark:bg-[#111111] rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 p-6 sm:p-8 max-w-sm w-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-purple-500 to-pink-500"></div>
            
            <div className="flex flex-col items-center text-center gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-full text-primary">
                <IconRocket size={40} className="animate-bounce" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold tracking-wide text-slate-800 dark:text-slate-100 mb-1">업데이트 가능</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">새로운 기능이 추가된 최신 버전이 출시되었습니다!</p>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-black/50 py-2.5 px-5 rounded-xl border border-slate-100 dark:border-slate-700 w-full justify-center">
                <span className="font-mono text-slate-400 line-through text-sm">v{packageJson.version}</span>
                <span className="text-slate-300">→</span>
                <span className="font-mono font-bold tracking-wide text-primary text-base">{updateInfo.version}</span>
              </div>

              <div className="flex flex-col w-full gap-2 mt-2">
                <button onClick={() => { window.location.href = window.location.pathname + '?v=' + updateInfo.version; }} className="w-full bg-primary hover:bg-primaryHover text-white font-semibold py-3 rounded-lg text-sm transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                  <IconRefresh size={18} aria-hidden="true" /> 지금 새로고침
                </button>
                <a href={updateInfo.url} target="_blank" rel="noopener noreferrer" className="w-full bg-slate-100 dark:bg-[#111111] hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <IconExternalLink size={18} aria-hidden="true" /> 릴리즈 노트 보기
                </a>
                <button onClick={() => setUpdateInfo(null)} className="w-full bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium py-2 rounded-lg text-sm transition-colors mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  나중에 하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      

      {/* Mobile Layout Wrapper - Glassmorphism */}
      <div className="w-full md:max-w-6xl max-w-md flex flex-col h-full overflow-hidden relative bg-[#f2f4f6] dark:bg-black md:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] md:border border-white/5 md:rounded-[3rem] transition-all z-10">
        
        {/* Mobile Header (Top) - Toss/Wallet Style */}
        <header className="bg-[#f2f4f6] dark:bg-black z-40 shrink-0 px-6 pt-12 pb-4 flex justify-between items-center gap-2 border-none transition-all">
          <div className="flex-1 min-w-0">
            {activeTab !== 'home' && (
              <h1 className="font-bold text-[28px] tracking-tight text-black dark:text-white">
                {activeTab === 'folders' && '폴더 관리'}
                {activeTab === 'settings' && '설정'}
              </h1>
            )}
            {activeTab === 'home' && (
              <div className="flex items-center gap-2 w-full">
                <div className="relative shrink-0">
                  <select 
                    value={currentFolder} 
                    onChange={(e) => setCurrentFolder(e.target.value)}
                    className="bg-white dark:bg-[#1c1c1e] border-0 rounded-xl pl-3 pr-8 py-2.5 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer text-slate-700 dark:text-slate-200"
                  >
                    <option value="전체">전체 폴더</option>
                    {folders.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
                <div className="relative flex-1 min-w-0">
                  <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} aria-hidden="true" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="검색..." className="w-full bg-white dark:bg-[#1c1c1e] border-0 rounded-xl pl-9 pr-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary outline-none transition-shadow shadow-sm truncate" />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={`https://github.com/LeeAn0121/WebBarcode/releases/tag/v${latestVersion}`} target="_blank" rel="noopener noreferrer" className="hidden sm:block text-slate-500 hover:text-primary transition-colors font-mono text-[10px] bg-slate-200/50 dark:bg-white/10 px-2.5 py-1 rounded-full font-bold tracking-widest">
              V{latestVersion}
            </a>
            <button onClick={() => { setIsNoticeHistoryOpen(true); }} className="relative w-10 h-10 bg-white dark:bg-[#1c1c1e] text-slate-500 hover:text-primary flex items-center justify-center rounded-full shadow-sm transition-all border border-transparent dark:border-white/5" title="공지사항">
              <IconBell size={18} />
              {unreadNoticeCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-[#f2f2f7] dark:border-black rounded-full"></span>}
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className="w-10 h-10 bg-white dark:bg-[#1c1c1e] text-slate-500 hover:text-primary flex items-center justify-center rounded-full shadow-sm transition-all border border-transparent dark:border-white/5">
              {darkMode ? <IconSun size={18}/> : <IconMoon size={18}/>}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="w-full min-h-full flex flex-col relative">
            {/* Tab: Home (List) */}
        {activeTab === 'home' && (
          <div className="flex flex-col md:flex-row w-full flex-1 h-full animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">
            
      {/* Inline Scanner Area */}
      {isScannerModalOpen && (
        <div className="w-full h-[50vh] md:h-full md:w-[45%] shrink-0 bg-black relative z-40 shadow-2xl flex flex-col animate-in md:slide-in-from-left-4 slide-in-from-top-4 duration-500 overflow-hidden rounded-b-3xl md:rounded-none md:rounded-br-3xl">
           <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-50">
             <button onClick={() => { stopScanner(); setIsScannerModalOpen(false); }} aria-label="스캐너 닫기" className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
               <IconX size={24} />
             </button>
             <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} aria-label={isSoundEnabled ? '스캔 효과음 끄기' : '스캔 효과음 켜기'} aria-pressed={isSoundEnabled} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
               {isSoundEnabled ? <IconVolume size={20} /> : <IconVolume3 size={20} />}
             </button>
           </div>
           
           <div className="flex-1 relative overflow-hidden">
              <div id="reader" className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"></div>
              {isScanning && (
                <div id="reader-overlay" className="absolute inset-x-8 inset-y-12 rounded-3xl border-2 ring-[1000px] ring-black/50 border-white/80 pointer-events-none transition-all duration-300 ease-out overflow-hidden">
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-glow motion-safe:animate-scan-laser motion-reduce:hidden" aria-hidden="true"></div>
                </div>
              )}
           </div>
           
           <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center gap-4 z-50">
              {isScanning && (
                <button 
                  disabled={isSwitching}
                  onClick={async () => {
                    if (isSwitching) return;
                    setIsSwitching(true);
                    try {
                      if (scannerRef.current) { try { await scannerRef.current.stop(); } catch(e) {} }
                      await new Promise(resolve => setTimeout(resolve, 300));
                      const nextMode = facingMode === 'environment' ? 'user' : 'environment';
                      await startScanner(nextMode);
                    } finally {
                      setIsSwitching(false);
                    }
                  }}
                  className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-full font-bold shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white transition-all active:scale-95"
                  aria-label="렌즈 전환"
                >
                  <IconRefresh size={18} className={isSwitching ? 'animate-spin' : ''} />
                  {isSwitching ? '전환중...' : '렌즈 전환'}
                </button>
              )}

              {maxZoom > 1 && isScanning && (
                <div className="w-full max-w-[200px] flex items-center gap-3 bg-black/40 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-white/10">
                  <IconSearch size={14} className="text-white/70" aria-hidden="true" />
                  <input type="range" min="1" max={maxZoom} step="0.1" value={zoomLevel} onChange={handleZoomChange} aria-label="카메라 줌 배율" className="flex-1 accent-primary" />
                </div>
              )}
           </div>
        </div>
      )}
      
      <section className="w-full md:flex-1 md:w-[55%] flex flex-col flex-1 pb-24 overflow-y-auto relative custom-scrollbar">

              <div className="flex flex-col h-full">
                <div className="px-6 py-4 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-black dark:text-white tracking-tight">
                        {currentFolder === '전체' ? '모든 바코드' : currentFolder}
                      </h2>
                      <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {barcodes.filter(b => currentFolder === '전체' || (b.folder || '기본폴더') === currentFolder).length}
                      </span>
                    </div>
                    {isSelectionMode ? (
                       <div className="flex gap-2">
      {selectedIds.length > 0 && (
        <button onClick={async () => {
          if (!window.confirm(`선택한 ${selectedIds.length}개의 바코드를 삭제하시겠습니까?`)) return;
          try {
            const { error } = await supabase.from('barcodes').delete().in('id', selectedIds);
            if (error) throw error;
            setBarcodes(prev => prev.filter(b => !selectedIds.includes(b.id)));
            setSelectedIds([]);
            setIsSelectionMode(false);
            toast.success('삭제 완료');
          } catch(e) { toast.error('삭제 실패'); }
        }} className="text-sm font-bold text-white bg-red-500 px-3 py-1.5 rounded-full transition-colors">삭제 ({selectedIds.length})</button>
      )}
      <button onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }} className="text-sm font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full transition-colors">취소</button>
   </div>
                    ) : (
                       <button onClick={() => setIsSelectionMode(true)} className="text-sm font-bold text-slate-500 bg-slate-100 dark:bg-white/10 px-3 py-1.5 rounded-full transition-colors">다중 선택</button>
                    )}
                  </div>
                  
</div>
<div className="flex-1 px-6 pb-6 overflow-y-auto custom-scrollbar max-h-[55vh] lg:max-h-none lg:h-full">
                  <div className="space-y-4">
                    {filteredBarcodes.filter(b => currentFolder === '전체' || (b.folder || '기본폴더') === currentFolder).map((item, idx) => (
                      <div
                      key={item.id}
                      onPointerDown={(e) => {
                         // Only trigger long press if left click or touch
                         if (e.pointerType === 'mouse' && e.button !== 0) return;
                         handlePointerDown(item.id);
                      }}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      onClick={(e) => {
                        if (isSelectionMode || e.ctrlKey || e.metaKey || e.shiftKey) {
                          handleItemClick(item.id, '', e);
                        } else {
                          setActiveActionMenu(activeActionMenu === item.id ? null : item.id);
                        }
                      }}
                      style={idx < 8 ? { animationDelay: `${idx * 30}ms`, animationFillMode: 'backwards' } : undefined}
                      className={`relative p-5 rounded-[1.5rem] transition-all duration-300 flex items-center justify-between gap-4 group cursor-pointer overflow-hidden ${idx < 8 ? 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-300 ease-out' : ''} ${
    selectedIds.includes(item.id)
      ? 'bg-primary/5 ring-2 ring-primary dark:bg-primary/20'
      : 'bg-white dark:bg-[#1c1c1e] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:scale-[0.98] border border-transparent dark:border-white/5'
  }`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          <div className="h-12 w-12 shrink-0 rounded-2xl bg-[#f2f4f6] dark:bg-[#2c2c2e] text-black dark:text-white flex items-center justify-center transition-transform group-hover:scale-110">
                            <IconBarcode size={20} />
                          </div>
                          <div className="flex flex-col flex-1 overflow-hidden gap-0.5 py-1">
                            {item.memo ? (
                              <>
                                <div className="font-bold text-base text-slate-900 dark:text-white truncate">
                                  {item.memo}
                                </div>
                                <div className="truncate text-[13px]">
                                  {renderFormattedCode(item.code)}
                                </div>
                              </>
                            ) : (
                              <div className="truncate text-base mt-1">
                                {renderFormattedCode(item.code)}
                              </div>
                            )}
                            
                            {/* Meta Info */}
                            <div className="flex items-center gap-2 text-[10px] mt-1.5 flex-wrap">
                              <span className="text-slate-400 flex items-center gap-1 shrink-0"><IconClock size={12} aria-hidden="true"/> {format(new Date(item.created_at), 'MM.dd HH:mm')}</span>
                              {currentFolder === '전체' && (
                                <span className="flex items-center gap-1 shrink-0 text-slate-500 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md font-medium">
                                  <IconFolder size={12} aria-hidden="true"/> {item.folder || '기본폴더'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="shrink-0 relative z-20 mr-2">
                          {isSelectionMode && (
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedIds.includes(item.id) ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                              {selectedIds.includes(item.id) && <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
                            </div>
                          )}
                        </div>

                        {!isSelectionMode && activeActionMenu === item.id && (
                          <div className="absolute inset-y-0 right-0 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-md flex items-center gap-2.5 px-5 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.1)] dark:shadow-none border-l border-slate-100 dark:border-white/5 animate-in slide-in-from-right-4 duration-200 rounded-r-[24px]">
                            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(item.code); toast.success('복사됨'); triggerHaptic('success'); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all active:scale-95" aria-label="전체 복사">
                              <IconCopy size={22} />
                              <span className="text-[10px] font-bold">전체복사</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); const serial = item.code.length > 6 ? item.code.slice(-6) : item.code; navigator.clipboard.writeText(serial); toast.success('시리얼 복사됨'); triggerHaptic('success'); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all active:scale-95" aria-label="시리얼 복사">
                              <IconScissors size={22} />
                              <span className="text-[10px] font-bold">시리얼</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleEditMemo(item.id, item.memo); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all active:scale-95" aria-label="메모">
                              <IconMessagePlus size={22} />
                              <span className="text-[10px] font-bold">메모</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setMoveModal({ isOpen: true, ids: [item.id], targetFolder: item.folder || '기본폴더', type: 'barcode', sourceFolder: '' }); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all active:scale-95" aria-label="이동">
                              <IconFolder size={22} />
                              <span className="text-[10px] font-bold">이동</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95" aria-label="삭제">
                              <IconTrash size={22} />
                              <span className="text-[10px] font-bold">삭제</span>
                                </button>
                            <button onClick={(e) => { e.stopPropagation(); setActiveGlobalMenu(item.id); setActiveActionMenu(null); }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all active:scale-95" aria-label="더보기">
                              <IconDotsVertical size={22} />
                              <span className="text-[10px] font-bold">더보기</span>
                            </button>
                              </div>
                        )}
                      </div>
                    ))}
                    
                    {filteredBarcodes.filter(b => currentFolder === '전체' || (b.folder || '기본폴더') === currentFolder).length === 0 && (
                      <div className="h-56 flex flex-col items-center justify-center text-slate-400 gap-2 text-center px-6">
                        <div className="relative w-20 h-20 mb-2 flex items-center justify-center animate-float">
                          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                          <IconBarcode size={48} className="text-primary/70 relative z-10" aria-hidden="true" />
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          {searchQuery ? '검색 결과가 없습니다.' : '기록이 없습니다.'}
                        </p>
                        {!searchQuery && (
                          <p className="text-xs text-slate-400">우측 하단 카메라 버튼으로 첫 바코드를 스캔해보세요</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
            
            {/* Floating Action Button for Scanner */}
            {!isScannerModalOpen && (
              <div className="absolute bottom-28 right-6 md:bottom-10 md:right-10 z-40">
                {barcodes.filter(b => currentFolder === '전체' || (b.folder || '기본폴더') === currentFolder).length === 0 && (
                  <span className="absolute inset-0 rounded-full bg-primary/50 motion-safe:animate-ping motion-reduce:hidden" aria-hidden="true"></span>
                )}
                <button
                  onClick={() => { setIsScannerModalOpen(true); startScanner(); }}
                  aria-label="바코드 스캐너 열기"
                  className="relative w-16 h-16 bg-gradient-to-tr from-primary to-purple-500 rounded-[1.5rem] shadow-[0_10px_40px_rgba(99,102,241,0.5)] flex items-center justify-center text-white fluid-spring hover:scale-110 active:scale-90 hover:rounded-full focus-visible:outline-none"
                >
                  <IconCamera size={28} />
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Tab: Folders */}
        {activeTab === 'folders' && (
          <div className="flex-1 flex flex-row min-h-0 bg-[#f2f4f6] dark:bg-black animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* Desktop Sidebar Tree View */}
            <div className="hidden md:flex w-72 shrink-0 border-r border-slate-200/50 dark:border-white/10 flex-col bg-white/40 dark:bg-black/40 backdrop-blur-xl">
              <div className="p-5 pb-2 font-bold text-lg text-slate-800 dark:text-slate-200 border-b border-transparent">
                탐색기
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-1">
                <button 
                  onClick={() => setExplorerPath('')}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-[14px] transition-all text-sm ${explorerPath === '' ? 'bg-[#3182f6]/10 text-[#3182f6] font-bold shadow-sm' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 font-medium'}`}
                >
                  <IconHome size={18} /> Home
                </button>
                
                {folders.filter(f => f !== '기본폴더').map(f => {
                  const depth = f.split('/').length - 1;
                  const name = f.split('/').pop();
                  const isExact = explorerPath === f;
                  
                  return (
                    <button 
                      key={f}
                      onClick={() => setExplorerPath(f)}
                      style={{ paddingLeft: `${(depth * 1.2) + 0.75}rem` }}
                      className={`w-full flex items-center gap-2 pr-3 py-2 rounded-[14px] transition-all text-sm ${isExact ? 'bg-[#3182f6]/10 text-[#3182f6] font-bold shadow-sm' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 font-medium'}`}
                    >
                      {isExact ? <IconFolderOpen size={18} /> : <IconFolderFilled size={18} className="text-[#3182f6]" />}
                      <span className="truncate">{name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">
              
            {/* Breadcrumb Header */}
            <div className="flex-none p-4 pb-2 bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 z-10 sticky top-0 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar whitespace-nowrap text-lg font-bold text-slate-800 dark:text-white">
                  <button onClick={() => setExplorerPath('')} className="hover:text-primary transition-colors flex items-center gap-1">
                    <IconHome size={20} /> Home
                  </button>
                  {explorerPath.split('/').filter(Boolean).map((part, idx, arr) => {
                    const path = arr.slice(0, idx + 1).join('/');
                    return (
                      <React.Fragment key={path}>
                        <span className="text-slate-400">/</span>
                        <button onClick={() => setExplorerPath(path)} className="hover:text-primary transition-colors">
                          {part}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  {explorerPath !== '' && explorerPath !== '기본폴더' && (
                    <button onClick={() => setFolderActionModal(explorerPath)} className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
                      <IconEdit size={20} />
                    </button>
                  )}
                  
                  <button onClick={() => {
                    const newFolderName = prompt('현재 위치에 새 폴더 생성:');
                    if (newFolderName && newFolderName.trim()) {
                      const finalName = explorerPath ? `${explorerPath}/${newFolderName.trim()}` : newFolderName.trim();
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
                  }} className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors flex items-center gap-1" title="새 폴더">
                    <IconFolderPlus size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Folder & File Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-2">
              {(() => {
                // Compute current directory contents
                const currentPrefix = explorerPath ? explorerPath + '/' : '';
                
                // 1. Subfolders
                const subfolderNames = new Set<string>();
                folders.forEach(f => {
                  if (explorerPath === '' && !f.includes('/')) {
                    if (f !== '기본폴더') subfolderNames.add(f);
                  } else if (f.startsWith(currentPrefix) && f !== explorerPath) {
                    const rest = f.replace(currentPrefix, '');
                    subfolderNames.add(rest.split('/')[0]);
                  }
                });
                // Ensure '기본폴더' is always at root
                if (explorerPath === '') subfolderNames.add('기본폴더');
                
                const subfoldersList = Array.from(subfolderNames).map(name => ({ id: name, name, fullPath: explorerPath ? `${explorerPath}/${name}` : name })).sort((a, b) => {
                  const idxA = folderOrder.indexOf(a.fullPath);
                  const idxB = folderOrder.indexOf(b.fullPath);
                  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                  if (idxA !== -1) return -1;
                  if (idxB !== -1) return 1;
                  return a.name.localeCompare(b.name);
                });

                // 2. Files (Barcodes in current folder)
                const currentFolderExact = explorerPath === '' ? '기본폴더' : explorerPath;
                const files = barcodes.filter(b => (b.folder || '기본폴더') === currentFolderExact);

                if (subfoldersList.length === 0 && files.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
                      <IconFolderOpen size={40} className="text-slate-300 dark:text-slate-600" />
                      <span className="text-sm font-medium">폴더가 비어있습니다.</span>
                    </div>
                  );
                }

                return (
                  <div className={folderViewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pb-8" : "flex flex-col gap-3 pb-8"}>
                    {/* Render Subfolders */}
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
                      const fullPath = item.fullPath;
                      
                      const count = barcodes.filter(b => {
                        const bFolder = b.folder || '기본폴더';
                        return bFolder === fullPath || bFolder.startsWith(fullPath + '/');
                      }).length;

                      if (folderViewMode === 'list') {
                        return (
                          <div 
                            key={fullPath}
                            onClick={() => setExplorerPath(fullPath)}
                            className="bg-white dark:bg-[#1c1c1e] p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 transition-colors active:scale-95"
                          >
                            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500 rounded-xl flex items-center justify-center shrink-0">
                              <IconFolderFilled size={28} className="text-[#3182f6]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{name}</h3>
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap shrink-0 pr-2">{count}개 항목</div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={fullPath}
                          onClick={() => setExplorerPath(fullPath)}
                          className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[24px] shadow-sm border border-slate-100/50 dark:border-white/5 border border-slate-100/50 dark:border-white/5 flex flex-col items-center gap-3 cursor-pointer hover:shadow-lg dark:hover:bg-white/5 transition-all active:scale-95"
                        >
                          <div className="w-16 h-16 flex items-center justify-center">
                            <IconFolderFilled size={40} className="text-[#3182f6]" />
                          </div>
                          <div className="text-center w-full">
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{name}</h3>
                            <p className="text-[10px] text-slate-400 font-medium">{count}개 항목</p>
                          </div>
                        </div>
                      );
                    })}

                    </ReactSortable>
                    {/* Render Files (Barcodes) */}
                    {files.map(b => {
                      if (folderViewMode === 'list') {
                        return (
                          <div 
                            key={b.id}
                            onClick={() => setActiveActionMenu(activeActionMenu === b.id ? null : b.id)}
                            className="bg-white dark:bg-[#1c1c1e] p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/10 transition-colors relative group overflow-hidden"
                          >
                            <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl flex items-center justify-center shrink-0">
                              <IconBarcode size={24} />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <span className="font-mono text-[17px] tracking-tight font-bold text-slate-900 dark:text-white truncate">{b.code}</span>
                              {b.memo && <span className="text-sm text-primary font-medium truncate mt-0.5">{b.memo}</span>}
                            </div>
                            
                            {/* Action Overlay for List Mode */}
                            {activeActionMenu === b.id && (
                              <div className="absolute inset-y-0 right-0 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-md flex items-center gap-2.5 px-5 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.1)] dark:shadow-none border-l border-slate-100 dark:border-white/5 animate-in slide-in-from-right-4 duration-200 rounded-r-[24px]">
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(b.code); toast.success('전체 복사됨'); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all active:scale-95" aria-label="전체 복사">
                                  <IconCopy size={22} />
                                  <span className="text-[10px] font-bold">전체복사</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); const serial = b.code.length > 6 ? b.code.slice(-6) : b.code; navigator.clipboard.writeText(serial); toast.success('시리얼 복사됨'); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all active:scale-95" aria-label="시리얼 복사">
                                  <IconScissors size={22} />
                                  <span className="text-[10px] font-bold">시리얼</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleEditMemo(b.id, b.memo); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all active:scale-95" aria-label="메모">
                                  <IconMessagePlus size={22} />
                                  <span className="text-[10px] font-bold">메모</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setMoveModal({ isOpen: true, ids: [b.id], targetFolder: b.folder || '기본폴더', type: 'barcode', sourceFolder: '' }); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all active:scale-95" aria-label="이동">
                                  <IconFolder size={22} />
                                  <span className="text-[10px] font-bold">이동</span>
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(b.id); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95" aria-label="삭제">
                                  <IconTrash size={22} />
                                  <span className="text-[10px] font-bold">삭제</span>
                                </button>
                            <button onClick={(e) => { e.stopPropagation(); setActiveGlobalMenu(b.id); setActiveActionMenu(null); }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all active:scale-95" aria-label="더보기">
                              <IconDotsVertical size={22} />
                              <span className="text-[10px] font-bold">더보기</span>
                            </button>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={b.id}
                          onClick={() => setActiveActionMenu(activeActionMenu === b.id ? null : b.id)}
                          className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[24px] shadow-sm border border-slate-100/50 dark:border-white/5 border border-slate-100/50 dark:border-white/5 flex flex-col justify-between gap-3 cursor-pointer hover:shadow-lg dark:hover:bg-white/5 transition-all relative group"
                        >
                          <div className="flex flex-col gap-1 items-center pt-2">
                            <IconBarcode size={32} className="text-slate-800 dark:text-slate-200" />
                            <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 mt-2 truncate w-full text-center">{b.code}</span>
                          </div>
                          {b.memo && <div className="text-[10px] text-primary font-bold text-center truncate w-full bg-primary/10 rounded-md px-1 py-0.5">{b.memo}</div>}
                          
                          {/* Action Overlay */}
                          {activeActionMenu === b.id && (
                            <div className="absolute inset-0 bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-md rounded-[24px] flex flex-wrap content-center justify-center gap-2 p-3 z-10 animate-in zoom-in-95 duration-150">
                              <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(b.code); toast.success('복사됨'); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center gap-1 w-[45%] py-2 text-slate-600 dark:text-slate-300 hover:text-blue-500 bg-slate-50 dark:bg-black/20 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-[14px] transition-all active:scale-95" aria-label="복사">
                                <IconCopy size={20} />
                                <span className="text-[10px] font-bold">복사</span>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleEditMemo(b.id, b.memo); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center gap-1 w-[45%] py-2 text-slate-600 dark:text-slate-300 hover:text-emerald-500 bg-slate-50 dark:bg-black/20 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-[14px] transition-all active:scale-95" aria-label="메모">
                                <IconMessagePlus size={20} />
                                <span className="text-[10px] font-bold">메모</span>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); setMoveModal({ isOpen: true, ids: [b.id], targetFolder: b.folder || '기본폴더', type: 'barcode', sourceFolder: '' }); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center gap-1 w-[45%] py-2 text-slate-600 dark:text-slate-300 hover:text-purple-500 bg-slate-50 dark:bg-black/20 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-[14px] transition-all active:scale-95" aria-label="이동">
                                <IconFolder size={20} />
                                <span className="text-[10px] font-bold">이동</span>
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(b.id); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center gap-1 w-[45%] py-2 text-red-500 bg-slate-50 dark:bg-black/20 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-[14px] transition-all active:scale-95" aria-label="삭제">
                                <IconTrash size={20} />
                                <span className="text-[10px] font-bold">삭제</span>
                                </button>
                            <button onClick={(e) => { e.stopPropagation(); setActiveGlobalMenu(b.id); setActiveActionMenu(null); }} className="flex flex-col items-center gap-1 p-2 min-w-[48px] text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all active:scale-95" aria-label="더보기">
                              <IconDotsVertical size={22} />
                              <span className="text-[10px] font-bold">더보기</span>
                            </button>
                              </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            </div>

          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar pt-4 pb-28 px-5 animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">
          <div className="bg-white dark:bg-darkCard rounded-[24px] shadow-sm border border-slate-100/50 dark:border-white/5 border border-slate-100/50 dark:border-white/5 overflow-hidden min-h-[500px]">
            <div className="p-6 border-b border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-black/30">
              <h2 className="font-bold flex items-center gap-2 text-xl"><IconSettings className="text-primary" size={24} aria-hidden="true" /> 설정</h2>
            </div>
            
            <div className="p-4 sm:p-6 max-w-3xl mx-auto w-full flex flex-col gap-10">
              
              {/* 내보내기 영역 */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 font-bold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">데이터 백업 및 복원</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[24px] border border-slate-100/50 dark:border-white/5 flex flex-col gap-4 shadow-sm border border-slate-100/50 dark:border-white/5 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 text-blue-500">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                        <IconCloudDownload size={24} aria-hidden="true" />
                      </div>
                      <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">JSON 백업</h4>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">현재 앱에 저장된 모든 바코드 데이터를 JSON 파일로 안전하게 다운로드합니다.</p>
                    <button onClick={handleBackup} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">백업 파일 다운로드</button>
                  </div>

                  <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[24px] border border-slate-100/50 dark:border-white/5 flex flex-col gap-4 shadow-sm border border-slate-100/50 dark:border-white/5 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 text-indigo-500">
                      <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                        <IconCloudUpload size={24} aria-hidden="true" />
                      </div>
                      <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">JSON 복원</h4>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">이전에 백업해 둔 JSON 파일을 업로드하여 데이터를 덮어쓰기 없이 복구합니다.</p>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">백업 파일 업로드</button>
                    <input type="file" ref={fileInputRef} onChange={handleRestore} accept=".json" className="hidden" aria-label="JSON 백업 파일 선택" />
                  </div>
                </div>
              </section>

              {/* 엑셀 영역 */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 font-bold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">엑셀 출력</h3>
                <div className="bg-white dark:bg-[#1c1c1e] p-5 rounded-[24px] border border-slate-100/50 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm border border-slate-100/50 dark:border-white/5">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-lg text-sm text-green-600 dark:text-green-400 shrink-0">
                      <IconDownload size={24} aria-hidden="true"/>
                    </div>
                    <div>
                      <h4 className="font-bold text-green-700 dark:text-green-400 text-lg">Excel (.xlsx) 변환</h4>
                      <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1 leading-relaxed">스캔된 모든 기록을 엑셀 형식으로 추출합니다.</p>
                    </div>
                  </div>
                  <button onClick={exportExcel} className="w-full sm:w-auto shrink-0 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
                    엑셀 파일로 추출
                  </button>
                </div>
              </section>

              {/* 관리자 메뉴 (관리자에게만 표시) */}
              {isAdmin && (
                <section className="space-y-4 pt-4">
                  <h3 className="text-sm font-semibold text-purple-500 uppercase tracking-widest border-b border-purple-100 dark:border-purple-900/30 pb-2 flex items-center gap-2">
                    <IconRocket size={16} aria-hidden="true"/> 시스템 관리 (Admin)
                  </h3>
                  <div className="bg-white dark:bg-darkCard p-5 sm:p-6 rounded-[24px] border border-slate-100/50 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm border border-slate-100/50 dark:border-white/5">
                    <div>
                      <h4 className="font-bold text-purple-600 dark:text-purple-400 text-lg">Admin Center</h4>
                      <p className="text-sm text-purple-500/80 dark:text-purple-400/80 mt-1 leading-relaxed">공지사항 관리, 전체 로그 모니터링 및 실시간 접속자 현황 등을 확인합니다.</p>
                    </div>
                    <button onClick={() => window.location.href = import.meta.env.BASE_URL + 'admin'} className="w-full sm:w-auto shrink-0 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2">
                      관리자 페이지 진입
                    </button>
                  </div>
                </section>
              )}

              {/* 위험 구역 */}
              <section className="space-y-4 pt-4">
                <h3 className="text-sm font-semibold text-red-500 uppercase tracking-widest border-b border-red-100 dark:border-red-900/30 pb-2 flex items-center gap-2"><IconAlertTriangle size={16} aria-hidden="true"/> 위험 구역</h3>
                <div className="bg-white dark:bg-darkCard p-5 sm:p-6 rounded-[24px] border border-slate-100/50 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm border border-slate-100/50 dark:border-white/5">
                  <div>
                    <h4 className="font-bold text-red-600 dark:text-red-400 text-lg">모든 데이터 삭제</h4>
                    <p className="text-sm text-red-500/80 dark:text-red-400/80 mt-1 leading-relaxed">이 작업은 되돌릴 수 없습니다. 서버의 모든 데이터가 영구 삭제됩니다.</p>
                  </div>
                  <button onClick={handleDeleteAll} className="w-full sm:w-auto shrink-0 bg-white dark:bg-[#111111] border-2 border-red-500 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white font-semibold py-3 px-6 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">
                    영구 삭제 진행
                  </button>
                </div>
              </section>

            </div>
          </div>
          </div>
        )}
          </div>
        
      {/* 다중 선택 모드 플로팅 바 */}
      {isSelectionMode && (
        <div role="toolbar" aria-label="다중 선택 도구" className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-slate-900/95 backdrop-blur-xl text-white rounded-[24px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 flex items-center justify-between border border-white/10 animate-in slide-in-from-bottom-8 duration-300">
          <span className="font-bold text-sm" aria-live="polite">
            <span className="text-primary">{selectedIds.length}개</span> 선택됨
          </span>
          <div className="flex gap-2">
            <button onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              취소
            </button>
            <button onClick={() => setMoveModal({ isOpen: true, ids: selectedIds, targetFolder: currentFolder === '전체' ? '기본폴더' : currentFolder })} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              이동
            </button>
            <button onClick={handleMultiDelete} className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-semibold shadow-glow-red transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              선택 삭제
            </button>
          </div>
        </div>
      )}

      </main>

        {/* Modals */}

        {/* Notice History Popup */}
        {isNoticeHistoryOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsNoticeHistoryOpen(false)}>
            <div className="bg-[#f2f4f6] dark:bg-black w-full max-w-sm max-h-[80vh] rounded-[2rem] shadow-2xl flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 overflow-hidden border border-slate-100 dark:border-white/5" onClick={e => e.stopPropagation()}>
              <div className="p-5 bg-white dark:bg-[#1c1c1e] border-b border-slate-100 dark:border-white/5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                    <IconBell size={24} className="text-primary" /> 공지사항
                  </h3>
                  {unreadNoticeCount > 0 && (
                    <span className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">{unreadNoticeCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadNoticeCount > 0 && (
                    <button onClick={() => setNoticeHistory(prev => prev.map(n => ({...n, read: true})))} className="text-xs font-bold text-slate-500 hover:text-primary transition-colors bg-slate-100 dark:bg-white/5 px-2 py-1.5 rounded-lg">
                      모두 읽음
                    </button>
                  )}
                  <button onClick={() => setIsNoticeHistoryOpen(false)} className="p-1 -m-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                    <IconX size={24} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
                {noticeHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
                    <IconBellX size={40} className="text-slate-300 dark:text-slate-600" />
                    <span className="text-sm font-medium">새로운 공지사항이 없습니다.</span>
                  </div>
                ) : (
                  noticeHistory.map((notice) => (
                    <div 
                      key={notice.id} 
                      onClick={() => {
                        if (!notice.read) {
                          setNoticeHistory(prev => prev.map(n => n.id === notice.id ? {...n, read: true} : n));
                        }
                      }}
                      className={`p-4 rounded-2xl shadow-sm transition-colors cursor-pointer border ${notice.read ? 'bg-white dark:bg-[#1c1c1e] border-transparent dark:border-white/5 opacity-70' : 'bg-white dark:bg-[#1c1c1e] border-primary/30 dark:border-primary/50'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs text-slate-400 font-medium">{format(new Date(notice.date), 'yyyy년 MM월 dd일 HH:mm')}</div>
                        {!notice.read && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                      </div>
                      <p className={`text-sm font-medium leading-relaxed whitespace-pre-wrap ${notice.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200 font-bold'}`}>{notice.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}


        {folderActionModal && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setFolderActionModal(null)}>
            <div className="bg-white/80 dark:bg-[#111111]/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-6 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
              <h3 className="text-xl font-bold text-center text-black dark:text-white mb-6">'{folderActionModal.split('/').pop()}' 관리</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button onClick={() => {
                  const listToExport = barcodes.filter(b => (b.folder || '기본폴더') === folderActionModal);
                  if (listToExport.length === 0) return toast.warning('데이터가 없습니다.');
                  const data = listToExport.map(item => ({ '바코드': item.code, '메모': item.memo || '', '스캔시간': item.created_at, '폴더': item.folder || '기본폴더' }));
                  const ws = XLSX.utils.json_to_sheet(data);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Scans');
                  XLSX.writeFile(wb, `${folderActionModal.replace(/\//g, '_')}_barcodes.xlsx`);
                  toast.success(`'${folderActionModal}' 엑셀 추출 완료!`);
                  setFolderActionModal(null);
                }} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-green-50 dark:hover:bg-green-900/30 text-slate-600 hover:text-green-600 dark:text-slate-400 fluid-spring">
                  <IconFileExport size={28} />
                  <span className="font-bold text-sm">엑셀 추출</span>
                </button>

                <button onClick={() => { handleShareFolder(folderActionModal); setFolderActionModal(null); }} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 hover:text-blue-600 dark:text-slate-400 fluid-spring">
                  <IconCopy size={28} />
                  <span className="font-bold text-sm">공유 링크</span>
                </button>

                <button onClick={() => { handleCreateInvite(folderActionModal); setFolderActionModal(null); }} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-600 hover:text-emerald-600 dark:text-slate-400 fluid-spring">
                  <IconShare size={28} />
                  <span className="font-bold text-sm">팀 협업</span>
                </button>

                {folderActionModal !== '기본폴더' && (
                  <button onClick={() => { handleRenameFolder(folderActionModal); setFolderActionModal(null); }} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 fluid-spring">
                    <IconEdit size={28} />
                    <span className="font-bold text-sm">계층/이름 변경</span>
                  </button>
                )}
              </div>

              {folderActionModal !== '기본폴더' && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button onClick={() => handleMoveOrder(folderActionModal, 'up')} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-3 flex items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/30 text-slate-600 dark:text-slate-400 fluid-spring">
                    <span className="font-bold text-sm">⬆️ 앞으로 (위로)</span>
                  </button>
                  <button onClick={() => handleMoveOrder(folderActionModal, 'down')} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-3 flex items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/30 text-slate-600 dark:text-slate-400 fluid-spring">
                    <span className="font-bold text-sm">⬇️ 뒤로 (아래로)</span>
                  </button>
                </div>
              )}
              
              {folderActionModal !== '기본폴더' && (
                <button onClick={() => { handleDeleteFolder(folderActionModal); setFolderActionModal(null); }} className="w-full bg-red-50 dark:bg-red-900/20 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 transition-colors">
                  <IconTrash size={20} /> 폴더 삭제
                </button>
              )}
            </div>
          </div>
        )}
        {promptModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setPromptModal({ ...promptModal, isOpen: false })} role="dialog" aria-modal="true" aria-label={promptModal.title}>
            <div className="bg-white dark:bg-[#111111] w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
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
                className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none mb-6"
                placeholder={promptModal.placeholder}
              />
              <div className="flex gap-3">
                <button onClick={() => setPromptModal({ ...promptModal, isOpen: false })} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">취소</button>
                <button onClick={() => { promptModal.onConfirm(promptModal.value); setPromptModal({ ...promptModal, isOpen: false }); }} className="flex-1 py-3 bg-primary hover:bg-primaryHover text-white font-semibold rounded-xl shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">{promptModal.confirmText}</button>
              </div>
            </div>
          </div>
        )}

        
        
        {shareConfig.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShareConfig({ ...shareConfig, isOpen: false })} role="dialog" aria-modal="true" aria-label={shareConfig.type === 'invite' ? '협업 방 초대' : '공유 링크 생성'}>
            <div className="bg-white dark:bg-[#111111] w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                {shareConfig.type === 'invite' ? '협업 방 초대' : '공유 링크 생성'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">생성될 링크와 QR코드의 만료 시간을 선택하세요. 시간이 지나면 링크가 자동으로 비활성화됩니다.</p>

              <div className="relative mb-6">
                <label htmlFor="share-expire" className="sr-only">만료 시간</label>
                <select
                  id="share-expire"
                  value={shareConfig.expireHours}
                  onChange={(e) => setShareConfig({ ...shareConfig, expireHours: Number(e.target.value) })}
                  className="w-full appearance-none bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl p-3 pr-10 text-sm font-medium focus:ring-2 focus:ring-primary outline-none text-slate-700 dark:text-slate-200"
                >
                  <option value={1}>1시간 후 만료</option>
                  <option value={4}>4시간 후 만료</option>
                  <option value={8}>8시간 후 만료</option>
                  <option value={12}>12시간 후 만료</option>
                  <option value={24}>24시간 후 만료</option>
                  <option value={48}>48시간 후 만료</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <IconClock size={18} aria-hidden="true" />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShareConfig({ ...shareConfig, isOpen: false })} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">취소</button>
                <button onClick={processShareConfig} disabled={loadingShare} className="flex-1 py-3 bg-primary hover:bg-primaryHover text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                  {loadingShare ? <IconRefresh className="animate-spin" size={20} aria-hidden="true"/> : '링크 만들기'}
                </button>
              </div>
            </div>
          </div>
        )}

        {genModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setGenModal({ ...genModal, isOpen: false })}>
            <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/5 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-center" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-black dark:text-white mb-4">QR/바코드 생성</h3>
              <input type="text" value={genModal.text} onChange={e => setGenModal({...genModal, text: e.target.value})} placeholder="텍스트나 URL을 입력하세요" className="w-full bg-white dark:bg-[#1c1c1e] border-none rounded-2xl p-4 text-base font-medium focus:ring-2 focus:ring-primary outline-none mb-6 shadow-sm" />
              
              {genModal.text && (
                <div className="bg-white p-4 rounded-3xl mx-auto w-fit mb-6 shadow-sm">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(genModal.text)}`} alt="Generated QR" className="w-48 h-48 mx-auto rounded-xl" />
                </div>
              )}
              
              <button onClick={() => setGenModal({ ...genModal, isOpen: false })} className="w-full py-4 bg-slate-200 dark:bg-[#1c1c1e] hover:bg-slate-300 text-black dark:text-white font-bold rounded-2xl transition-colors">닫기</button>
            </div>
          </div>
        )}
        {shareModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShareModal({ isOpen: false, url: '', title: '', description: '', shareText: '' })} role="dialog" aria-modal="true" aria-label={shareModal.title}>
            <div className="bg-white dark:bg-[#111111] w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-center" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">{shareModal.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{shareModal.description}</p>
              
              <div className="bg-white p-3 rounded-2xl mx-auto w-fit mb-5 shadow-inner border border-slate-100">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareModal.url)}`} alt="Share QR" className="w-40 h-40 mx-auto" />
              </div>
              <p className="text-xs text-slate-400 mb-4">위 QR코드를 WebBarcode 앱의 카메라로 스캔하거나,<br/>아래 링크를 복사하여 공유하세요.</p>
              
              <div className="flex gap-2 mb-6">
                <label htmlFor="share-url" className="sr-only">공유 링크</label>
                <input id="share-url" type="text" readOnly value={shareModal.url} className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 outline-none" />
                <button onClick={() => { navigator.clipboard.writeText(shareModal.url); toast.success('링크 복사됨!'); }} className="bg-primary hover:bg-primaryHover text-white p-3 rounded-xl transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label="링크 복사" title="링크 복사">
                  <IconCopy size={18} />
                </button>
                <button onClick={async () => {
                  try {
                    const text = shareModal.shareText || `📦 [WebBarcode] 공유 데이터 도착!\n\n항목: ${shareModal.title}\n${shareModal.description}\n\n👉 ${shareModal.url}`;
                    
                    // 유저의 명시적 요청: 내용 전체는 클립보드에 복사하고, 이미지는 시스템 공유 앱으로.
                    navigator.clipboard.writeText(text).catch(() => {});
                    
                    if (navigator.share) {
                      try {
                        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(shareModal.url)}`;
                        const response = await fetch(qrUrl);
                        const blob = await response.blob();
                        const file = new File([blob], 'qrcode.png', { type: 'image/png' });
                        
                        if (navigator.canShare && navigator.canShare({ files: [file] })) {
                          // 시스템 네이티브 공유 호출 (이미지 첨부 및 텍스트 동시 전송)
                          await navigator.share({ title: shareModal.title, text: text, files: [file] });
                        } else {
                          await navigator.share({ title: shareModal.title, text: text });
                        }
                      } catch (err: any) {
                        if (err.name !== 'AbortError') {
                          await navigator.share({ title: shareModal.title, text: text }).catch(()=>{});
                        }
                      }
                    } else {
                      toast.success('시스템 공유를 지원하지 않는 브라우저입니다. 텍스트가 복사되었습니다!');
                    }
                  } catch(e) {
                    toast.error('공유 처리에 실패했습니다.');
                  }
                }} className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2" aria-label="시스템 앱으로 공유" title="시스템 앱으로 공유">
                  <IconShare size={18} />
                </button>
              </div>

              <button onClick={() => setShareModal({ isOpen: false, url: '', title: '', description: '', shareText: '' })} className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">닫기</button>
            </div>
          </div>
        )}

        
        {/* Global Action Menu Popup */}
        {activeGlobalMenu && barcodes.find(b => b.id === activeGlobalMenu) && (() => {
          const item = barcodes.find(b => b.id === activeGlobalMenu)!;
          return (
            <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4 transition-all" onClick={() => {setActiveActionMenu(null); setActiveGlobalMenu(null);}} role="dialog" aria-modal="true" aria-label={`${item.code} 작업 메뉴`}>
              <div className="bg-white dark:bg-[#1c1c1e] w-full sm:max-w-sm rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto my-3 sm:hidden"></div>
                <div className="px-6 pb-4 pt-2 flex flex-col">
                  <span className="font-mono font-bold text-xl text-black dark:text-white truncate">{item.code}</span>
                  <span className="text-sm font-bold text-slate-500 mt-1">{item.folder || '기본폴더'}</span>
                </div>
                <div className="px-5 pb-8 sm:pb-5">
                  {/* Primary Actions Grid */}
                  <div className="grid grid-cols-5 gap-3 mb-4" role="menu">
                    <button role="menuitem" onClick={() => { navigator.clipboard.writeText(item.code); toast.success('전체 복사됨'); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-[18px] transition-all active:scale-95 text-slate-700 dark:text-slate-200">
                      <IconCopy size={26} />
                      <span className="text-[11px] font-bold">전체복사</span>
                    </button>
                    <button role="menuitem" onClick={() => { const serial = item.code.length > 6 ? item.code.slice(-6) : item.code; navigator.clipboard.writeText(serial); toast.success('시리얼 복사됨'); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-[18px] transition-all active:scale-95 text-orange-600 dark:text-orange-400">
                      <IconScissors size={26} />
                      <span className="text-[11px] font-bold">시리얼 복사</span>
                    </button>
                    <button role="menuitem" onClick={() => { handleShare(item); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-[18px] transition-all active:scale-95 text-slate-700 dark:text-slate-200">
                      <IconShare size={26} />
                      <span className="text-[11px] font-bold">공유</span>
                    </button>
                    <button role="menuitem" onClick={() => { setMoveModal({ isOpen: true, ids: [item.id], targetFolder: item.folder || '기본폴더', type: 'barcode', sourceFolder: '' }); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center justify-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-[18px] transition-all active:scale-95 text-emerald-600 dark:text-emerald-400">
                      <IconFolder size={26} />
                      <span className="text-[11px] font-bold">이동</span>
                    </button>
                    <button role="menuitem" onClick={() => { handleDelete(item.id); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-[18px] transition-all active:scale-95 text-red-500 dark:text-red-400">
                      <IconTrash size={26} />
                      <span className="text-[11px] font-bold">삭제</span>
                    </button>
                  </div>

                  {/* Secondary Actions List */}
                  <div className="flex flex-col gap-1" role="menu">
                    <button role="menuitem" onClick={() => { handleEditMemo(item.id, item.memo); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-colors text-slate-700 dark:text-slate-200 font-bold">
                      <div className="flex items-center gap-3"><IconMessagePlus size={20} className="text-blue-500" /> 메모 추가 및 수정</div>
                      <IconChevronRight size={18} className="text-slate-400" />
                    </button>
                    <button role="menuitem" onClick={() => { handleEditCode(item.id, item.code); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-colors text-slate-700 dark:text-slate-200 font-bold">
                      <div className="flex items-center gap-3"><IconEdit size={20} className="text-amber-500" /> 바코드 번호 직접 수정</div>
                      <IconChevronRight size={18} className="text-slate-400" />
                    </button>
                    <button role="menuitem" onClick={() => { handleClone(item); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-colors text-slate-700 dark:text-slate-200 font-bold">
                      <div className="flex items-center gap-3"><IconCopy size={20} className="text-slate-500" /> 이 바코드 그대로 복제</div>
                      <IconChevronRight size={18} className="text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
{moveModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200" onClick={() => setMoveModal(prev => ({ ...prev, isOpen: false }))} role="dialog" aria-modal="true" aria-label="이동 위치 선택">
            <div className="bg-white dark:bg-[#1c1c1e] w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[24px] shadow-2xl p-6 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 flex flex-col max-h-[80svh]" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">이동할 위치 선택</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                {moveModal.type === 'barcode' ? `선택한 바코드 ${moveModal.ids.length}개를 이동합니다.` : `'${moveModal.sourceFolder.split('/').pop()}' 폴더를 이동합니다.`}
              </p>

              <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 border border-slate-100/50 dark:border-white/5 rounded-[24px] p-2 bg-slate-50 dark:bg-black/20 flex flex-col gap-1">
                <button 
                  onClick={() => setMoveModal(prev => ({ ...prev, targetFolder: '기본폴더' }))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-[16px] transition-colors ${moveModal.targetFolder === '기본폴더' ? 'bg-primary/10 text-primary font-bold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5'}`}
                >
                  <IconHome size={20} /> <span className="text-left flex-1">최상위 폴더 (Home)</span>
                  {moveModal.targetFolder === '기본폴더' && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                </button>
                
                {folders.filter(f => f !== '기본폴더').map(f => {
                  const depth = f.split('/').length - 1;
                  const name = f.split('/').pop();
                  
                  // 폴더 본인이거나 자신의 하위 폴더로는 이동 불가
                  if (moveModal.type === 'folder' && (f === moveModal.sourceFolder || f.startsWith(moveModal.sourceFolder + '/'))) return null;

                  return (
                    <button 
                      key={f}
                      onClick={() => setMoveModal(prev => ({ ...prev, targetFolder: f }))}
                      style={{ paddingLeft: `${(depth * 1.5) + 1}rem` }}
                      className={`w-full flex items-center gap-3 pr-4 py-3 rounded-[16px] transition-colors ${moveModal.targetFolder === f ? 'bg-primary/10 text-primary font-bold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5'}`}
                    >
                      <IconFolderFilled size={24} className={moveModal.targetFolder === f ? "text-primary" : "text-slate-300 dark:text-slate-600"} /> 
                      <span className="text-left flex-1 truncate">{name}</span>
                      {moveModal.targetFolder === f && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 shrink-0">
                <button onClick={() => setMoveModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-[16px] transition-colors focus-visible:outline-none">취소</button>
                <button onClick={handleMoveFolderSubmit} className="flex-1 py-3.5 bg-primary hover:bg-primaryHover text-white font-bold rounded-[16px] shadow-[0_4px_12px_rgba(49,130,246,0.3)] transition-all focus-visible:outline-none active:scale-95">여기로 이동</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Mobile Bottom Tab Bar */}
        <nav className="bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/40 dark:border-white/5 shrink-0 z-50 pb-safe pt-2" aria-label="주 메뉴">
          <div className="flex justify-around items-center px-4 pb-2">
            <button onClick={() => { setActiveTab('home'); triggerHaptic('light'); }} className={`flex flex-col items-center justify-center gap-1 py-2 w-20 transition-all ${activeTab === 'home' ? 'text-primary dark:text-primary scale-105' : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300'}`}>
              <IconHome size={26} stroke={activeTab === 'home' ? 2.5 : 1.5} />
              <span className="text-[10px] font-bold">홈</span>
            </button>
            <button onClick={() => { setActiveTab('folders'); triggerHaptic('light'); }} className={`flex flex-col items-center justify-center gap-1 py-2 w-20 transition-all ${activeTab === 'folders' ? 'text-primary dark:text-primary scale-105' : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300'}`}>
              <IconFolder size={26} stroke={activeTab === 'folders' ? 2.5 : 1.5} />
              <span className="text-[10px] font-bold">폴더</span>
            </button>
            <button onClick={() => { setActiveTab('settings'); triggerHaptic('light'); }} className={`flex flex-col items-center justify-center gap-1 py-2 w-20 transition-all ${activeTab === 'settings' ? 'text-primary dark:text-primary scale-105' : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300'}`}>
              <IconSettings size={26} stroke={activeTab === 'settings' ? 2.5 : 1.5} />
              <span className="text-[10px] font-bold">설정</span>
            </button>
          </div>
        </nav>
        
      </div>
    </div>
  );
}

export default App;
