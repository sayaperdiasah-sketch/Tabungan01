// ================================================================
//  STATE
// ================================================================
let transactions = [];
let target = { nama: 'Tabungan Darurat', nominal: 10000000 };
let editingId = null;
let currentPage = 'dashboard';
let filterKategori = 'semua';

// ================================================================
//  DOM REFS
// ================================================================
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

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

    kategoriChart: $('#kategoriChart'),
    kategoriTeratas: $('#kategoriTeratas'),

    laporanBulanan: $('#laporanBulanan'),
    laporanRingkasan: $('#laporanRingkasan'),

    modal: $('#modalTransaksi'),
    modalTitle: $('#modalTitle'),
    form: $('#formTransaksi'),
    fJenis: $$('input[name="jenis"]'),
    fKeterangan: $('#fKeterangan'),
    fNominal: $('#fNominal'),
    fKategori: $('#fKategori'),
    fTanggal: $('#fTanggal'),
    modalClose: $('#modalClose'),
    modalCancel: $('#modalCancel'),

    btnTambah: $('#btnTambahTransaksi'),
    btnTambahPage: $('#btnTambahDariPage'),
    btnSimpanTarget: $('#btnSimpanTarget'),
    btnEditTarget: $('#btnEditTarget'),
    btnFilterPeriod: $('#btnFilterPeriod'),
    rangeText: $('#rangeText'),
    greeting: $('#greeting'),
    userName: $('#userName'),
};

// ================================================================
//  LOCAL STORAGE
// ================================================================
function loadData() {
    try {
        const raw = localStorage.getItem('keuangan_data');
        if (raw) {
            const data = JSON.parse(raw);
            transactions = data.transactions || [];
            target = data.target || { nama: 'Tabungan Darurat', nominal: 10000000 };
        } else {
            // Data dummy untuk demo (opsional)
            // transactions = [...];
        }
    } catch (e) {
        console.warn('Gagal load data:', e);
    }
}

function saveData() {
    try {
        localStorage.setItem('keuangan_data', JSON.stringify({ transactions, target }));
    } catch (e) {
        console.warn('Gagal save data:', e);
    }
}

// ================================================================
//  RENDER ALL
// ================================================================
function renderAll() {
    renderSaldo();
    renderHistory();
    renderTarget();
    renderKategoriChart();
    renderAllTransactions();
    renderLaporan();
    updatePage();
}

// ================================================================
//  RENDER SALDO
// ================================================================
function renderSaldo() {
    const now = new Date();
    const bulanIni = now.getMonth();
    const tahunIni = now.getFullYear();

    let totalPemasukan = 0, totalPengeluaran = 0;
    let jmlPemasukan = 0, jmlPengeluaran = 0;

    transactions.forEach(t => {
        const d = new Date(t.tanggal);
        if (d.getMonth() === bulanIni && d.getFullYear() === tahunIni) {
            if (t.jenis === 'pemasukan') {
                totalPemasukan += t.nominal;
                jmlPemasukan++;
            } else {
                totalPengeluaran += t.nominal;
                jmlPengeluaran++;
            }
        }
    });

    const saldo = totalPemasukan - totalPengeluaran;

    dom.saldo.textContent = 'Rp ' + formatRupiah(saldo);
    dom.pemasukan.textContent = 'Rp ' + formatRupiah(totalPemasukan);
    dom.pengeluaran.textContent = 'Rp ' + formatRupiah(totalPengeluaran);
    dom.jmlPemasukan.textContent = jmlPemasukan + ' transaksi';
    dom.jmlPengeluaran.textContent = jmlPengeluaran + ' transaksi';

    const trend = totalPemasukan > totalPengeluaran ? '+ positif' : totalPemasukan < totalPengeluaran ? '- defisit' : 'seimbang';
    dom.saldoBadge.innerHTML = `<i class="fas fa-${totalPemasukan >= totalPengeluaran ? 'arrow-up' : 'arrow-down'}"></i> ${trend}`;
    dom.trendSaldo.innerHTML = `<i class="fas fa-${totalPemasukan >= totalPengeluaran ? 'arrow-up' : 'arrow-down'}"></i> ${totalPemasukan >= totalPengeluaran ? 'Sehat' : 'Perhatikan'}`;

    const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    dom.rangeText.textContent = `${bulan[bulanIni]} ${tahunIni}`;
    dom.btnFilterPeriod.innerHTML = `<i class="fas fa-calendar"></i> ${bulan[bulanIni]} ${tahunIni}`;
}

