// ================================================================
//  KEUANGAN PRIBADI — SCRIPT.JS
//  Versi kompatibel dengan HTML terbaru
// ================================================================

// ================================================================
// STATE
// ================================================================

let transactions = [];
let target = { nama: 'Tabungan Darurat', nominal: 10000000, savings: [] };
let editingId = null;
let editingSavingId = null;
let currentPage = 'dashboard';
let filterKategori = 'semua';
let filterMode = 'bulan';

// ================================================================
// DOM HELPER
// ================================================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ================================================================
// DOM REFS — disesuaikan dengan ID di HTML
// ================================================================

const dom = {
    // Saldo
    saldo: $('#totalSaldo'),
    pemasukan: $('#totalPemasukan'),
    pengeluaran: $('#totalPengeluaran'),
    jmlPemasukan: $('#jmlPemasukan'),
    jmlPengeluaran: $('#jmlPengeluaran'),
    saldoBadge: $('#saldoBadge'),
    trendSaldo: $('#trendSaldo'),
    
    // History
    historyTable: $('#historyTable'),
    jmlRiwayat: $('#jmlRiwayat'),
    filterKategori: $('#filterKategori'),
    allTransaksiList: $('#allTransaksiList'),
    
    // Target
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
    targetSavingHistory: $('#targetSavingHistory'),
    jmlSetoran: $('#jmlSetoran'),
    
    // Laporan
    laporanBulanan: $('#laporanBulanan'),
    laporanRingkasan: $('#laporanRingkasan'),
    laporanLabelBulan: $('#laporanLabelBulan'),
    
    // Modal Transaksi
    modal: $('#modalTransaksi'),
    modalTitle: $('#modalTitle'),
    form: $('#formTransaksi'),
    fKeterangan: $('#fKeterangan'),
    fNominal: $('#fNominal'),
    fKategori: $('#fKategori'),
    fTanggal: $('#fTanggal'),
    modalClose: $('#modalClose'),
    modalCancel: $('#modalCancel'),
    
    // Button Transaksi
    btnTambah: $('#btnTambahTransaksi'),
    btnTambahPage: $('#btnTambahDariPage'),
    
    // Target Button
    btnSimpanTarget: $('#btnSimpanTarget'),
    btnEditTarget: $('#btnEditTarget'),
    btnTambahTabungan: $('#btnTambahTabungan'),
    
    // Filter
    btnFilterPeriod: $('#btnFilterPeriod'),
    rangeText: $('#rangeText'),
    
    // Modal Tabungan
    modalTabungan: $('#modalTabungan'),
    modalTabunganTitle: $('#modalTabunganTitle'),
    formTabungan: $('#formTabungan'),
    fTabunganNominal: $('#tabunganNominal'),
    fTabunganTanggal: $('#tabunganTanggal'),
    fTabunganCatatan: $('#tabunganCatatan'),
    modalTabunganClose: $('#tabunganModalClose'),
    modalTabunganCancel: $('#tabunganModalCancel'),
    btnSimpanTabunganText: $('#btnSimpanTabunganText'),
    
    // Navigasi
    navItems: $$('.nav-item'),
    pageSections: $$('.page-section'),
    mobileMenuBtn: $('#mobileMenuBtn'),
    sidebarClose: $('#sidebarClose'),
    sidebarOverlay: $('#sidebarOverlay'),
    sidebar: $('.sidebar'),
    
    // Laporan navigasi
    laporanPrev: $('#laporanPrev'),
    laporanNext: $('#laporanNext'),
};

// ================================================================
// LOCAL STORAGE
// ================================================================

function loadData() {
    try {
        const raw = localStorage.getItem('keuangan_data_v2');
        if (!raw) {
            resetData();
            return;
        }
        const data = JSON.parse(raw);
        transactions = Array.isArray(data.transactions) ? data.transactions : [];
        target = data.target || { nama: 'Tabungan Darurat', nominal: 10000000, savings: [] };
        if (!Array.isArray(target.savings)) target.savings = [];
    } catch (e) {
        console.warn('Gagal load data:', e);
        resetData();
    }
}

function resetData() {
    transactions = [];
    target = { nama: 'Tabungan Darurat', nominal: 10000000, savings: [] };
}

