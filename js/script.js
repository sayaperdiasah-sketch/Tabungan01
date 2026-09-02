// ================================================================
//  KEUANGAN PRIBADI — SCRIPT.JS (FULL PERBAIKAN)
// ================================================================

// STATE
let transactions = [];
let target = { nama: 'Tabungan Darurat', nominal: 10000000, savings: [] };
let editingId = null;
let editingSavingId = null;
let currentPage = 'dashboard';
let filterKategori = 'semua';
let filterMode = 'bulan';

// DOM HELPER
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// DOM
const dom = {
    saldo: $('#totalSaldo'),
    pemasukan: $('#totalPemasukan'),
    pengeluaran: $('#totalPengeluaran'),
    jmlPemasukan: $('#jmlPemasukan'),
    jmlPengeluaran: $('#jmlPengeluaran'),
    saldoBadge: $('#saldoBadge'),
    trendSaldo: $('#trendSaldo'),
    historyTable: $('#historyTable'),
    jmlRiwayat: $('#jmlRiwayat'),
    filterKategori: $('#filterKategori'),
    allTransaksiList: $('#allTransaksiList'),

    targetNominal: $('#targetNominal'),
    targetDesc: $('#targetDesc'),
    targetProgress: $('#targetProgress'),
    targetProgress2: $('#targetProgress2'),
    targetProgressText: $('#targetProgressText'),
    targetTerkumpul: $('#targetTerkumpul'),
    targetSisa: $('#targetSisa'),
    targetNamaInput: $('#targetNamaInput'),
    targetNominalInput: $('#targetNominalInput'),
    targetStatus: $('#targetStatus'),
    targetSavingHistory: $('#tabunganHistory'),
    jmlSetoran: $('#jmlTabungan'),
    targetPageNama: $('#targetPageNama'),
    targetPageStatus: $('#targetPageStatus'),
    targetNamaDashboard: $('#targetNamaDashboard'),

    laporanBulanan: $('#laporanBulanan'),
    laporanRingkasan: $('#laporanRingkasan'),

    modal: $('#modalTransaksi'),
    modalTitle: $('#modalTitle'),
    form: $('#formTransaksi'),
    fKeterangan: $('#fKeterangan'),
    fNominal: $('#fNominal'),
    fKategori: $('#fKategori'),
    fTanggal: $('#fTanggal'),
    modalClose: $('#modalClose'),
    modalCancel: $('#modalCancel'),

    btnTambah: $('#btnTambahTransaksiTop'),
    btnTambahPage: $('#btnTambahDariPage'),

    btnSimpanTarget: $('#btnSimpanTarget'),
    btnEditTarget: $('#btnEditTarget'),
    btnTambahTabungan: $('#btnTambahTabungan'),

    btnFilterPeriod: $('#btnFilterPeriod'),
    rangeText: $('#rangeText'),

    modalTabungan: $('#modalTabungan'),
    modalTabunganTitle: $('#tabunganModalTitle'),
    formTabungan: $('#formTabungan'),
    fTabunganNominal: $('#tabunganNominal'),
    fTabunganTanggal: $('#tabunganTanggal'),
    fTabunganCatatan: $('#tabunganCatatan'),
    modalTabunganClose: $('#tabunganModalClose'),
    modalTabunganCancel: $('#tabunganModalCancel'),

    currentDate: $('#currentDate'),
    periodBtns: $$('.period-btn'),
    pageTitle: $('#pageTitle'),
};

// ================================================================
//  MIGRASI DATA
// ================================================================
function migrateData(oldData) {
    if (oldData.target && !oldData.target.savings) {
        oldData.target.savings = [];
    }
    if (oldData.transactions) {
        oldData.transactions = oldData.transactions.map(t => ({
            ...t,
            id: t.id || 't-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            jenis: t.jenis || 'pengeluaran',
            keterangan: t.keterangan || '',
            nominal: Number(t.nominal) || 0,
            kategori: t.kategori || 'lainnya',
            tanggal: t.tanggal || getLocalDateString()
        }));
    }
    return oldData;
}

