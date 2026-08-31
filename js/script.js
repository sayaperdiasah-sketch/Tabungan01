// ================================================================
//  STATE & DOM
// ================================================================

let transactions = [];
let target = {
    nama: 'Tabungan Darurat',
    nominal: 10000000
};

let editingId = null;
let currentPage = 'dashboard';
let filterKategori = 'semua';
let periodMode = 'bulan';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const dom = {
    // Dashboard
    saldo: $('#totalSaldo'),
    pemasukan: $('#totalPemasukan'),
    pengeluaran: $('#totalPengeluaran'),
    jmlPemasukan: $('#jmlPemasukan'),
    jmlPengeluaran: $('#jmlPengeluaran'),
    saldoBadge: $('#saldoBadge'),
    trendSaldo: $('#trendSaldo'),

    // Riwayat
    historyTable: $('#historyTable'),
    jmlRiwayat: $('#jmlRiwayat'),
    filterKategori: $('#filterKategori'),

    // Semua transaksi
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

    // Kategori
    kategoriChart: $('#kategoriChart'),
    kategoriTeratas: $('#kategoriTeratas'),

    // Laporan
    laporanBulanan: $('#laporanBulanan'),
    laporanRingkasan: $('#laporanRingkasan'),

    // Modal
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

    // Buttons
    btnTambah: $('#btnTambahTransaksi'),
    btnTambahPage: $('#btnTambahDariPage'),
    btnSimpanTarget: $('#btnSimpanTarget'),
    btnEditTarget: $('#btnEditTarget'),
    btnFilterPeriod: $('#btnFilterPeriod'),

    rangeText: $('#rangeText'),

    userName: $('#userName'),
    avatarUser: $('#avatarUser')
};


// ================================================================
//  DEFAULT DATA
// ================================================================

const DEFAULT_TARGET = {
    nama: 'Tabungan Darurat',
    nominal: 10000000
};


// ================================================================
//  LOCAL STORAGE
// ================================================================

function loadData() {
    try {
        const raw = localStorage.getItem('keuangan_data');

        if (!raw) {
            transactions = [];
            target = { ...DEFAULT_TARGET };
            return;
        }

        const data = JSON.parse(raw);

        transactions = Array.isArray(data.transactions)
            ? data.transactions
            : [];

        target = data.target && typeof data.target === 'object'
            ? {
                nama: data.target.nama || DEFAULT_TARGET.nama,
                nominal: Number(data.target.nominal) || DEFAULT_TARGET.nominal
            }
            : { ...DEFAULT_TARGET };

        // ========================================================
        // NORMALISASI DATA LAMA
        // ========================================================
        // Data lama mungkin memiliki ID desimal karena sebelumnya:
        // Date.now() + Math.random() * 1000
        //
        // Kita ubah semua ID menjadi STRING agar aman.
        transactions = transactions.map((t, index) => ({
            ...t,

            id: String(
                t.id !== undefined && t.id !== null
                    ? t.id
                    : `trx-${Date.now()}-${index}`
            ),

            nominal: Number(t.nominal) || 0,

            jenis: t.jenis === 'pengeluaran'
                ? 'pengeluaran'
                : 'pemasukan',

            kategori: t.kategori || 'Lainnya',

            keterangan: t.keterangan || '',

            tanggal: t.tanggal || getToday()
        }));

        saveData();

    } catch (error) {

        console.error('Gagal load data:', error);

        transactions = [];
        target = { ...DEFAULT_TARGET };
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

    } catch (error) {

        console.error('Gagal menyimpan data:', error);

    }
}


// ================================================================
//  ID TRANSAKSI
// ================================================================

function generateTransactionId() {

    // ID STRING supaya tidak pernah bentrok
    return `trx-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`;
}


// ================================================================
//  HELPER DATE
// ================================================================

function getToday() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(now.getMonth() + 1)
        .padStart(2, '0');

    const day = String(now.getDate())
        .padStart(2, '0');

    return `${year}-${month}-${day}`;
}


