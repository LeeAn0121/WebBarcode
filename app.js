// TODO: Replace with your Supabase Project Details
// 1. Go to Supabase Dashboard (https://supabase.com/dashboard)
// 2. Create a project
// 3. Get Project URL and anon public key from Settings -> API
const SUPABASE_URL = 'https://otxmccqqpfirmytlrchl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90eG1jY3FxcGZpcm15dGxyY2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxOTIxNDUsImV4cCI6MjEwMzc2ODE0NX0.ZklBr-UroChsHlT9MggagEny_lRKE6yyWFb3RKVVKqY';

// Initialize Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State variables
let allBarcodes = [];
let isSoundEnabled = true;

// DOM Elements
const barcodeList = document.getElementById('barcode-list');
const requestCameraBtn = document.getElementById('request-camera-btn');
const cameraSelect = document.getElementById('camera-select');
const cameraSelectIcon = document.getElementById('camera-select-icon');
const readerPlaceholder = document.getElementById('reader-placeholder');
const emptyState = document.getElementById('empty-state');
const noResultsState = document.getElementById('no-results-state');
const scanCount = document.getElementById('scan-count');
const connectionStatus = document.getElementById('connection-status');
const liveIndicator = document.getElementById('live-indicator');
const liveIndicatorPing = document.getElementById('live-indicator-ping');
const searchInput = document.getElementById('search-input');
const exportExcelBtn = document.getElementById('export-excel-btn');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const themeToggleBtn = document.getElementById('theme-toggle');

let html5QrCode;
let totalScans = 0;

// Theme Toggle Logic
const currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
if (currentTheme) {
    document.documentElement.classList.add(currentTheme);
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
}

themeToggleBtn.addEventListener('click', () => {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
});

// Sound Toggle Logic
soundToggleBtn.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    const icon = soundToggleBtn.querySelector('i');
    if (isSoundEnabled) {
        icon.className = 'fa-solid fa-volume-high text-lg';
        soundToggleBtn.classList.remove('text-slate-400');
        soundToggleBtn.classList.add('text-primary', 'dark:text-indigo-400');
    } else {
        icon.className = 'fa-solid fa-volume-xmark text-lg';
        soundToggleBtn.classList.remove('text-primary', 'dark:text-indigo-400');
        soundToggleBtn.classList.add('text-slate-400');
    }
});

// Sound effect for scan results
function playSound(type = 'success') {
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

// Excel Export Logic
exportExcelBtn.addEventListener('click', () => {
    if (allBarcodes.length === 0) {
        alert("내보낼 데이터가 없습니다.");
        return;
    }
    
    const exportData = allBarcodes.map(item => ({
        '바코드': item.code,
        '메모': item.memo || '',
        '스캔시간': new Date(item.created_at || Date.now()).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "바코드 스캔 기록");
    
    // Auto-size columns roughly
    const wscols = [ {wch:25}, {wch:30}, {wch:25} ];
    worksheet['!cols'] = wscols;

    const filename = `WebBarcode_Export_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.xlsx`;
    XLSX.writeFile(workbook, filename);
});

// Search Logic
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    let matchCount = 0;
    
    const listItems = barcodeList.querySelectorAll('li.barcode-item');
    listItems.forEach(li => {
        const textContent = li.textContent.toLowerCase();
        if (textContent.includes(searchTerm)) {
            li.style.display = 'flex';
            matchCount++;
        } else {
            li.style.display = 'none';
        }
    });

    if (matchCount === 0 && listItems.length > 0) {
        noResultsState.style.display = 'flex';
        emptyState.style.display = 'none';
    } else {
        noResultsState.style.display = 'none';
        if (listItems.length === 0) emptyState.style.display = 'flex';
    }
});

function setConnectionStatus(status) {
    if (status === 'connected') {
        connectionStatus.textContent = 'Live';
        liveIndicator.classList.replace('bg-red-500', 'bg-secondary');
        liveIndicatorPing.classList.replace('bg-red-500', 'bg-secondary');
        liveIndicatorPing.style.display = 'inline-flex';
    } else {
        connectionStatus.textContent = 'Disconnected';
        liveIndicator.classList.replace('bg-secondary', 'bg-red-500');
        liveIndicatorPing.style.display = 'none';
    }
}

// Fetch initial data
async function loadInitialData() {
    try {
        const { data, error } = await supabaseClient
            .from('barcodes')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        if (data && data.length > 0) {
            emptyState.style.display = 'none';
            allBarcodes = data;
            totalScans = data.length;
            updateScanCount();
            
            data.reverse().forEach(item => {
                addBarcodeToList(item, false);
            });
            
            if (window.location.hash) {
                setTimeout(() => {
                    const targetEl = document.querySelector(window.location.hash);
                    if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        targetEl.classList.add('bg-indigo-100', 'dark:bg-indigo-900'); 
                        setTimeout(() => targetEl.classList.remove('bg-indigo-100', 'dark:bg-indigo-900'), 2000);
                    }
                }, 500);
            }
        }
    } catch (err) {
        console.error("Error loading initial data:", err);
    }
}

