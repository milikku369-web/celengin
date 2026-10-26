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

// GLOBAL APP STATE
let savingsData = [];
let currentDetailId = null;
let activeTab = 'berlangsung'; // 'berlangsung' | 'tercapai'
let currentSortField = 'nama'; // 'nama' | 'persen' | 'target' | 'terkumpul'
let currentSortOrder = 'asc'; // 'asc' | 'desc'
let currentTxType = 'deposit'; // 'deposit' | 'withdraw'
let editingTxId = null;
let selectedTxIdForModal = null;

// INITIALIZATION
window.addEventListener('DOMContentLoaded', () => {
    loadStorage();
    renderHome();
});

// STORAGE MANAGEMENT
function loadStorage() {
    try {
        const stored = localStorage.getItem('celenganku_app_data');
        if (stored) {
            savingsData = JSON.parse(stored);
        } else {
            seedSampleData(false);
        }
    } catch (err) {
        console.error("Failed to load storage", err);
        savingsData = [];
    }
}

function saveStorage() {
    try {
        localStorage.setItem('celenganku_app_data', JSON.stringify(savingsData));
    } catch (err) {
        console.error("Failed to save storage", err);
        showToast("Gagal menyimpan data ke memori!");
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
            reminderEnabled: true,
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
    const cursorPosition = inputElement.selectionStart;
    const originalLength = inputElement.value.length;

    const numericValue = parseNominal(inputElement.value);
    if (numericValue === 0 && inputElement.value.trim() === '') {
        inputElement.value = '';
        return;
    }

    inputElement.value = formatDots(numericValue);

    // Maintain cursor position
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
    const day = now.getDate();
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} • ${hours}:${mins}`;
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
    document.getElementById('topMenu').classList.add('hidden');
    document.getElementById('sortDropdown').classList.add('hidden');

    const fab = document.getElementById('fabAddSavings');

    if (viewName === 'home') {
        currentDetailId = null;
        document.getElementById('view-home').classList.remove('hidden');
        document.getElementById('view-detail').classList.add('hidden');
        if (fab) fab.classList.remove('hidden'); // Munculkan di halaman utama
        renderHome();
    } else if (viewName === 'detail') {
        document.getElementById('view-home').classList.add('hidden');
        document.getElementById('view-detail').classList.remove('hidden');
        if (fab) fab.classList.add('hidden'); // Sembunyikan di halaman detail
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


// HOME PAGE RENDERING
function setActiveTab(tab) {
    activeTab = tab;
    const tabB = document.getElementById('tab-berlangsung');
    const tabT = document.getElementById('tab-tercapai');

    if (tab === 'berlangsung') {
        tabB.className = "flex-1 md:flex-initial px-6 py-2 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-[#282838] shadow transition";
        tabT.className = "flex-1 md:flex-initial px-6 py-2 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition";
    } else {
        tabT.className = "flex-1 md:flex-initial px-6 py-2 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-[#282838] shadow transition";
        tabB.className = "flex-1 md:flex-initial px-6 py-2 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition";
    }
    renderHome();
}


function toggleTopMenu() {
    document.getElementById('topMenu').classList.toggle('hidden');
}

function toggleSortDropdown() {
    document.getElementById('sortDropdown').classList.toggle('hidden');
}

function setSortField(field, label) {
    currentSortField = field;
    document.getElementById('currentSortLabel').innerText = label;
    document.getElementById('sortDropdown').classList.add('hidden');
    renderHome();
}

function toggleSortOrder() {
    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
    document.getElementById('sortOrderIcon').className = currentSortOrder === 'asc' ? "fa-solid fa-arrow-up text-blue-400" : "fa-solid fa-arrow-down text-blue-400";
    document.getElementById('sortOrderLabel').innerText = currentSortOrder === 'asc' ? "Meningkat" : "Menurun";
    renderHome();
}

function renderHome() {
    const container = document.getElementById('savingsListContainer');
    const emptyState = document.getElementById('emptyState');

    let filtered = savingsData.filter(item => {
        const pct = calculatePercentage(item);
        return activeTab === 'tercapai' ? pct >= 100 : pct < 100;
    });

    filtered.sort((a, b) => {
        let valA, valB;
        if (currentSortField === 'nama') {
            valA = a.title.toLowerCase();
            valB = b.title.toLowerCase();
            return currentSortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else if (currentSortField === 'persen') {
            valA = calculatePercentage(a);
            valB = calculatePercentage(b);
        } else if (currentSortField === 'target') {
            valA = a.targetAmount;
            valB = b.targetAmount;
        } else if (currentSortField === 'terkumpul') {
            valA = calculateTerkumpul(a);
            valB = calculateTerkumpul(b);
        }
        return currentSortOrder === 'asc' ? valA - valB : valB - valA;
    });

    if (filtered.length === 0) {
        container.innerHTML = "";
        emptyState.classList.remove('hidden');
        return;
    } else {
        emptyState.classList.add('hidden');
    }

    container.innerHTML = filtered.map(item => {
        const terkumpul = calculateTerkumpul(item);
        const pct = calculatePercentage(item);
        const displayPct = Math.min(100, pct);
        const estimasiText = calculateEstimasiText(item);
        const img = item.imageUrl || PRESET_IMAGES.mac;
        const symbol = item.currencySymbol || 'Rp';

        return `
            <div onclick="openDetailView('${item.id}')" class="bg-[#181820] border border-gray-800/80 hover:border-gray-700 rounded-3xl p-5 shadow-xl cursor-pointer transition transform hover:-translate-y-1 active:scale-[0.99] flex flex-col justify-between space-y-4">
                <div>
                    <h3 class="text-xl font-bold text-white tracking-wide truncate mb-3">${escapeHtml(item.title)}</h3>

                    <div class="w-full h-48 rounded-2xl overflow-hidden bg-[#22222e] flex items-center justify-center">
                        <img src="${img}" alt="${escapeHtml(item.title)}" class="w-full h-full object-cover" onerror="this.onerror=null; this.src='https://placehold.co/600x400/22222a/94a3b8?text=Impian+Kamu';">
                    </div>
                </div>

                <div>
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="text-2xl font-extrabold text-white">${formatCurrency(item.targetAmount, symbol)}</h4>
                            <p class="text-xs text-gray-400 mt-0.5 font-medium">${formatCurrency(item.freqAmount, symbol)} ${escapeHtml(item.freqType || 'Perminggu')}</p>
                        </div>
                        <div class="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                            <svg class="w-14 h-14 transform -rotate-90">
                                <circle cx="28" cy="28" r="22" stroke="#282836" stroke-width="4" fill="transparent" />
                                <circle cx="28" cy="28" r="22" stroke="#3b82f6" stroke-width="4" stroke-dasharray="138.23" stroke-dashoffset="${(138.23 - (138.23 * displayPct / 100)).toFixed(2)}" stroke-linecap="round" fill="transparent" class="transition-all duration-500 ease-out" />
                            </svg>
                            <span class="absolute text-[11px] font-bold text-white">${pct}%</span>
                        </div>
                    </div>

                    <div class="border-t border-gray-800/80 mt-4 pt-3 flex items-center justify-between text-xs">
                        <span class="text-gray-500 font-medium">Sisa Estimasi</span>
                        <span class="font-semibold text-blue-400">${estimasiText}</span>
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

    document.getElementById('detailHeaderTitle').innerText = item.title;
    document.getElementById('detailImg').src = item.imageUrl || PRESET_IMAGES.mac;
    document.getElementById('detailTargetAmount').innerText = formatCurrency(item.targetAmount, symbol);
    document.getElementById('detailFrequency').innerText = `${formatCurrency(item.freqAmount, symbol)} ${item.freqType || 'Perminggu'}`;

    const circle = document.getElementById('detailCircleProgress');
    const dashOffset = (201.06 - (201.06 * displayPct / 100)).toFixed(2);
    circle.setAttribute('stroke-dashoffset', dashOffset);
    document.getElementById('detailPercentText').innerText = `${pct}%`;

    document.getElementById('detailCreatedDate').innerText = item.createdDate || '-';
    document.getElementById('detailEstimasi').innerText = calculateEstimasiText(item);

    document.getElementById('detailReminderTime').innerText = item.reminderTime || '12:00';
    document.getElementById('detailReminderFreq').innerText = item.reminderFreq || 'Setiap Minggu';
    document.getElementById('toggleReminder').checked = item.reminderEnabled !== false;

    document.getElementById('detailTerkumpul').innerText = formatCurrency(terkumpul, symbol);
    document.getElementById('detailKekurangan').innerText = formatCurrency(kekurang, symbol);

    renderDetailHistory(item);
    showView('detail');
}