function parseDate(dateString) {

    if (!dateString) {
        return new Date();
    }

    // Hindari masalah timezone untuk YYYY-MM-DD
    const parts = String(dateString).split('-');

    if (parts.length === 3) {

        return new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );
    }

    return new Date(dateString);
}


function isSameMonth(dateString, date) {

    const d = parseDate(dateString);

    return (
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
    );
}


// ================================================================
//  FORMAT RUPIAH
// ================================================================

function formatRupiah(angka) {

    const number = Number(angka) || 0;

    return number.toLocaleString('id-ID');
}


// ================================================================
//  FORMAT TANGGAL
// ================================================================

function formatTanggal(dateString) {

    const d = parseDate(dateString);

    if (isNaN(d.getTime())) {
        return '-';
    }

    const bulan = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des'
    ];

    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}


// ================================================================
//  ESCAPE HTML
// ================================================================

function escapeHtml(text) {

    const div = document.createElement('div');

    div.textContent = text ?? '';

    return div.innerHTML;
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

    let totalPemasukan = 0;

    let totalPengeluaran = 0;

    let jmlPemasukan = 0;

    let jmlPengeluaran = 0;


    transactions.forEach(t => {

        const d = parseDate(t.tanggal);

        if (
            d.getMonth() === bulanIni &&
            d.getFullYear() === tahunIni
        ) {

            const nominal = Number(t.nominal) || 0;

            if (t.jenis === 'pemasukan') {

                totalPemasukan += nominal;

                jmlPemasukan++;

            } else {

                totalPengeluaran += nominal;

                jmlPengeluaran++;

            }
        }
    });


    const saldo = totalPemasukan - totalPengeluaran;


    // ============================================================
    // SALDO
    // ============================================================

    dom.saldo.textContent =
        'Rp ' + formatRupiah(saldo);

    dom.pemasukan.textContent =
        'Rp ' + formatRupiah(totalPemasukan);

    dom.pengeluaran.textContent =
        'Rp ' + formatRupiah(totalPengeluaran);


    dom.jmlPemasukan.textContent =
        `${jmlPemasukan} transaksi`;

    dom.jmlPengeluaran.textContent =
        `${jmlPengeluaran} transaksi`;


    // ============================================================
    // STATUS SALDO
    // ============================================================

    if (totalPemasukan > totalPengeluaran) {

        dom.saldoBadge.innerHTML = `
            <i class="fas fa-arrow-up"></i>
            +${calculatePercentage(
                totalPemasukan,
                totalPengeluaran
            )}%
        `;

        dom.trendSaldo.innerHTML = `
            <i class="fas fa-arrow-up"></i>
            Sehat
        `;

    } else if (totalPemasukan < totalPengeluaran) {

        dom.saldoBadge.innerHTML = `
            <i class="fas fa-arrow-down"></i>
            Defisit
        `;

        dom.trendSaldo.innerHTML = `
            <i class="fas fa-arrow-down"></i>
            Perhatikan
        `;

    } else {

        dom.saldoBadge.innerHTML = `
            <i class="fas fa-minus"></i>
            0%
        `;

        dom.trendSaldo.innerHTML = `
            <i class="fas fa-minus"></i>
            Seimbang
        `;
    }


    // ============================================================
    // BULAN
    // ============================================================

    const bulan = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des'
    ];


    if (periodMode === 'bulan') {

        dom.rangeText.textContent =
            `${bulan[bulanIni]} ${tahunIni}`;

        dom.btnFilterPeriod.innerHTML = `
            <i class="fas fa-calendar"></i>
            ${bulan[bulanIni]} ${tahunIni}
        `;

    } else {

        dom.rangeText.textContent =
            `Tahun ${tahunIni}`;

        dom.btnFilterPeriod.innerHTML = `
            <i class="fas fa-calendar"></i>
            Tahun ${tahunIni}
        `;
    }
}


// ================================================================
//  PERSENTASE
// ================================================================