// Subscribe to real-time changes
const channel = supabaseClient
    .channel('public:barcodes')
    .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barcodes' },
        (payload) => {
            if (payload.eventType === 'INSERT') {
                emptyState.style.display = 'none';
                noResultsState.style.display = 'none';
                allBarcodes.unshift(payload.new);
                totalScans++;
                updateScanCount();
                addBarcodeToList(payload.new, true);
                
                // Re-apply search filter to new item if search is active
                if(searchInput.value) {
                    searchInput.dispatchEvent(new Event('input'));
                }
            } else if (payload.eventType === 'UPDATE') {
                const index = allBarcodes.findIndex(b => b.id === payload.new.id);
                if(index !== -1) allBarcodes[index] = payload.new;
                updateBarcodeInList(payload.new);
                
                if(searchInput.value) searchInput.dispatchEvent(new Event('input'));
            } else if (payload.eventType === 'DELETE') {
                allBarcodes = allBarcodes.filter(b => b.id !== payload.old.id);
                removeBarcodeFromList(payload.old.id);
            }
        }
    )
    .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            setConnectionStatus('disconnected');
        }
    });

loadInitialData();

function updateScanCount() {
    scanCount.textContent = `${totalScans}건`;
}

function removeBarcodeFromList(id) {
    const li = document.getElementById(`barcode-${id}`);
    if (li) {
        li.remove();
        totalScans = Math.max(0, totalScans - 1);
        updateScanCount();
        if (totalScans === 0 && emptyState) {
            emptyState.style.display = 'flex';
            noResultsState.style.display = 'none';
        }
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `flex items-center p-4 mb-2 text-sm rounded-xl shadow-lg transition-all duration-300 transform translate-y-10 opacity-0 ${
        type === 'success' ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900' :
        type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'
    }`;
    
    const icon = type === 'success' ? '<i class="fa-solid fa-check-circle mr-3 text-lg text-emerald-400 dark:text-emerald-500"></i>' 
                 : '<i class="fa-solid fa-circle-exclamation mr-3 text-lg"></i>';
                 
    toast.innerHTML = `${icon} <span class="font-medium">${message}</span>`;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    }, 10);
    
    // Animate out
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('-translate-y-4', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function updateBarcodeInList(data) {
    const codeElement = document.getElementById(`barcode-text-${data.id}`);
    const li = document.getElementById(`barcode-${data.id}`);
    
    if (li && codeElement) {
        li.remove();
        
        const timeValue = data.created_at ? new Date(data.created_at) : new Date();
        const timeString = timeValue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const isNewItem = false;
        
        const newHtml = generateBarcodeCardHtml(data, timeString, isNewItem);
        
        // Re-create li
        const newLi = document.createElement('li');
        newLi.id = `barcode-${data.id}`;
        newLi.className = `barcode-item bg-white dark:bg-darkCard p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col gap-3 transition-all duration-300 hover:shadow-md hover:border-primary/30 dark:hover:border-primary/50 group`;
        newLi.innerHTML = newHtml;
        
        barcodeList.insertBefore(newLi, newLi.nextSibling);
        newLi.classList.add('bg-indigo-50/50', 'dark:bg-indigo-900/20');
        setTimeout(() => newLi.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/20'), 1500);
    }
}

window.deleteBarcode = async (id) => {
    if(confirm('이 스캔 기록을 삭제하시겠습니까?')) {
        const { error } = await supabaseClient.from('barcodes').delete().eq('id', id);
        if(error) showToast('삭제 실패: ' + error.message, 'error');
        else showToast('기록이 삭제되었습니다.');
    }
};

window.editBarcode = async (id, currentCode) => {
    const newCode = prompt('바코드 내용을 수정하세요:', currentCode);
    if(newCode !== null && newCode.trim() !== '' && newCode !== currentCode) {
        const { error } = await supabaseClient.from('barcodes').update({ code: newCode.trim() }).eq('id', id);
        if(error) showToast('수정 실패: ' + error.message, 'error');
        else showToast('바코드가 수정되었습니다.');
    }
};

window.editMemo = async (id, currentMemo) => {
    const newMemo = prompt('메모를 입력하세요 (비워두면 메모가 삭제됩니다):', currentMemo);
    if(newMemo !== null && newMemo !== currentMemo) {
        const { error } = await supabaseClient.from('barcodes').update({ memo: newMemo.trim() }).eq('id', id);
        if(error) showToast('메모 저장 실패: ' + error.message, 'error');
        else showToast(newMemo.trim() === '' ? '메모가 삭제되었습니다.' : '메모가 저장되었습니다.');
    }
};

window.copyBarcode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
        showToast('바코드 번호가 복사되었습니다.');
    });
};