// ================================================================
//  LOCAL STORAGE
// ================================================================
function loadData() {
    try {
        const raw = localStorage.getItem('keuangan_data');
        if (!raw) {
            transactions = [];
            target = { nama: 'Tabungan Darurat', nominal: 10000000, savings: [] };
            return;
        }
        let data = JSON.parse(raw);
        data = migrateData(data);
        transactions = data.transactions || [];
        target = data.target || { nama: 'Tabungan Darurat', nominal: 10000000, savings: [] };
        if (!target.savings) target.savings = [];
        saveData();
    } catch (e) {
        console.warn('Gagal load data, menggunakan default', e);
        transactions = [];
        target = { nama: 'Tabungan Darurat', nominal: 10000000, savings: [] };
    }
}

function saveData() {
    try {
        localStorage.setItem('keuangan_data', JSON.stringify({ transactions, target }));
    } catch (e) {
        console.warn('Gagal save data', e);
    }
}

// ================================================================
//  HELPERS
// ================================================================
function formatRupiah(angka) {
    return Number(angka || 0).toLocaleString('id-ID');
}

function getLocalDateString() {
    const now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
}

function formatTanggal(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '-';
    const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
}

function createId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
}

// ================================================================
//  RENDER SALDO
// ================================================================
function renderSaldo() {
    let totalPemasukan = 0, totalPengeluaran = 0;
    let jmlPemasukan = 0, jmlPengeluaran = 0;

    transactions.forEach(t => {
        const nominal = Number(t.nominal) || 0;
        if (t.jenis === 'pemasukan') {
            totalPemasukan += nominal;
            jmlPemasukan++;
        } else {
            totalPengeluaran += nominal;
            jmlPengeluaran++;
        }
    });

    const saldo = totalPemasukan - totalPengeluaran;

    if (dom.saldo) dom.saldo.textContent = 'Rp ' + formatRupiah(saldo);
    if (dom.pemasukan) dom.pemasukan.textContent = 'Rp ' + formatRupiah(totalPemasukan);
    if (dom.pengeluaran) dom.pengeluaran.textContent = 'Rp ' + formatRupiah(totalPengeluaran);
    if (dom.jmlPemasukan) dom.jmlPemasukan.textContent = jmlPemasukan + ' transaksi';
    if (dom.jmlPengeluaran) dom.jmlPengeluaran.textContent = jmlPengeluaran + ' transaksi';

    const positif = totalPemasukan >= totalPengeluaran;
    const trend = totalPemasukan > totalPengeluaran ? '+ positif' : totalPemasukan < totalPengeluaran ? '- defisit' : 'seimbang';

    if (dom.saldoBadge) {
        dom.saldoBadge.innerHTML = `<i class="fas fa-${positif ? 'arrow-up' : 'arrow-down'}"></i> ${trend}`;
    }
    if (dom.trendSaldo) {
        dom.trendSaldo.innerHTML = `<i class="fas fa-${positif ? 'arrow-up' : 'arrow-down'}"></i> ${positif ? 'Sehat' : 'Perhatikan'}`;
    }

    if (dom.currentDate) {
        const now = new Date();
        dom.currentDate.textContent = formatTanggal(now.toISOString().split('T')[0]);
    }
}

