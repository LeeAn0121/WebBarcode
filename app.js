// TODO: Replace with your Supabase Project Details
// 1. Go to Supabase Dashboard (https://supabase.com/dashboard)
// 2. Create a project
// 3. Get Project URL and anon public key from Settings -> API
const SUPABASE_URL = 'https://otxmccqqpfirmytlrchl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90eG1jY3FxcGZpcm15dGxyY2hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxOTIxNDUsImV4cCI6MjEwMzc2ODE0NX0.ZklBr-UroChsHlT9MggagEny_lRKE6yyWFb3RKVVKqY';

// Initialize Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Generate a random user ID for this session
const userId = Math.random().toString(36).substring(2, 8);

const barcodeList = document.getElementById('barcode-list');
const requestCameraBtn = document.getElementById('request-camera-btn');
const cameraSelect = document.getElementById('camera-select');
const cameraSelectIcon = document.getElementById('camera-select-icon');
const readerPlaceholder = document.getElementById('reader-placeholder');
const emptyState = document.getElementById('empty-state');
const scanCount = document.getElementById('scan-count');
const connectionStatus = document.getElementById('connection-status');
const liveIndicator = document.getElementById('live-indicator');
const liveIndicatorPing = document.getElementById('live-indicator-ping');

let html5QrCode;
let totalScans = 0;

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
            totalScans = data.length;
            updateScanCount();
            
            // Reverse so oldest of the 100 is at the bottom
            data.reverse().forEach(item => {
                addBarcodeToList(item, false);
            });
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
                totalScans++;
                updateScanCount();
                addBarcodeToList(payload.new, true);
            } else if (payload.eventType === 'UPDATE') {
                updateBarcodeInList(payload.new);
            } else if (payload.eventType === 'DELETE') {
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
        if (totalScans === 0 && emptyState) emptyState.style.display = 'flex';
    }
}

function updateBarcodeInList(data) {
    const codeElement = document.getElementById(`barcode-text-${data.id}`);
    if (codeElement) {
        codeElement.textContent = data.code;
        
        // Highlight briefly to show it was updated
        const li = document.getElementById(`barcode-${data.id}`);
        li.classList.add('bg-yellow-50');
        setTimeout(() => li.classList.remove('bg-yellow-50'), 1500);
    }
}

window.deleteBarcode = async (id) => {
    if(confirm('이 스캔 기록을 삭제하시겠습니까?')) {
        const { error } = await supabaseClient.from('barcodes').delete().eq('id', id);
        if(error) alert('삭제 실패: ' + error.message);
    }
};

window.editBarcode = async (id, currentCode) => {
    const newCode = prompt('바코드 내용을 수정하세요:', currentCode);
    if(newCode !== null && newCode.trim() !== '' && newCode !== currentCode) {
        const { error } = await supabaseClient.from('barcodes').update({ code: newCode.trim() }).eq('id', id);
        if(error) alert('수정 실패: ' + error.message);
    }
};

window.shareBarcode = async (code) => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: '스캔된 바코드',
                text: code
            });
        } catch (err) {
            console.error('공유 취소 또는 실패', err);
        }
    } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(code).then(() => {
            alert('바코드 텍스트가 클립보드에 복사되었습니다.');
        });
    }
};

