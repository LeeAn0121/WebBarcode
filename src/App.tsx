import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppShell } from './components/AppShell';
import { BarcodeLibrary, type BarcodeRecord, type SortOrder } from './components/BarcodeLibrary';
import { EntryDialog, type EntryValues } from './components/EntryDialog';
import { ActionDialog, type ActionDialogProps } from './components/ActionDialog';
import { applyQuickFilter, getQuickFilterCounts, type QuickFilter } from './barcodeFilters';
import { collectFolderPaths, normalizeFolderPath, planFolderRename, renameFolderPath } from './folderOperations';
import AuthScreen from './components/AuthScreen';
import './workspace.css';
import { useDialogFocusManager } from './hooks/useDialogFocusManager';
import { ReactSortable } from 'react-sortablejs';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { startPrecisionScanner } from './scanner/precisionScanner';
import { waitForCameraPlayback } from './scanner/waitForCameraPlayback';
import { Toaster, toast } from 'sonner';
import * as XLSX from 'xlsx';
import packageJson from '../package.json';
import {
  IconAlertTriangle,
  IconBarcode,
  IconBell,
  IconBellX,
  IconChevronRight,
  IconClock,
  IconCloudDownload,
  IconCloudUpload,
  IconCopy,
  IconDotsVertical,
  IconDownload,
  IconEdit,
  IconExternalLink,
  IconFileExport,
  IconFolder,
  IconFolderFilled,
  IconFolderOpen,
  IconFolderPlus,
  IconHome,
  IconMessagePlus,
  IconMoon,
  IconRefresh,
  IconRocket,
  IconSearch,
  IconSettings,
  IconShare,
  IconSun,
  IconTrash,
  IconVolume,
  IconVolume3,
  IconX
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { supabase, logDebug, getDebugSessionId, isAdminEmail } from './supabaseClient';

function playSound(type = 'success', isSoundEnabled) {
  if (!isSoundEnabled) return;
  try {
      const audioCtx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
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


const Splash = ({ fadingOut }: { fadingOut: boolean }) => <div className={`workspace-splash ${fadingOut?'is-fading':''}`} role="status"><IconBarcode size={40}/><strong>WebBarcode</strong><span>작업 공간을 준비하고 있어요</span></div>;

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
  const triggerHaptic = (type = 'light') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'light') navigator.vibrate(10);
      else if (type === 'medium') navigator.vibrate(30);
      else if (type === 'heavy') navigator.vibrate(50);
      else if (type === 'success') navigator.vibrate([20, 50, 30]);
    }
  };


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

  const [smartFilter, setSmartFilter] = useState<QuickFilter>('all');
  const [filterDate, setFilterDate] = useState(() => new Date());
  useEffect(() => {
    const refreshDay = () => {
      const now = new Date();
      setFilterDate(previous => previous.toDateString() === now.toDateString() ? previous : now);
    };
    const timer = setInterval(refreshDay, 60000);
    document.addEventListener('visibilitychange', refreshDay);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refreshDay); };
  }, []);

  const workspaceActionsRef = useRef({
    navigate: async (_tab: 'home' | 'folders' | 'settings') => {},
    scan: () => {},
    addFolder: () => {},
  });

  // PC 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target instanceof Element ? e.target : document.activeElement;
      if (e.defaultPrevented || e.isComposing || target?.closest('button, a, input, textarea, select, [contenteditable]') || document.querySelector('[role="dialog"]')) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        void workspaceActionsRef.current.navigate('home').then(() => document.getElementById('barcode-search')?.focus());
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        void workspaceActionsRef.current.navigate('folders').then(() => workspaceActionsRef.current.addFolder());
      } else if (e.code === 'Space' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && !e.repeat) {
        e.preventDefault();
        workspaceActionsRef.current.scan();
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
  const [barcodes, setBarcodes] = useState<BarcodeRecord[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryError, setLibraryError] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [entryItem, setEntryItem] = useState<BarcodeRecord | 'new' | null>(null);
  const barcodesRef = useRef<BarcodeRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const lastScannedRef = useRef<{code: string, time: number}>({ code: '', time: 0 });

  // USB/Bluetooth 바코드 리더기 (키보드 웨지) 전역 지원 로직
  const usbBufferRef = useRef('');
  const usbTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target instanceof Element ? e.target : document.activeElement;
      if (e.isComposing || target?.closest('button, a, input, textarea, select, [contenteditable]') || document.querySelector('[role="dialog"]')) {
        usbBufferRef.current = '';
        if (usbTimeoutRef.current) clearTimeout(usbTimeoutRef.current);
        return;
      }
      // Keyboard wedge scanners finish their payload with Enter.
      if (e.key === 'Enter') {
        if (usbBufferRef.current.length >= 3) {
          const scannedCode = usbBufferRef.current;
          usbBufferRef.current = '';
          void scanCallbackRef.current(scannedCode);
          e.preventDefault();
        }
        return;
      }

      // 단일 문자 입력만 허용
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;

      usbBufferRef.current += e.key;

      if (usbTimeoutRef.current) clearTimeout(usbTimeoutRef.current);
      usbTimeoutRef.current = setTimeout(() => {
        usbBufferRef.current = ''; // 사람이 치는 속도(>50ms)면 버퍼 초기화
      }, 50);
    };

    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, []);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [facingMode, setFacingMode] = useState<'environment'|'user'>('environment');
  const [isSwitching, setIsSwitching] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [currentFolder, setCurrentFolder] = useState('전체');
  const [activeTab, setActiveTab] = useState('home');
  const [activeActionMenu, setActiveActionMenu] = useState<any>(null);
  const [activeGlobalMenu, setActiveGlobalMenu] = useState<any>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectionIds, setSelectedIds] = useState<string[]>([]);
  const folderPressTimer = useRef<any>(null);
  const folderStartY = useRef(0);
  const folderLongPressTime = useRef(0);
  const [moveModal, setMoveModal] = useState({ isOpen: false, ids: [] as string[], targetFolder: '기본폴더', type: 'barcode' as 'barcode' | 'folder', sourceFolder: '' });
  const [shareModal, setShareModal] = useState({ isOpen: false, url: '', title: '', description: '', shareText: '' });
  const [shareConfig, setShareConfig] = useState({ isOpen: false, type: '', folderName: '', item: null as any, expireHours: 1 });
  const [collabFolders, setCollabFolders] = useState<{owner_id: string, folder_name: string}[]>([]);
  const [loadingShare, setLoadingShare] = useState(false);
  const [folderActionModal, setFolderActionModal] = useState<string | null>(null);
  const [explorerPath, setExplorerPath] = useState<string>('');
  const [folderViewMode, setFolderViewMode] = useState<'grid' | 'list'>('list');
  const [folderOrder, setFolderOrder] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('folderOrder') || '[]');
      return Array.isArray(saved) ? saved.filter((value): value is string => typeof value === 'string') : [];
    } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('folderOrder', JSON.stringify(folderOrder)); }, [folderOrder]);
  const [promptModal, setPromptModal] = useState<Omit<ActionDialogProps, 'onClose'> & { isOpen: boolean }>({ isOpen: false, title: '', placeholder: '', value: '', type: 'text', description: '', confirmText: '확인', onConfirm: (val: string) => {} });
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
  const [updateInfo, setUpdateInfo] = useState<{ version: string; notes: string; url: string } | null>(null);
  const [latestVersion, setLatestVersion] = useState(packageJson.version);

  const [localFolders, setLocalFolders] = useState<string[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('folders') || '[]');
      return Array.isArray(saved) ? saved.filter((value): value is string => typeof value === 'string') : [];
    }
    catch { return []; }
  });
  useEffect(() => { localStorage.setItem('folders', JSON.stringify(localFolders)); }, [localFolders]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerOperationRef = useRef<Promise<void>>(Promise.resolve());
  const scannerGenerationRef = useRef(0);
  const precisionStopRef = useRef<(() => void) | null>(null);
  const scanCallbackRef = useRef<(text: string) => void>(() => {});
  const pendingInsertsRef = useRef(new Set());
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const lastScanTimeRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentFolderRef = useRef('전체');

  // Derived unique folders from barcodes and local
  const explicitFolders = ['기본폴더', ...localFolders, ...barcodes.map(b => b.folder).filter((folder): folder is string => Boolean(folder))];
  const folders = [...new Set([...explicitFolders, ...collectFolderPaths(explicitFolders)])];
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

  // Dialogs own Escape. With no overlay, Escape only clears selection.
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || document.querySelector('[role="dialog"]')) return;
      setIsSelectionMode(false);
      setSelectedIds([]);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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


  useEffect(() => {
    if (session?.user?.id) {
      fetchBarcodes();
      fetchCollabFolders();
    }

    const noticeSub = supabase
      .channel('custom-notices-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notices' }, payload => {
        setNoticeHistory(prev => [{id: payload.new.id, message: payload.new.message, date: payload.new.created_at, read: false}, ...prev].slice(0, 50));
        playSound('success', true);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('새 공지사항', { body: payload.new.message, icon: `${import.meta.env.BASE_URL}icon.jpg` });
        }
      })
      .subscribe();
    const subscription = supabase
      .channel('public:barcodes')
      .on<BarcodeRecord>('postgres_changes', { event: '*', schema: 'public', table: 'barcodes' }, payload => {
        // filter incoming payloads if needed, though RLS handles it.
        // If no RLS, we only accept if user_id matches session
        if (payload.eventType !== 'DELETE' && payload.new.user_id && payload.new.user_id !== session?.user?.id) return;

        if (payload.eventType === 'INSERT') {
          if (!pendingInsertsRef.current.has(payload.new.code) && 'Notification' in window && Notification.permission === 'granted') {
            new Notification('새 바코드 공유됨', { body: `[${payload.new.folder}] ${payload.new.code}`, icon: `${import.meta.env.BASE_URL}icon.jpg` });
          }
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
      supabase.removeChannel(noticeSub);
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
    setLibraryLoading(true);
    setLibraryError('');
    try {
      const { data, error } = await supabase.from('barcodes').select('*').eq('user_id', session?.user?.id).order('created_at', { ascending: false });
      if (error) throw error;
      setBarcodes(data || []);
    } catch (error) {
      setLibraryError(error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.');
    } finally { setLibraryLoading(false); }
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
    if (!session?.user?.id) return;
    const cleanText = decodedText.trim();
    if (!cleanText) return;
    const now = Date.now();

    // 쿨다운(Debounce): 같은 바코드는 3초, 다른 바코드라도 1초 쿨다운을 적용해 연속 스캔 폭주 방지
    const isSameCode = lastScannedRef.current.code === cleanText;
    const cooldownPeriod = isSameCode ? 3000 : 1000;

    if (now - lastScannedRef.current.time < cooldownPeriod) {
      return; // 쿨다운 중 무시 (멈춤 없이 스무스하게 넘어감)
    }

    lastScannedRef.current = { code: cleanText, time: now };
    logDebug('info', '스캔 디코딩 성공', { code: cleanText });



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
      await fetchBarcodes();
      toast.success(`바코드 인식 성공: ${cleanText}`);
      setTimeout(() => pendingInsertsRef.current.delete(cleanText), 3000);
    }


  };

  // Both decoders share the same cooldown, duplicate protection and latest state.
  useEffect(() => { scanCallbackRef.current = handleScan; });

  const stopScanner = () => {
    ++scannerGenerationRef.current;
    precisionStopRef.current?.();
    precisionStopRef.current = null;
    videoTrackRef.current = null;
    setIsScanning(false);
    setMaxZoom(1);
    setZoomLevel(1);
    scannerOperationRef.current = scannerOperationRef.current.then(async () => {
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
    }).catch(console.error);
    return scannerOperationRef.current;
  };

  useEffect(() => () => { void stopScanner(); }, []);


  const startScanner = (requestedFacingMode?: 'environment' | 'user', requestedDeviceId?: string) => {
    setScannerError('');
    const generation = ++scannerGenerationRef.current;
    const targetFacingMode = requestedFacingMode ?? facingMode;
    // An explicit empty selection means automatic. A facing switch clears the old ID.
    const targetDeviceId = requestedDeviceId ?? (requestedFacingMode ? '' : selectedCamera);
    const isCurrent = () => generation === scannerGenerationRef.current;

    scannerOperationRef.current = scannerOperationRef.current.then(async () => {
      // Allow React to mount #reader before requesting the camera.
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      if (!isCurrent() || !document.getElementById('reader')) return;
      precisionStopRef.current?.();
      precisionStopRef.current = null;
      if (scannerRef.current?.isScanning) await scannerRef.current.stop();
      if (!isCurrent()) return;
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode('reader', {
          formatsToSupport,
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        });
      }
      const scanner = scannerRef.current;
      const cameraConfig = targetDeviceId
        ? { deviceId: { exact: targetDeviceId } }
        : { facingMode: targetFacingMode };
      const onDecoded = (text: string) => {
        if (isCurrent()) scanCallbackRef.current(text);
      };
      let playbackReady = false;
      try {
        await scanner.start(cameraConfig, {
          fps: 12,
          // Scan the full frame; a square crop clips long product barcodes.
          disableFlip: targetFacingMode === 'environment',
          videoConstraints: {
            ...cameraConfig,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          },
        }, onDecoded, () => {});
        const video = document.querySelector<HTMLVideoElement>('#reader video');
        if (!video) throw new Error('카메라 영상을 찾을 수 없습니다.');
        await waitForCameraPlayback(video);
        playbackReady = true;
        if (!isCurrent()) {
          await scanner.stop();
          return;
        }
        setIsScanning(true);
        setFacingMode(targetFacingMode);
        setSelectedCamera(targetDeviceId);
        const track = (video?.srcObject as MediaStream | null)?.getVideoTracks()[0];
        if (video && track) {
          videoTrackRef.current = track;
          const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & {
            focusMode?: string[]; zoom?: { min: number; max: number };
          };
          if (capabilities?.focusMode?.includes('continuous')) {
            // Unsupported focus controls must never prevent the camera from starting.
            await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] })
              .catch(error => { logDebug('warn', '연속 자동 초점 설정 실패', { error: String(error) }); });
          }
          if (!isCurrent()) return;
          if (capabilities?.zoom) {
            setMaxZoom(capabilities.zoom.max);
            setZoomLevel((track.getSettings() as MediaTrackSettings & { zoom?: number }).zoom ?? 1);
          }
          try {
            precisionStopRef.current = startPrecisionScanner(video, onDecoded, error => {
              logDebug('warn', '정밀 판독 중단 (기본 판독 유지)', { error });
            });
          } catch (error) {
            logDebug('warn', '정밀 판독 초기화 실패 (기본 판독 유지)', { error: String(error) });
          }
          logDebug('info', '카메라 시작 성공', { settings: track.getSettings() });
        }
        // Enumerate after opening: labels are available, without a throwaway stream.
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (isCurrent()) setCameras(devices.filter(device => device.kind === 'videoinput')
          .map(device => ({ id: device.deviceId, label: device.label })));
      } catch (err: any) {
        if (!isCurrent()) {
          try { await scanner.stop(); } catch { /* Already stopped or never started. */ }
          return;
        }
        if (scanner.isScanning && playbackReady) {
          // Optional capability/enumeration failures do not invalidate a live camera.
          logDebug('warn', '카메라 부가 설정 실패', { error: String(err) });
          return;
        }
        try { await scanner.stop(); } catch { /* Release a stream that failed to render. */ }
        setIsScanning(false);
        const errName = err?.name || 'UnknownError';
        const message = String(err?.message || err);
        let toastMsg = `카메라 시작 실패 (${errName})`;
        if (errName === 'NotAllowedError' || /Permission|NotAllowedError/.test(message)) {
          toastMsg = "카메라 권한이 거부/차단 상태입니다. 브라우저 주소창의 카메라 권한을 '허용'으로 변경 후 새로고침 해주세요!";
        } else if (errName === 'NotReadableError' || /in use|NotReadableError/.test(message)) {
          toastMsg = '카메라가 이미 다른 앱이나 탭에서 사용 중입니다. 백그라운드 앱을 종료해주세요.';
        }
        logDebug('error', '카메라 시작 실패', { error: message });
        setScannerError(toastMsg);
        toast.error(toastMsg);
      }
    }).catch(error => {
      if (isCurrent()) { setScannerError('카메라를 시작하지 못했습니다. 다시 시도해주세요.'); toast.error('카메라를 시작하지 못했습니다. 다시 시도해주세요.'); }
      console.error(error);
    });
    return scannerOperationRef.current;
  };

  const handleZoomChange = (e) => {
    const newZoom = parseFloat(e.target.value);
    setZoomLevel(newZoom);
    if (videoTrackRef.current) {
      videoTrackRef.current.applyConstraints({
        advanced: [{ zoom: newZoom } as MediaTrackConstraintSet]
      }).catch(console.warn);
    }
  };

  const exportExcel = (onlySelected: boolean | React.MouseEvent = false) => {
    const listToExport = onlySelected === true ? barcodes.filter(b => selectedIds.includes(b.id)) : visibleBarcodes;
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

  const handleMultiDelete = () => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setPromptModal({ isOpen: true, title: '선택한 바코드 삭제', hideInput: true, danger: true,
      description: `선택한 ${ids.length}개 바코드를 삭제합니다. 이 작업은 되돌릴 수 없습니다.`, confirmText: '삭제하기',
      onConfirm: async () => {
        const { error } = await supabase.from('barcodes').delete().in('id', ids);
        if (error) throw new Error(error.message);
        setBarcodes(prev => prev.filter(b => !ids.includes(b.id)));
        setSelectedIds([]); setIsSelectionMode(false);
        toast.success(`${ids.length}개가 삭제되었습니다.`);
      },
    });
  };

  const handleDelete = (id: string) => {
    setPromptModal({ isOpen: true, title: '바코드 삭제', hideInput: true, danger: true,
      description: '이 바코드를 보관함에서 삭제합니다. 이 작업은 되돌릴 수 없습니다.', confirmText: '삭제하기',
      onConfirm: async () => {
        const { error } = await supabase.from('barcodes').delete().eq('id', id);
        if (error) throw new Error(error.message);
        setBarcodes(prev => prev.filter(b => b.id !== id));
        setSelectedIds(prev => prev.filter(selected => selected !== id));
        toast.success('삭제되었습니다.');
      },
    });
  };

  const handleEditCode = (id: string, _currentCode?: string) => {
    const row = barcodes.find(item => item.id === id);
    if (row) setEntryItem(row);
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
      label: '메모',
      description: '바코드에 대한 메모를 입력하세요. 비워두면 삭제됩니다.',
      placeholder: '예: 유통기한 2026-09-02',
      value: currentMemo || '',
      type: 'text',
      confirmText: '저장하기',
      onConfirm: async (newMemo) => {
        if (newMemo !== currentMemo) {
          const { error } = await supabase.from('barcodes').update({ memo: newMemo.trim() }).eq('id', id);
          if (error) throw new Error(error.message);
          setBarcodes(prev => prev.map(b => b.id === id ? {...b, memo: newMemo.trim()} : b));
          setSelectedIds(prev => prev.filter(selected => selected !== id));
          toast.success('메모가 저장되었습니다.');
        }
      }
    });
  };

  const handleAddFolder = (parentPath = '') => {
    setPromptModal({ isOpen: true, title: '새 폴더 만들기', label: '폴더 이름', required: true,
      value: '', placeholder: '예: 창고/A구역', confirmText: '만들기',
      description: parentPath ? `'${parentPath}' 안에 폴더를 만듭니다.` : '/로 나누면 하위 폴더도 함께 만들 수 있습니다.',
      onConfirm: (raw) => {
        const folderName = normalizeFolderPath(parentPath ? `${parentPath}/${raw}` : raw);
        if (folders.includes(folderName)) throw new Error('같은 이름의 폴더가 이미 있습니다.');
        const additions = collectFolderPaths([folderName]);
        setLocalFolders(prev => [...new Set([...prev, ...additions])]);
        setFolderOrder(prev => [...new Set([...prev, ...additions])]);
        setCurrentFolder(folderName); setSelectedIds([]);
        if (activeTab === 'folders') setExplorerPath(folderName);
        toast.success(`'${folderName}' 폴더가 생성되었습니다.`);
      },
    });
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

  const handleRenameFolder = (oldName: string) => {
    if (oldName === '기본폴더') return toast.error('기본 폴더는 이름을 변경할 수 없습니다.');
    setPromptModal({ isOpen: true, title: '폴더 이름 변경', label: '새 폴더 이름', required: true,
      value: oldName.split('/').pop() || '', confirmText: '변경하기',
      description: `'${oldName}'과 하위 폴더의 경로가 함께 변경됩니다.`,
      onConfirm: async (raw) => {
        const { newPath, mapping } = planFolderRename(oldName, raw, folders);
        if (newPath === oldName) return;
        const completed: { oldPath: string; newPath: string; ids: string[] }[] = [];
        try {
          for (const [oldPath, target] of mapping) {
            const ids = barcodes.filter(b => (b.folder || '기본폴더') === oldPath).map(b => b.id);
            if (!ids.length) continue;
            const { error } = await supabase.from('barcodes').update({ folder: target }).in('id', ids);
            if (error) throw new Error(error.message);
            completed.push({ oldPath, newPath: target, ids });
          }
        } catch (error) {
          let rollbackFailed = false;
          for (const update of completed.reverse()) {
            try {
              const { error: rollbackError } = await supabase.from('barcodes').update({ folder: update.oldPath })
                .in('id', update.ids).eq('folder', update.newPath);
              if (rollbackError) rollbackFailed = true;
            } catch { rollbackFailed = true; }
          }
          await fetchBarcodes();
          throw new Error(rollbackFailed
            ? '일부 항목의 변경을 되돌리지 못했습니다. 보관함 목록을 확인한 뒤 다시 시도하세요.'
            : `폴더 이름을 변경하지 못했습니다. ${error instanceof Error ? error.message : '다시 시도하세요.'}`);
        }
        const rename = (path: string) => renameFolderPath(path, oldName, newPath);
        setLocalFolders(prev => [...new Set([...prev.map(rename), ...mapping.values()])]);
        setFolderOrder(prev => [...new Set(prev.map(rename))]);
        setBarcodes(prev => prev.map(b => ({ ...b, folder: rename(b.folder || '기본폴더') })));
        setCurrentFolder(prev => rename(prev)); setExplorerPath(prev => rename(prev));
        toast.success('폴더와 하위 경로의 이름을 변경했습니다.');
      },
    });
  };

  const handleDeleteFolder = (folderName: string) => {
    if (folderName === '기본폴더') return toast.error('기본 폴더는 삭제할 수 없습니다.');
    if (folders.some(path => path.startsWith(folderName + '/'))) return toast.error('하위 폴더를 먼저 정리해주세요.');
    if (barcodes.some(b => (b.folder || '기본폴더') === folderName)) return toast.error('바코드를 다른 폴더로 옮긴 후 삭제해주세요.');
    setPromptModal({ isOpen: true, title: '폴더 삭제', hideInput: true, danger: true,
      description: `'${folderName}' 폴더를 삭제합니다.`, confirmText: '삭제하기',
      onConfirm: () => {
        setLocalFolders(prev => prev.filter(f => f !== folderName));
        setFolderOrder(prev => prev.filter(f => f !== folderName));
        if (currentFolder === folderName) setCurrentFolder('기본폴더');
        if (explorerPath === folderName) setExplorerPath('');
        toast.success('폴더가 삭제되었습니다.');
      },
    });
  };

  const handleDeleteAll = () => {
    setPromptModal({ isOpen: true, title: '모든 바코드 삭제', label: '확인 문구', required: true, danger: true,
      value: '', placeholder: '삭제합니다', confirmText: '모든 바코드 삭제',
      description: '모든 스캔 기록을 영구 삭제합니다. 계속하려면 삭제합니다를 입력하세요.',
      onConfirm: async (value) => {
        if (value !== '삭제합니다') throw new Error('확인 문구가 일치하지 않습니다. 삭제합니다를 입력하세요.');
        const { error } = await supabase.from('barcodes').delete().eq('user_id', session.user.id);
        if (error) throw new Error(error.message);
        setBarcodes([]); setSelectedIds([]);
        toast.success('모든 스캔 기록이 삭제되었습니다.');
      },
    });
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

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = event.target?.result;
        if (typeof result !== 'string') throw new Error('Invalid backup file');
        const parsed = JSON.parse(result);
        let importedBarcodes: (Pick<BarcodeRecord, 'code'> & Partial<Omit<BarcodeRecord, 'code'>>)[] = [];
        let importedFolders: string[] = [];

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
    e.target.value = '';
  };

  const handleShare = (item) => {
    if (!session?.user?.id) return toast.error('로그인이 필요합니다.');
    setShareConfig({ isOpen: true, type: 'share_item', folderName: '', item, expireHours: 1 });
    {setActiveActionMenu(null); setActiveGlobalMenu(null);}
  };

  const matchingBarcodes = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return barcodes.filter(b => (currentFolder === '전체' || (b.folder || '기본폴더') === currentFolder) &&
      (b.code.toLocaleLowerCase().includes(query) || (b.memo || '').toLocaleLowerCase().includes(query)));
  }, [barcodes, currentFolder, searchQuery]);
  const filterCounts = getQuickFilterCounts(matchingBarcodes, filterDate);
  const visibleBarcodes = useMemo(() => applyQuickFilter(matchingBarcodes, smartFilter, filterDate)
    .sort((a,b) => sortOrder === 'name' ? a.code.localeCompare(b.code, undefined, {numeric:true}) :
      (sortOrder === 'oldest' ? 1 : -1) * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || a.id.localeCompare(b.id)),
    [matchingBarcodes, smartFilter, sortOrder, filterDate]);
  const selectedIds = useMemo(() => {
    const visibleIds = new Set(visibleBarcodes.map(row => row.id));
    return selectionIds.filter(id => visibleIds.has(id));
  }, [selectionIds, visibleBarcodes]);
  const changeFolder = (folder: string) => { setCurrentFolder(folder); setSelectedIds([]); };
  const changeQuery = (query: string) => { setSearchQuery(query); setSelectedIds([]); };
  const changeQuickFilter = (filter: QuickFilter) => { setSmartFilter(filter); setSelectedIds([]); };
  const resetFilters = () => { setSearchQuery(''); setCurrentFolder('전체'); setSmartFilter('all'); setSelectedIds([]); };
  const folderCounts = useMemo(() => barcodes.reduce<Record<string, number>>((counts, b) => {
    const folder = b.folder || '기본폴더';
    counts[folder] = (counts[folder] || 0) + 1;
    return counts;
  }, {}), [barcodes]);
  const renderFormattedCode = (code: string) => <span className="font-mono break-all">{code}</span>;
  const copyBarcode = async (code: string) => {
    try { await navigator.clipboard.writeText(code); toast.success('전체 바코드를 복사했습니다.'); }
    catch { toast.error('복사하지 못했습니다. 클립보드 권한을 확인해주세요.'); }
  };
  const closeScanner = async () => {
    // html5-qrcode must keep its reader/video host until an in-flight start settles.
    await stopScanner();
    setIsScannerModalOpen(false);
  };
  const navigate = async (tab: 'home' | 'folders' | 'settings') => {
    if (isScannerModalOpen) await closeScanner();
    setActiveTab(tab); setSelectedIds([]); setIsSelectionMode(false);
  };
  const openScanner = () => {
    const destination = activeTab === 'folders' ? (explorerPath || '기본폴더') : currentFolder;
    currentFolderRef.current = destination;
    setCurrentFolder(destination); setSmartFilter('all'); setSearchQuery(''); setSelectedIds([]);
    setActiveTab('home'); setIsScannerModalOpen(true); void startScanner();
  };
  useEffect(() => {
    workspaceActionsRef.current = { navigate, scan: openScanner, addFolder: handleAddFolder };
  });
  const saveEntry = async (values: EntryValues) => {
    if (barcodes.some(b => b.code === values.code && (b.folder || '기본폴더') === values.folder && b.id !== (entryItem !== 'new' ? entryItem?.id : undefined))) throw new Error('이 폴더에 같은 바코드가 이미 있습니다.');
    if (entryItem && entryItem !== 'new') {
      const {error} = await supabase.from('barcodes').update(values).eq('id', entryItem.id);
      if (error) throw new Error(error.message);
      setBarcodes(prev => prev.map(b => b.id === entryItem.id ? {...b,...values} : b));
    } else {
      const {data,error} = await supabase.from('barcodes').insert([{...values,user_id:session.user.id}]).select();
      if(error) throw new Error(error.message);
      if(data?.length) setBarcodes(prev => [...data,...prev.filter(b => !data.some(row => row.id === b.id))]);
      else await fetchBarcodes();
    }
    setSelectedIds([]);
    toast.success('바코드를 저장했습니다.');
  };

  useDialogFocusManager([
    { id: 'update-dialog', open: Boolean(updateInfo), onClose: () => setUpdateInfo(null) },
    { id: 'notice-dialog', open: isNoticeHistoryOpen, onClose: () => setIsNoticeHistoryOpen(false) },
    { id: 'folder-dialog', open: Boolean(folderActionModal), onClose: () => setFolderActionModal(null) },
    { id: 'prompt-dialog', open: promptModal.isOpen, onClose: () => setPromptModal(prev => ({ ...prev, isOpen: false })) },
    { id: 'share-config-dialog', open: shareConfig.isOpen, onClose: () => setShareConfig(prev => ({ ...prev, isOpen: false })) },
    { id: 'generate-dialog', open: genModal.isOpen, onClose: () => setGenModal(prev => ({ ...prev, isOpen: false })) },
    { id: 'share-dialog', open: shareModal.isOpen, onClose: () => setShareModal(prev => ({ ...prev, isOpen: false })) },
    { id: 'action-dialog', open: Boolean(activeGlobalMenu), onClose: () => setActiveGlobalMenu(null) },
    { id: 'move-dialog', open: moveModal.isOpen, onClose: () => setMoveModal(prev => ({ ...prev, isOpen: false })) },
  ], Boolean(entryItem) || !session);

  if (!session) {
    return (
      <>
        <Toaster position="top-center" richColors />
        {splashVisible && <Splash fadingOut={splashFadingOut} />}
        <AuthScreen supabase={supabase} />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors theme={darkMode ? 'dark' : 'light'} style={{ zIndex: 99999 }} />
      <div className="workspace-root">
      {splashVisible && <Splash fadingOut={splashFadingOut} />}


      {/* Update Available Modal */}
      {updateInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" id="update-dialog" tabIndex={-1} role="dialog" aria-modal="true" aria-label="업데이트 알림">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 ease-out"></div>
          <div className="relative bg-white dark:bg-darkCard rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 p-6 sm:p-8 max-w-sm w-full animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-purple-500 to-pink-500"></div>

            <div className="flex flex-col items-center text-center gap-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-full text-primary">
                <IconRocket size={40} className="animate-bounce" />
              </div>

              <div>
                <h3 className="text-2xl font-bold tracking-wide text-slate-800 dark:text-slate-100 mb-1">업데이트 가능</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">새로운 기능이 추가된 최신 버전이 출시되었습니다!</p>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 dark:bg-darkBg/50 py-2.5 px-5 rounded-xl border border-slate-100 dark:border-slate-700 w-full justify-center">
                <span className="font-mono text-slate-400 line-through text-sm">v{packageJson.version}</span>
                <span className="text-slate-300">→</span>
                <span className="font-mono font-bold tracking-wide text-primary text-base">{updateInfo.version}</span>
              </div>

              <div className="flex flex-col w-full gap-2 mt-2">
                <button onClick={() => { window.location.href = window.location.pathname + '?v=' + updateInfo.version; }} className="w-full bg-primary hover:bg-primaryHover text-white font-semibold py-3 rounded-lg text-sm transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                  <IconRefresh size={18} aria-hidden="true" /> 지금 새로고침
                </button>
                <a href={updateInfo.url} target="_blank" rel="noopener noreferrer" className="w-full bg-slate-100 dark:bg-darkCard hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
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


      <AppShell tab={activeTab} onNavigate={navigate} onScan={openScanner} folders={folders} folder={currentFolder} counts={folderCounts}
        onFolder={folder => { void navigate('home').then(() => setCurrentFolder(folder)); }} onAddFolder={() => handleAddFolder()}
        email={session.user.email || '내 계정'} dark={darkMode} onTheme={() => setDarkMode(!darkMode)}
        onNotices={() => setIsNoticeHistoryOpen(true)} unread={unreadNoticeCount} onSignOut={async () => { await closeScanner(); await supabase.auth.signOut(); }}>
        {/* Main Content Area */}
        <main className="workspace-main custom-scrollbar">
          {activeTab !== 'home' && <div className="ws-page-heading"><div><h1>{activeTab === 'folders' ? '폴더 관리' : '설정'}</h1><p>{activeTab === 'folders' ? '폴더로 정리하고 필요한 바코드를 빠르게 찾아보세요.' : '나에게 맞는 작업 공간을 관리하세요.'}</p></div></div>}
          <div className="w-full min-h-full flex flex-col relative">
            {/* Tab: Home (List) */}
        {activeTab === 'home' && (
          <div className="workspace-library-layout">

      {/* Inline Scanner Area */}
      {isScannerModalOpen && (
        <div className="workspace-scanner">
           <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-50">
             <button onClick={() => void closeScanner()} aria-label="스캐너 닫기" className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
               <IconX size={24} />
             </button>
             <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} aria-label={isSoundEnabled ? '스캔 효과음 끄기' : '스캔 효과음 켜기'} aria-pressed={isSoundEnabled} className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
               {isSoundEnabled ? <IconVolume size={20} /> : <IconVolume3 size={20} />}
             </button>
           </div>

           <div className="flex-1 relative overflow-hidden">
              <div id="reader" className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover"></div>
              {isScanning && (
                <div id="reader-overlay" className="absolute inset-6 rounded-3xl border-2 ring-[1000px] ring-black/50 border-white/80 pointer-events-none transition-all duration-300 ease-out overflow-hidden">
                  <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-glow motion-safe:animate-scan-laser motion-reduce:hidden" aria-hidden="true"></div>
                </div>
              )}
           </div>

           <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center gap-4 z-50">
                <div className="text-center text-white text-xs" role="status">
                  <strong className="font-semibold">{scannerError ? '카메라 연결을 확인해주세요' : isScanning ? '바코드를 카메라에 비춰주세요' : '카메라 준비 중…'}</strong>
                  <p className="mt-1 text-white/80">저장 위치: {currentFolder === '전체' ? '기본폴더' : currentFolder}</p>
                  {scannerError && <><p className="mt-2 max-w-md">{scannerError}</p><button className="mt-2 underline" onClick={() => void startScanner()}>카메라 다시 연결</button></>}
                </div>
                {cameras.length > 0 && (
                  <div className="w-full max-w-[280px] bg-black/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/10 p-2 z-50">
                    <select
                      aria-label="카메라 선택" value={selectedCamera}
                      onChange={async (e) => {
                        const newDeviceId = e.target.value;
                        if (isSwitching) return;
                        setIsSwitching(true);
                        try {
                          setSelectedCamera(newDeviceId);
                          await stopScanner();
                          await startScanner(undefined, newDeviceId);
                        } finally {
                          setIsSwitching(false);
                        }
                      }}
                      className="w-full bg-transparent text-white text-sm focus:outline-none [&>option]:bg-slate-800 [&>option]:text-white truncate"
                    >
                      <option value="">(자동) 시스템 기본/방향 우선</option>
                      {cameras.map(c => {
                        const lbl = (c.label || '').toLowerCase();
                        let type = '내장/기타';
                        if (lbl.includes('usb')) type = 'USB';
                        else if (lbl.includes('bluetooth') || lbl.includes('bt')) type = 'Bluetooth';
                        return <option key={c.id} value={c.id}>[{type}] {c.label || '알 수 없는 카메라 장치'}</option>;
                      })}
                    </select>
                  </div>
                )}
                {isScanning && (
                  <button
                    disabled={isSwitching}
                    onClick={async () => {
                      setSelectedCamera(''); // 전환 시 자동 모드로 복귀
                    if (isSwitching) return;
                    setIsSwitching(true);
                    try {
                      await stopScanner();
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

      <BarcodeLibrary all={barcodes} rows={visibleBarcodes} folders={folders} folder={currentFolder} query={searchQuery} sort={sortOrder}
        selected={selectedIds} loading={libraryLoading} error={libraryError} onRetry={fetchBarcodes}
        onFolder={changeFolder} onQuery={changeQuery} onSort={setSortOrder} onSelect={setSelectedIds}
        quickFilter={smartFilter} filterCounts={filterCounts} onQuickFilter={changeQuickFilter} onResetFilters={resetFilters}
        onScan={openScanner} onManual={() => setEntryItem('new')} onExport={exportExcel}
        onMove={() => setMoveModal({isOpen:true, ids:selectedIds, targetFolder:currentFolder === '전체'?'기본폴더':currentFolder, type:'barcode', sourceFolder:''})}
        onDelete={handleMultiDelete} onCopy={copyBarcode} onEdit={setEntryItem} onMore={setActiveGlobalMenu}/>
            {/* Floating Action Button for Scanner */}

          </div>
        )}

        {/* Tab: Folders */}
        {activeTab === 'folders' && (
          <div className="workspace-folders flex flex-row min-h-0">

            {/* Desktop Sidebar Tree View */}
            <div className="hidden md:flex w-72 shrink-0 border-r border-slate-200/50 dark:border-white/10 flex-col bg-white/40 dark:bg-darkBg/40 backdrop-blur-xl">
              <div className="p-5 pb-2 font-bold text-lg text-slate-800 dark:text-slate-200 border-b border-transparent">
                탐색기
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 flex flex-col gap-1">
                <button
                  onClick={() => setExplorerPath('')}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-[14px] transition-all text-sm ${explorerPath === '' ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 font-medium'}`}
                >
                  <IconHome size={18} /> 전체 폴더
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
                      className={`w-full flex items-center gap-2 pr-3 py-2 rounded-[14px] transition-all text-sm ${isExact ? 'bg-primary/10 text-primary font-bold shadow-sm' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/10 font-medium'}`}
                    >
                      {isExact ? <IconFolderOpen size={18} /> : <IconFolderFilled size={18} className="text-primary" />}
                      <span className="truncate">{name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative">

            {/* Breadcrumb Header */}
            <div className="flex-none p-4 pb-2 bg-white/80 dark:bg-darkCard/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 z-10 sticky top-0 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar whitespace-nowrap text-lg font-bold text-slate-800 dark:text-white">
                  <button onClick={() => setExplorerPath('')} className="hover:text-primary transition-colors">전체 폴더</button>
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
                    <button aria-label="현재 폴더 관리" onClick={() => setFolderActionModal(explorerPath)} className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
                      <IconEdit size={20} />
                    </button>
                  )}

                  <button onClick={() => handleAddFolder(explorerPath)} aria-label="현재 위치에 새 폴더 만들기" className="p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors flex items-center gap-1" title="새 폴더">
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
                  <div className="pb-8">
                    <div className="bg-white dark:bg-darkCard rounded-[24px] shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden flex flex-col">

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
                        className="flex flex-col"
                        animation={200}
                        delayOnTouchOnly={true}
                        delay={150}
                        ghostClass="opacity-40 bg-slate-50 dark:bg-white/5"
                      >
                      {subfoldersList.map((item, idx) => {
                        const name = item.name;
                        const fullPath = item.fullPath;
                        const count = barcodes.filter(b => {
                          const bFolder = b.folder || '기본폴더';
                          return bFolder === fullPath || bFolder.startsWith(fullPath + '/');
                        }).length;

                        const isLastFolder = idx === subfoldersList.length - 1 && files.length === 0;

                        return (
                          <div
                            key={fullPath}
                            onClick={(e) => {
                              if (Date.now() - folderLongPressTime.current < 500) { e.preventDefault(); e.stopPropagation(); return; }
                              setExplorerPath(fullPath);
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setFolderActionModal(fullPath);
                            }}
                            onPointerDown={(e) => {
                              folderStartY.current = e.clientY;
                              folderPressTimer.current = setTimeout(() => {
                                folderPressTimer.current = null;
                                folderLongPressTime.current = Date.now();
                                setFolderActionModal(fullPath);
                                triggerHaptic('heavy');
                              }, 600);
                            }}
                            onPointerMove={(e) => {
                              if (folderPressTimer.current && Math.abs(e.clientY - folderStartY.current) > 10) {
                                clearTimeout(folderPressTimer.current);
                                folderPressTimer.current = null;
                              }
                            }}
                            onPointerUp={() => {
                              if (folderPressTimer.current) {
                                clearTimeout(folderPressTimer.current);
                                folderPressTimer.current = null;
                              }
                            }}
                            onPointerLeave={() => {
                              if (folderPressTimer.current) {
                                clearTimeout(folderPressTimer.current);
                                folderPressTimer.current = null;
                              }
                            }}
                            className={`p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors active:bg-slate-100 dark:active:bg-white/10 ${!isLastFolder ? 'border-b border-slate-100 dark:border-white/5' : ''}`}
                          >
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-primary rounded-[14px] flex items-center justify-center shrink-0">
                              <IconFolderFilled size={22} className="text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <button className="font-bold text-[15px] text-slate-800 dark:text-slate-100 text-left break-words" onClick={e => { e.stopPropagation(); setExplorerPath(fullPath); }} aria-label={name + ' 폴더 열기'}>{name}</button>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[12px] text-slate-400 font-medium whitespace-nowrap">{count}개</span>
                              <button className="ws-icon-button" aria-label={name + ' 폴더 관리'} onClick={e => { e.stopPropagation(); setFolderActionModal(fullPath); }}><IconDotsVertical size={20}/></button>
                              <IconChevronRight size={16} className="text-slate-300 dark:text-slate-600" />
                            </div>
                          </div>
                        );
                      })}
                      </ReactSortable>

                      {/* Folder contents reuse the library's visible copy/edit/more controls. */}
                      {files.map(b => (
                        <div key={b.id} className="folder-barcode-row">
                          <IconBarcode size={24} className="text-primary shrink-0" aria-hidden="true"/>
                          <div className="folder-barcode-content">
                            {b.memo && <strong>{b.memo}</strong>}
                            {renderFormattedCode(b.code)}
                          </div>
                          <div className="folder-barcode-actions">
                            <button className="ws-icon-button" aria-label={b.code + ' 바코드 복사'} onClick={() => void copyBarcode(b.code)}><IconCopy size={19}/></button>
                            <button className="ws-icon-button" aria-label={b.code + ' 수정'} onClick={() => setEntryItem(b)}><IconEdit size={19}/></button>
                            <button className="ws-icon-button" aria-label={b.code + ' 더보기'} onClick={() => setActiveGlobalMenu(b.id)}><IconDotsVertical size={19}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          </div>
        )}

        {activeTab === 'settings' && (
          <div className="workspace-settings">
          <div className="bg-white dark:bg-darkCard rounded-[24px] shadow-sm border border-slate-100/50 dark:border-white/5 border border-slate-100/50 dark:border-white/5 overflow-hidden min-h-[500px]">
            <div className="p-6 border-b border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-darkBg/30">
              <h2 className="font-bold flex items-center gap-2 text-xl"><IconSettings className="text-primary" size={24} aria-hidden="true" /> 환경설정</h2>
            </div>

            <div className="p-4 sm:p-6 w-full flex flex-col gap-8">
                {/* 기본 설정 */}
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 font-bold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">기본 설정</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-darkCard p-5 rounded-[24px] border border-slate-100/50 dark:border-white/5 flex flex-col gap-4 shadow-sm hover:shadow-lg transition-all">
                      <div className="flex items-center gap-3 text-pink-500">
                        <div className="bg-pink-100 dark:bg-pink-900/30 p-2 rounded-lg">
                          <IconBell size={24} aria-hidden="true" />
                        </div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">시스템 알림</h4>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">새 바코드 공유 및 공지사항 알림을 받습니다.</p>
                      <button onClick={() => {
                        if ('Notification' in window) {
                          Notification.requestPermission().then(perm => {
                            if(perm === 'granted') toast.success('알림 권한이 허용되었습니다.');
                            else toast.error('알림 권한이 거부/차단되었습니다.');
                          });
                        }
                      }} className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm focus-visible:outline-none">
                        알림 권한 요청
                      </button>
                    </div>

                    <div className="bg-white dark:bg-darkCard p-5 rounded-[24px] border border-slate-100/50 dark:border-white/5 flex flex-col gap-4 shadow-sm hover:shadow-lg transition-all">
                      <div className="flex items-center gap-3 text-amber-500">
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                          {darkMode ? <IconMoon size={24} aria-hidden="true" /> : <IconSun size={24} aria-hidden="true" />}
                        </div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">테마 설정</h4>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">눈의 피로를 줄이기 위해 다크 모드를 사용할 수 있습니다.</p>
                      <button onClick={() => setDarkMode(!darkMode)} className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm focus-visible:outline-none">
                        {darkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
                      </button>
                    </div>

                    <div className="bg-white dark:bg-darkCard p-5 rounded-[24px] border border-slate-100/50 dark:border-white/5 flex flex-col gap-4 shadow-sm hover:shadow-lg transition-all">
                      <div className="flex items-center gap-3 text-emerald-500">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                          <IconRocket size={24} aria-hidden="true" />
                        </div>
                        <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">앱 버전 정보</h4>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">현재 설치된 웹바코드 버전을 확인합니다.</p>
                      <div className="w-full bg-slate-50 dark:bg-darkBg/50 border border-slate-100 dark:border-white/5 py-2.5 rounded-lg flex justify-center items-center gap-2">
                        <span className="font-mono text-slate-500 font-bold tracking-wider">v{packageJson.version}</span>
                        {latestVersion && latestVersion !== packageJson.version && (
                          <a href={`https://github.com/LeeAn0121/WebBarcode/releases/tag/v${latestVersion}`} target="_blank" rel="noopener noreferrer" className="ml-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold transition-colors hover:bg-primary/20">
                            업데이트 가능
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </section>


              {/* 내보내기 영역 */}
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300 font-bold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">데이터 백업 및 복원</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-darkCard p-5 rounded-[24px] border border-slate-100/50 dark:border-white/5 flex flex-col gap-4 shadow-sm border border-slate-100/50 dark:border-white/5 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 text-primary">
                      <div className="bg-blue-100 dark:bg-indigo-900/30 p-2 rounded-lg">
                        <IconCloudDownload size={24} aria-hidden="true" />
                      </div>
                      <h4 className="font-bold text-lg text-slate-800 dark:text-slate-100">JSON 백업</h4>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 leading-relaxed">현재 앱에 저장된 모든 바코드 데이터를 JSON 파일로 안전하게 다운로드합니다.</p>
                    <button onClick={handleBackup} className="w-full bg-indigo-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">백업 파일 다운로드</button>
                  </div>

                  <div className="bg-white dark:bg-darkCard p-5 rounded-[24px] border border-slate-100/50 dark:border-white/5 flex flex-col gap-4 shadow-sm border border-slate-100/50 dark:border-white/5 hover:shadow-lg transition-all">
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
                <div className="bg-white dark:bg-darkCard p-5 rounded-[24px] border border-slate-100/50 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm border border-slate-100/50 dark:border-white/5">
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
                  <button onClick={handleDeleteAll} className="w-full sm:w-auto shrink-0 bg-white dark:bg-darkCard border-2 border-red-500 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white font-semibold py-3 px-6 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">
                    영구 삭제 진행
                  </button>
                </div>
              </section>

            </div>
          </div>
          </div>
        )}
          </div>

      </main>

        {/* Modals */}

        {/* Notice History Popup */}
        {isNoticeHistoryOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsNoticeHistoryOpen(false)} id="notice-dialog" tabIndex={-1} role="dialog" aria-modal="true" aria-label="공지사항">
            <div className="bg-[#f7f8fc] dark:bg-darkBg w-full max-w-sm max-h-[80vh] rounded-[2rem] shadow-2xl flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 overflow-hidden border border-slate-100 dark:border-white/5" onClick={e => e.stopPropagation()}>
              <div className="p-5 bg-white dark:bg-darkCard border-b border-slate-100 dark:border-white/5 flex justify-between items-center shrink-0">
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
                  <button aria-label="공지사항 닫기" onClick={() => setIsNoticeHistoryOpen(false)} className="p-1 -m-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
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
                      className={`p-4 rounded-2xl shadow-sm transition-colors cursor-pointer border ${notice.read ? 'bg-white dark:bg-darkCard border-transparent dark:border-white/5 opacity-70' : 'bg-white dark:bg-darkCard border-primary/30 dark:border-primary/50'}`}
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
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setFolderActionModal(null)} id="folder-dialog" tabIndex={-1} role="dialog" aria-modal="true" aria-label="폴더 관리 작업">
            <div className="bg-white/80 dark:bg-darkCard/80 backdrop-blur-2xl border border-white/50 dark:border-white/10 w-full max-w-sm rounded-[2.5rem] shadow-2xl p-6 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
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

                <button onClick={() => { handleShareFolder(folderActionModal); setFolderActionModal(null); }} className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-600 hover:text-primary dark:text-slate-400 fluid-spring">
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
                    <span className="font-bold text-sm">이름 변경</span>
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
        {promptModal.isOpen && <ActionDialog key={promptModal.title} {...promptModal}
          onClose={() => setPromptModal(prev => ({ ...prev, isOpen: false }))} />}

        {shareConfig.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShareConfig({ ...shareConfig, isOpen: false })} id="share-config-dialog" tabIndex={-1} role="dialog" aria-modal="true" aria-label={shareConfig.type === 'invite' ? '협업 방 초대' : '공유 링크 생성'}>
            <div className="bg-white dark:bg-darkCard w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
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
                  className="w-full appearance-none bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-slate-700 rounded-xl p-3 pr-10 text-sm font-medium focus:ring-2 focus:ring-primary outline-none text-slate-700 dark:text-slate-200"
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setGenModal({ ...genModal, isOpen: false })} id="generate-dialog" tabIndex={-1} role="dialog" aria-modal="true" aria-label="QR 및 바코드 생성">
            <div className="bg-white/60 dark:bg-darkBg/40 backdrop-blur-md border border-white/40 dark:border-white/5 w-full max-w-sm rounded-[2rem] shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-center" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-black dark:text-white mb-4">QR/바코드 생성</h3>
              <input aria-label="생성할 텍스트 또는 URL" type="text" value={genModal.text} onChange={e => setGenModal({...genModal, text: e.target.value})} placeholder="텍스트나 URL을 입력하세요" className="w-full bg-white dark:bg-darkCard border-none rounded-2xl p-4 text-base font-medium focus:ring-2 focus:ring-primary outline-none mb-6 shadow-sm" />

              {genModal.text && (
                <div className="bg-white p-4 rounded-3xl mx-auto w-fit mb-6 shadow-sm">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(genModal.text)}`} alt="Generated QR" className="w-48 h-48 mx-auto rounded-xl" />
                </div>
              )}

              <button onClick={() => setGenModal({ ...genModal, isOpen: false })} className="w-full py-4 bg-slate-200 dark:bg-darkCard hover:bg-slate-300 text-black dark:text-white font-bold rounded-2xl transition-colors">닫기</button>
            </div>
          </div>
        )}
        {shareModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShareModal({ isOpen: false, url: '', title: '', description: '', shareText: '' })} id="share-dialog" tabIndex={-1} role="dialog" aria-modal="true" aria-label={shareModal.title}>
            <div className="bg-white dark:bg-darkCard w-full max-w-sm rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-center" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">{shareModal.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{shareModal.description}</p>

              <div className="bg-white p-3 rounded-2xl mx-auto w-fit mb-5 shadow-inner border border-slate-100">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareModal.url)}`} alt="Share QR" className="w-40 h-40 mx-auto" />
              </div>
              <p className="text-xs text-slate-400 mb-4">위 QR코드를 WebBarcode 앱의 카메라로 스캔하거나,<br/>아래 링크를 복사하여 공유하세요.</p>

              <div className="flex gap-2 mb-6">
                <label htmlFor="share-url" className="sr-only">공유 링크</label>
                <input id="share-url" type="text" readOnly value={shareModal.url} className="w-full bg-slate-50 dark:bg-darkBg border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 outline-none" />
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
            <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4 transition-all" onClick={() => {setActiveActionMenu(null); setActiveGlobalMenu(null);}} id="action-dialog" tabIndex={-1} role="dialog" aria-modal="true" aria-label={`${item.code} 작업 메뉴`}>
              <div className="bg-white dark:bg-darkCard w-full sm:max-w-sm rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto my-3 sm:hidden"></div>
                <div className="px-6 pb-4 pt-2 flex flex-col">
                  <span className="font-mono font-bold text-xl text-black dark:text-white truncate">{item.code}</span>
                  <span className="text-sm font-bold text-slate-500 mt-1">{item.folder || '기본폴더'}</span>
                </div>
                <div className="px-5 pb-8 sm:pb-5">
                  {/* Primary Actions Grid */}
                  <div className="grid grid-cols-4 gap-3 mb-4" role="menu">
                    <button role="menuitem" onClick={() => { void copyBarcode(item.code); triggerHaptic('success'); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex flex-col items-center justify-center gap-2 p-3 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-[18px] transition-all active:scale-95 text-slate-700 dark:text-slate-200">
                      <IconCopy size={26} />
                      <span className="text-[11px] font-bold">복사</span>
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
                    <button role="menuitem" onClick={() => { handleEditMemo(item.id, item.memo); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-darkBg/20 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-colors text-slate-700 dark:text-slate-200 font-bold">
                      <div className="flex items-center gap-3"><IconMessagePlus size={20} className="text-primary" /> 메모 추가 및 수정</div>
                      <IconChevronRight size={18} className="text-slate-400" />
                    </button>
                    <button role="menuitem" onClick={() => { handleEditCode(item.id, item.code); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-darkBg/20 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-colors text-slate-700 dark:text-slate-200 font-bold">
                      <div className="flex items-center gap-3"><IconEdit size={20} className="text-amber-500" /> 바코드 번호 직접 수정</div>
                      <IconChevronRight size={18} className="text-slate-400" />
                    </button>
                    <button role="menuitem" onClick={() => { handleClone(item); {setActiveActionMenu(null); setActiveGlobalMenu(null);} }} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-darkBg/20 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-colors text-slate-700 dark:text-slate-200 font-bold">
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
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200" onClick={() => setMoveModal(prev => ({ ...prev, isOpen: false }))} id="move-dialog" tabIndex={-1} role="dialog" aria-modal="true" aria-label="이동 위치 선택">
            <div className="bg-white dark:bg-darkCard w-full sm:max-w-sm rounded-t-[32px] sm:rounded-[24px] shadow-2xl p-6 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200 flex flex-col max-h-[80svh]" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">이동할 위치 선택</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                {moveModal.type === 'barcode' ? `선택한 바코드 ${moveModal.ids.length}개를 이동합니다.` : `'${moveModal.sourceFolder.split('/').pop()}' 폴더를 이동합니다.`}
              </p>

              <div className="flex-1 overflow-y-auto custom-scrollbar mb-6 border border-slate-100/50 dark:border-white/5 rounded-[24px] p-2 bg-slate-50 dark:bg-darkBg/20 flex flex-col gap-1">
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


      {entryItem && <EntryDialog folders={folders} editing={entryItem !== 'new'}
        initial={entryItem === 'new' ? {code:'',memo:'',folder:currentFolder==='전체'?'기본폴더':currentFolder} : {code:entryItem.code,memo:entryItem.memo||'',folder:entryItem.folder||'기본폴더'}}
        onClose={() => setEntryItem(null)} onSave={saveEntry}/>}

      </AppShell>
    </div>
    </>
  );
}

export default App;