function renderDetailHistory(item) {
    const container = document.getElementById('detailHistoryContainer');
    const countSpan = document.getElementById('detailHistoryCount');
    const symbol = item.currencySymbol || 'Rp';

    if (!item.history || item.history.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-500 text-center py-6">Belum ada catatan tabungan</p>`;
        countSpan.innerText = "0 Transaksi";
        return;
    }

    countSpan.innerText = `${item.history.length} Transaksi`;

    const sortedTx = [...item.history].reverse();

    container.innerHTML = sortedTx.map(tx => {
        const isDep = tx.type === 'deposit';
        const sign = isDep ? '+' : '-';
        const textColor = isDep ? 'text-emerald-400' : 'text-rose-400';

        return `
            <div onclick="openModalTxDetail('${tx.id}')" class="flex items-center justify-between p-3.5 rounded-2xl bg-[#14141c] hover:bg-[#20202e] border border-gray-800/80 cursor-pointer transition active:scale-[0.99]">
                <div>
                    <p class="text-xs font-semibold text-gray-200">${escapeHtml(tx.note || (isDep ? 'Setoran Tabungan' : 'Penarikan Tabungan'))}</p>
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
        document.getElementById('inputImage').value = base64Str;
        updateLivePreview(base64Str);
    };
    reader.readAsDataURL(file);
}

function setPresetImg(key) {
    if (PRESET_IMAGES[key]) {
        const url = PRESET_IMAGES[key];
        document.getElementById('inputImage').value = url;
        document.getElementById('inputFileImage').value = "";
        updateLivePreview(url);
    }
}

// MODAL CELENGAN (ADD / EDIT)
function setFreqType(type) {
    document.getElementById('inputFreqType').value = type;
    const btnH = document.getElementById('btnFreqHarian');
    const btnM = document.getElementById('btnFreqMingguan');
    const btnB = document.getElementById('btnFreqBulanan');

    [btnH, btnM, btnB].forEach(b => {
        b.className = "flex-1 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition";
    });

    if (type === 'Perhari') {
        btnH.className = "flex-1 py-1.5 rounded-lg text-xs font-semibold bg-[#2a2a38] text-white shadow transition";
    } else if (type === 'Perminggu') {
        btnM.className = "flex-1 py-1.5 rounded-lg text-xs font-semibold bg-[#2a2a38] text-white shadow transition";
    } else {
        btnB.className = "flex-1 py-1.5 rounded-lg text-xs font-semibold bg-[#2a2a38] text-white shadow transition";
    }
}

function handleCurrencyChange(val) {
    const parts = val.split('|');
    if (parts.length >= 3) {
        document.getElementById('currencyFlag').innerText = parts[2];
    }
}

function openModalAddSavings() {
    document.getElementById('modalSavingsTitle').innerText = "Tambah Celengan";
    document.getElementById('inputSavingsId').value = "";
    document.getElementById('inputTitle').value = "";
    document.getElementById('inputTargetAmount').value = "";
    document.getElementById('inputFreqAmount').value = "";
    document.getElementById('inputCurrency').value = "IDR|Rp|🇮🇩";
    handleCurrencyChange("IDR|Rp|🇮🇩");
    setFreqType('Perminggu');
    document.getElementById('inputImage').value = "";
    document.getElementById('inputFileImage').value = "";
    updateLivePreview("");
    document.getElementById('modalSavings').classList.remove('hidden');
}

function openModalEditSavings() {
    if (!currentDetailId) return;
    const item = savingsData.find(s => s.id === currentDetailId);
    if (!item) return;

    document.getElementById('modalSavingsTitle').innerText = "Edit Celengan";
    document.getElementById('inputSavingsId').value = item.id;
    document.getElementById('inputTitle').value = item.title;
    document.getElementById('inputTargetAmount').value = formatDots(item.targetAmount);
    document.getElementById('inputFreqAmount').value = formatDots(item.freqAmount);
    setFreqType(item.freqType || "Perminggu");

    const currVal = `${item.currencyCode || 'IDR'}|${item.currencySymbol || 'Rp'}|${item.currencyFlag || '🇮🇩'}`;
    document.getElementById('inputCurrency').value = currVal;
    handleCurrencyChange(currVal);

    document.getElementById('inputImage').value = item.imageUrl || "";
    document.getElementById('inputFileImage').value = "";
    updateLivePreview(item.imageUrl || "");
    document.getElementById('modalSavings').classList.remove('hidden');
}

function closeModalSavings() {
    document.getElementById('modalSavings').classList.add('hidden');
}

function handleSaveSavings(e) {
    e.preventDefault();
    const id = document.getElementById('inputSavingsId').value;
    const title = document.getElementById('inputTitle').value.trim();
    const targetAmount = parseNominal(document.getElementById('inputTargetAmount').value);
    const freqAmount = parseNominal(document.getElementById('inputFreqAmount').value);
    const freqType = document.getElementById('inputFreqType').value;

    const currVal = document.getElementById('inputCurrency').value;
    const [cCode, cSymbol, cFlag] = currVal.split('|');

    let imageUrl = document.getElementById('inputImage').value.trim();
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
            reminderEnabled: true,
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
    document.getElementById('modalTxTitle').innerText = "Catat Tabungan";
    setTransactionType('deposit');
    document.getElementById('inputTxAmount').value = "";
    document.getElementById('inputTxNote').value = "";

    const terkumpul = calculateTerkumpul(item);
    const kekurang = Math.max(0, item.targetAmount - terkumpul);

    document.getElementById('chipPeriodic').innerText = `${formatDots(item.freqAmount)}`;
    document.getElementById('chipPeriodic').onclick = () => setTxChipAmount(item.freqAmount);

    document.getElementById('chipRemaining').innerText = `${formatDots(kekurang)}`;
    document.getElementById('chipRemaining').onclick = () => setTxChipAmount(kekurang);

    document.getElementById('modalTransaction').classList.remove('hidden');
}

function closeModalTransaction() {
    document.getElementById('modalTransaction').classList.add('hidden');
    editingTxId = null;
}

function setTransactionType(type) {
    currentTxType = type;
    const btnDep = document.getElementById('btnTypeDeposit');
    const btnWith = document.getElementById('btnTypeWithdraw');

    if (type === 'deposit') {
        btnDep.className = "flex-1 py-2 rounded-xl text-xs font-semibold bg-[#2a3040] text-white shadow transition";
        btnWith.className = "flex-1 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition";
    } else {
        btnWith.className = "flex-1 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white shadow transition";
        btnDep.className = "flex-1 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition";
    }
}

function setTxChipAmount(val) {
    document.getElementById('inputTxAmount').value = formatDots(val);
}

function handleSaveTransaction(e) {
    if (e) e.preventDefault();
    if (!currentDetailId) return;

    const item = savingsData.find(s => s.id === currentDetailId);
    if (!item) return;

    const amount = parseNominal(document.getElementById('inputTxAmount').value);
    const note = document.getElementById('inputTxNote').value.trim();

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
    amountElem.innerText = `${isDep ? '+' : '-'} ${formatDots(tx.amount)}`;
    amountElem.className = `text-3xl font-extrabold tracking-tight ${isDep ? 'text-emerald-400' : 'text-rose-400'}`;

    document.getElementById('txDetailDate').innerText = tx.dateStr;

    const noteElem = document.getElementById('txDetailNote');
    if (tx.note && tx.note.trim() !== '') {
        noteElem.innerText = `"${tx.note}"`;
        noteElem.classList.remove('hidden');
    } else {
        noteElem.classList.add('hidden');
    }

    document.getElementById('modalTxDetail').classList.remove('hidden');
}

function closeModalTxDetail() {
    document.getElementById('modalTxDetail').classList.add('hidden');
}

function handleEditTxFromModal() {
    closeModalTxDetail();
    if (!currentDetailId || !selectedTxIdForModal) return;

    const item = savingsData.find(s => s.id === currentDetailId);
    if (!item || !item.history) return;

    const tx = item.history.find(t => t.id === selectedTxIdForModal);
    if (!tx) return;

    editingTxId = tx.id;
    document.getElementById('modalTxTitle').innerText = "Ubah Catatan Tabungan";
    setTransactionType(tx.type);
    document.getElementById('inputTxAmount').value = formatDots(tx.amount);
    document.getElementById('inputTxNote').value = tx.note || "";

    const terkumpul = calculateTerkumpul(item);
    const kekurang = Math.max(0, item.targetAmount - terkumpul);

    document.getElementById('chipPeriodic').innerText = `${formatDots(item.freqAmount)}`;
    document.getElementById('chipPeriodic').onclick = () => setTxChipAmount(item.freqAmount);

    document.getElementById('chipRemaining').innerText = `${formatDots(kekurang)}`;
    document.getElementById('chipRemaining').onclick = () => setTxChipAmount(kekurang);

    document.getElementById('modalTransaction').classList.remove('hidden');
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

    document.getElementById('inputReminderTime').value = item.reminderTime || '12:00';
    document.getElementById('inputReminderFreq').value = item.reminderFreq || 'Setiap Minggu';
    document.getElementById('inputReminderActive').checked = item.reminderEnabled !== false;

    document.getElementById('modalReminder').classList.remove('hidden');
}

function closeModalReminder() {
    document.getElementById('modalReminder').classList.add('hidden');
}

function handleSaveReminder(e) {
    e.preventDefault();
    if (!currentDetailId) return;

    const item = savingsData.find(s => s.id === currentDetailId);
    if (!item) return;

    item.reminderTime = document.getElementById('inputReminderTime').value;
    item.reminderFreq = document.getElementById('inputReminderFreq').value;
    item.reminderEnabled = document.getElementById('inputReminderActive').checked;

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
    document.getElementById('modalConfirmDelete').classList.remove('hidden');
}

function closeConfirmDelete() {
    document.getElementById('modalConfirmDelete').classList.add('hidden');
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
    document.getElementById('toastMsg').innerText = msg;
    toast.classList.remove('opacity-0', 'pointer-events-none');

    setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none');
    }, 2500);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Inisialisasi tema saat halaman pertama kali dimuat
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});

function initTheme() {
    const savedTheme = localStorage.getItem('app_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Gunakan tema yang tersimpan, atau ikuti preferensi sistem HP/Browser
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        updateThemeIcons(true);
    } else {
        document.documentElement.classList.remove('dark');
        updateThemeIcons(false);
    }
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('app_theme', isDark ? 'dark' : 'light');
    updateThemeIcons(isDark);
}

function updateThemeIcons(isDark) {
    const moonIcon = document.getElementById('themeMoonIcon');
    const sunIcon = document.getElementById('themeSunIcon');
    if (!moonIcon || !sunIcon) return;

    if (isDark) {
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    } else {
        moonIcon.classList.remove('hidden');
        sunIcon.classList.add('hidden');
    }
}

// FUNGSI TOGGLE DARK/LIGHT MODE
function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('app_theme', isDark ? 'dark' : 'light');

    const moonIcon = document.getElementById('themeMoonIcon');
    const sunIcon = document.getElementById('themeSunIcon');
    
    if (moonIcon && sunIcon) {
        moonIcon.classList.toggle('hidden', isDark);
        sunIcon.classList.toggle('hidden', !isDark);
    }
}