window.shareBarcode = async (id, code, timeString, memo) => {
    let shareText = `[WebBarcode]\n\n바코드: ${code}\n스캔시간: ${timeString}`;
    
    if (memo && memo.trim() !== '' && memo !== 'null') {
        shareText += `\n메모: ${memo}`;
    }
    
    shareText += `\n\n아래 링크에서 확인하세요:`;
    const shareUrl = window.location.origin + window.location.pathname + '#barcode-' + id;

    if (navigator.share) {
        try {
            await navigator.share({
                text: shareText,
                url: shareUrl
            });
        } catch (err) {
            console.error('공유 취소 또는 실패', err);
        }
    } else {
        const fullText = `${shareText}\n${shareUrl}`;
        navigator.clipboard.writeText(fullText).then(() => {
            showToast('공유 내용이 클립보드에 복사되었습니다.');
        });
    }
};

function generateBarcodeCardHtml(data, timeString, isNew) {
    const memoText = (data.memo && data.memo.trim() !== '') ? data.memo : null;
    let memoHtml = '';
    if (memoText) {
        memoHtml = `
        <div class="mt-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2.5 flex items-start gap-2 border border-slate-100 dark:border-slate-800">
            <i class="fa-solid fa-quote-left text-slate-300 dark:text-slate-600 text-xs mt-0.5"></i>
            <p class="text-sm text-slate-600 dark:text-slate-300 font-medium break-all flex-1">${memoText}</p>
        </div>`;
    }
    
    const escapedCode = data.code.replace(/'/g, "\\'");
    const escapedMemo = memoText ? memoText.replace(/'/g, "\\'") : '';
    
    const badgeHtml = isNew ? `<span class="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 uppercase tracking-wide">New</span>` : '';

    return `
        <div class="flex items-start justify-between gap-3 w-full">
            <div class="flex items-center gap-3 overflow-hidden flex-1">
                <div class="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/10 flex items-center justify-center text-primary dark:text-indigo-400 flex-shrink-0 border border-indigo-100/50 dark:border-indigo-500/20 group-hover:scale-105 transition-transform">
                    <i class="fa-solid fa-barcode text-lg sm:text-xl"></i>
                </div>
                <div class="overflow-hidden flex-1 flex flex-col justify-center">
                    <div class="flex items-center">
                        <p id="barcode-text-${data.id}" class="font-mono font-semibold text-slate-800 dark:text-slate-100 text-base sm:text-lg tracking-tight truncate">${data.code}</p>
                        ${badgeHtml}
                    </div>
                    <p class="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5"><i class="fa-regular fa-clock mr-1 opacity-70"></i>${timeString}</p>
                </div>
            </div>
            
            <div class="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800 flex-shrink-0">
                <button onclick="copyBarcode('${escapedCode}')" class="text-slate-400 hover:text-primary dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 p-1.5 sm:p-2 rounded-lg transition-all" title="복사하기">
                    <i class="fa-regular fa-copy"></i>
                </button>
                <button onclick="shareBarcode('${data.id}', '${escapedCode}', '${timeString}', '${escapedMemo}')" class="text-slate-400 hover:text-primary dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 p-1.5 sm:p-2 rounded-lg transition-all" title="공유하기">
                    <i class="fa-solid fa-share-nodes"></i>
                </button>
                <div class="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                <button onclick="editMemo('${data.id}', '${escapedMemo}')" class="text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 p-1.5 sm:p-2 rounded-lg transition-all" title="메모 추가/수정">
                    <i class="fa-solid fa-comment-medical"></i>
                </button>
                <button onclick="editBarcode('${data.id}', document.getElementById('barcode-text-${data.id}').textContent)" class="text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-slate-800 p-1.5 sm:p-2 rounded-lg transition-all" title="수정하기">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button onclick="deleteBarcode('${data.id}')" class="text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 p-1.5 sm:p-2 rounded-lg transition-all" title="삭제하기">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
        ${memoHtml}
    `;
}

function addBarcodeToList(data, isNew = false) {
    const li = document.createElement('li');
    li.id = `barcode-${data.id}`;
    li.className = `barcode-item bg-white dark:bg-darkCard p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50 flex flex-col gap-3 transition-all duration-300 hover:shadow-md hover:border-primary/30 dark:hover:border-primary/50 group ${isNew ? 'item-enter' : ''}`;
    
    const timeValue = data.created_at ? new Date(data.created_at) : new Date();
    const timeString = timeValue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    li.innerHTML = generateBarcodeCardHtml(data, timeString, isNew);
    
    barcodeList.prepend(li);
    
    if (isNew && navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Handle Barcode Scan
let lastScannedCode = null;
let scanTimeout = null;

const pendingInserts = new Set();

async function onScanSuccess(decodedText, decodedResult) {
    const cleanText = decodedText.trim();
    if (cleanText === lastScannedCode) return;
    lastScannedCode = cleanText;
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => { lastScannedCode = null; }, 2000);

    // Check for duplicate (both in DB list and currently inserting)
    const isDuplicate = allBarcodes.some(barcode => barcode.code === cleanText) || pendingInserts.has(cleanText);
    
    if (isDuplicate) {
        // Duplicate logic
        playSound('duplicate');
        showToast(`이미 등록된 바코드입니다: ${cleanText}`, 'error');
        return; // Prevent insertion
    }

    // New barcode logic
    pendingInserts.add(cleanText);
    playSound('success');

    // Save to Supabase
    const { error } = await supabaseClient
        .from('barcodes')
        .insert([
            { code: cleanText }
        ]);
        
    if (error) {
        console.error("Supabase insert error:", error);
        showToast("데이터를 저장하는데 실패했습니다. Supabase 설정을 확인해주세요.", "error");
        pendingInserts.delete(cleanText);
    } else {
        // Clean up pending after a few seconds (realtime will have picked it up by then)
        setTimeout(() => pendingInserts.delete(cleanText), 3000);
    }
}

function onScanFailure(error) {
    // Ignore routine scan failures
}

const zoomContainer = document.getElementById('zoom-control-container');
const zoomSlider = document.getElementById('zoom-slider');
let videoTrack = null;

function setupZoomControl() {
    zoomContainer.classList.add('hidden');
    
    const videoElem = document.querySelector('#reader video');
    if (!videoElem) return;

    const stream = videoElem.srcObject;
    if (!stream) return;

    const tracks = stream.getVideoTracks();
    if (tracks.length > 0) {
        videoTrack = tracks[0];
        
        setTimeout(() => {
            const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : null;
            if (capabilities && capabilities.zoom) {
                const minZoom = capabilities.zoom.min || 1;
                const maxZoom = capabilities.zoom.max || 5;
                const step = capabilities.zoom.step || 0.1;
                
                zoomSlider.min = minZoom;
                zoomSlider.max = maxZoom;
                zoomSlider.step = step;
                
                const settings = videoTrack.getSettings();
                zoomSlider.value = settings.zoom || minZoom;
                
                zoomContainer.classList.remove('hidden');
                zoomContainer.classList.add('flex');
                
                zoomSlider.oninput = async (e) => {
                    try {
                        await videoTrack.applyConstraints({
                            advanced: [{ zoom: parseFloat(e.target.value) }]
                        });
                    } catch (err) {
                        console.error("Zoom constraint failed", err);
                    }
                };
            }
        }, 500);
    }
}

// Camera Setup
requestCameraBtn.addEventListener('click', () => {
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            requestCameraBtn.style.display = 'none';
            cameraSelect.classList.remove('hidden');
            cameraSelect.classList.add('block');
            cameraSelectIcon.classList.remove('hidden');
            readerPlaceholder.style.display = 'none';
            
            cameraSelect.innerHTML = '';
            
            const rearCameras = devices.filter(d => 
                d.label.toLowerCase().includes('back') || 
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('environment')
            );
            
            const displayCameras = rearCameras.length > 0 ? rearCameras : devices;
            let defaultCameraId = displayCameras[0].id;
            
            displayCameras.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.id;
                
                let cameraName = device.label || `카메라 ${index + 1}`;
                let namePrefix = "";
                
                if (cameraName.toLowerCase().includes('back') || cameraName.toLowerCase().includes('rear') || cameraName.toLowerCase().includes('environment')) {
                    namePrefix = "[후면] ";
                } else if (cameraName.toLowerCase().includes('front') || cameraName.toLowerCase().includes('user')) {
                    namePrefix = "[전면] ";
                }
                
                option.text = `${namePrefix}${cameraName}`;
                cameraSelect.appendChild(option);
            });
            
            html5QrCode = new Html5Qrcode("reader");
            startScanner(defaultCameraId);
            
            cameraSelect.addEventListener('change', (e) => {
                html5QrCode.stop().then(() => {
                    zoomContainer.classList.add('hidden'); 
                    startScanner(e.target.value);
                }).catch(err => console.error("Camera switch error", err));
            });

        } else {
            alert("카메라를 찾을 수 없습니다.");
        }
    }).catch(err => {
        console.error(err);
        alert("카메라 권한을 얻는 데 실패했습니다: " + err);
    });
});

function startScanner(cameraId) {
    html5QrCode.start(
        cameraId, 
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        onScanSuccess,
        onScanFailure
    ).then(() => {
        setupZoomControl();
    }).catch(err => {
        console.error(`Error starting scanner: ${err}`);
        alert("카메라를 시작할 수 없습니다.");
    });
}