// ================================================================
//  RENDER HISTORY
// ================================================================
function renderHistory() {
    if (!dom.historyTable) return;

    let filtered = [...transactions];
    if (dom.filterKategori && dom.filterKategori.value !== 'semua') {
        filtered = filtered.filter(t => t.kategori === dom.filterKategori.value);
    }
    filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    if (dom.jmlRiwayat) dom.jmlRiwayat.textContent = filtered.length + ' transaksi';

    if (filtered.length === 0) {
        dom.historyTable.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="fas fa-receipt"></i>Belum ada transaksi</td></tr>`;
        return;
    }

    let html = '';
    filtered.slice(0, 10).forEach(t => {
        const isPemasukan = t.jenis === 'pemasukan';
        const sign = isPemasukan ? '+' : '−';
        const color = isPemasukan ? 'var(--success)' : 'var(--danger)';
        const id = escapeHtml(String(t.id));
        html += `
            <tr data-id="${id}">
                <td>${escapeHtml(t.keterangan)}</td>
                <td>${escapeHtml(t.kategori)}</td>
                <td>${formatTanggal(t.tanggal)}</td>
                <td style="color:${color};font-weight:700;">${sign} Rp${formatRupiah(t.nominal)}</td>
                <td>
                    <button class="edit-btn" data-id="${id}" title="Edit"><i class="fas fa-pen"></i></button>
                    <button class="delete-btn" data-id="${id}" title="Hapus"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
    dom.historyTable.innerHTML = html;

    dom.historyTable.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            editTransaction(this.dataset.id);
        });
    });
    dom.historyTable.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteTransaction(this.dataset.id);
        });
    });
}

// ================================================================
//  CRUD TRANSAKSI
// ================================================================
function deleteTransaction(id) {
    const t = transactions.find(t => String(t.id) === String(id));
    if (!t) { alert('Transaksi tidak ditemukan'); return; }
    if (!confirm(`Hapus transaksi "${t.keterangan}"?\nData tidak dapat dikembalikan.`)) return;
    transactions = transactions.filter(t => String(t.id) !== String(id));
    saveData();
    renderAll();
}

function editTransaction(id) {
    const t = transactions.find(t => String(t.id) === String(id));
    if (!t) { alert('Transaksi tidak ditemukan'); return; }
    openModal(t);
}

// ================================================================
//  RENDER ALL TRANSACTIONS
// ================================================================
function renderAllTransactions() {
    if (!dom.allTransaksiList) return;
    if (transactions.length === 0) {
        dom.allTransaksiList.innerHTML = `<div class="empty-state"><i class="fas fa-receipt"></i>Belum ada transaksi</div>`;
        return;
    }
    const sorted = [...transactions].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    let html = `
        <div class="row header-row" style="display:grid;grid-template-columns:2fr 1.2fr 1fr 1.2fr;padding:10px 0;border-bottom:1px solid var(--border);color:var(--text-muted);font-size:11px;font-weight:800;">
            <span>Keterangan</span><span>Tanggal</span><span>Kategori</span><span>Nominal</span>
        </div>
    `;
    sorted.forEach(t => {
        const isPemasukan = t.jenis === 'pemasukan';
        const sign = isPemasukan ? '+' : '−';
        const color = isPemasukan ? 'var(--success)' : 'var(--danger)';
        const id = escapeHtml(String(t.id));
        html += `
            <div class="row" style="display:grid;grid-template-columns:2fr 1.2fr 1fr 1.2fr;padding:10px 0;border-bottom:1px solid var(--border);align-items:center;">
                <span>${escapeHtml(t.keterangan)}</span>
                <span>${formatTanggal(t.tanggal)}</span>
                <span>${escapeHtml(t.kategori)}</span>
                <span style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
                    <span style="color:${color};font-weight:700;">${sign} Rp${formatRupiah(t.nominal)}</span>
                    <span>
                        <button class="edit-btn-all" data-id="${id}" title="Edit"><i class="fas fa-pen"></i></button>
                        <button class="delete-btn-all" data-id="${id}" title="Hapus"><i class="fas fa-trash"></i></button>
                    </span>
                </span>
            </div>
        `;
    });
    dom.allTransaksiList.innerHTML = html;

    dom.allTransaksiList.querySelectorAll('.edit-btn-all').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            editTransaction(this.dataset.id);
        });
    });
    dom.allTransaksiList.querySelectorAll('.delete-btn-all').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteTransaction(this.dataset.id);
        });
    });
}

// ================================================================
//  TARGET
// ================================================================
function getTotalTabungan() {
    if (!target || !Array.isArray(target.savings)) return 0;
    return target.savings.reduce((sum, s) => sum + (Number(s.nominal) || 0), 0);
}