function calculatePercentage(a, b) {

    if (b === 0) {
        return a > 0 ? 100 : 0;
    }

    return Math.round(((a - b) / b) * 100);
}


// ================================================================
//  RENDER HISTORY
// ================================================================

function renderHistory() {

    if (!dom.historyTable) return;

    const filter = dom.filterKategori
        ? dom.filterKategori.value
        : 'semua';


    let filtered = [...transactions];


    // Filter kategori
    if (filter !== 'semua') {

        filtered = filtered.filter(
            t => t.kategori === filter
        );
    }


    // Urutkan tanggal terbaru
    filtered.sort(
        (a, b) =>
            parseDate(b.tanggal) -
            parseDate(a.tanggal)
    );


    dom.jmlRiwayat.textContent =
        `${filtered.length} transaksi`;


    if (filtered.length === 0) {

        dom.historyTable.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <span>Belum ada transaksi</span>
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

            <div class="row">

                <span>
                    ${escapeHtml(t.keterangan)}
                </span>

                <span>
                    ${formatTanggal(t.tanggal)}
                </span>

                <span>
                    ${escapeHtml(t.kategori)}
                </span>

                <span
                    style="
                        display:flex;
                        align-items:center;
                        gap:8px;
                        justify-content:space-between;
                    "
                >

                    <span
                        style="
                            color:${color};
                            font-weight:700;
                            white-space:nowrap;
                        "
                    >
                        ${sign} Rp ${formatRupiah(t.nominal)}
                    </span>

                    <div
                        style="
                            display:flex;
                            gap:5px;
                            flex-shrink:0;
                        "
                    >

                        <button
                            type="button"
                            class="edit-btn"
                            data-id="${escapeHtml(String(t.id))}"
                            title="Edit transaksi"
                        >
                            <i class="fas fa-pen"></i>
                        </button>

                        <button
                            type="button"
                            class="delete-btn"
                            data-id="${escapeHtml(String(t.id))}"
                            title="Hapus transaksi"
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
    // EVENT EDIT & DELETE
    // ============================================================

    attachTransactionEvents(dom.historyTable);
}


// ================================================================
//  RENDER SEMUA TRANSAKSI
// ================================================================

function renderAllTransactions() {

    if (!dom.allTransaksiList) return;


    if (transactions.length === 0) {

        dom.allTransaksiList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <span>Belum ada transaksi</span>
            </div>
        `;

        return;
    }


    const sorted = [...transactions].sort(
        (a, b) =>
            parseDate(b.tanggal) -
            parseDate(a.tanggal)
    );


    let html = `

        <div
            class="row header-row"
            style="
                grid-template-columns:
                2fr 1.2fr 1fr 1.5fr;
            "
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
                style="
                    grid-template-columns:
                    2fr 1.2fr 1fr 1.5fr;
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

                <span
                    style="
                        display:flex;
                        align-items:center;
                        gap:8px;
                        justify-content:space-between;
                    "
                >

                    <span
                        style="
                            color:${color};
                            font-weight:700;
                            white-space:nowrap;
                        "
                    >
                        ${sign} Rp ${formatRupiah(t.nominal)}
                    </span>

                    <div
                        style="
                            display:flex;
                            gap:5px;
                            flex-shrink:0;
                        "
                    >

                        <button
                            type="button"
                            class="edit-btn"
                            data-id="${escapeHtml(String(t.id))}"
                            title="Edit transaksi"
                        >
                            <i class="fas fa-pen"></i>
                        </button>

                        <button
                            type="button"
                            class="delete-btn"
                            data-id="${escapeHtml(String(t.id))}"
                            title="Hapus transaksi"
                        >
                            <i class="fas fa-trash"></i>
                        </button>

                    </div>

                </span>

            </div>

        `;
    });


    dom.allTransaksiList.innerHTML = html;


    attachTransactionEvents(dom.allTransaksiList);
}


// ================================================================
//  EVENT EDIT & DELETE
// ================================================================

function attachTransactionEvents(container) {

    if (!container) return;


    // ============================================================
    // EDIT
    // ============================================================

    container
        .querySelectorAll('.edit-btn')
        .forEach(button => {

            button.addEventListener('click', function(e) {

                e.preventDefault();

                e.stopPropagation();

                const id =
                    String(this.dataset.id);

                editTransaction(id);
            });
        });


    // ============================================================
    // DELETE
    // ============================================================

    container
        .querySelectorAll('.delete-btn')
        .forEach(button => {

            button.addEventListener('click', function(e) {

                e.preventDefault();

                e.stopPropagation();

                const id =
                    String(this.dataset.id);

                deleteTransaction(id);
            });
        });
}


// ================================================================
//  EDIT TRANSACTION
// ================================================================

function editTransaction(id) {

    const transaction =
        transactions.find(
            t => String(t.id) === String(id)
        );


    if (!transaction) {

        console.error(
            'Transaksi tidak ditemukan:',
            id
        );

        alert('Transaksi tidak ditemukan.');

        return;
    }


    openModal(transaction);
}


// ================================================================
//  DELETE TRANSACTION
// ================================================================

function deleteTransaction(id) {

    const transaction =
        transactions.find(
            t => String(t.id) === String(id)
        );


    if (!transaction) {

        alert('Transaksi tidak ditemukan.');

        return;
    }


    const nama =
        transaction.keterangan || 'transaksi ini';


    const yakin = confirm(
        `Apakah kamu yakin ingin menghapus "${nama}"?`
    );


    if (!yakin) {
        return;
    }


    const oldLength =
        transactions.length;


    transactions =
        transactions.filter(
            t => String(t.id) !== String(id)
        );


    if (transactions.length === oldLength) {

        alert('Gagal menghapus transaksi.');

        return;
    }


    saveData();

    renderAll();


    // Notifikasi kecil
    showNotification(
        'Transaksi berhasil dihapus.'
    );
}


// ================================================================
//  RENDER TARGET
// ================================================================

function renderTarget() {

    const now = new Date();

    let totalPemasukan = 0;


    transactions.forEach(t => {

        if (
            t.jenis === 'pemasukan' &&
            isSameMonth(t.tanggal, now)
        ) {

            totalPemasukan +=
                Number(t.nominal) || 0;
        }
    });


    const nominalTarget =
        Number(target.nominal) ||
        DEFAULT_TARGET.nominal;


    const progress =
        nominalTarget > 0
            ? Math.min(
                100,
                (totalPemasukan /
                    nominalTarget) *
                100
            )
            : 0;


    if (dom.targetNominal) {

        dom.targetNominal.textContent =
            'Rp ' +
            formatRupiah(nominalTarget);
    }


    if (dom.targetDesc) {

        dom.targetDesc.textContent =
            `dari target Rp ${formatRupiah(nominalTarget)}`;
    }


    if (dom.targetProgress) {

        dom.targetProgress.style.width =
            `${progress}%`;
    }


    if (dom.targetProgress2) {

        dom.targetProgress2.style.width =
            `${progress}%`;
    }


    if (dom.targetProgressText) {

        dom.targetProgressText.textContent =
            `${progress.toFixed(1)}%`;
    }


    if (dom.targetTerkumpul) {

        dom.targetTerkumpul.textContent =
            'Rp ' +
            formatRupiah(totalPemasukan);
    }


    if (dom.targetSisa) {

        dom.targetSisa.textContent =
            'sisa Rp ' +
            formatRupiah(
                Math.max(
                    0,
                    nominalTarget -
                    totalPemasukan
                )
            );
    }


    if (dom.targetNamaInput) {

        dom.targetNamaInput.value =
            target.nama ||
            DEFAULT_TARGET.nama;
    }


    if (dom.targetNominalInput) {

        dom.targetNominalInput.value =
            nominalTarget;
    }


    if ($('#targetStatus')) {

        $('#targetStatus').textContent =
            `${progress.toFixed(0)}%`;
    }
}


// ================================================================
//  RENDER KATEGORI
// ================================================================

function renderKategoriChart() {

    if (!dom.kategoriChart) return;


    const now = new Date();

    const kategoriMap = {};

    let total = 0;


    transactions.forEach(t => {

        if (
            t.jenis === 'pengeluaran' &&
            isSameMonth(t.tanggal, now)
        ) {

            const kategori =
                t.kategori || 'Lainnya';

            const nominal =
                Number(t.nominal) || 0;


            kategoriMap[kategori] =
                (kategoriMap[kategori] || 0) +
                nominal;


            total += nominal;
        }
    });


    const entries =
        Object.entries(kategoriMap)
            .sort((a, b) => b[1] - a[1]);


    dom.kategoriChart.innerHTML = '';


    if (entries.length === 0) {

        dom.kategoriChart.innerHTML = `
            <div
                style="
                    color:var(--text-secondary);
                    font-size:14px;
                    padding:8px 0;
                "
            >
                Belum ada pengeluaran bulan ini
            </div>
        `;

        if (dom.kategoriTeratas) {

            dom.kategoriTeratas.textContent = '—';
        }

        return;
    }


    if (dom.kategoriTeratas) {

        const topKategori =
            entries[0][0];

        const topPersen =
            Math.round(
                (entries[0][1] / total) * 100
            );


        dom.kategoriTeratas.textContent =
            `${topKategori} (${topPersen}%)`;
    }


    const colors = [
        '#6c5ce7',
        '#00d4aa',
        '#ff6b6b',
        '#ffc107',
        '#4ecdc4',
        '#a29bfe'
    ];


    entries
        .slice(0, 6)
        .forEach(([kategori, nominal], index) => {

            const persen =
                total > 0
                    ? (nominal / total) * 100
                    : 0;


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
                        background:${colors[index]};
                    "
                ></div>

                <span class="persen">
                    ${persen.toFixed(0)}%
                </span>

            `;


            dom.kategoriChart.appendChild(item);
        });
}