// ================================================================
//  RENDER HISTORY
// ================================================================
function renderHistory() {
    const filter = dom.filterKategori.value;
    let filtered = [...transactions];
    if (filter !== 'semua') {
        filtered = filtered.filter(t => t.kategori === filter);
    }
    filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    dom.jmlRiwayat.textContent = filtered.length + ' transaksi';

    if (filtered.length === 0) {
        dom.historyTable.innerHTML = `<div class="empty-state"><i class="fas fa-receipt"></i>Belum ada transaksi</div>`;
        return;
    }

    let html = `
        <div class="row header-row">
            <span>Keterangan</span>
            <span>Tanggal</span>
            <span>Kategori</span>
            <span>Nominal</span>
        </div>
    `;

    filtered.slice(0, 10).forEach(t => {
        const isPemasukan = t.jenis === 'pemasukan';
        const sign = isPemasukan ? '+' : '−';
        const color = isPemasukan ? 'var(--success)' : 'var(--danger)';

        html += `
            <div class="row">
                <span>${escapeHtml(t.keterangan)}</span>
                <span>${formatTanggal(t.tanggal)}</span>
                <span>${escapeHtml(t.kategori)}</span>
                <span style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
                    <span style="color:${color};font-weight:700;">${sign} Rp${formatRupiah(t.nominal)}</span>
                    <button class="delete-btn" data-id="${t.id}" title="Hapus"><i class="fas fa-trash"></i></button>
                </span>
            </div>
        `;
    });

    dom.historyTable.innerHTML = html;

    dom.historyTable.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            if (confirm('Hapus transaksi ini?')) {
                transactions = transactions.filter(t => t.id !== id);
                saveData();
                renderAll();
            }
        });
    });
}

// ================================================================
//  RENDER ALL TRANSACTIONS (halaman transaksi)
// ================================================================
function renderAllTransactions() {
    const list = dom.allTransaksiList;
    if (transactions.length === 0) {
        list.innerHTML = `<div class="empty-state"><i class="fas fa-receipt"></i>Belum ada transaksi</div>`;
        return;
    }

    const sorted = [...transactions].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    let html = `
        <div class="row header-row" style="grid-template-columns:2fr 1.2fr 1fr 1.2fr;">
            <span>Keterangan</span><span>Tanggal</span><span>Kategori</span><span>Nominal</span>
        </div>
    `;
    sorted.forEach(t => {
        const isPemasukan = t.jenis === 'pemasukan';
        const sign = isPemasukan ? '+' : '−';
        const color = isPemasukan ? 'var(--success)' : 'var(--danger)';
        html += `
            <div class="row" style="grid-template-columns:2fr 1.2fr 1fr 1.2fr;">
                <span>${escapeHtml(t.keterangan)}</span>
                <span>${formatTanggal(t.tanggal)}</span>
                <span>${escapeHtml(t.kategori)}</span>
                <span style="display:flex;align-items:center;gap:8px;justify-content:space-between;">
                    <span style="color:${color};font-weight:700;">${sign} Rp${formatRupiah(t.nominal)}</span>
                    <button class="delete-btn" data-id="${t.id}" title="Hapus"><i class="fas fa-trash"></i></button>
                </span>
            </div>
        `;
    });
    list.innerHTML = html;

    list.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            if (confirm('Hapus transaksi ini?')) {
                transactions = transactions.filter(t => t.id !== id);
                saveData();
                renderAll();
            }
        });
    });
}