function renderTarget() {
    if (!target) return;
    const nominalTarget = Number(target.nominal) || 10000000;
    const totalTabungan = getTotalTabungan();
    const progress = nominalTarget > 0 ? Math.min(100, (totalTabungan / nominalTarget) * 100) : 0;
    const sisa = Math.max(0, nominalTarget - totalTabungan);

    if (dom.targetNominal) dom.targetNominal.textContent = 'Rp ' + formatRupiah(totalTabungan);
    if (dom.targetDesc) dom.targetDesc.textContent = 'dari target Rp ' + formatRupiah(nominalTarget);
    if (dom.targetProgress) dom.targetProgress.style.width = progress + '%';
    if (dom.targetStatus) dom.targetStatus.textContent = progress.toFixed(1) + '%';
    if (dom.targetNamaDashboard) dom.targetNamaDashboard.textContent = target.nama || 'Tabungan Darurat';

    if (dom.targetProgress2) dom.targetProgress2.style.width = progress + '%';
    if (dom.targetProgressText) dom.targetProgressText.textContent = progress.toFixed(1) + '%';
    if (dom.targetTerkumpul) dom.targetTerkumpul.textContent = 'Rp ' + formatRupiah(totalTabungan);
    if (dom.targetSisa) dom.targetSisa.textContent = 'sisa Rp ' + formatRupiah(sisa);
    if (dom.targetPageNama) dom.targetPageNama.textContent = target.nama || 'Tabungan Darurat';
    if (dom.targetNamaInput) dom.targetNamaInput.value = target.nama || 'Tabungan Darurat';
    if (dom.targetNominalInput) dom.targetNominalInput.value = nominalTarget;

    const statusMsg = getTargetStatus(progress);
    if (dom.targetPageStatus) dom.targetPageStatus.textContent = statusMsg;

    renderTargetSavingHistory();
}

function getTargetStatus(progress) {
    if (progress >= 100) return '🎉 Target tercapai!';
    if (progress >= 75) return '🚀 Hampir tercapai';
    if (progress >= 50) return '💪 Sudah setengah jalan';
    if (progress >= 25) return '🔥 Mulai berkembang';
    return '🌱 Baru mulai';
}