// ================================================================
//  RENDER LAPORAN
// ================================================================

function renderLaporan() {

    if (!dom.laporanBulanan) return;


    const bulan = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des'
    ];


    const tahunIni =
        new Date().getFullYear();


    const pemasukanBulan =
        new Array(12).fill(0);


    const pengeluaranBulan =
        new Array(12).fill(0);


    transactions.forEach(t => {

        const d =
            parseDate(t.tanggal);


        if (
            d.getFullYear() === tahunIni
        ) {

            const index =
                d.getMonth();


            const nominal =
                Number(t.nominal) || 0;


            if (t.jenis === 'pemasukan') {

                pemasukanBulan[index] +=
                    nominal;

            } else {

                pengeluaranBulan[index] +=
                    nominal;
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
            (pemasukanBulan[i] /
                maxVal) *
            160;


        const q =
            (pengeluaranBulan[i] /
                maxVal) *
            160;


        const div =
            document.createElement('div');


        div.style.cssText = `
            flex:1;
            display:flex;
            flex-direction:column;
            align-items:center;
            gap:3px;
        `;


        div.innerHTML = `

            <div
                style="
                    width:100%;
                    display:flex;
                    justify-content:center;
                    gap:2px;
                    align-items:flex-end;
                    height:170px;
                "
            >

                <div
                    title="Pemasukan ${bulan[i]}"
                    style="
                        width:30%;
                        background:#00d4aa;
                        border-radius:4px 4px 0 0;
                        height:${p}px;
                        min-height:2px;
                        transition:0.3s;
                    "
                ></div>

                <div
                    title="Pengeluaran ${bulan[i]}"
                    style="
                        width:30%;
                        background:#ff6b6b;
                        border-radius:4px 4px 0 0;
                        height:${q}px;
                        min-height:2px;
                        transition:0.3s;
                    "
                ></div>

            </div>

            <span
                style="
                    color:var(--text-secondary);
                    font-size:9px;
                "
            >
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


    if (dom.laporanRingkasan) {

        dom.laporanRingkasan.innerHTML = `

            <div
                style="
                    display:grid;
                    grid-template-columns:
                    1fr 1fr;
                    gap:12px;
                "
            >

                <div
                    style="
                        background:
                        rgba(0,212,170,0.06);
                        padding:12px;
                        border-radius:16px;
                    "
                >

                    <div
                        style="
                            color:var(--text-secondary);
                            font-size:12px;
                        "
                    >
                        Total Pemasukan
                    </div>

                    <div
                        style="
                            font-size:20px;
                            font-weight:700;
                            color:var(--success);
                        "
                    >
                        Rp ${formatRupiah(totalPem)}
                    </div>

                </div>


                <div
                    style="
                        background:
                        rgba(255,107,107,0.06);
                        padding:12px;
                        border-radius:16px;
                    "
                >

                    <div
                        style="
                            color:var(--text-secondary);
                            font-size:12px;
                        "
                    >
                        Total Pengeluaran
                    </div>

                    <div
                        style="
                            font-size:20px;
                            font-weight:700;
                            color:var(--danger);
                        "
                    >
                        Rp ${formatRupiah(totalPeng)}
                    </div>

                </div>

            </div>


            <div
                style="
                    margin-top:12px;
                    padding:12px;
                    background:
                    rgba(255,255,255,0.02);
                    border-radius:16px;
                "
            >

                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        color:var(--text-secondary);
                        font-size:13px;
                    "
                >

                    <span>Selisih</span>

                    <span
                        style="
                            font-weight:600;
                            color:
                            ${totalPem >= totalPeng
                                ? 'var(--success)'
                                : 'var(--danger)'};
                        "
                    >
                        Rp ${formatRupiah(
                            totalPem - totalPeng
                        )}
                    </span>

                </div>


                <div
                    style="
                        display:flex;
                        justify-content:space-between;
                        color:var(--text-secondary);
                        font-size:13px;
                        margin-top:4px;
                    "
                >

                    <span>Transaksi</span>

                    <span>
                        ${transactions.length}
                        transaksi
                    </span>

                </div>

            </div>

        `;
    }
}


// ================================================================
//  NAVIGATION
// ================================================================

function navigateTo(page) {

    currentPage = page;


    document
        .querySelectorAll('.page-section')
        .forEach(section => {

            section.style.display = 'none';
        });


    const pageId =
        'page' +
        page.charAt(0).toUpperCase() +
        page.slice(1);


    const pageElement =
        document.getElementById(pageId);


    if (pageElement) {

        pageElement.style.display =
            'block';
    }


    document
        .querySelectorAll('.nav-icons a')
        .forEach(link => {

            link.classList.remove('active');
        });


    const navLink =
        document.querySelector(
            `.nav-icons a[data-page="${page}"]`
        );


    if (navLink) {

        navLink.classList.add('active');
    }
}


function updatePage() {

    // Pastikan halaman aktif tetap benar
    navigateTo(currentPage);
}


// ================================================================
//  MODAL - TAMBAH / EDIT
// ================================================================

function openModal(editData = null) {

    if (!dom.modal) return;


    dom.modal.style.display = 'flex';


    if (editData) {

        // ========================================================
        // MODE EDIT
        // ========================================================

        dom.modalTitle.textContent =
            'Edit Transaksi';


        dom.fKeterangan.value =
            editData.keterangan || '';


        dom.fNominal.value =
            editData.nominal || '';


        dom.fKategori.value =
            editData.kategori || 'Makanan';


        dom.fTanggal.value =
            editData.tanggal || getToday();


        const radio =
            document.querySelector(
                `input[name="jenis"][value="${editData.jenis}"]`
            );


        if (radio) {
            radio.checked = true;
        }


        editingId =
            String(editData.id);


        // Ubah teks tombol
        const saveButton =
            dom.form.querySelector(
                '.btn-save'
            );


        if (saveButton) {

            saveButton.innerHTML = `
                <i class="fas fa-save"></i>
                Simpan Perubahan
            `;
        }

    } else {

        // ========================================================
        // MODE TAMBAH
        // ========================================================

        dom.modalTitle.textContent =
            'Tambah Transaksi';


        dom.fKeterangan.value = '';

        dom.fNominal.value = '';

        dom.fKategori.value =
            'Makanan';

        dom.fTanggal.value =
            getToday();


        const pemasukanRadio =
            document.querySelector(
                'input[name="jenis"][value="pemasukan"]'
            );


        if (pemasukanRadio) {
            pemasukanRadio.checked = true;
        }


        editingId = null;


        const saveButton =
            dom.form.querySelector(
                '.btn-save'
            );


        if (saveButton) {

            saveButton.innerHTML = `
                <i class="fas fa-save"></i>
                Simpan
            `;
        }
    }


    // Fokus keterangan
    setTimeout(() => {

        if (dom.fKeterangan) {
            dom.fKeterangan.focus();
        }

    }, 100);
}


// ================================================================
//  CLOSE MODAL
// ================================================================

function closeModal() {

    if (!dom.modal) return;


    dom.modal.style.display =
        'none';


    editingId = null;


    // Reset tombol
    const saveButton =
        dom.form.querySelector(
            '.btn-save'
        );


    if (saveButton) {

        saveButton.innerHTML = `
            <i class="fas fa-save"></i>
            Simpan
        `;
    }
}


// ================================================================
//  SUBMIT FORM
// ================================================================

function handleFormSubmit(e) {

    e.preventDefault();


    const radioJenis =
        document.querySelector(
            'input[name="jenis"]:checked'
        );


    if (!radioJenis) {

        alert('Pilih jenis transaksi.');

        return;
    }


    const jenis =
        radioJenis.value;


    const keterangan =
        dom.fKeterangan.value.trim();


    const nominal =
        Number(dom.fNominal.value);


    const kategori =
        dom.fKategori.value;


    const tanggal =
        dom.fTanggal.value;


    // ============================================================
    // VALIDASI
    // ============================================================

    if (!keterangan) {

        alert(
            'Masukkan keterangan transaksi.'
        );

        dom.fKeterangan.focus();

        return;
    }


    if (
        !Number.isFinite(nominal) ||
        nominal <= 0
    ) {

        alert(
            'Masukkan nominal yang valid.'
        );

        dom.fNominal.focus();

        return;
    }


    if (!tanggal) {

        alert(
            'Pilih tanggal transaksi.'
        );

        dom.fTanggal.focus();

        return;
    }


    // ============================================================
    // MODE EDIT
    // ============================================================

    if (editingId !== null) {

        const index =
            transactions.findIndex(
                t =>
                    String(t.id) ===
                    String(editingId)
            );


        if (index === -1) {

            alert(
                'Transaksi yang ingin diedit tidak ditemukan.'
            );

            return;
        }


        transactions[index] = {

            ...transactions[index],

            jenis,

            keterangan,

            nominal,

            kategori,

            tanggal
        };


        saveData();

        closeModal();

        renderAll();


        showNotification(
            'Transaksi berhasil diperbarui.'
        );


        return;
    }


    // ============================================================
    // MODE TAMBAH
    // ============================================================

    const newTransaction = {

        id: generateTransactionId(),

        jenis,

        keterangan,

        nominal,

        kategori,

        tanggal
    };


    transactions.push(
        newTransaction
    );


    saveData();

    closeModal();

    renderAll();


    showNotification(
        'Transaksi berhasil ditambahkan.'
    );
}


// ================================================================
//  TARGET
// ================================================================

function saveTarget() {

    const nama =
        dom.targetNamaInput.value.trim() ||
        DEFAULT_TARGET.nama;


    const nominal =
        Number(dom.targetNominalInput.value);


    if (
        !Number.isFinite(nominal) ||
        nominal <= 0
    ) {

        alert(
            'Masukkan nominal target yang valid.'
        );

        dom.targetNominalInput.focus();

        return;
    }


    target = {

        nama,

        nominal
    };


    saveData();

    renderTarget();


    showNotification(
        'Target berhasil disimpan.'
    );
}


// ================================================================
//  FILTER PERIODE
// ================================================================

function togglePeriod() {

    periodMode =
        periodMode === 'bulan'
            ? 'tahun'
            : 'bulan';


    renderSaldo();
}


// ================================================================
//  NOTIFICATION
// ================================================================

function showNotification(message) {

    let notification =
        document.getElementById(
            'appNotification'
        );


    if (!notification) {

        notification =
            document.createElement('div');


        notification.id =
            'appNotification';


        notification.style.cssText = `

            position:fixed;

            right:24px;

            bottom:24px;

            z-index:9999;

            padding:12px 18px;

            background:#141c2b;

            color:#e8edf5;

            border:1px solid
                rgba(255,255,255,0.08);

            border-radius:14px;

            box-shadow:
                0 8px 30px
                rgba(0,0,0,0.35);

            font-size:14px;

            opacity:0;

            transform:
                translateY(10px);

            transition:
                all 0.25s ease;
        `;


        document.body.appendChild(
            notification
        );
    }


    notification.textContent =
        message;


    requestAnimationFrame(() => {

        notification.style.opacity =
            '1';

        notification.style.transform =
            'translateY(0)';
    });


    clearTimeout(
        notification._timer
    );


    notification._timer =
        setTimeout(() => {

            notification.style.opacity =
                '0';

            notification.style.transform =
                'translateY(10px)';

        }, 2500);
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
    // TAMBAH TRANSAKSI
    // ============================================================

    if (dom.btnTambah) {

        dom.btnTambah.addEventListener(
            'click',
            () => openModal()
        );
    }


    if (dom.btnTambahPage) {

        dom.btnTambahPage.addEventListener(
            'click',
            () => openModal()
        );
    }


    // ============================================================
    // CLOSE MODAL
    // ============================================================

    if (dom.modalClose) {

        dom.modalClose.addEventListener(
            'click',
            closeModal
        );
    }


    if (dom.modalCancel) {

        dom.modalCancel.addEventListener(
            'click',
            closeModal
        );
    }


    if (dom.modal) {

        dom.modal.addEventListener(
            'click',
            function(e) {

                if (e.target === this) {

                    closeModal();
                }
            }
        );
    }


    // ============================================================
    // FORM
    // ============================================================

    if (dom.form) {

        dom.form.addEventListener(
            'submit',
            handleFormSubmit
        );
    }


    // ============================================================
    // FILTER KATEGORI
    // ============================================================

    if (dom.filterKategori) {

        dom.filterKategori.addEventListener(
            'change',
            function() {

                filterKategori =
                    this.value;

                renderHistory();
            }
        );
    }


    // ============================================================
    // TARGET
    // ============================================================

    if (dom.btnSimpanTarget) {

        dom.btnSimpanTarget.addEventListener(
            'click',
            saveTarget
        );
    }


    if (dom.btnEditTarget) {

        dom.btnEditTarget.addEventListener(
            'click',
            function() {

                navigateTo('target');
            }
        );
    }


    // ============================================================
    // FILTER PERIODE
    // ============================================================

    if (dom.btnFilterPeriod) {

        dom.btnFilterPeriod.addEventListener(
            'click',
            togglePeriod
        );
    }


    // ============================================================
    // ESCAPE
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
//  INIT
// ================================================================

function init() {

    loadData();

    bindEvents();

    renderAll();


    if (dom.fTanggal) {

        dom.fTanggal.value =
            getToday();
    }


    // Avatar
    if (
        dom.userName &&
        dom.avatarUser
    ) {

        const nama =
            dom.userName.textContent.trim();


        if (nama) {

            dom.avatarUser.textContent =
                nama.charAt(0).toUpperCase();
        }
    }
}


// ================================================================
//  START
// ================================================================

document.addEventListener(
    'DOMContentLoaded',
    init
);