// ================================================================
//  RENDER TARGET
// ================================================================
function renderTarget() {
    const now = new Date();
    const bulanIni = now.getMonth();
    const tahunIni = now.getFullYear();

    let totalPemasukan = 0;
    transactions.forEach(t => {
        const d = new Date(t.tanggal);
        if (d.getMonth() === bulanIni && d.getFullYear() === tahunIni && t.jenis === 'pemasukan') {
            totalPemasukan += t.nominal;
        }
    });

    const nominalTarget = target.nominal || 10000000;
    const progress = Math.min(100, (totalPemasukan / nominalTarget) * 100);

    dom.targetNominal.textContent = 'Rp ' + formatRupiah(nominalTarget);
    dom.targetDesc.textContent = `dari target Rp ${formatRupiah(nominalTarget)}`;
    dom.targetProgress.style.width = progress + '%';
    dom.targetProgress2.style.width = progress + '%';
    dom.targetProgressText.textContent = progress.toFixed(1) + '%';
    dom.targetTerkumpul.textContent = 'Rp ' + formatRupiah(totalPemasukan);
    dom.targetSisa.textContent = 'sisa Rp ' + formatRupiah(Math.max(0, nominalTarget - totalPemasukan));

    dom.targetNamaInput.value = target.nama || 'Tabungan Darurat';
    dom.targetNominalInput.value = nominalTarget;
}

// ================================================================
//  RENDER KATEGORI CHART
// ================================================================
function renderKategoriChart() {
    const now = new Date();
    const bulanIni = now.getMonth();
    const tahunIni = now.getFullYear();

    const kategoriMap = {};
    let total = 0;

    transactions.forEach(t => {
        const d = new Date(t.tanggal);
        if (d.getMonth() === bulanIni && d.getFullYear() === tahunIni && t.jenis === 'pengeluaran') {
            kategoriMap[t.kategori] = (kategoriMap[t.kategori] || 0) + t.nominal;
            total += t.nominal;
        }
    });

    const entries = Object.entries(kategoriMap).sort((a, b) => b[1] - a[1]);
    const container = dom.kategoriChart;
    container.innerHTML = '';

    if (entries.length === 0) {
        container.innerHTML = '<div style="color:var(--text-secondary);font-size:14px;padding:8px 0;">Belum ada pengeluaran bulan ini</div>';
        dom.kategoriTeratas.textContent = '—';
        return;
    }

    dom.kategoriTeratas.textContent = entries[0][0] + ' (' + Math.round((entries[0][1] / total) * 100) + '%)';

    entries.slice(0, 6).forEach(([kategori, nominal]) => {
        const persen = (nominal / total) * 100;
        const item = document.createElement('div');
        item.className = 'kategori-item';
        const colors = ['#6c5ce7', '#00d4aa', '#ff6b6b', '#ffc107', '#4ecdc4', '#a29bfe'];
        const idx = entries.indexOf([kategori, nominal]) % colors.length;
        item.innerHTML = `
            <span>${kategori}</span>
            <div class="bar" style="width:${Math.max(10, persen * 1.2)}px; background:${colors[idx]};"></div>
            <span class="persen">${persen.toFixed(0)}%</span>
        `;
        container.appendChild(item);
    });
}

// ================================================================
//  RENDER LAPORAN
// ================================================================
function renderLaporan() {
    const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const tahunIni = new Date().getFullYear();

    const pemasukanBulan = new Array(12).fill(0);
    const pengeluaranBulan = new Array(12).fill(0);

    transactions.forEach(t => {
        const d = new Date(t.tanggal);
        if (d.getFullYear() === tahunIni) {
            const idx = d.getMonth();
            if (t.jenis === 'pemasukan') pemasukanBulan[idx] += t.nominal;
            else pengeluaranBulan[idx] += t.nominal;
        }
    });

    const maxVal = Math.max(1, ...pemasukanBulan, ...pengeluaranBulan);
    const container = dom.laporanBulanan;
    container.innerHTML = '';

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
        container.appendChild(div);
    }

    const totalPem = pemasukanBulan.reduce((a, b) => a + b, 0);
    const totalPeng = pengeluaranBulan.reduce((a, b) => a + b, 0);
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
//  PAGE NAVIGATION
// ================================================================
function navigateTo(page) {
    currentPage = page;
    document.querySelectorAll('.page-section').forEach(el => el.style.display = 'none');
    const target = document.getElementById('page' + page.charAt(0).toUpperCase() + page.slice(1));
    if (target) target.style.display = 'block';

    document.querySelectorAll('.nav-icons a').forEach(el => el.classList.remove('active'));
    const navLink = document.querySelector(`.nav-icons a[data-page="${page}"]`);
    if (navLink) navLink.classList.add('active');
}

function updatePage() {}

