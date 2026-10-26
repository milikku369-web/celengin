// FIREBASE CONFIGURATION & INITIALIZATION
const firebaseConfig = {
    apiKey: "AIzaSyDVFoMedduyW951hA1a9FOpt4whm0NIFI",
    authDomain: "tabungin-app-74a2f.firebaseapp.com",
    projectId: "tabungin-app-74a2f",
    storageBucket: "tabungin-app-74a2f.firebasestorage.app",
    messagingSenderId: "291986020648",
    appId: "1:291986020648:web:3f74bb239afc7e3872181d",
    measurementId: "G-8X433506J"
};

// Inisialisasi Firebase & Firestore
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
const COLLECTION_NAME = "user_savings";

// PRESET IMAGES
const PRESET_IMAGES = {
    mac: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    iphone: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80',
    motor: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
    sepatu: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    konser: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    mobil: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    rumah: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80',
    kamera: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
    liburan: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80'
};

// GLOBAL APP STATE & USER AUTH STATE
let savingsData = [];
let currentDetailId = null;
let activeTab = 'berlangsung'; // 'berlangsung' | 'tercapai'
let currentSortField = 'nama'; // 'nama' | 'persen' | 'target' | 'terkumpul'
let currentSortOrder = 'asc'; // 'asc' | 'desc'
let currentTxType = 'deposit'; // 'deposit' | 'withdraw'
let editingTxId = null;
let selectedTxIdForModal = null;

// USER MANAGEMENT STATE
let currentUser = localStorage.getItem('tabungin_username') || '';
let currentAuthMode = 'login'; // 'login' | 'register'

// INITIALIZATION
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    if (!currentUser) {
        openModalUsername();
    } else {
        updateUserUI();
        await loadStorage();
    }
});

// AUTHENTICATION & USER MANAGEMENT
function openModalUsername() {
    switchAuthMode('login');
    document.getElementById('modalUsername')?.classList.remove('hidden');
}

function switchAuthMode(mode) {
    currentAuthMode = mode;
    const tabLogin = document.getElementById('tabAuthLogin');
    const tabRegister = document.getElementById('tabAuthRegister');
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const btn = document.getElementById('btnAuthSubmit');
    
    const activeClass = "flex-1 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#282838] text-blue-600 dark:text-white shadow transition";
    const inactiveClass = "flex-1 py-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition";

    if (mode === 'login') {
        if (tabLogin) tabLogin.className = activeClass;
        if (tabRegister) tabRegister.className = inactiveClass;
        if (title) title.innerText = "Masuk ke TABUNGin";
        if (subtitle) subtitle.innerText = "Masukkan username akunmu yang sudah terdaftar.";
        if (btn) btn.innerText = "Masuk ke Akun";
    } else {
        if (tabRegister) tabRegister.className = activeClass;
        if (tabLogin) tabLogin.className = inactiveClass;
        if (title) title.innerText = "Buat Akun Baru";
        if (subtitle) subtitle.innerText = "Buat username baru untuk mulai menabung di cloud.";
        if (btn) btn.innerText = "Daftar Akun Baru";
    }
}