function saveData() {
    try {
        localStorage.setItem('keuangan_data_v2', JSON.stringify({ transactions, target }));
    } catch (e) {
        console.warn('Gagal save data:', e);
    }
}

// ================================================================
// RENDER ALL
// ================================================================

function renderAll() {
    renderSaldo();
    renderHistory();
    renderTarget();
    renderKategoriChart();
    renderAllTransactions();
    renderLaporan();
    renderTargetSavingHistory();
}

// ================================================================
// RENDER SALDO
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
    
    updatePeriodDisplay();
}

// ================================================================
// RENDER HISTORY
// ================================================================

function renderHistory() {
    if (!dom.historyTable) return;
    
    let filtered = [...transactions];
    if (dom.filterKategori && dom.filterKategori.value !== 'semua') {
        filtered = filtered.filter(t => t.kategori === dom.filterKategori.value);
    }
    
    filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    if (dom.jmlRiwayat) dom.jmlRiwayat.textContent = filtered.length;
    
    if (filtered.length === 0) {
        dom.historyTable.innerHTML = `
            <tr><td colspan="6">
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <strong>Belum ada transaksi</strong>
                    <p>Mulai catat pemasukan dan pengeluaranmu</p>
                </div>
            </td></tr>
        `;
        return;
    }
    
    let html = '';
    filtered.slice(0, 10).forEach(t => {
        const isPemasukan = t.jenis === 'pemasukan';
        const sign = isPemasukan ? '+' : '−';
        const color = isPemasukan ? 'var(--success)' : 'var(--danger)';
        const status = isPemasukan ? 'Pemasukan' : 'Pengeluaran';
        const statusClass = isPemasukan ? 'success' : 'danger';
        
        html += `
            <tr data-id="${t.id}">
                <td><strong>${escapeHtml(t.keterangan)}</strong></td>
                <td>${escapeHtml(t.kategori)}</td>
                <td>${formatTanggal(t.tanggal)}</td>
                <td style="color:${color};font-weight:700;">${sign} Rp${formatRupiah(t.nominal)}</td>
                <td><span class="status ${statusClass}">${status}</span></td>
                <td>
                    <div style="display:flex;gap:4px;">
                        <button class="edit-btn" data-id="${t.id}" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:13px;">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="delete-btn" data-id="${t.id}" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:13px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    dom.historyTable.innerHTML = html;
    
    // Event listeners
    dom.historyTable.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            const data = transactions.find(t => String(t.id) === String(id));
            if (data) openModal(data);
        });
    });
    
    dom.historyTable.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            if (confirm('Hapus transaksi ini?')) {
                transactions = transactions.filter(t => String(t.id) !== String(id));
                saveData();
                renderAll();
            }
        });
    });
}

// ================================================================
// RENDER ALL TRANSACTIONS (halaman transaksi)
// ================================================================

function renderAllTransactions() {
    if (!dom.allTransaksiList) return;
    
    if (transactions.length === 0) {
        dom.allTransaksiList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <strong>Belum ada transaksi</strong>
                <p>Klik tombol "Tambah Transaksi" untuk mulai mencatat</p>
            </div>
        `;
        return;
    }
    
    const sorted = [...transactions].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    let html = `
        <div class="row header-row" style="display:grid;grid-template-columns:2fr 1.2fr 1fr 1.2fr;padding:10px 20px;border-bottom:1px solid var(--border);color:var(--text-muted);font-size:11px;font-weight:700;">
            <span>Keterangan</span>
            <span>Tanggal</span>
            <span>Kategori</span>
            <span>Nominal</span>
        </div>
    `;
    
    sorted.forEach(t => {
        const isPemasukan = t.jenis === 'pemasukan';
        const sign = isPemasukan ? '+' : '−';
        const color = isPemasukan ? 'var(--success)' : 'var(--danger)';
        
        html += `
            <div class="row" style="display:grid;grid-template-columns:2fr 1.2fr 1fr 1.2fr;padding:12px 20px;border-bottom:1px solid var(--border);align-items:center;">
                <span>${escapeHtml(t.keterangan)}</span>
                <span>${formatTanggal(t.tanggal)}</span>
                <span>${escapeHtml(t.kategori)}</span>
                <span style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="color:${color};font-weight:700;">${sign} Rp${formatRupiah(t.nominal)}</span>
                    <div style="display:flex;gap:4px;">
                        <button class="edit-btn-all" data-id="${t.id}" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:13px;">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="delete-btn-all" data-id="${t.id}" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;font-size:13px;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </span>
            </div>
        `;
    });
    
    dom.allTransaksiList.innerHTML = html;
    
    dom.allTransaksiList.querySelectorAll('.edit-btn-all').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const data = transactions.find(t => String(t.id) === String(id));
            if (data) openModal(data);
        });
    });
    
    dom.allTransaksiList.querySelectorAll('.delete-btn-all').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            if (confirm('Hapus transaksi ini?')) {
                transactions = transactions.filter(t => String(t.id) !== String(id));
                saveData();
                renderAll();
            }
        });
    });
}

