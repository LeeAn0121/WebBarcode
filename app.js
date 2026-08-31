// TODO: Replace with your Supabase Project Details
// 1. Go to Supabase Dashboard (https://supabase.com/dashboard)
// 2. Create a project
// 3. Get Project URL and anon public key from Settings -> API
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
        const { data, error } = await supabase
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
const channel = supabase
    .channel('public:barcodes')
    .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'barcodes' },
        (payload) => {
            console.log('New barcode received!', payload.new);
            emptyState.style.display = 'none';
            totalScans++;
            updateScanCount();
            addBarcodeToList(payload.new, true);
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

function addBarcodeToList(data, isNew = false) {
    const li = document.createElement('li');
    li.className = `bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isNew ? 'item-enter' : ''}`;
    
    // Fallback to Date.now() if created_at is missing
    const timeValue = data.created_at ? new Date(data.created_at) : new Date();
    const timeString = timeValue.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const userShort = data.user_id || 'Unknown';
    
    li.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-primary flex-shrink-0">
                <i class="fa-solid fa-barcode"></i>
            </div>
            <div>
                <p class="font-bold text-slate-800 text-lg tracking-wide">${data.code}</p>
                <p class="text-xs text-slate-400 mt-0.5 sm:hidden">${timeString}</p>
            </div>
        </div>
        <div class="flex items-center gap-2 self-start sm:self-auto">
            <span class="hidden sm:inline-block text-xs text-slate-400">${timeString}</span>
            <span class="bg-slate-100 text-slate-500 text-[10px] uppercase font-bold px-2 py-1 rounded-md">User: ${userShort}</span>
        </div>
    `;
    
    barcodeList.prepend(li);
    
    if (isNew && navigator.vibrate) {
        navigator.vibrate(50);
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

    // Save to Supabase
    const { error } = await supabase
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
    ).catch(err => {
        console.error(`Error starting scanner: ${err}`);
        alert("카메라를 시작할 수 없습니다.");
    });
}