async function handleAuthSubmit(e) {
    if (e) e.preventDefault();
    const rawInput = document.getElementById('inputAuthUsername')?.value || "";
    const username = rawInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!username || username.length < 3) {
        showToast("Username minimal 3 karakter (huruf/angka/underscore)!");
        return;
    }

    if (!db) {
        showToast("Koneksi database Firebase belum siap!");
        return;
    }

    try {
        const docRef = db.collection(COLLECTION_NAME).doc(username);
        const docSnap = await docRef.get();

        if (currentAuthMode === 'register') {
            // PROSES REGISTRASI AKUN BARU
            if (docSnap.exists) {
                showToast("Username sudah dipakai, pilih username lain!");
                return;
            }
            // Buat akun baru dengan data contoh awal
            savingsData = [
                {
                    id: 'savings-mac-001',
                    title: 'tabungan MAC',
                    targetAmount: 13500000,
                    freqAmount: 50000,
                    freqType: 'Perminggu',
                    currencySymbol: 'Rp',
                    currencyFlag: '🇮🇩',
                    currencyCode: 'IDR',
                    imageUrl: PRESET_IMAGES.mac,
                    createdDate: formatDateOnlyNow(),
                    reminderTime: '12:00',
                    reminderFreq: 'Setiap Minggu',
                    reminderEnabled: false,
                    history: [
                        {
                            id: 'tx-001',
                            type: 'deposit',
                            amount: 2200000,
                            dateStr: formatDateNow(),
                            note: 'Setoran awal tabungan Mac'
                        }
                    ]
                }
            ];
            await docRef.set({
                username: username,
                items: savingsData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast(`Akun @${username} berhasil dibuat! 🎉`);
        } else {
            // PROSES LOGIN AKUN LAMA
            if (!docSnap.exists) {
                showToast("Username tidak ditemukan! Silakan klik 'Daftar Baru'");
                return;
            }
            savingsData = docSnap.data().items || [];
            showToast(`Selamat datang kembali, @${username}!`);
        }

        currentUser = username;
        localStorage.setItem('tabungin_username', currentUser);
        document.getElementById('modalUsername')?.classList.add('hidden');

        updateUserUI();
        renderHome();
    } catch (err) {
        console.error("Gagal autentikasi:", err);
        showToast("Gagal terhubung ke server database!");
    }
}

function handleLogout() {
    document.getElementById('topMenu')?.classList.add('hidden');
    localStorage.removeItem('tabungin_username');
    currentUser = '';
    savingsData = [];
    updateUserUI();
    renderHome();
    showToast("Kamu berhasil keluar!");
    openModalUsername();
}

function updateUserUI() {
    const label = document.getElementById('currentUsernameLabel');
    if (label) label.innerText = currentUser ? `@${currentUser}` : 'Guest';
}

// STORAGE MANAGEMENT (LOCAL + CLOUD FIREBASE PER USER)
async function loadStorage() {
    if (!currentUser) return;
    let loadedFromCloud = false;

    if (db) {
        try {
            const docRef = db.collection(COLLECTION_NAME).doc(currentUser);
            const docSnap = await docRef.get();

            if (docSnap.exists && Array.isArray(docSnap.data().items)) {
                savingsData = docSnap.data().items;
                loadedFromCloud = true;
            }
        } catch (err) {
            console.error("Gagal memuat data dari Firebase:", err);
        }
    }

    if (!loadedFromCloud) {
        try {
            const stored = localStorage.getItem(`celenganku_data_${currentUser}`);
            if (stored) {
                savingsData = JSON.parse(stored);
            } else {
                savingsData = [];
                seedSampleData(false);
            }
        } catch (err) {
            savingsData = [];
        }
    }

    renderHome();
}

async function saveStorage() {
    if (!currentUser) return;

    // 1. Simpan di LocalStorage HP sesuai username
    try {
        localStorage.setItem(`celenganku_data_${currentUser}`, JSON.stringify(savingsData));
    } catch (err) {
        console.error("Gagal menyimpan ke memori lokal", err);
    }

    // 2. Simpan di Cloud Firebase Firestore sesuai doc(currentUser)
    if (db) {
        try {
            await db.collection(COLLECTION_NAME).doc(currentUser).set({
                username: currentUser,
                items: savingsData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (err) {
            console.error("Gagal menyinkronkan ke cloud:", err);
            showToast("Gagal menyinkronkan ke cloud!");
        }
    }
}

function seedSampleData(notify = true) {
    savingsData = [
        {
            id: 'savings-mac-001',
            title: 'tabungan MAC',
            targetAmount: 13500000,
            freqAmount: 50000,
            freqType: 'Perminggu',
            currencySymbol: 'Rp',
            currencyFlag: '🇮🇩',
            currencyCode: 'IDR',
            imageUrl: PRESET_IMAGES.mac,
            createdDate: '18 Okt 2026',
            reminderTime: '12:00',
            reminderFreq: 'Setiap Minggu',
            reminderEnabled: false,
            history: [
                {
                    id: 'tx-001',
                    type: 'deposit',
                    amount: 2200000,
                    dateStr: '18 Okt 2026 • 12:03',
                    note: 'Setoran awal tabungan Mac'
                }
            ]
        }
    ];
    saveStorage();
    renderHome();
    if (currentDetailId) openDetailView(currentDetailId);
    if (notify) showToast("Data contoh berhasil dimuat");
}

function clearAllData() {
    savingsData = [];
    saveStorage();
    showView('home');
    renderHome();
    showToast("Semua data berhasil dihapus");
}

// REAL-TIME FORMATTING & PARSING HELPERS
function parseNominal(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleanStr = String(val).replace(/[^0-9]/g, '');
    return parseFloat(cleanStr) || 0;
}

function formatDots(num) {
    const val = parseNominal(num);
    if (val === 0) return '0';
    return val.toLocaleString('id-ID');
}

function formatCurrency(amount, symbol = 'Rp') {
    const formatted = formatDots(amount);
    return `${symbol} ${formatted}`;
}

function handleFormattedInput(inputElement) {
    if (!inputElement) return;
    const cursorPosition = inputElement.selectionStart;
    const originalLength = inputElement.value.length;

    const numericValue = parseNominal(inputElement.value);
    if (numericValue === 0 && inputElement.value.trim() === '') {
        inputElement.value = '';
        return;
    }

    inputElement.value = formatDots(numericValue);

    const newLength = inputElement.value.length;
    const diff = newLength - originalLength;
    inputElement.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
}

function clearInput(elementId) {
    const elem = document.getElementById(elementId);
    if (elem) {
        elem.value = "";
        elem.focus();
    }
}

function formatDateNow() {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} • ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function formatDateOnlyNow() {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function calculateTerkumpul(item) {
    if (!item || !item.history || !Array.isArray(item.history)) return 0;
    return item.history.reduce((sum, tx) => {
        const amt = parseNominal(tx.amount);
        return tx.type === 'deposit' ? sum + amt : sum - amt;
    }, 0);
}

function calculatePercentage(item) {
    if (!item || !item.targetAmount || item.targetAmount <= 0) return 0;
    const terkumpul = calculateTerkumpul(item);
    const pct = Math.round((terkumpul / item.targetAmount) * 100);
    return Math.max(0, pct);
}

function calculateEstimasiText(item) {
    const terkumpul = calculateTerkumpul(item);
    const kekurang = Math.max(0, item.targetAmount - terkumpul);
    if (kekurang <= 0) return "Target Tercapai 🎉";
    if (!item.freqAmount || item.freqAmount <= 0) return "-";

    const sisaPeriode = Math.ceil(kekurang / item.freqAmount);
    const unit = item.freqType === 'Perhari' ? 'Hari' : (item.freqType === 'Perbulan' ? 'Bulan' : 'Minggu');
    return `${sisaPeriode} ${unit} Lagi`;
}

// VIEW ROUTING
function showView(viewName) {
    document.getElementById('topMenu')?.classList.add('hidden');
    document.getElementById('sortDropdown')?.classList.add('hidden');

    const fab = document.getElementById('fabAddSavings');
    const viewHome = document.getElementById('view-home');
    const viewDetail = document.getElementById('view-detail');

    if (viewName === 'home') {
        currentDetailId = null;
        if (viewHome) viewHome.classList.remove('hidden');
        if (viewDetail) viewDetail.classList.add('hidden');
        if (fab) fab.style.display = ''; 
        renderHome();
    } else if (viewName === 'detail') {
        if (viewHome) viewHome.classList.add('hidden');
        if (viewDetail) viewDetail.classList.remove('hidden');
        if (fab) fab.style.display = 'none'; 
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// HOME PAGE RENDERING
function setActiveTab(tab) {
    activeTab = tab;
    const tabB = document.getElementById('tab-berlangsung');
    const tabT = document.getElementById('tab-tercapai');

    if (tabB && tabT) {
        if (tab === 'berlangsung') {
            tabB.className = "flex-1 md:flex-initial px-6 py-2 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-[#282838] shadow transition";
            tabT.className = "flex-1 md:flex-initial px-6 py-2 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition";
        } else {
            tabT.className = "flex-1 md:flex-initial px-6 py-2 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-[#282838] shadow transition";
            tabB.className = "flex-1 md:flex-initial px-6 py-2 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition";
        }
    }
    renderHome();
}

function toggleTopMenu() {
    document.getElementById('topMenu')?.classList.toggle('hidden');
}

function toggleSortDropdown() {
    document.getElementById('sortDropdown')?.classList.toggle('hidden');
}

function setSortField(field, label) {
    currentSortField = field;
    const labelElem = document.getElementById('currentSortLabel');
    if (labelElem) labelElem.innerText = label;
    document.getElementById('sortDropdown')?.classList.add('hidden');
    renderHome();
}

function toggleSortOrder() {
    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    const icon = document.getElementById('sortOrderIcon');
    const label = document.getElementById('sortOrderLabel');
    if (icon) icon.className = currentSortOrder === 'asc' ? "fa-solid fa-arrow-up text-blue-500 dark:text-blue-400" : "fa-solid fa-arrow-down text-blue-500 dark:text-blue-400";
    if (label) label.innerText = currentSortOrder === 'asc' ? "Meningkat" : "Menurun";
    renderHome();
}

function renderHome() {
    const container = document.getElementById('savingsListContainer') || document.getElementById('savingsList');
    const emptyState = document.getElementById('emptyState');
    if (!container) return;

    if (!savingsData || savingsData.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        container.innerHTML = '';
        return;
    }

    let filtered = savingsData.filter(item => {
        const pct = calculatePercentage(item);
        return activeTab === 'tercapai' ? pct >= 100 : pct < 100;
    });

    filtered.sort((a, b) => {
        let valA, valB;
        if (currentSortField === 'nama') {
            valA = (a.title || '').toLowerCase();
            valB = (b.title || '').toLowerCase();
            return currentSortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else if (currentSortField === 'persen') {
            valA = calculatePercentage(a);
            valB = calculatePercentage(b);
        } else if (currentSortField === 'target') {
            valA = a.targetAmount || 0;
            valB = b.targetAmount || 0;
        } else if (currentSortField === 'terkumpul') {
            valA = calculateTerkumpul(a);
            valB = calculateTerkumpul(b);
        }
        return currentSortOrder === 'asc' ? valA - valB : valB - valA;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-400 dark:text-gray-500">
                <i class="fa-solid fa-piggy-bank text-4xl mb-3 opacity-50"></i>
                <p class="text-sm">Belum ada tabungan di kategori ini.</p>
            </div>
        `;
        if (emptyState) emptyState.classList.add('hidden');
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    container.innerHTML = filtered.map(item => {
        const pct = calculatePercentage(item);
        const displayPct = Math.min(100, pct);
        const estimasiText = calculateEstimasiText(item);
        const img = item.imageUrl || PRESET_IMAGES.mac;
        const symbol = item.currencySymbol || 'Rp';

        return `
            <div onclick="openDetailView('${item.id}')" class="bg-white dark:bg-[#181820] border border-gray-200 dark:border-gray-800/80 hover:border-gray-300 dark:hover:border-gray-700 rounded-3xl p-5 shadow-xl cursor-pointer transition transform hover:-translate-y-1 active:scale-[0.99] flex flex-col justify-between space-y-4">
                <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white tracking-wide truncate mb-3">${escapeHtml(item.title)}</h3>

                    <div class="w-full h-48 rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#22222e] flex items-center justify-center">
                        <img src="${img}" alt="${escapeHtml(item.title)}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='https://placehold.co/600x400/22222a/94a3b8?text=Impian+Kamu';">
                    </div>
                </div>

                <div>
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="text-2xl font-extrabold text-gray-900 dark:text-white">${formatCurrency(item.targetAmount, symbol)}</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">${formatCurrency(item.freqAmount, symbol)} ${escapeHtml(item.freqType || 'Perminggu')}</p>
                        </div>
                        <div class="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                            <svg class="w-14 h-14 transform -rotate-90">
                                <circle cx="28" cy="28" r="22" class="stroke-gray-200 dark:stroke-[#282836]" stroke-width="4" fill="transparent" />
                                <circle cx="28" cy="28" r="22" stroke="#3b82f6" stroke-width="4" stroke-dasharray="138.23" stroke-dashoffset="${(138.23 - (138.23 * displayPct / 100)).toFixed(2)}" stroke-linecap="round" fill="transparent" class="transition-all duration-500 ease-out" />
                            </svg>
                            <span class="absolute text-[11px] font-bold text-gray-900 dark:text-white">${pct}%</span>
                        </div>
                    </div>

                    <div class="border-t border-gray-100 dark:border-gray-800/80 mt-4 pt-3 flex items-center justify-between text-xs">
                        <span class="text-gray-500 dark:text-gray-400 font-medium">Sisa Estimasi</span>
                        <span class="font-semibold text-blue-600 dark:text-blue-400">${estimasiText}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// DETAIL PAGE RENDERING
function openDetailView(id) {
    currentDetailId = id;
    const item = savingsData.find(s => s.id === id);
    if (!item) {
        showView('home');
        return;
    }

    const terkumpul = calculateTerkumpul(item);
    const kekurang = Math.max(0, item.targetAmount - terkumpul);
    const pct = calculatePercentage(item);
    const displayPct = Math.min(100, pct);
    const symbol = item.currencySymbol || 'Rp';

    const setTxt = (elemId, txt) => {
        const el = document.getElementById(elemId);
        if (el) el.innerText = txt;
    };

    setTxt('detailHeaderTitle', item.title);
    setTxt('detailTargetAmount', formatCurrency(item.targetAmount, symbol));
    setTxt('detailFrequency', `${formatCurrency(item.freqAmount, symbol)} ${item.freqType || 'Perminggu'}`);
    setTxt('detailPercentText', `${pct}%`);
    setTxt('detailCreatedDate', item.createdDate || '-');
    setTxt('detailEstimasi', calculateEstimasiText(item));
    setTxt('detailReminderTime', item.reminderTime || '12:00');
    setTxt('detailReminderFreq', item.reminderFreq || 'Setiap Minggu');
    setTxt('detailTerkumpul', formatCurrency(terkumpul, symbol));
    setTxt('detailKekurangan', formatCurrency(kekurang, symbol));

    const imgElem = document.getElementById('detailImg');
    if (imgElem) imgElem.src = item.imageUrl || PRESET_IMAGES.mac;

    const circle = document.getElementById('detailCircleProgress');
    if (circle) {
        const dashOffset = (201.06 - (201.06 * displayPct / 100)).toFixed(2);
        circle.setAttribute('stroke-dashoffset', dashOffset);
    }

    const reminderToggle = document.getElementById('toggleReminder');
    if (reminderToggle) reminderToggle.checked = item.reminderEnabled !== false;

    renderDetailHistory(item);
    showView('detail');
}

function renderDetailHistory(item) {
    const container = document.getElementById('detailHistoryContainer');
    const countSpan = document.getElementById('detailHistoryCount');
    if (!container) return;

    if (!item.history || item.history.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-500 text-center py-6">Belum ada catatan tabungan</p>`;
        if (countSpan) countSpan.innerText = "0 Transaksi";
        return;
    }

    if (countSpan) countSpan.innerText = `${item.history.length} Transaksi`;

    const sortedTx = [...item.history].reverse();

    container.innerHTML = sortedTx.map(tx => {
        const isDep = tx.type === 'deposit';
        const sign = isDep ? '+' : '-';
        const textColor = isDep ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400';

        return `
            <div onclick="openModalTxDetail('${tx.id}')" class="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-[#14141c] hover:bg-gray-100 dark:hover:bg-[#20202e] border border-gray-200 dark:border-gray-800/80 cursor-pointer transition active:scale-[0.99]">
                <div>
                    <p class="text-xs font-semibold text-gray-800 dark:text-gray-200">${escapeHtml(tx.note || (isDep ? 'Setoran Tabungan' : 'Penarikan Tabungan'))}</p>
                    <p class="text-[10px] text-gray-500 mt-0.5">${tx.dateStr}</p>
                </div>
                <div class="text-right">
                    <p class="text-sm font-bold ${textColor}">${sign} ${formatDots(tx.amount)}</p>
                </div>
            </div>
        `;
    }).join('');
}

// LIVE PREVIEW & FILE UPLOAD
function updateLivePreview(url) {
    const previewImg = document.getElementById('modalImgPreview');
    const placeholder = document.getElementById('modalImgPlaceholder');

    if (previewImg && placeholder) {
        if (url && url.trim() !== "") {
            previewImg.src = url;
            previewImg.classList.remove('hidden');
            placeholder.classList.add('hidden');
        } else {
            previewImg.src = "";
            previewImg.classList.add('hidden');
            placeholder.classList.remove('hidden');
        }
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
        showToast("Ukuran foto maksimal 2.5MB!");
        e.target.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = function(evt) {
        const base64Str = evt.target.result;
        const inputImg = document.getElementById('inputImage');
        if (inputImg) inputImg.value = base64Str;
        updateLivePreview(base64Str);
    };
    reader.readAsDataURL(file);
}

function setPresetImg(key) {
    if (PRESET_IMAGES[key]) {
        const url = PRESET_IMAGES[key];
        const inputImg = document.getElementById('inputImage');
        const inputFileInput = document.getElementById('inputFileImage');
        if (inputImg) inputImg.value = url;
        if (inputFileInput) inputFileInput.value = "";
        updateLivePreview(url);
    }
}

// MODAL CELENGAN (ADD / EDIT)
function setFreqType(type) {
    const freqInput = document.getElementById('inputFreqType');
    if (freqInput) freqInput.value = type;

    const btnH = document.getElementById('btnFreqHarian');
    const btnM = document.getElementById('btnFreqMingguan');
    const btnB = document.getElementById('btnFreqBulanan');

    [btnH, btnM, btnB].forEach(b => {
        if (b) b.className = "flex-1 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition";
    });

    const activeClass = "flex-1 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#2a2a38] text-blue-600 dark:text-white shadow transition";
    if (type === 'Perhari' && btnH) btnH.className = activeClass;
    else if (type === 'Perminggu' && btnM) btnM.className = activeClass;
    else if (type === 'Perbulan' && btnB) btnB.className = activeClass;
}

function handleCurrencyChange(val) {
    const parts = val.split('|');
    const flagElem = document.getElementById('currencyFlag');
    if (parts.length >= 3 && flagElem) {
        flagElem.innerText = parts[2];
    }
}

function openModalAddSavings() {
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };
    const setTitle = (txt) => {
        const el = document.getElementById('modalSavingsTitle');
        if (el) el.innerText = txt;
    };

    setTitle("Tambah Celengan");
    setVal('inputSavingsId', "");
    setVal('inputTitle', "");
    setVal('inputTargetAmount', "");
    setVal('inputFreqAmount', "");
    setVal('inputCurrency', "IDR|Rp|🇮🇩");
    handleCurrencyChange("IDR|Rp|🇮🇩");
    setFreqType('Perminggu');
    setVal('inputImage', "");
    setVal('inputFileImage', "");
    updateLivePreview("");
    document.getElementById('modalSavings')?.classList.remove('hidden');
}

function openModalEditSavings() {
    if (!currentDetailId) return;
    const item = savingsData.find(s => s.id === currentDetailId);
    if (!item) return;

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    const modalTitle = document.getElementById('modalSavingsTitle');
    if (modalTitle) modalTitle.innerText = "Edit Celengan";

    setVal('inputSavingsId', item.id);
    setVal('inputTitle', item.title);
    setVal('inputTargetAmount', formatDots(item.targetAmount));
    setVal('inputFreqAmount', formatDots(item.freqAmount));
    setFreqType(item.freqType || "Perminggu");

    const currVal = `${item.currencyCode || 'IDR'}|${item.currencySymbol || 'Rp'}|${item.currencyFlag || '🇮🇩'}`;
    setVal('inputCurrency', currVal);
    handleCurrencyChange(currVal);

    setVal('inputImage', item.imageUrl || "");
    setVal('inputFileImage', "");
    updateLivePreview(item.imageUrl || "");
    document.getElementById('modalSavings')?.classList.remove('hidden');
}

function closeModalSavings() {
    document.getElementById('modalSavings')?.classList.add('hidden');
}

function handleSaveSavings(e) {
    if (e) e.preventDefault();
    const getVal = (id) => document.getElementById(id)?.value || "";

    const id = getVal('inputSavingsId');
    const title = getVal('inputTitle').trim();
    const targetAmount = parseNominal(getVal('inputTargetAmount'));
    const freqAmount = parseNominal(getVal('inputFreqAmount'));
    const freqType = getVal('inputFreqType');

    const currVal = getVal('inputCurrency');
    const [cCode, cSymbol, cFlag] = currVal.split('|');

    let imageUrl = getVal('inputImage').trim();
    if (!imageUrl) imageUrl = PRESET_IMAGES.mac;

    if (id) {
        const item = savingsData.find(s => s.id === id);
        if (item) {
            item.title = title;
            item.targetAmount = targetAmount;
            item.freqAmount = freqAmount;
            item.freqType = freqType;
            item.currencyCode = cCode;
            item.currencySymbol = cSymbol;
            item.currencyFlag = cFlag;
            item.imageUrl = imageUrl;
            saveStorage();
            openDetailView(id);
            showToast("Celengan berhasil diperbarui");
        }
    } else {
        const newItem = {
            id: 'savings-' + Date.now(),
            title: title,
            targetAmount: targetAmount,
            freqAmount: freqAmount,
            freqType: freqType,
            currencyCode: cCode,
            currencySymbol: cSymbol,
            currencyFlag: cFlag,
            imageUrl: imageUrl,
            createdDate: formatDateOnlyNow(),
            reminderTime: '12:00',
            reminderFreq: 'Setiap Minggu',
            reminderEnabled: false,
            history: []
        };
        savingsData.push(newItem);
        saveStorage();
        renderHome();
        showToast("Celengan baru ditambahkan");
    }

    closeModalSavings();
}

// MODAL TRANSACTION (CATAT TABUNGAN)
function openModalTransaction() {
    if (!currentDetailId) return;
    const item = savingsData.find(s => s.id === currentDetailId);
    if (!item) return;

    editingTxId = null;
    const modalTitle = document.getElementById('modalTxTitle');
    if (modalTitle) modalTitle.innerText = "Catat Tabungan";

    setTransactionType('deposit');
    const inputAmt = document.getElementById('inputTxAmount');
    const inputNote = document.getElementById('inputTxNote');
    if (inputAmt) inputAmt.value = "";
    if (inputNote) inputNote.value = "";

    const terkumpul = calculateTerkumpul(item);
    const kekurang = Math.max(0, item.targetAmount - terkumpul);

    const chipP = document.getElementById('chipPeriodic');
    if (chipP) {
        chipP.innerText = `${formatDots(item.freqAmount)}`;
        chipP.onclick = () => setTxChipAmount(item.freqAmount);
    }

    const chipR = document.getElementById('chipRemaining');
    if (chipR) {
        chipR.innerText = `${formatDots(kekurang)}`;
        chipR.onclick = () => setTxChipAmount(kekurang);
    }

    document.getElementById('modalTransaction')?.classList.remove('hidden');
}

function closeModalTransaction() {
    document.getElementById('modalTransaction')?.classList.add('hidden');
    editingTxId = null;
}

function setTransactionType(type) {
    currentTxType = type;
    const btnDep = document.getElementById('btnTypeDeposit');
    const btnWith = document.getElementById('btnTypeWithdraw');

    if (btnDep && btnWith) {
        if (type === 'deposit') {
            btnDep.className = "flex-1 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white shadow transition";
            btnWith.className = "flex-1 py-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition";
        } else {
            btnWith.className = "flex-1 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white shadow transition";
            btnDep.className = "flex-1 py-2 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition";
        }
    }
}

function setTxChipAmount(val) {
    const elem = document.getElementById('inputTxAmount');
    if (elem) elem.value = formatDots(val);
}

function handleSaveTransaction(e) {
    if (e) e.preventDefault();
    if (!currentDetailId) return;

    const item = savingsData.find(s => s.id === currentDetailId);
    if (!item) return;

    const amount = parseNominal(document.getElementById('inputTxAmount')?.value);
    const note = (document.getElementById('inputTxNote')?.value || "").trim();

    if (!amount || amount <= 0) {
        showToast("Nominal tabungan harus lebih dari 0!");
        return;
    }

    if (!item.history) item.history = [];

    if (editingTxId) {
        const tx = item.history.find(t => t.id === editingTxId);
        if (tx) {
            tx.type = currentTxType;
            tx.amount = amount;
            tx.note = note;
        }
    } else {
        const newTx = {
            id: 'tx-' + Date.now(),
            type: currentTxType,
            amount: amount,
            dateStr: formatDateNow(),
            note: note
        };
        item.history.push(newTx);
    }

    saveStorage();
    closeModalTransaction();
    openDetailView(item.id);
    renderHome();

    const pct = calculatePercentage(item);
    if (pct >= 100 && currentTxType === 'deposit') {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 }
            });
        }
        showToast("Selamat! Target tabungan tercapai 🎉");
    } else {
        showToast(editingTxId ? "Catatan tabungan diperbarui" : (currentTxType === 'deposit' ? "Setoran berhasil dicatat" : "Penarikan berhasil dicatat"));
    }
    editingTxId = null;
}

// TRANSACTION DETAIL POPUP (UBAH / HAPUS)
function openModalTxDetail(txId) {
    if (!currentDetailId) return;
    const item = savingsData.find(s => s.id === currentDetailId);
    if (!item || !item.history) return;

    const tx = item.history.find(t => t.id === txId);
    if (!tx) return;

    selectedTxIdForModal = txId;

    const isDep = tx.type === 'deposit';
    const amountElem = document.getElementById('txDetailAmount');
    if (amountElem) {
        amountElem.innerText = `${isDep ? '+' : '-'} ${formatDots(tx.amount)}`;
        amountElem.className = `text-3xl font-extrabold tracking-tight ${isDep ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`;
    }

    const dateElem = document.getElementById('txDetailDate');
    if (dateElem) dateElem.innerText = tx.dateStr;

    const noteElem = document.getElementById('txDetailNote');
    if (noteElem) {
        if (tx.note && tx.note.trim() !== '') {
            noteElem.innerText = `"${tx.note}"`;
            noteElem.classList.remove('hidden');
        } else {
            noteElem.classList.add('hidden');
        }
    }

    document.getElementById('modalTxDetail')?.classList.remove('hidden');
}

function closeModalTxDetail() {
    document.getElementById('modalTxDetail')?.classList.add('hidden');
}

function handleEditTxFromModal() {
    closeModalTxDetail();
    if (!currentDetailId || !selectedTxIdForModal) return;

    const item = savingsData.find(s => s.id === currentDetailId);
    if (!item || !item.history) return;

    const tx = item.history.find(t => t.id === selectedTxIdForModal);
    if (!tx) return;

    editingTxId = tx.id;
    const titleElem = document.getElementById('modalTxTitle');
    if (titleElem) titleElem.innerText = "Ubah Catatan Tabungan";

    setTransactionType(tx.type);

    const inputAmt = document.getElementById('inputTxAmount');
    const inputNote = document.getElementById('inputTxNote');
    if (inputAmt) inputAmt.value = formatDots(tx.amount);
    if (inputNote) inputNote.value = tx.note || "";

    const terkumpul = calculateTerkumpul(item);
    const kekurang = Math.max(0, item.targetAmount - terkumpul);

    const chipP = document.getElementById('chipPeriodic');
    if (chipP) {
        chipP.innerText = `${formatDots(item.freqAmount)}`;
        chipP.onclick = () => setTxChipAmount(item.freqAmount);
    }

    const chipR = document.getElementById('chipRemaining');
    if (chipR) {
        chipR.innerText = `${formatDots(kekurang)}`;
        chipR.onclick = () => setTxChipAmount(kekurang);
    }

    document.getElementById('modalTransaction')?.classList.remove('hidden');
}

function handleDeleteTxFromModal() {
    if (!currentDetailId || !selectedTxIdForModal) return;

    const item = savingsData.find(s => s.id === currentDetailId);
    if (!item || !item.history) return;

    item.history = item.history.filter(t => t.id !== selectedTxIdForModal);
    saveStorage();

    closeModalTxDetail();
    openDetailView(item.id);
    renderHome();
    showToast("Catatan tabungan berhasil dihapus");
    selectedTxIdForModal = null;
}

// MODAL ALARM / PENGINGAT
function openModalReminder() {
    if (!currentDetailId) return;
    const item = savingsData.find(s => s.id === currentDetailId);
    if (!item) return;

    const timeInp = document.getElementById('inputReminderTime');
    const freqInp = document.getElementById('inputReminderFreq');
    const activeInp = document.getElementById('inputReminderActive');

    if (timeInp) timeInp.value = item.reminderTime || '12:00';
    if (freqInp) freqInp.value = item.reminderFreq || 'Setiap Minggu';
    if (activeInp) activeInp.checked = item.reminderEnabled !== false;

    document.getElementById('modalReminder')?.classList.remove('hidden');
}

function closeModalReminder() {
    document.getElementById('modalReminder')?.classList.add('hidden');
}

function handleSaveReminder(e) {
    if (e) e.preventDefault();
    if (!currentDetailId) return;

    const item = savingsData.find(s => s.id === currentDetailId);
    if (!item) return;

    item.reminderTime = document.getElementById('inputReminderTime')?.value || '12:00';
    item.reminderFreq = document.getElementById('inputReminderFreq')?.value || 'Setiap Minggu';
    item.reminderEnabled = document.getElementById('inputReminderActive')?.checked !== false;

    saveStorage();
    closeModalReminder();
    openDetailView(item.id);
    showToast("Pengaturan pengingat disimpan");
}

function toggleReminderState(enabled) {
    if (!currentDetailId) return;
    const item = savingsData.find(s => s.id === currentDetailId);
    if (!item) return;

    item.reminderEnabled = enabled;
    saveStorage();
    showToast(enabled ? "Pengingat diaktifkan" : "Pengingat dinonaktifkan");
}

// DELETE CELENGAN
function confirmDeleteSavings() {
    document.getElementById('modalConfirmDelete')?.classList.remove('hidden');
}

function closeConfirmDelete() {
    document.getElementById('modalConfirmDelete')?.classList.add('hidden');
}

function executeDeleteSavings() {
    if (!currentDetailId) return;
    savingsData = savingsData.filter(s => s.id !== currentDetailId);
    saveStorage();
    closeConfirmDelete();
    showView('home');
    showToast("Celengan berhasil dihapus");
}

// TOAST HELPER
function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (toastMsg) toastMsg.innerText = msg;
    if (toast) {
        toast.classList.remove('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            toast.classList.add('opacity-0', 'pointer-events-none');
        }, 2500);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// TEMA / LIGHT & DARK MODE MANAGEMENT (Bawaan Perangkat / Terang / Gelap)
function initTheme() {
    const savedTheme = localStorage.getItem('app_theme') || 'system';
    applyTheme(savedTheme);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const currentTheme = localStorage.getItem('app_theme') || 'system';
        if (currentTheme === 'system') {
            applyTheme('system');
        }
    });
}

function cycleTheme() {
    const currentTheme = localStorage.getItem('app_theme') || 'system';
    let nextTheme = 'system';

    if (currentTheme === 'system') nextTheme = 'light';
    else if (currentTheme === 'light') nextTheme = 'dark';
    else if (currentTheme === 'dark') nextTheme = 'system';

    localStorage.setItem('app_theme', nextTheme);
    applyTheme(nextTheme);

    const labels = { system: 'Ikuti Perangkat', light: 'Mode Terang', dark: 'Mode Gelap' };
    showToast(`Tema: ${labels[nextTheme]}`);
}

function toggleDarkMode() {
    cycleTheme();
}

function applyTheme(theme) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);

    if (isDark) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    updateThemeUI(theme);
}

function updateThemeUI(theme) {
    const menuIconElem = document.getElementById('menuThemeIcon');
    const menuLabelElem = document.getElementById('menuThemeLabel');

    if (menuIconElem && menuLabelElem) {
        if (theme === 'system') {
            menuIconElem.className = 'fa-solid fa-circle-half-stroke text-blue-500 dark:text-blue-400 text-sm';
            menuLabelElem.innerText = 'Sistem';
        } else if (theme === 'light') {
            menuIconElem.className = 'fa-solid fa-sun text-amber-500 text-sm';
            menuLabelElem.innerText = 'Terang';
        } else if (theme === 'dark') {
            menuIconElem.className = 'fa-solid fa-moon text-indigo-400 text-sm';
            menuLabelElem.innerText = 'Gelap';
        }
    }

    const iconElem = document.getElementById('themeIcon');
    const moonIcon = document.getElementById('themeMoonIcon');
    const sunIcon = document.getElementById('themeSunIcon');

    if (iconElem) {
        if (theme === 'system') {
            iconElem.className = 'fa-solid fa-desktop text-sm';
        } else if (theme === 'dark') {
            iconElem.className = 'fa-solid fa-moon text-sm';
        } else {
            iconElem.className = 'fa-solid fa-sun text-sm';
        }
    }

    if (moonIcon && sunIcon) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
        moonIcon.classList.toggle('hidden', isDark);
        sunIcon.classList.toggle('hidden', !isDark);
    }
}