// ================================================================
// TARGET
// ================================================================

function getTotalTabungan() {
    if (!target || !Array.isArray(target.savings)) return 0;
    return target.savings.reduce((total, s) => total + (Number(s.nominal) || 0), 0);
}

function renderTarget() {
    const nominalTarget = Number(target.nominal) || 10000000;
    const totalTabungan = getTotalTabungan();
    const progress = nominalTarget > 0 ? Math.min(100, (totalTabungan / nominalTarget) * 100) : 0;
    const sisa = Math.max(0, nominalTarget - totalTabungan);
    
    if (dom.targetNominal) dom.targetNominal.textContent = 'Rp ' + formatRupiah(totalTabungan);
    if (dom.targetDesc) dom.targetDesc.textContent = `dari target Rp ${formatRupiah(nominalTarget)}`;
    if (dom.targetProgress) dom.targetProgress.style.width = progress + '%';
    if (dom.targetProgress2) dom.targetProgress2.style.width = progress + '%';
    if (dom.targetProgressText) dom.targetProgressText.textContent = progress.toFixed(1) + '%';
    if (dom.targetStatus) dom.targetStatus.textContent = progress.toFixed(1) + '%';
    if (dom.targetTerkumpul) dom.targetTerkumpul.textContent = 'Rp ' + formatRupiah(totalTabungan);
    if (dom.targetSisa) dom.targetSisa.textContent = 'sisa Rp ' + formatRupiah(sisa);
    if (dom.targetNamaInput) dom.targetNamaInput.value = target.nama;
    if (dom.targetNominalInput) dom.targetNominalInput.value = nominalTarget;
    
    // Target page nama
    const targetPageNama = document.getElementById('targetPageNama');
    if (targetPageNama) targetPageNama.textContent = target.nama;
    
    // Target page status message
    const targetPageStatus = document.getElementById('targetPageStatus');
    if (targetPageStatus) {
        if (progress >= 100) targetPageStatus.textContent = '🎉 Target tercapai!';
        else if (progress >= 75) targetPageStatus.textContent = '🚀 Hampir tercapai';
        else if (progress >= 50) targetPageStatus.textContent = '💪 Sudah setengah jalan';
        else if (progress >= 25) targetPageStatus.textContent = '🔥 Mulai berkembang';
        else targetPageStatus.textContent = '🌱 Baru mulai';
    }
}

// ================================================================
// TARGET SAVING HISTORY
// ================================================================

function renderTargetSavingHistory() {
    const container = dom.targetSavingHistory;
    if (!container) return;
    
    const savings = [...(target.savings || [])].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    if (dom.jmlSetoran) dom.jmlSetoran.textContent = savings.length + ' setoran';
    
    if (savings.length === 0) {
        container.innerHTML = `
            <div class="empty-saving-state">
                <div class="empty-icon"><i class="fas fa-piggy-bank"></i></div>
                <strong>Belum ada setoran</strong>
                <p>Mulai sisihkan uang untuk mencapai target tabunganmu</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    savings.forEach(s => {
        html += `
            <div class="target-saving-item" data-id="${s.id}">
                <div class="target-saving-icon"><i class="fas fa-piggy-bank"></i></div>
                <div class="target-saving-info">
                    <strong>${escapeHtml(s.catatan || 'Setoran tabungan')}</strong>
                    <span>${formatTanggal(s.tanggal)}</span>
                </div>
                <div class="target-saving-amount">+Rp${formatRupiah(s.nominal)}</div>
                <div class="target-saving-actions">
                    <button class="saving-edit" data-id="${s.id}" title="Edit"><i class="fas fa-pen"></i></button>
                    <button class="saving-delete" data-id="${s.id}" title="Hapus"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    container.querySelectorAll('.saving-edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const data = target.savings.find(s => String(s.id) === String(id));
            if (data) openSavingModal(data);
        });
    });
    
    container.querySelectorAll('.saving-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            if (confirm('Hapus setoran ini?')) {
                target.savings = target.savings.filter(s => String(s.id) !== String(id));
                saveData();
                renderAll();
            }
        });
    });
}