function addBarcodeToList(data, isNew = false) {
    const li = document.createElement('li');
    li.id = `barcode-${data.id}`;
    li.className = `bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-300 ${isNew ? 'item-enter' : ''}`;
    
    // Fallback to Date.now() if created_at is missing
    const timeValue = data.created_at ? new Date(data.created_at) : new Date();
    const timeString = timeValue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    li.innerHTML = `
        <div class="flex items-center gap-3 overflow-hidden">
            <div class="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-primary flex-shrink-0">
                <i class="fa-solid fa-barcode"></i>
            </div>
            <div class="overflow-hidden">
                <p id="barcode-text-${data.id}" class="font-bold text-slate-800 text-lg tracking-wide truncate">${data.code}</p>
                <p class="text-xs text-slate-400 mt-0.5 sm:hidden">${timeString}</p>
            </div>
        </div>
        <div class="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
            <span class="hidden sm:inline-block text-xs text-slate-400 mr-2">${timeString}</span>
            <button onclick="shareBarcode('${data.code.replace(/'/g, "\\'")}')" class="text-slate-400 hover:text-primary transition-colors p-2" title="공유하기">
                <i class="fa-solid fa-share-nodes"></i>
            </button>
            <button onclick="editBarcode('${data.id}', document.getElementById('barcode-text-${data.id}').textContent)" class="text-slate-400 hover:text-emerald-500 transition-colors p-2" title="수정하기">
                <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="deleteBarcode('${data.id}')" class="text-slate-400 hover:text-red-500 transition-colors p-2" title="삭제하기">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `;
    
    barcodeList.prepend(li);
    
    if (isNew && navigator.vibrate) {
        navigator.vibrate(50);
    }
}

const zoomContainer = document.getElementById('zoom-control-container');
const zoomSlider = document.getElementById('zoom-slider');
let videoTrack = null;

// Sound effect for successful scan
function playBeepSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 800Hz
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.1);
    } catch(e) {
        console.warn("Web Audio API not supported", e);
    }
}

// Handle Barcode Scan
let lastScannedCode = null;
let scanTimeout = null;

async function onScanSuccess(decodedText, decodedResult) {
    if (decodedText === lastScannedCode) return;
    lastScannedCode = decodedText;
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => { lastScannedCode = null; }, 2000);

    // Play beep sound
    playBeepSound();

    // Save to Supabase
    const { error } = await supabaseClient
        .from('barcodes')
        .insert([
            { code: decodedText, user_id: userId }
        ]);
        
    if (error) {
        console.error("Supabase insert error:", error);
        alert("데이터를 저장하는데 실패했습니다. Supabase 설정을 확인해주세요.");
    }
}

function onScanFailure(error) {
    // Ignore routine scan failures
}

function setupZoomControl() {
    // Reset zoom slider
    zoomContainer.classList.add('hidden');
    
    // Try to get the video track from the reader's video element
    const videoElem = document.querySelector('#reader video');
    if (!videoElem) return;

    const stream = videoElem.srcObject;
    if (!stream) return;

    const tracks = stream.getVideoTracks();
    if (tracks.length > 0) {
        videoTrack = tracks[0];
        
        // Wait briefly for capabilities to be populated (sometimes takes a moment on mobile)
        setTimeout(() => {
            const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : null;
            if (capabilities && capabilities.zoom) {
                const minZoom = capabilities.zoom.min || 1;
                const maxZoom = capabilities.zoom.max || 5;
                const step = capabilities.zoom.step || 0.1;
                
                zoomSlider.min = minZoom;
                zoomSlider.max = maxZoom;
                zoomSlider.step = step;
                
                // Get current zoom setting
                const settings = videoTrack.getSettings();
                zoomSlider.value = settings.zoom || minZoom;
                
                zoomContainer.classList.remove('hidden');
                zoomContainer.classList.add('flex');
                
                // Remove old listeners to prevent duplicates
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
            
            let backCameraId = devices[0].id;
            devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.id;
                option.text = device.label || `Camera ${cameraSelect.length + 1}`;
                cameraSelect.appendChild(option);
                
                if (device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('rear')) {
                    backCameraId = device.id;
                    option.selected = true;
                }
            });
            
            html5QrCode = new Html5Qrcode("reader");
            startScanner(backCameraId);
            
            cameraSelect.addEventListener('change', (e) => {
                html5QrCode.stop().then(() => {
                    zoomContainer.classList.add('hidden'); // Hide zoom while switching
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
        // Scanner started successfully, setup zoom
        setupZoomControl();
    }).catch(err => {
        console.error(`Error starting scanner: ${err}`);
        alert("카메라를 시작할 수 없습니다.");
    });
}