function renderTargetSavingHistory() {
    const container = dom.targetSavingHistory;
    if (!container) return;

    const savings = Array.isArray(target.savings) ? [...target.savings] : [];
    savings.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    if (dom.jmlSetoran) dom.jmlSetoran.textContent = savings.length + ' setoran';

    if (savings.length === 0) {
        container.innerHTML = `
            <div class="empty-saving-state">
                <i class="fas fa-piggy-bank"></i>
                <div>Belum ada setoran.<br>Mulai sisihkan uang untuk mencapai targetmu.</div>
            </div>
        `;
        return;
    }

    let html = '';
    savings.forEach(s => {
        const id = escapeHtml(String(s.id));
        html += `
            <div class="target-saving-item" data-id="${id}">
                <div class="target-saving-icon"><i class="fas fa-piggy-bank"></i></div>
                <div class="target-saving-info">
                    <strong>${escapeHtml(s.catatan || 'Setoran tabungan')}</strong>
                    <span>${formatTanggal(s.tanggal)}</span>
                </div>
                <div class="target-saving-amount">+Rp${formatRupiah(s.nominal)}</div>
                <div class="target-saving-actions">
                    <button class="saving-edit" data-id="${id}" title="Edit"><i class="fas fa-pen"></i></button>
                    <button class="saving-delete" data-id="${id}" title="Hapus"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;

    container.querySelectorAll('.saving-edit').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            editSaving(this.dataset.id);
        });
    });
    container.querySelectorAll('.saving-delete').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteSaving(this.dataset.id);
        });
    });
}

function editSaving(id) {
    const s = target.savings.find(item => String(item.id) === String(id));
    if (!s) { alert('Setoran tidak ditemukan'); return; }
    openSavingModal(s);
}

function deleteSaving(id) {
    const s = target.savings.find(item => String(item.id) === String(id));
    if (!s) { alert('Setoran tidak ditemukan'); return; }
    if (!confirm(`Hapus setoran Rp${formatRupiah(s.nominal)}?`)) return;
    target.savings = target.savings.filter(item => String(item.id) !== String(id));
    saveData();
    renderAll();
}

// ================================================================
//  MODAL TRANSAKSI
// ================================================================
function openModal(editData = null) {
    if (!dom.modal) { alert('Modal tidak tersedia'); return; }
    dom.modal.style.display = 'flex';
    if (editData) {
        dom.modalTitle.textContent = 'Edit Transaksi';
        dom.fKeterangan.value = editData.keterangan;
        dom.fNominal.value = editData.nominal;
        dom.fKategori.value = editData.kategori;
        dom.fTanggal.value = editData.tanggal;
        const radio = document.querySelector(`input[name="jenis"][value="${editData.jenis}"]`);
        if (radio) radio.checked = true;
        editingId = String(editData.id);
    } else {
        dom.modalTitle.textContent = 'Tambah Transaksi';
        dom.fKeterangan.value = '';
        dom.fNominal.value = '';
        dom.fKategori.value = 'makanan';
        dom.fTanggal.value = getLocalDateString();
        const radio = document.querySelector('input[name="jenis"][value="pemasukan"]');
        if (radio) radio.checked = true;
        editingId = null;
    }
}

function closeModal() {
    if (dom.modal) dom.modal.style.display = 'none';
    editingId = null;
}

function handleFormSubmit(e) {
    e.preventDefault();
    const radio = document.querySelector('input[name="jenis"]:checked');
    if (!radio) { alert('Pilih jenis transaksi'); return; }
    const jenis = radio.value;
    const keterangan = dom.fKeterangan?.value?.trim() || '';
    const nominal = parseFloat(dom.fNominal?.value);
    const kategori = dom.fKategori?.value || 'lainnya';
    const tanggal = dom.fTanggal?.value;

    if (!keterangan) { alert('Masukkan keterangan'); return; }
    if (!Number.isFinite(nominal) || nominal <= 0) { alert('Masukkan nominal valid'); return; }
    if (!tanggal) { alert('Pilih tanggal'); return; }

    if (editingId) {
        const idx = transactions.findIndex(t => String(t.id) === String(editingId));
        if (idx === -1) { alert('Data tidak ditemukan'); return; }
        transactions[idx] = { ...transactions[idx], jenis, keterangan, nominal, kategori, tanggal };
    } else {
        transactions.push({ id: createId('t'), jenis, keterangan, nominal, kategori, tanggal });
    }
    saveData();
    closeModal();
    renderAll();
}

// ================================================================
//  MODAL TABUNGAN
// ================================================================
function openSavingModal(editData = null) {
    if (!dom.modalTabungan) { alert('Modal tabungan tidak tersedia'); return; }
    dom.modalTabungan.style.display = 'flex';
    if (editData) {
        dom.modalTabunganTitle.textContent = 'Edit Tabungan';
        dom.fTabunganNominal.value = editData.nominal;
        dom.fTabunganTanggal.value = editData.tanggal;
        dom.fTabunganCatatan.value = editData.catatan || '';
        editingSavingId = String(editData.id);
    } else {
        dom.modalTabunganTitle.textContent = 'Tambah Tabungan';
        dom.fTabunganNominal.value = '';
        dom.fTabunganTanggal.value = getLocalDateString();
        dom.fTabunganCatatan.value = '';
        editingSavingId = null;
    }
    const targetNameEl = document.getElementById('tabunganTargetName');
    if (targetNameEl) targetNameEl.textContent = target.nama || 'Tabungan Darurat';
}

function closeSavingModal() {
    if (dom.modalTabungan) dom.modalTabungan.style.display = 'none';
    editingSavingId = null;
}

// ================================================================
//  FORM SUBMIT TABUNGAN (PERBAIKAN)
// ================================================================
function handleSavingSubmit(e) {
    e.preventDefault();

    if (!Array.isArray(target.savings)) target.savings = [];

    // Ambil nilai dari input
    const nominalInput = dom.fTabunganNominal;
    const tanggalInput = dom.fTabunganTanggal;
    const catatanInput = dom.fTabunganCatatan;

    // Validasi elemen ada
    if (!nominalInput || !tanggalInput) {
        alert('Form tabungan tidak lengkap. Refresh halaman.');
        return;
    }

    // Ambil nilai sebagai string, lalu bersihkan
    let rawNominal = nominalInput.value.trim();
    if (!rawNominal) {
        alert('Masukkan nominal tabungan.');
        nominalInput.focus();
        return;
    }

    // Konversi ke angka (hapus titik, koma, spasi)
    const cleanNominal = rawNominal.replace(/[^0-9]/g, '');
    const nominal = parseFloat(cleanNominal);

    // Validasi angka
    if (isNaN(nominal) || nominal <= 0) {
        alert('Masukkan nominal tabungan yang valid (angka positif). Contoh: 100000');
        nominalInput.value = '';
        nominalInput.focus();
        return;
    }

    const tanggal = tanggalInput.value;
    if (!tanggal) {
        alert('Pilih tanggal tabungan.');
        tanggalInput.focus();
        return;
    }

    const catatan = catatanInput?.value?.trim() || '';

    // Simpan atau update
    if (editingSavingId) {
        const idx = target.savings.findIndex(s => String(s.id) === String(editingSavingId));
        if (idx === -1) {
            alert('Setoran tidak ditemukan.');
            return;
        }
        target.savings[idx] = { ...target.savings[idx], nominal, tanggal, catatan };
    } else {
        target.savings.push({
            id: createId('saving'),
            nominal,
            tanggal,
            catatan
        });
    }

    saveData();
    closeSavingModal();
    renderAll();

    // Cek target tercapai
    const total = getTotalTabungan();
    const targetNominal = Number(target.nominal) || 0;
    if (total >= targetNominal && targetNominal > 0) {
        setTimeout(() => {
            alert('🎉 Selamat! Target tabungan kamu sudah tercapai!');
        }, 300);
    }
}

// ================================================================
//  KATEGORI CHART
// ================================================================
function renderKategoriChart() {
    if (!dom.kategoriChart) return;
    const now = new Date();
    const bulanIni = now.getMonth();
    const tahunIni = now.getFullYear();

    const kategoriMap = {};
    let total = 0;
    transactions.forEach(t => {
        const d = new Date(t.tanggal + 'T00:00:00');
        if (d.getMonth() === bulanIni && d.getFullYear() === tahunIni && t.jenis === 'pengeluaran') {
            const nominal = Number(t.nominal) || 0;
            kategoriMap[t.kategori] = (kategoriMap[t.kategori] || 0) + nominal;
            total += nominal;
        }
    });

    const entries = Object.entries(kategoriMap).sort((a, b) => b[1] - a[1]);
    dom.kategoriChart.innerHTML = '';
    if (entries.length === 0) {
        dom.kategoriChart.innerHTML = `<div style="color:var(--text-secondary);font-size:14px;padding:8px 0;">Belum ada pengeluaran bulan ini</div>`;
        if (dom.kategoriTeratas) dom.kategoriTeratas.textContent = '—';
        return;
    }
    if (dom.kategoriTeratas) {
        dom.kategoriTeratas.textContent = `${entries[0][0]} (${Math.round((entries[0][1]/total)*100)}%)`;
    }

    const colors = ['#6c5ce7','#00d4aa','#ff6b6b','#ffc107','#4ecdc4','#a29bfe'];
    entries.slice(0, 6).forEach(([kategori, nominal], index) => {
        const persen = (nominal / total) * 100;
        const item = document.createElement('div');
        item.className = 'kategori-item';
        item.innerHTML = `
            <span>${escapeHtml(kategori)}</span>
            <div class="bar" style="width:${Math.max(10, persen * 1.2)}px; background:${colors[index % colors.length]};"></div>
            <span class="persen">${persen.toFixed(0)}%</span>
        `;
        dom.kategoriChart.appendChild(item);
    });
}

// ================================================================
//  LAPORAN
// ================================================================
function renderLaporan() {
    if (!dom.laporanBulanan || !dom.laporanRingkasan) return;
    const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const tahunIni = new Date().getFullYear();
    const pemasukanBulan = new Array(12).fill(0);
    const pengeluaranBulan = new Array(12).fill(0);

    transactions.forEach(t => {
        const d = new Date(t.tanggal + 'T00:00:00');
        if (d.getFullYear() === tahunIni) {
            const idx = d.getMonth();
            const nominal = Number(t.nominal) || 0;
            if (t.jenis === 'pemasukan') pemasukanBulan[idx] += nominal;
            else pengeluaranBulan[idx] += nominal;
        }
    });

    const maxVal = Math.max(1, ...pemasukanBulan, ...pengeluaranBulan);
    dom.laporanBulanan.innerHTML = '';
    for (let i = 0; i < 12; i++) {
        const p = (pemasukanBulan[i] / maxVal) * 160;
        const q = (pengeluaranBulan[i] / maxVal) * 160;
        const div = document.createElement('div');
        div.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;';
        div.innerHTML = `
            <div style="width:100%;display:flex;justify-content:center;gap:2px;align-items:flex-end;height:170px;">
                <div style="width:30%;background:#00d4aa;border-radius:4px 4px 0 0;height:${p}px;min-height:2px;transition:0.3s;"></div>
                <div style="width:30%;background:#ff6b6b;border-radius:4px 4px 0 0;height:${q}px;min-height:2px;transition:0.3s;"></div>
            </div>
            <span style="color:var(--text-secondary);font-size:9px;">${bulan[i]}</span>
        `;
        dom.laporanBulanan.appendChild(div);
    }

    const totalPem = pemasukanBulan.reduce((a,b) => a+b, 0);
    const totalPeng = pengeluaranBulan.reduce((a,b) => a+b, 0);
    dom.laporanRingkasan.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div style="background:rgba(0,212,170,0.06);padding:12px;border-radius:16px;">
                <div style="color:var(--text-secondary);font-size:12px;">Total Pemasukan</div>
                <div style="font-size:20px;font-weight:700;color:var(--success);">Rp ${formatRupiah(totalPem)}</div>
            </div>
            <div style="background:rgba(255,107,107,0.06);padding:12px;border-radius:16px;">
                <div style="color:var(--text-secondary);font-size:12px;">Total Pengeluaran</div>
                <div style="font-size:20px;font-weight:700;color:var(--danger);">Rp ${formatRupiah(totalPeng)}</div>
            </div>
        </div>
        <div style="margin-top:12px;padding:12px;background:rgba(255,255,255,0.02);border-radius:16px;">
            <div style="display:flex;justify-content:space-between;color:var(--text-secondary);font-size:13px;">
                <span>Selisih</span>
                <span style="font-weight:600;color:${totalPem >= totalPeng ? 'var(--success)' : 'var(--danger)'};">Rp ${formatRupiah(totalPem - totalPeng)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;color:var(--text-secondary);font-size:13px;margin-top:4px;">
                <span>Transaksi</span>
                <span>${transactions.length} transaksi</span>
            </div>
        </div>
    `;
}

// ================================================================
//  NAVIGASI
// ================================================================
function navigateTo(page) {
    currentPage = page;
    document.querySelectorAll('.page-section').forEach(el => el.style.display = 'none');
    const target = document.getElementById('page-' + page);
    if (target) target.style.display = 'block';

    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');

    const titles = { dashboard: 'Dashboard', transaksi: 'Transaksi', target: 'Target', laporan: 'Laporan' };
    if (dom.pageTitle) dom.pageTitle.textContent = titles[page] || 'Dashboard';
}

function renderAll() {
    renderSaldo();
    renderHistory();
    renderTarget();
    renderKategoriChart();
    renderAllTransactions();
    renderLaporan();
    updatePage();
}

function updatePage() {
    navigateTo(currentPage);
}

// ================================================================
//  BIND EVENTS
// ================================================================
function bindEvents() {
    // NAV
    document.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page) navigateTo(page);
        });
    });

    // MOBILE
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebarClose');
    const overlay = document.getElementById('sidebarOverlay');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });
    }
    if (sidebarClose) {
        sidebarClose.addEventListener('click', function() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }
    if (overlay) {
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    }

    // TOMBOL TAMBAH
    const tambahBtns = document.querySelectorAll('#btnTambahTransaksiTop, #btnTambahDariPage, .topbar-add-btn');
    tambahBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    });
    if (dom.btnTambah) {
        dom.btnTambah.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    }
    if (dom.btnTambahPage) {
        dom.btnTambahPage.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    }

    // MODAL TRANSAKSI
    if (dom.modalClose) dom.modalClose.addEventListener('click', closeModal);
    if (dom.modalCancel) dom.modalCancel.addEventListener('click', closeModal);
    if (dom.modal) {
        dom.modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    if (dom.form) dom.form.addEventListener('submit', handleFormSubmit);

    // FILTER
    if (dom.filterKategori) {
        dom.filterKategori.addEventListener('change', renderHistory);
    }

    // TARGET
    if (dom.btnSimpanTarget) {
        dom.btnSimpanTarget.addEventListener('click', function() {
            const nama = dom.targetNamaInput?.value?.trim() || 'Tabungan Darurat';
            const nominal = parseFloat(dom.targetNominalInput?.value);
            if (!Number.isFinite(nominal) || nominal <= 0) {
                alert('Masukkan nominal target yang valid');
                return;
            }
            target.nama = nama;
            target.nominal = nominal;
            if (!Array.isArray(target.savings)) target.savings = [];
            saveData();
            renderAll();
            alert('✅ Target berhasil disimpan!');
        });
    }
    if (dom.btnEditTarget) {
        dom.btnEditTarget.addEventListener('click', function() {
            navigateTo('target');
        });
    }

    // TABUNGAN
    if (dom.btnTambahTabungan) {
        dom.btnTambahTabungan.addEventListener('click', function() {
            openSavingModal();
        });
    }
    if (dom.modalTabunganClose) dom.modalTabunganClose.addEventListener('click', closeSavingModal);
    if (dom.modalTabunganCancel) dom.modalTabunganCancel.addEventListener('click', closeSavingModal);
    if (dom.modalTabungan) {
        dom.modalTabungan.addEventListener('click', function(e) {
            if (e.target === this) closeSavingModal();
        });
    }
    if (dom.formTabungan) dom.formTabungan.addEventListener('submit', handleSavingSubmit);

    // PERIOD
    dom.periodBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            dom.periodBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filterMode = this.dataset.period === 'bulan' ? 'bulan' : 'semua';
            renderAll();
        });
    });

    // ESCAPE
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (dom.modalTabungan && dom.modalTabungan.style.display === 'flex') closeSavingModal();
            else if (dom.modal && dom.modal.style.display === 'flex') closeModal();
        }
    });

    // VIEW ALL
    document.querySelectorAll('[data-page-link="transaksi"]').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            navigateTo('transaksi');
        });
    });
}

// ================================================================
//  INIT
// ================================================================
function init() {
    console.log('🚀 Keuangan Dashboard starting...');
    loadData();
    if (dom.fTanggal) dom.fTanggal.value = getLocalDateString();
    if (dom.fTabunganTanggal) dom.fTabunganTanggal.value = getLocalDateString();
    renderAll();
    bindEvents();
    console.log('✅ Keuangan Dashboard ready.');
}

document.addEventListener('DOMContentLoaded', init);