// ================================================================
// KATEGORI CHART
// ================================================================

function renderKategoriChart() {
    const container = document.querySelector('.category-chart');
    if (!container) return;
    
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
    container.innerHTML = '';
    
    if (entries.length === 0) {
        container.innerHTML = '<div style="color:var(--text-secondary);font-size:13px;padding:10px;">Belum ada pengeluaran bulan ini</div>';
        const top = document.querySelector('.category-top');
        if (top) top.innerHTML = '<span style="color:var(--text-muted);font-size:13px;">—</span>';
        return;
    }
    
    const top = document.querySelector('.category-top');
    if (top) {
        top.innerHTML = `
            <div style="font-size:28px;font-weight:800;color:var(--accent-light);">${entries[0][0]}</div>
            <div style="color:var(--text-secondary);font-size:13px;">${Math.round((entries[0][1] / total) * 100)}% dari total pengeluaran</div>
        `;
    }
    
    const colors = ['#6c5ce7', '#00d4aa', '#ff6b6b', '#ffc107', '#4ecdc4', '#a29bfe'];
    entries.slice(0, 6).forEach(([kategori, nominal], index) => {
        const persen = (nominal / total) * 100;
        const item = document.createElement('div');
        item.className = 'kategori-item';
        item.style.cssText = 'display:flex;align-items:center;gap:8px;padding:4px 12px;background:rgba(255,255,255,0.04);border-radius:20px;font-size:12px;';
        item.innerHTML = `
            <span>${escapeHtml(kategori)}</span>
            <div style="width:${Math.max(10, persen * 1.2)}px;height:5px;border-radius:10px;background:${colors[index % colors.length]};"></div>
            <span style="color:var(--text-secondary);font-size:11px;">${persen.toFixed(0)}%</span>
        `;
        container.appendChild(item);
    });
}

// ================================================================
// LAPORAN
// ================================================================

let laporanBulanOffset = 0;