// ================================================================
//  MODAL
// ================================================================
function openModal(editData = null) {
    dom.modal.style.display = 'flex';
    if (editData) {
        dom.modalTitle.textContent = 'Edit Transaksi';
        dom.fKeterangan.value = editData.keterangan;
        dom.fNominal.value = editData.nominal;
        dom.fKategori.value = editData.kategori;
        dom.fTanggal.value = editData.tanggal;
        const radio = document.querySelector(`input[name="jenis"][value="${editData.jenis}"]`);
        if (radio) radio.checked = true;
        editingId = editData.id;
    } else {
        dom.modalTitle.textContent = 'Tambah Transaksi';
        dom.fKeterangan.value = '';
        dom.fNominal.value = '';
        dom.fKategori.value = 'Makanan';
        dom.fTanggal.value = new Date().toISOString().split('T')[0];
        document.querySelector('input[name="jenis"][value="pemasukan"]').checked = true;
        editingId = null;
    }
}

function closeModal() {
    dom.modal.style.display = 'none';
    editingId = null;
}

// ================================================================
//  FORM SUBMIT (Tambah & Edit)
// ================================================================
function handleFormSubmit(e) {
    e.preventDefault();

    const jenis = document.querySelector('input[name="jenis"]:checked').value;
    const keterangan = dom.fKeterangan.value.trim();
    const nominal = parseFloat(dom.fNominal.value);
    const kategori = dom.fKategori.value;
    const tanggal = dom.fTanggal.value;

    if (!keterangan) { alert('Masukkan keterangan'); return; }
    if (!nominal || nominal <= 0) { alert('Masukkan nominal valid'); return; }
    if (!tanggal) { alert('Pilih tanggal'); return; }

    if (editingId) {
        // Edit
        const idx = transactions.findIndex(t => t.id === editingId);
        if (idx !== -1) {
            transactions[idx] = { ...transactions[idx], jenis, keterangan, nominal, kategori, tanggal };
        }
    } else {
        // Tambah
        transactions.push({
            id: Date.now() + Math.random() * 1000,
            jenis,
            keterangan,
            nominal,
            kategori,
            tanggal
        });
    }

    saveData();
    closeModal();
    renderAll();
}

// ================================================================
//  BIND EVENTS
// ================================================================
function bindEvents() {
    // Nav
    document.querySelectorAll('.nav-icons a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page) navigateTo(page);
        });
    });

    // Modal
    dom.btnTambah.addEventListener('click', () => openModal());
    dom.btnTambahPage.addEventListener('click', () => openModal());
    dom.modalClose.addEventListener('click', closeModal);
    dom.modalCancel.addEventListener('click', closeModal);
    dom.modal.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    // Form
    dom.form.addEventListener('submit', handleFormSubmit);

    // Filter
    dom.filterKategori.addEventListener('change', renderHistory);

    // Target
    dom.btnSimpanTarget.addEventListener('click', function() {
        const nama = dom.targetNamaInput.value.trim() || 'Tabungan Darurat';
        const nominal = parseFloat(dom.targetNominalInput.value);
        if (!nominal || nominal <= 0) { alert('Masukkan nominal target yang valid'); return; }
        target.nama = nama;
        target.nominal = nominal;
        saveData();
        renderTarget();
        alert('✅ Target berhasil disimpan!');
    });

    dom.btnEditTarget.addEventListener('click', function() {
        navigateTo('target');
    });

    // Filter period
    dom.btnFilterPeriod.addEventListener('click', function() {
        const currentText = this.textContent.trim();
        if (currentText.includes('Bulan')) {
            this.innerHTML = '<i class="fas fa-calendar"></i> Tahun ini';
            dom.rangeText.textContent = new Date().getFullYear();
        } else {
            const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            this.innerHTML = `<i class="fas fa-calendar"></i> ${bulan[new Date().getMonth()]} ${new Date().getFullYear()}`;
            dom.rangeText.textContent = `${bulan[new Date().getMonth()]} ${new Date().getFullYear()}`;
        }
        renderAll();
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}

// ================================================================
//  HELPERS
// ================================================================
function formatRupiah(angka) {
    return angka.toLocaleString('id-ID');
}

function formatTanggal(dateStr) {
    const d = new Date(dateStr);
    const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setDefaultDate() {
    dom.fTanggal.value = new Date().toISOString().split('T')[0];
}

// ================================================================
//  START
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    setDefaultDate();
    loadData();
    renderAll();
    bindEvents();
});
