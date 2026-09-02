// ================================================================
//  STATE & DOM
// ================================================================
let transactions = [];
let target = { nama: 'Tabungan Darurat', nominal: 10000000 };
let editingId = null;
let currentPage = 'dashboard';
let filterKategori = 'semua';

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
};

// ================================================================
//  LOCAL STORAGE
// ================================================================
function loadData() {
    try {
        const raw = localStorage.getItem('keuangan_data');

        if (raw) {
            const data = JSON.parse(raw);

            transactions = Array.isArray(data.transactions)
                ? data.transactions
                : [];

            target = data.target || {
                nama: 'Tabungan Darurat',
                nominal: 10000000
            };

            // Pastikan ID transaksi lama tetap aman
            transactions = transactions.map((t, index) => ({
                ...t,
                id: String(t.id ?? `${Date.now()}-${index}`)
            }));
        }
    } catch (e) {
        console.warn('Gagal load data', e);

        transactions = [];

        target = {
            nama: 'Tabungan Darurat',
            nominal: 10000000
        };
    }
}

function saveData() {
    try {
        localStorage.setItem(
            'keuangan_data',
            JSON.stringify({
                transactions,
                target
            })
        );
    } catch (e) {
        console.warn('Gagal save', e);
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
    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    let jmlPemasukan = 0;
    let jmlPengeluaran = 0;

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

    dom.saldo.textContent = 'Rp ' + formatRupiah(saldo);
    dom.pemasukan.textContent = 'Rp ' + formatRupiah(totalPemasukan);
    dom.pengeluaran.textContent = 'Rp ' + formatRupiah(totalPengeluaran);

    dom.jmlPemasukan.textContent =
        jmlPemasukan + ' transaksi';

    dom.jmlPengeluaran.textContent =
        jmlPengeluaran + ' transaksi';

    const trend =
        totalPemasukan > totalPengeluaran
            ? '+ positif'
            : totalPemasukan < totalPengeluaran
                ? '- defisit'
                : 'seimbang';

    dom.saldoBadge.innerHTML = `
        <i class="fas fa-${totalPemasukan >= totalPengeluaran
            ? 'arrow-up'
            : 'arrow-down'}"></i>
        ${trend}
    `;

    dom.trendSaldo.innerHTML = `
        <i class="fas fa-${totalPemasukan >= totalPengeluaran
            ? 'arrow-up'
            : 'arrow-down'}"></i>
        ${totalPemasukan >= totalPengeluaran
            ? 'Sehat'
            : 'Perhatikan'}
    `;

    const bulan = [
        'Jan', 'Feb', 'Mar', 'Apr',
        'Mei', 'Jun', 'Jul', 'Agu',
        'Sep', 'Okt', 'Nov', 'Des'
    ];

    const now = new Date();

    dom.rangeText.textContent =
        `${bulan[now.getMonth()]} ${now.getFullYear()}`;

    dom.btnFilterPeriod.innerHTML = `
        <i class="fas fa-calendar"></i>
        ${bulan[now.getMonth()]} ${now.getFullYear()}
    `;
}

// ================================================================
//  DELETE TRANSACTION
// ================================================================
function deleteTransaction(id) {

    const transaction = transactions.find(
        t => String(t.id) === String(id)
    );

    if (!transaction) {
        alert('Transaksi tidak ditemukan.');
        return;
    }

    const yakin = confirm(
        `Hapus transaksi "${transaction.keterangan}"?\n\n` +
        `Data yang dihapus tidak dapat dikembalikan.`
    );

    if (!yakin) return;

    transactions = transactions.filter(
        t => String(t.id) !== String(id)
    );

    saveData();
    renderAll();
}

// ================================================================
//  EDIT TRANSACTION
// ================================================================
function editTransaction(id) {

    const transaction = transactions.find(
        t => String(t.id) === String(id)
    );

    if (!transaction) {
        alert('Transaksi tidak ditemukan.');
        return;
    }

    openModal(transaction);
}

// ================================================================
//  RENDER HISTORY
// ================================================================
function renderHistory() {

    const filter = dom.filterKategori.value;

    let filtered = [...transactions];

    if (filter !== 'semua') {
        filtered = filtered.filter(
            t => t.kategori === filter
        );
    }

    filtered.sort(
        (a, b) =>
            new Date(b.tanggal) - new Date(a.tanggal)
    );

    dom.jmlRiwayat.textContent =
        filtered.length + ' transaksi';

    if (filtered.length === 0) {

        dom.historyTable.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                Belum ada transaksi
            </div>
        `;

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

        const isPemasukan =
            t.jenis === 'pemasukan';

        const sign =
            isPemasukan ? '+' : '−';

        const color =
            isPemasukan
                ? 'var(--success)'
                : 'var(--danger)';

        html += `
            <div class="row" data-id="${escapeHtml(String(t.id))}">

                <span>
                    ${escapeHtml(t.keterangan)}
                </span>

                <span>
                    ${formatTanggal(t.tanggal)}
                </span>

                <span>
                    ${escapeHtml(t.kategori)}
                </span>

                <span style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                    justify-content:space-between;
                ">

                    <span style="
                        color:${color};
                        font-weight:700;
                    ">
                        ${sign}
                        Rp${formatRupiah(Number(t.nominal) || 0)}
                    </span>

                    <div style="
                        display:flex;
                        gap:4px;
                    ">

                        <button
                            type="button"
                            class="edit-btn"
                            data-id="${escapeHtml(String(t.id))}"
                            title="Edit"
                            style="
                                background:none;
                                border:none;
                                color:var(--text-secondary);
                                cursor:pointer;
                                font-size:14px;
                                transition:0.2s;
                            "
                        >
                            <i class="fas fa-pen"></i>
                        </button>

                        <button
                            type="button"
                            class="delete-btn"
                            data-id="${escapeHtml(String(t.id))}"
                            title="Hapus"
                            style="
                                background:none;
                                border:none;
                                color:var(--text-secondary);
                                cursor:pointer;
                                font-size:14px;
                                transition:0.2s;
                            "
                        >
                            <i class="fas fa-trash"></i>
                        </button>

                    </div>

                </span>

            </div>
        `;
    });

    dom.historyTable.innerHTML = html;

    // ============================================================
    // EVENT EDIT
    // ============================================================
    dom.historyTable
        .querySelectorAll('.edit-btn')
        .forEach(btn => {

            btn.addEventListener('click', function(e) {

                e.preventDefault();
                e.stopPropagation();

                const id = this.dataset.id;

                editTransaction(id);
            });
        });

    // ============================================================
    // EVENT DELETE
    // ============================================================
    dom.historyTable
        .querySelectorAll('.delete-btn')
        .forEach(btn => {

            btn.addEventListener('click', function(e) {

                e.preventDefault();
                e.stopPropagation();

                const id = this.dataset.id;

                deleteTransaction(id);
            });
        });
}

// ================================================================
//  RENDER ALL TRANSACTIONS
// ================================================================
function renderAllTransactions() {

    const list = dom.allTransaksiList;

    if (transactions.length === 0) {

        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                Belum ada transaksi
            </div>
        `;

        return;
    }

    const sorted = [...transactions].sort(
        (a, b) =>
            new Date(b.tanggal) - new Date(a.tanggal)
    );

    let html = `
        <div
            class="row header-row"
            style="grid-template-columns:2fr 1.2fr 1fr 1.2fr;"
        >
            <span>Keterangan</span>
            <span>Tanggal</span>
            <span>Kategori</span>
            <span>Nominal</span>
        </div>
    `;

    sorted.forEach(t => {

        const isPemasukan =
            t.jenis === 'pemasukan';

        const sign =
            isPemasukan ? '+' : '−';

        const color =
            isPemasukan
                ? 'var(--success)'
                : 'var(--danger)';

        html += `
            <div
                class="row"
                data-id="${escapeHtml(String(t.id))}"
                style="
                    grid-template-columns:
                    2fr 1.2fr 1fr 1.2fr;
                "
            >

                <span>
                    ${escapeHtml(t.keterangan)}
                </span>

                <span>
                    ${formatTanggal(t.tanggal)}
                </span>

                <span>
                    ${escapeHtml(t.kategori)}
                </span>

                <span style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                    justify-content:space-between;
                ">

                    <span style="
                        color:${color};
                        font-weight:700;
                    ">
                        ${sign}
                        Rp${formatRupiah(Number(t.nominal) || 0)}
                    </span>

                    <div style="
                        display:flex;
                        gap:4px;
                    ">

                        <button
                            type="button"
                            class="edit-btn-all"
                            data-id="${escapeHtml(String(t.id))}"
                            title="Edit"
                            style="
                                background:none;
                                border:none;
                                color:var(--text-secondary);
                                cursor:pointer;
                                font-size:14px;
                                transition:0.2s;
                            "
                        >
                            <i class="fas fa-pen"></i>
                        </button>

                        <button
                            type="button"
                            class="delete-btn-all"
                            data-id="${escapeHtml(String(t.id))}"
                            title="Hapus"
                            style="
                                background:none;
                                border:none;
                                color:var(--text-secondary);
                                cursor:pointer;
                                font-size:14px;
                                transition:0.2s;
                            "
                        >
                            <i class="fas fa-trash"></i>
                        </button>

                    </div>

                </span>

            </div>
        `;
    });

    list.innerHTML = html;

    // ============================================================
    // EVENT DELETE HALAMAN TRANSAKSI
    // ============================================================
    list
        .querySelectorAll('.delete-btn-all')
        .forEach(btn => {

            btn.addEventListener('click', function(e) {

                e.preventDefault();
                e.stopPropagation();

                const id = this.dataset.id;

                deleteTransaction(id);
            });
        });

    // ============================================================
    // EVENT EDIT HALAMAN TRANSAKSI
    // ============================================================
    list
        .querySelectorAll('.edit-btn-all')
        .forEach(btn => {

            btn.addEventListener('click', function(e) {

                e.preventDefault();
                e.stopPropagation();

                const id = this.dataset.id;

                editTransaction(id);
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

        if (
            d.getMonth() === bulanIni &&
            d.getFullYear() === tahunIni &&
            t.jenis === 'pemasukan'
        ) {
            totalPemasukan += Number(t.nominal) || 0;
        }
    });

    const nominalTarget =
        Number(target.nominal) || 10000000;

    const progress =
        nominalTarget > 0
            ? Math.min(
                100,
                (totalPemasukan / nominalTarget) * 100
            )
            : 0;

    dom.targetNominal.textContent =
        'Rp ' + formatRupiah(nominalTarget);

    dom.targetDesc.textContent =
        `dari target Rp ${formatRupiah(nominalTarget)}`;

    dom.targetProgress.style.width =
        progress + '%';

    dom.targetProgress2.style.width =
        progress + '%';

    dom.targetProgressText.textContent =
        progress.toFixed(1) + '%';

    dom.targetTerkumpul.textContent =
        'Rp ' + formatRupiah(totalPemasukan);

    dom.targetSisa.textContent =
        'sisa Rp ' +
        formatRupiah(
            Math.max(
                0,
                nominalTarget - totalPemasukan
            )
        );

    dom.targetNamaInput.value =
        target.nama || 'Tabungan Darurat';

    dom.targetNominalInput.value =
        nominalTarget;
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

        if (
            d.getMonth() === bulanIni &&
            d.getFullYear() === tahunIni &&
            t.jenis === 'pengeluaran'
        ) {

            const nominal =
                Number(t.nominal) || 0;

            kategoriMap[t.kategori] =
                (kategoriMap[t.kategori] || 0) +
                nominal;

            total += nominal;
        }
    });

    const entries =
        Object.entries(kategoriMap)
            .sort((a, b) => b[1] - a[1]);

    const container =
        dom.kategoriChart;

    container.innerHTML = '';

    if (entries.length === 0) {

        container.innerHTML = `
            <div style="
                color:var(--text-secondary);
                font-size:14px;
                padding:8px 0;
            ">
                Belum ada pengeluaran bulan ini
            </div>
        `;

        dom.kategoriTeratas.textContent = '—';

        return;
    }

    dom.kategoriTeratas.textContent =
        entries[0][0] +
        ' (' +
        Math.round(
            (entries[0][1] / total) * 100
        ) +
        '%)';

    const colors = [
        '#6c5ce7',
        '#00d4aa',
        '#ff6b6b',
        '#ffc107',
        '#4ecdc4',
        '#a29bfe'
    ];

    entries.slice(0, 6).forEach(
        ([kategori, nominal], index) => {

            const persen =
                (nominal / total) * 100;

            const item =
                document.createElement('div');

            item.className =
                'kategori-item';

            item.innerHTML = `
                <span>
                    ${escapeHtml(kategori)}
                </span>

                <div
                    class="bar"
                    style="
                        width:${Math.max(
                            10,
                            persen * 1.2
                        )}px;
                        background:${colors[index % colors.length]};
                    "
                ></div>

                <span class="persen">
                    ${persen.toFixed(0)}%
                </span>
            `;

            container.appendChild(item);
        }
    );
}

// ================================================================
//  RENDER LAPORAN
// ================================================================
function renderLaporan() {

    const bulan = [
        'Jan', 'Feb', 'Mar', 'Apr',
        'Mei', 'Jun', 'Jul', 'Agu',
        'Sep', 'Okt', 'Nov', 'Des'
    ];

    const tahunIni =
        new Date().getFullYear();

    const pemasukanBulan =
        new Array(12).fill(0);

    const pengeluaranBulan =
        new Array(12).fill(0);

    transactions.forEach(t => {

        const d = new Date(t.tanggal);

        if (d.getFullYear() === tahunIni) {

            const idx =
                d.getMonth();

            const nominal =
                Number(t.nominal) || 0;

            if (t.jenis === 'pemasukan') {
                pemasukanBulan[idx] += nominal;
            } else {
                pengeluaranBulan[idx] += nominal;
            }
        }
    });

    const maxVal =
        Math.max(
            1,
            ...pemasukanBulan,
            ...pengeluaranBulan
        );

    const container =
        dom.laporanBulanan;

    container.innerHTML = '';

    for (let i = 0; i < 12; i++) {

        const p =
            (pemasukanBulan[i] / maxVal) * 160;

        const q =
            (pengeluaranBulan[i] / maxVal) * 160;

        const div =
            document.createElement('div');

        div.style.cssText =
            `
            flex:1;
            display:flex;
            flex-direction:column;
            align-items:center;
            gap:3px;
            `;

        div.innerHTML = `
            <div style="
                width:100%;
                display:flex;
                justify-content:center;
                gap:2px;
                align-items:flex-end;
                height:170px;
            ">

                <div style="
                    width:30%;
                    background:#00d4aa;
                    border-radius:4px 4px 0 0;
                    height:${p}px;
                    min-height:2px;
                    transition:0.3s;
                "></div>

                <div style="
                    width:30%;
                    background:#ff6b6b;
                    border-radius:4px 4px 0 0;
                    height:${q}px;
                    min-height:2px;
                    transition:0.3s;
                "></div>

            </div>

            <span style="
                color:var(--text-secondary);
                font-size:9px;
            ">
                ${bulan[i]}
            </span>
        `;

        container.appendChild(div);
    }

    const totalPem =
        pemasukanBulan.reduce(
            (a, b) => a + b,
            0
        );

    const totalPeng =
        pengeluaranBulan.reduce(
            (a, b) => a + b,
            0
        );

    dom.laporanRingkasan.innerHTML = `

        <div style="
            display:grid;
            grid-template-columns:1fr 1fr;
            gap:12px;
        ">

            <div style="
                background:rgba(0,212,170,0.06);
                padding:12px;
                border-radius:16px;
            ">

                <div style="
                    color:var(--text-secondary);
                    font-size:12px;
                ">
                    Total Pemasukan
                </div>

                <div style="
                    font-size:20px;
                    font-weight:700;
                    color:var(--success);
                ">
                    Rp ${formatRupiah(totalPem)}
                </div>

            </div>

            <div style="
                background:rgba(255,107,107,0.06);
                padding:12px;
                border-radius:16px;
            ">

                <div style="
                    color:var(--text-secondary);
                    font-size:12px;
                ">
                    Total Pengeluaran
                </div>

                <div style="
                    font-size:20px;
                    font-weight:700;
                    color:var(--danger);
                ">
                    Rp ${formatRupiah(totalPeng)}
                </div>

            </div>

        </div>

        <div style="
            margin-top:12px;
            padding:12px;
            background:rgba(255,255,255,0.02);
            border-radius:16px;
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                color:var(--text-secondary);
                font-size:13px;
            ">

                <span>Selisih</span>

                <span style="
                    font-weight:600;
                    color:${
                        totalPem >= totalPeng
                            ? 'var(--success)'
                            : 'var(--danger)'
                    };
                ">
                    Rp ${formatRupiah(
                        totalPem - totalPeng
                    )}
                </span>

            </div>

            <div style="
                display:flex;
                justify-content:space-between;
                color:var(--text-secondary);
                font-size:13px;
                margin-top:4px;
            ">

                <span>Transaksi</span>

                <span>
                    ${transactions.length} transaksi
                </span>

            </div>

        </div>
    `;
}

// ================================================================
//  PAGE NAVIGATION
// ================================================================
function navigateTo(page) {

    currentPage = page;

    document
        .querySelectorAll('.page-section')
        .forEach(el => {
            el.style.display = 'none';
        });

    const pageId =
        'page' +
        page.charAt(0).toUpperCase() +
        page.slice(1);

    const targetPage =
        document.getElementById(pageId);

    if (targetPage) {
        targetPage.style.display = 'block';
    }

    document
        .querySelectorAll('.nav-icons a')
        .forEach(el => {
            el.classList.remove('active');
        });

    const navLink =
        document.querySelector(
            `.nav-icons a[data-page="${page}"]`
        );

    if (navLink) {
        navLink.classList.add('active');
    }
}

function updatePage() {}

// ================================================================
//  MODAL
// ================================================================
function openModal(editData = null) {

    dom.modal.style.display = 'flex';

    if (editData) {

        dom.modalTitle.textContent =
            'Edit Transaksi';

        dom.fKeterangan.value =
            editData.keterangan;

        dom.fNominal.value =
            editData.nominal;

        dom.fKategori.value =
            editData.kategori;

        dom.fTanggal.value =
            editData.tanggal;

        const radio =
            document.querySelector(
                `input[name="jenis"][value="${editData.jenis}"]`
            );

        if (radio) {
            radio.checked = true;
        }

        editingId =
            String(editData.id);

    } else {

        dom.modalTitle.textContent =
            'Tambah Transaksi';

        dom.fKeterangan.value = '';

        dom.fNominal.value = '';

        dom.fKategori.value =
            'Makanan';

        dom.fTanggal.value =
            getLocalDateString();

        const radio =
            document.querySelector(
                'input[name="jenis"][value="pemasukan"]'
            );

        if (radio) {
            radio.checked = true;
        }

        editingId = null;
    }
}

// ================================================================
//  CLOSE MODAL
// ================================================================
function closeModal() {

    dom.modal.style.display = 'none';

    editingId = null;
}

// ================================================================
//  FORM SUBMIT
// ================================================================
function handleFormSubmit(e) {

    e.preventDefault();

    const jenis =
        document.querySelector(
            'input[name="jenis"]:checked'
        ).value;

    const keterangan =
        dom.fKeterangan.value.trim();

    const nominal =
        parseFloat(dom.fNominal.value);

    const kategori =
        dom.fKategori.value;

    const tanggal =
        dom.fTanggal.value;

    if (!keterangan) {
        alert('Masukkan keterangan');
        return;
    }

    if (!nominal || nominal <= 0) {
        alert('Masukkan nominal valid');
        return;
    }

    if (!tanggal) {
        alert('Pilih tanggal');
        return;
    }

    // ============================================================
    // EDIT DATA
    // ============================================================
    if (editingId !== null) {

        const idx =
            transactions.findIndex(
                t =>
                    String(t.id) ===
                    String(editingId)
            );

        if (idx !== -1) {

            transactions[idx] = {
                ...transactions[idx],
                jenis,
                keterangan,
                nominal,
                kategori,
                tanggal
            };

        } else {

            alert(
                'Data transaksi yang ingin diedit tidak ditemukan.'
            );

            return;
        }

    }

    // ============================================================
    // TAMBAH DATA BARU
    // ============================================================
    else {

        transactions.push({

            // ID dibuat STRING agar tidak berubah
            id:
                Date.now().toString() +
                '-' +
                Math.random()
                    .toString(36)
                    .substring(2, 9),

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

    // ============================================================
    // NAVIGATION
    // ============================================================
    document
        .querySelectorAll('.nav-icons a')
        .forEach(link => {

            link.addEventListener(
                'click',
                function(e) {

                    e.preventDefault();

                    const page =
                        this.dataset.page;

                    if (page) {
                        navigateTo(page);
                    }
                }
            );
        });

    // ============================================================
    // MODAL
    // ============================================================
    dom.btnTambah.addEventListener(
        'click',
        () => openModal()
    );

    dom.btnTambahPage.addEventListener(
        'click',
        () => openModal()
    );

    dom.modalClose.addEventListener(
        'click',
        closeModal
    );

    dom.modalCancel.addEventListener(
        'click',
        closeModal
    );

    dom.modal.addEventListener(
        'click',
        function(e) {

            if (e.target === this) {
                closeModal();
            }
        }
    );

    // ============================================================
    // FORM
    // ============================================================
    dom.form.addEventListener(
        'submit',
        handleFormSubmit
    );

    // ============================================================
    // FILTER
    // ============================================================
    dom.filterKategori.addEventListener(
        'change',
        renderHistory
    );

    // ============================================================
    // TARGET
    // ============================================================
    dom.btnSimpanTarget.addEventListener(
        'click',
        function() {

            const nama =
                dom.targetNamaInput.value.trim() ||
                'Tabungan Darurat';

            const nominal =
                parseFloat(
                    dom.targetNominalInput.value
                );

            if (!nominal || nominal <= 0) {

                alert(
                    'Masukkan nominal target yang valid'
                );

                return;
            }

            target.nama = nama;
            target.nominal = nominal;

            saveData();

            renderTarget();

            alert(
                '✅ Target berhasil disimpan!'
            );
        }
    );

    dom.btnEditTarget.addEventListener(
        'click',
        function() {

            navigateTo('target');
        }
    );

    // ============================================================
    // FILTER PERIOD
    // ============================================================
    dom.btnFilterPeriod.addEventListener(
        'click',
        function() {

            const currentText =
                this.textContent.trim();

            if (currentText.includes('Bulan')) {

                this.innerHTML = `
                    <i class="fas fa-calendar"></i>
                    Tahun ini
                `;

                dom.rangeText.textContent =
                    new Date().getFullYear();

            } else {

                const bulan = [
                    'Jan', 'Feb', 'Mar', 'Apr',
                    'Mei', 'Jun', 'Jul', 'Agu',
                    'Sep', 'Okt', 'Nov', 'Des'
                ];

                const now = new Date();

                this.innerHTML = `
                    <i class="fas fa-calendar"></i>
                    ${bulan[now.getMonth()]}
                    ${now.getFullYear()}
                `;

                dom.rangeText.textContent =
                    `${bulan[now.getMonth()]}
                    ${now.getFullYear()}`;
            }

            renderAll();
        }
    );

    // ============================================================
    // ESCAPE CLOSE MODAL
    // ============================================================
    document.addEventListener(
        'keydown',
        function(e) {

            if (e.key === 'Escape') {
                closeModal();
            }
        }
    );
}

// ================================================================
//  HELPERS
// ================================================================
function formatRupiah(angka) {

    return Number(angka || 0)
        .toLocaleString('id-ID');
}

// ================================================================
//  FIX TANGGAL LOCAL
// ================================================================
function getLocalDateString() {

    const now = new Date();

    const year =
        now.getFullYear();

    const month =
        String(now.getMonth() + 1)
            .padStart(2, '0');

    const day =
        String(now.getDate())
            .padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatTanggal(dateStr) {

    const d =
        new Date(dateStr + 'T00:00:00');

    const bulan = [
        'Jan', 'Feb', 'Mar', 'Apr',
        'Mei', 'Jun', 'Jul', 'Agu',
        'Sep', 'Okt', 'Nov', 'Des'
    ];

    return `
        ${d.getDate()}
        ${bulan[d.getMonth()]}
        ${d.getFullYear()}
    `;
}

function escapeHtml(text) {

    const div =
        document.createElement('div');

    div.textContent =
        text == null ? '' : String(text);

    return div.innerHTML;
}

// ================================================================
//  INIT
// ================================================================
function init() {

    loadData();

    renderAll();

    bindEvents();

    dom.fTanggal.value =
        getLocalDateString();
}

document.addEventListener(
    'DOMContentLoaded',
    init
);