function renderLaporan() {
    if (!dom.laporanBulanan || !dom.laporanRingkasan) return;
    
    const now = new Date();
    const tahun = now.getFullYear();
    const bulanSekarang = now.getMonth();
    const bulanTarget = bulanSekarang - laporanBulanOffset;
    const tahunTarget = bulanTarget < 0 ? tahun - 1 : tahun;
    const bulanIndex = bulanTarget < 0 ? 11 : bulanTarget;
    
    const bulanNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    if (dom.laporanLabelBulan) {
        dom.laporanLabelBulan.textContent = `${bulanNames[bulanIndex]} ${tahunTarget}`;
    }
    
    // Filter transaksi bulan ini
    let pemasukan = 0, pengeluaran = 0;
    transactions.forEach(t => {
        const d = new Date(t.tanggal + 'T00:00:00');
        if (d.getMonth() === bulanIndex && d.getFullYear() === tahunTarget) {
            const nominal = Number(t.nominal) || 0;
            if (t.jenis === 'pemasukan') pemasukan += nominal;
            else pengeluaran += nominal;
        }
    });
    
    // Ringkasan
    dom.laporanRingkasan.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div style="background:rgba(0,212,170,0.06);padding:14px;border-radius:14px;">
                <div style="color:var(--text-secondary);font-size:11px;">Pemasukan</div>
                <div style="font-size:22px;font-weight:800;color:var(--success);">Rp ${formatRupiah(pemasukan)}</div>
            </div>
            <div style="background:rgba(255,107,107,0.06);padding:14px;border-radius:14px;">
                <div style="color:var(--text-secondary);font-size:11px;">Pengeluaran</div>
                <div style="font-size:22px;font-weight:800;color:var(--danger);">Rp ${formatRupiah(pengeluaran)}</div>
            </div>
        </div>
        <div style="margin-top:12px;padding:12px;background:rgba(255,255,255,0.02);border-radius:14px;display:flex;justify-content:space-between;color:var(--text-secondary);font-size:13px;">
            <span>Selisih</span>
            <span style="font-weight:700;color:${pemasukan >= pengeluaran ? 'var(--success)' : 'var(--danger)'};">Rp ${formatRupiah(pemasukan - pengeluaran)}</span>
        </div>
        <div style="margin-top:8px;padding:12px;background:rgba(255,255,255,0.02);border-radius:14px;display:flex;justify-content:space-between;color:var(--text-secondary);font-size:13px;">
            <span>Transaksi bulan ini</span>
            <span style="font-weight:700;color:var(--text-primary);">${transactions.filter(t => {
                const d = new Date(t.tanggal + 'T00:00:00');
                return d.getMonth() === bulanIndex && d.getFullYear() === tahunTarget;
            }).length} transaksi</span>
        </div>
    `;
    
    // Grafik 12 bulan
    const pemasukanBulan = new Array(12).fill(0);
    const pengeluaranBulan = new Array(12).fill(0);
    
    transactions.forEach(t => {
        const d = new Date(t.tanggal + 'T00:00:00');
        if (d.getFullYear() === tahunTarget) {
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
            <span style="color:var(--text-secondary);font-size:9px;">${bulanNames[i]}</span>
        `;
        dom.laporanBulanan.appendChild(div);
    }
}

// ================================================================
// NAVIGASI
// ================================================================

function navigateTo(page) {
    currentPage = page;
    dom.pageSections.forEach(s => s.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    
    dom.navItems.forEach(item => item.classList.remove('active'));
    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');
    
    // Update title
    const titles = {
        dashboard: 'Dashboard',
        transaksi: 'Transaksi',
        target: 'Target',
        laporan: 'Laporan'
    };
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[page] || 'Dashboard';
    
    // Tutup sidebar mobile
    closeSidebar();
}

function toggleSidebar() {
    const sidebar = dom.sidebar;
    const overlay = dom.sidebarOverlay;
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
}

function closeSidebar() {
    const sidebar = dom.sidebar;
    const overlay = dom.sidebarOverlay;
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

// ================================================================
// MODAL TRANSAKSI
// ================================================================

function openModal(editData = null) {
    if (!dom.modal) return;
    dom.modal.style.display = 'flex';
    
    if (editData) {
        if (dom.modalTitle) dom.modalTitle.textContent = 'Edit Transaksi';
        if (dom.fKeterangan) dom.fKeterangan.value = editData.keterangan;
        if (dom.fNominal) dom.fNominal.value = editData.nominal;
        if (dom.fKategori) dom.fKategori.value = editData.kategori;
        if (dom.fTanggal) dom.fTanggal.value = editData.tanggal;
        const radio = document.querySelector(`input[name="jenis"][value="${editData.jenis}"]`);
        if (radio) radio.checked = true;
        editingId = editData.id;
    } else {
        if (dom.modalTitle) dom.modalTitle.textContent = 'Tambah Transaksi';
        if (dom.fKeterangan) dom.fKeterangan.value = '';
        if (dom.fNominal) dom.fNominal.value = '';
        if (dom.fKategori) dom.fKategori.value = 'Makanan';
        if (dom.fTanggal) dom.fTanggal.value = getLocalDateString();
        const radio = document.querySelector('input[name="jenis"][value="pemasukan"]');
        if (radio) radio.checked = true;
        editingId = null;
    }
}

function closeModal() {
    if (dom.modal) dom.modal.style.display = 'none';
    editingId = null;
}

// ================================================================
// MODAL TABUNGAN
// ================================================================

function openSavingModal(editData = null) {
    if (!dom.modalTabungan) return;
    dom.modalTabungan.style.display = 'flex';
    
    if (editData) {
        if (dom.modalTabunganTitle) dom.modalTabunganTitle.textContent = 'Edit Tabungan';
        if (dom.fTabunganNominal) dom.fTabunganNominal.value = editData.nominal;
        if (dom.fTabunganTanggal) dom.fTabunganTanggal.value = editData.tanggal;
        if (dom.fTabunganCatatan) dom.fTabunganCatatan.value = editData.catatan || '';
        editingSavingId = editData.id;
    } else {
        if (dom.modalTabunganTitle) dom.modalTabunganTitle.textContent = 'Tambah Tabungan';
        if (dom.fTabunganNominal) dom.fTabunganNominal.value = '';
        if (dom.fTabunganTanggal) dom.fTabunganTanggal.value = getLocalDateString();
        if (dom.fTabunganCatatan) dom.fTabunganCatatan.value = '';
        editingSavingId = null;
    }
}

function closeSavingModal() {
    if (dom.modalTabungan) dom.modalTabungan.style.display = 'none';
    editingSavingId = null;
}

// ================================================================
// FORM SUBMIT TRANSAKSI
// ================================================================

function handleFormSubmit(e) {
    e.preventDefault();
    
    const jenis = document.querySelector('input[name="jenis"]:checked')?.value;
    const keterangan = dom.fKeterangan?.value?.trim() || '';
    const nominal = parseFloat(dom.fNominal?.value);
    const kategori = dom.fKategori?.value || 'Lainnya';
    const tanggal = dom.fTanggal?.value;
    
    if (!keterangan) { alert('Masukkan keterangan'); return; }
    if (!nominal || nominal <= 0) { alert('Masukkan nominal valid'); return; }
    if (!tanggal) { alert('Pilih tanggal'); return; }
    if (!jenis) { alert('Pilih jenis transaksi'); return; }
    
    if (editingId) {
        const idx = transactions.findIndex(t => String(t.id) === String(editingId));
        if (idx !== -1) {
            transactions[idx] = { ...transactions[idx], jenis, keterangan, nominal, kategori, tanggal };
        }
    } else {
        transactions.push({ id: createId('txn'), jenis, keterangan, nominal, kategori, tanggal });
    }
    
    saveData();
    closeModal();
    renderAll();
}

// ================================================================
// FORM SUBMIT TABUNGAN
// ================================================================

function handleSavingSubmit(e) {
    e.preventDefault();
    
    const nominal = parseFloat(dom.fTabunganNominal?.value);
    const tanggal = dom.fTabunganTanggal?.value;
    const catatan = dom.fTabunganCatatan?.value?.trim() || '';
    
    if (!nominal || nominal <= 0) { alert('Masukkan nominal tabungan'); return; }
    if (!tanggal) { alert('Pilih tanggal'); return; }
    
    if (!Array.isArray(target.savings)) target.savings = [];
    
    if (editingSavingId) {
        const idx = target.savings.findIndex(s => String(s.id) === String(editingSavingId));
        if (idx !== -1) {
            target.savings[idx] = { ...target.savings[idx], nominal, tanggal, catatan };
        }
    } else {
        target.savings.push({ id: createId('svn'), nominal, tanggal, catatan });
    }
    
    saveData();
    closeSavingModal();
    renderAll();
}

// ================================================================
// PERIOD DISPLAY
// ================================================================

function updatePeriodDisplay() {
    const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    
    if (filterMode === 'tahun') {
        if (dom.rangeText) dom.rangeText.textContent = `Tahun ${now.getFullYear()}`;
        if (dom.btnFilterPeriod) dom.btnFilterPeriod.innerHTML = `<i class="fas fa-calendar"></i> Tahun ini`;
    } else {
        if (dom.rangeText) dom.rangeText.textContent = `${bulan[now.getMonth()]} ${now.getFullYear()}`;
        if (dom.btnFilterPeriod) dom.btnFilterPeriod.innerHTML = `<i class="fas fa-calendar"></i> ${bulan[now.getMonth()]} ${now.getFullYear()}`;
    }
    
    // Current date di topbar
    const currentDateEl = document.getElementById('currentDate');
    if (currentDateEl) {
        currentDateEl.textContent = `${now.getDate()} ${bulan[now.getMonth()]} ${now.getFullYear()}`;
    }
}

// ================================================================
// BIND EVENTS
// ================================================================

function bindEvents() {
    // Navigasi
    dom.navItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            if (page) navigateTo(page);
        });
    });
    
    // Sidebar mobile
    if (dom.mobileMenuBtn) {
        dom.mobileMenuBtn.addEventListener('click', toggleSidebar);
    }
    if (dom.sidebarClose) {
        dom.sidebarClose.addEventListener('click', closeSidebar);
    }
    if (dom.sidebarOverlay) {
        dom.sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // Modal Transaksi
    if (dom.btnTambah) dom.btnTambah.addEventListener('click', () => openModal());
    if (dom.btnTambahPage) dom.btnTambahPage.addEventListener('click', () => openModal());
    if (dom.modalClose) dom.modalClose.addEventListener('click', closeModal);
    if (dom.modalCancel) dom.modalCancel.addEventListener('click', closeModal);
    if (dom.modal) {
        dom.modal.addEventListener('click', function(e) {
            if (e.target === this) closeModal();
        });
    }
    if (dom.form) dom.form.addEventListener('submit', handleFormSubmit);
    
    // Filter kategori
    if (dom.filterKategori) {
        dom.filterKategori.addEventListener('change', renderHistory);
    }
    
    // Target
    if (dom.btnSimpanTarget) {
        dom.btnSimpanTarget.addEventListener('click', function() {
            const nama = dom.targetNamaInput?.value?.trim() || 'Tabungan Darurat';
            const nominal = parseFloat(dom.targetNominalInput?.value);
            if (!nominal || nominal <= 0) {
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
    
    // Tambah tabungan
    if (dom.btnTambahTabungan) {
        dom.btnTambahTabungan.addEventListener('click', () => openSavingModal());
    }
    
    // Modal Tabungan
    if (dom.modalTabunganClose) dom.modalTabunganClose.addEventListener('click', closeSavingModal);
    if (dom.modalTabunganCancel) dom.modalTabunganCancel.addEventListener('click', closeSavingModal);
    if (dom.modalTabungan) {
        dom.modalTabungan.addEventListener('click', function(e) {
            if (e.target === this) closeSavingModal();
        });
    }
    if (dom.formTabungan) dom.formTabungan.addEventListener('submit', handleSavingSubmit);
    
    // Filter period
    if (dom.btnFilterPeriod) {
        dom.btnFilterPeriod.addEventListener('click', function() {
            filterMode = filterMode === 'bulan' ? 'tahun' : 'bulan';
            updatePeriodDisplay();
            renderAll();
        });
    }
    
    // Laporan navigasi
    if (dom.laporanPrev) {
        dom.laporanPrev.addEventListener('click', function() {
            laporanBulanOffset++;
            renderLaporan();
        });
    }
    if (dom.laporanNext) {
        dom.laporanNext.addEventListener('click', function() {
            if (laporanBulanOffset > 0) {
                laporanBulanOffset--;
                renderLaporan();
            }
        });
    }
    
    // View all link
    document.querySelectorAll('[data-page-link]').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = this.dataset.pageLink;
            if (page) navigateTo(page);
        });
    });
    
    // Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (dom.modalTabungan?.style.display === 'flex') closeSavingModal();
            if (dom.modal?.style.display === 'flex') closeModal();
            closeSidebar();
        }
    });
}

// ================================================================
// HELPERS
// ================================================================

function formatRupiah(angka) {
    return Number(angka || 0).toLocaleString('id-ID');
}

function formatTanggal(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '-';
    const bulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

function getLocalDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function createId(prefix = 'id') {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

// ================================================================
// INIT
// ================================================================

function init() {
    console.log('🚀 Keuangan Pribadi — Starting...');
    loadData();
    
    // Set default date
    if (dom.fTanggal) dom.fTanggal.value = getLocalDateString();
    if (dom.fTabunganTanggal) dom.fTabunganTanggal.value = getLocalDateString();
    
    renderAll();
    bindEvents();
    
    // Set default page
    navigateTo('dashboard');
    
    console.log('✅ Keuangan Pribadi — Ready!');
    console.log(`📊 ${transactions.length} transaksi, ${target.savings?.length || 0} setoran tabungan`);
}

document.addEventListener('DOMContentLoaded', init);
