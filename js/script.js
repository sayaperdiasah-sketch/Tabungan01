// ================================================================
//  KEUANGAN PRIBADI — SCRIPT.JS
//  Versi diperbaiki:
//  - Semua tombol aman meskipun beberapa elemen HTML tidak ada
//  - CRUD transaksi
//  - CRUD tabungan target
//  - Target tidak bercampur dengan transaksi
//  - LocalStorage
//  - Navigasi halaman
//  - Modal
//  - Filter kategori
//  - Filter periode
// ================================================================


// ================================================================
// STATE
// ================================================================

let transactions = [];

let target = {
    nama: 'Tabungan Darurat',
    nominal: 10000000,
    savings: []
};

let editingId = null;
let editingSavingId = null;

let currentPage = 'dashboard';
let filterKategori = 'semua';
let filterMode = 'bulan';


// ================================================================
// DOM HELPER
// ================================================================

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    document.querySelectorAll(selector);


// ================================================================
// DOM
// ================================================================

const dom = {

    // ------------------------------------------------------------
    // TRANSAKSI
    // ------------------------------------------------------------

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


    // ------------------------------------------------------------
    // TARGET
    // ------------------------------------------------------------

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


    // ------------------------------------------------------------
    // LAPORAN
    // ------------------------------------------------------------

    laporanBulanan: $('#laporanBulanan'),
    laporanRingkasan: $('#laporanRingkasan'),


    // ------------------------------------------------------------
    // MODAL TRANSAKSI
    // ------------------------------------------------------------

    modal: $('#modalTransaksi'),
    modalTitle: $('#modalTitle'),

    form: $('#formTransaksi'),

    fKeterangan: $('#fKeterangan'),
    fNominal: $('#fNominal'),
    fKategori: $('#fKategori'),
    fTanggal: $('#fTanggal'),

    modalClose: $('#modalClose'),
    modalCancel: $('#modalCancel'),


    // ------------------------------------------------------------
    // BUTTON TRANSAKSI
    // ------------------------------------------------------------

    btnTambah: $('#btnTambahTransaksi'),
    btnTambahPage: $('#btnTambahDariPage'),


    // ------------------------------------------------------------
    // BUTTON TARGET
    // ------------------------------------------------------------

    btnSimpanTarget: $('#btnSimpanTarget'),
    btnEditTarget: $('#btnEditTarget'),
    btnTambahTabungan: $('#btnTambahTabungan'),


    // ------------------------------------------------------------
    // FILTER
    // ------------------------------------------------------------

    btnFilterPeriod: $('#btnFilterPeriod'),
    rangeText: $('#rangeText'),


    // ------------------------------------------------------------
    // MODAL TABUNGAN
    // ------------------------------------------------------------

    modalTabungan: $('#modalTabungan'),
    modalTabunganTitle: $('#modalTabunganTitle'),

    formTabungan: $('#formTabungan'),

    fTabunganNominal: $('#fTabunganNominal'),
    fTabunganTanggal: $('#fTabunganTanggal'),
    fTabunganCatatan: $('#fTabunganCatatan'),

    modalTabunganClose: $('#modalTabunganClose'),
    modalTabunganCancel: $('#modalTabunganCancel'),

    btnSimpanTabunganText: $('#btnSimpanTabunganText')

};


// ================================================================
// SAFE EVENT
// ================================================================

function on(element, event, handler) {

    if (!element) return;

    element.addEventListener(
        event,
        handler
    );

}


// ================================================================
// LOCAL STORAGE
// ================================================================

function loadData() {

    try {

        const raw =
            localStorage.getItem(
                'keuangan_data'
            );

        if (!raw) {

            transactions = [];

            target = {
                nama: 'Tabungan Darurat',
                nominal: 10000000,
                savings: []
            };

            return;

        }


        const data =
            JSON.parse(raw);


        // --------------------------------------------------------
        // TRANSACTIONS
        // --------------------------------------------------------

        transactions =
            Array.isArray(data.transactions)
                ? data.transactions
                : [];


        transactions =
            transactions.map(
                (t, index) => ({

                    ...t,

                    id:
                        String(
                            t.id ??
                            `transaction-${Date.now()}-${index}`
                        ),

                    jenis:
                        t.jenis === 'pemasukan'
                            ? 'pemasukan'
                            : 'pengeluaran',

                    keterangan:
                        t.keterangan || '',

                    nominal:
                        Number(t.nominal) || 0,

                    kategori:
                        t.kategori || 'Lainnya',

                    tanggal:
                        t.tanggal ||
                        getLocalDateString()

                })
            );


        // --------------------------------------------------------
        // TARGET
        // --------------------------------------------------------

        const oldTarget =
            data.target || {};


        target = {

            nama:
                oldTarget.nama ||
                'Tabungan Darurat',

            nominal:
                Number(oldTarget.nominal) ||
                10000000,

            savings:
                Array.isArray(
                    oldTarget.savings
                )
                    ? oldTarget.savings.map(
                        (saving, index) => ({

                            ...saving,

                            id:
                                String(
                                    saving.id ??
                                    `saving-${Date.now()}-${index}`
                                ),

                            nominal:
                                Number(
                                    saving.nominal
                                ) || 0,

                            tanggal:
                                saving.tanggal ||
                                getLocalDateString(),

                            catatan:
                                saving.catatan || ''

                        })
                    )
                    : []

        };


    } catch (error) {

        console.error(
            'Gagal membaca LocalStorage:',
            error
        );


        transactions = [];

        target = {
            nama: 'Tabungan Darurat',
            nominal: 10000000,
            savings: []
        };

    }

}


// ================================================================
// SAVE DATA
// ================================================================

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

        console.error(
            'Gagal menyimpan data:',
            error
        );

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

    updatePage();

}


// ================================================================
// RENDER SALDO
// ================================================================

function renderSaldo() {

    let totalPemasukan = 0;
    let totalPengeluaran = 0;

    let jmlPemasukan = 0;
    let jmlPengeluaran = 0;


    transactions.forEach(
        transaction => {

            const nominal =
                Number(
                    transaction.nominal
                ) || 0;


            if (
                transaction.jenis ===
                'pemasukan'
            ) {

                totalPemasukan += nominal;

                jmlPemasukan++;

            } else {

                totalPengeluaran += nominal;

                jmlPengeluaran++;

            }

        }
    );


    const saldo =
        totalPemasukan -
        totalPengeluaran;


    if (dom.saldo) {

        dom.saldo.textContent =
            'Rp ' +
            formatRupiah(saldo);

    }


    if (dom.pemasukan) {

        dom.pemasukan.textContent =
            'Rp ' +
            formatRupiah(
                totalPemasukan
            );

    }


    if (dom.pengeluaran) {

        dom.pengeluaran.textContent =
            'Rp ' +
            formatRupiah(
                totalPengeluaran
            );

    }


    if (dom.jmlPemasukan) {

        dom.jmlPemasukan.textContent =
            `${jmlPemasukan} transaksi`;

    }


    if (dom.jmlPengeluaran) {

        dom.jmlPengeluaran.textContent =
            `${jmlPengeluaran} transaksi`;

    }


    const positif =
        totalPemasukan >=
        totalPengeluaran;


    const trend =
        totalPemasukan >
        totalPengeluaran

            ? '+ positif'

            : totalPemasukan <
              totalPengeluaran

                ? '- defisit'

                : 'seimbang';


    if (dom.saldoBadge) {

        dom.saldoBadge.innerHTML = `

            <i class="fas fa-${
                positif
                    ? 'arrow-up'
                    : 'arrow-down'
            }"></i>

            ${trend}

        `;

    }


    if (dom.trendSaldo) {

        dom.trendSaldo.innerHTML = `

            <i class="fas fa-${
                positif
                    ? 'arrow-up'
                    : 'arrow-down'
            }"></i>

            ${
                positif
                    ? 'Sehat'
                    : 'Perhatikan'
            }

        `;

    }


    updatePeriodDisplay();

}


// ================================================================
// PERIOD DISPLAY
// ================================================================

function updatePeriodDisplay() {

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


    const now =
        new Date();


    if (filterMode === 'tahun') {

        if (dom.rangeText) {

            dom.rangeText.textContent =
                `Tahun ${now.getFullYear()}`;

        }


        if (dom.btnFilterPeriod) {

            dom.btnFilterPeriod.innerHTML = `

                <i class="fas fa-calendar"></i>

                Tahun ini

            `;

        }

    } else {

        if (dom.rangeText) {

            dom.rangeText.textContent =
                `${bulan[now.getMonth()]}
                 ${now.getFullYear()}`;

        }


        if (dom.btnFilterPeriod) {

            dom.btnFilterPeriod.innerHTML = `

                <i class="fas fa-calendar"></i>

                ${bulan[now.getMonth()]}
                ${now.getFullYear()}

            `;

        }

    }

}


// ================================================================
// TRANSACTION DELETE
// ================================================================

function deleteTransaction(id) {

    const transaction =
        transactions.find(
            t =>
                String(t.id) ===
                String(id)
        );


    if (!transaction) {

        alert(
            'Transaksi tidak ditemukan.'
        );

        return;

    }


    const yakin =
        confirm(

            `Hapus transaksi "${transaction.keterangan}"?\n\n` +

            `Data yang dihapus tidak dapat dikembalikan.`

        );


    if (!yakin) return;


    transactions =
        transactions.filter(
            t =>
                String(t.id) !==
                String(id)
        );


    saveData();

    renderAll();


    alert(
        'Transaksi berhasil dihapus.'
    );

}


// ================================================================
// TRANSACTION EDIT
// ================================================================

function editTransaction(id) {

    const transaction =
        transactions.find(
            t =>
                String(t.id) ===
                String(id)
        );


    if (!transaction) {

        alert(
            'Transaksi tidak ditemukan.'
        );

        return;

    }


    openModal(transaction);

}


// ================================================================
// RENDER HISTORY
// ================================================================

function renderHistory() {

    if (!dom.historyTable) return;


    let filtered =
        [...transactions];


    if (
        dom.filterKategori
    ) {

        const filter =
            dom.filterKategori.value;


        filterKategori =
            filter;


        if (
            filter !== 'semua'
        ) {

            filtered =
                filtered.filter(
                    t =>
                        t.kategori ===
                        filter
                );

        }

    }


    filtered.sort(
        (a, b) =>
            new Date(
                b.tanggal
            ) -
            new Date(
                a.tanggal
            )
    );


    if (dom.jmlRiwayat) {

        dom.jmlRiwayat.textContent =
            `${filtered.length} transaksi`;

    }


    if (
        filtered.length === 0
    ) {

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


    filtered
        .slice(0, 10)
        .forEach(
            transaction => {

                const pemasukan =
                    transaction.jenis ===
                    'pemasukan';


                const sign =
                    pemasukan
                        ? '+'
                        : '−';


                const color =
                    pemasukan
                        ? 'var(--success)'
                        : 'var(--danger)';


                const id =
                    escapeHtml(
                        String(
                            transaction.id
                        )
                    );


                html += `

                    <div
                        class="row"
                        data-id="${id}"
                    >

                        <span>

                            ${escapeHtml(
                                transaction.keterangan
                            )}

                        </span>


                        <span>

                            ${formatTanggal(
                                transaction.tanggal
                            )}

                        </span>


                        <span>

                            ${escapeHtml(
                                transaction.kategori
                            )}

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
                                "
                            >

                                ${sign}
                                Rp${formatRupiah(
                                    transaction.nominal
                                )}

                            </span>


                            <span
                                style="
                                    display:flex;
                                    gap:5px;
                                "
                            >

                                <button
                                    type="button"
                                    class="edit-btn"
                                    data-id="${id}"
                                    title="Edit"
                                >

                                    <i class="fas fa-pen"></i>

                                </button>


                                <button
                                    type="button"
                                    class="delete-btn"
                                    data-id="${id}"
                                    title="Hapus"
                                >

                                    <i class="fas fa-trash"></i>

                                </button>

                            </span>

                        </span>

                    </div>

                `;

            }
        );


    dom.historyTable.innerHTML =
        html;


    dom.historyTable
        .querySelectorAll(
            '.edit-btn'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();

                        event.stopPropagation();

                        editTransaction(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    dom.historyTable
        .querySelectorAll(
            '.delete-btn'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();

                        event.stopPropagation();

                        deleteTransaction(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


// ================================================================
// RENDER ALL TRANSACTIONS
// ================================================================

function renderAllTransactions() {

    if (!dom.allTransaksiList) return;


    if (
        transactions.length === 0
    ) {

        dom.allTransaksiList.innerHTML = `

            <div class="empty-state">

                <i class="fas fa-receipt"></i>

                Belum ada transaksi

            </div>

        `;

        return;

    }


    const sorted =
        [...transactions].sort(
            (a, b) =>
                new Date(
                    b.tanggal
                ) -
                new Date(
                    a.tanggal
                )
        );


    let html = `

        <div
            class="row header-row"
            style="
                grid-template-columns:
                2fr 1.2fr 1fr 1.2fr;
            "
        >

            <span>Keterangan</span>

            <span>Tanggal</span>

            <span>Kategori</span>

            <span>Nominal</span>

        </div>

    `;


    sorted.forEach(
        transaction => {

            const pemasukan =
                transaction.jenis ===
                'pemasukan';


            const sign =
                pemasukan
                    ? '+'
                    : '−';


            const color =
                pemasukan
                    ? 'var(--success)'
                    : 'var(--danger)';


            const id =
                escapeHtml(
                    String(
                        transaction.id
                    )
                );


            html += `

                <div
                    class="row"
                    data-id="${id}"
                    style="
                        grid-template-columns:
                        2fr 1.2fr 1fr 1.2fr;
                    "
                >

                    <span>

                        ${escapeHtml(
                            transaction.keterangan
                        )}

                    </span>


                    <span>

                        ${formatTanggal(
                            transaction.tanggal
                        )}

                    </span>


                    <span>

                        ${escapeHtml(
                            transaction.kategori
                        )}

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
                            "
                        >

                            ${sign}
                            Rp${formatRupiah(
                                transaction.nominal
                            )}

                        </span>


                        <span
                            style="
                                display:flex;
                                gap:5px;
                            "
                        >

                            <button
                                type="button"
                                class="edit-btn-all"
                                data-id="${id}"
                                title="Edit"
                            >

                                <i class="fas fa-pen"></i>

                            </button>


                            <button
                                type="button"
                                class="delete-btn-all"
                                data-id="${id}"
                                title="Hapus"
                            >

                                <i class="fas fa-trash"></i>

                            </button>

                        </span>

                    </span>

                </div>

            `;

        }
    );


    dom.allTransaksiList.innerHTML =
        html;


    dom.allTransaksiList
        .querySelectorAll(
            '.edit-btn-all'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();

                        event.stopPropagation();

                        editTransaction(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    dom.allTransaksiList
        .querySelectorAll(
            '.delete-btn-all'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();

                        event.stopPropagation();

                        deleteTransaction(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


// ================================================================
// TOTAL TABUNGAN
// ================================================================

function getTotalTabungan() {

    if (
        !target ||
        !Array.isArray(
            target.savings
        )
    ) {

        return 0;

    }


    return target.savings.reduce(
        (
            total,
            saving
        ) => {

            return (
                total +
                (
                    Number(
                        saving.nominal
                    ) || 0
                )
            );

        },
        0
    );

}


// ================================================================
// TARGET RENDER
// ================================================================

function renderTarget() {

    if (!target) return;


    const nominalTarget =
        Number(
            target.nominal
        ) || 10000000;


    const totalTabungan =
        getTotalTabungan();


    const progress =
        nominalTarget > 0

            ? Math.min(
                100,
                (
                    totalTabungan /
                    nominalTarget
                ) * 100
            )

            : 0;


    const sisa =
        Math.max(
            0,
            nominalTarget -
            totalTabungan
        );


    // ------------------------------------------------------------
    // DASHBOARD
    // ------------------------------------------------------------

    if (dom.targetNominal) {

        dom.targetNominal.textContent =
            'Rp ' +
            formatRupiah(
                totalTabungan
            );

    }


    if (dom.targetDesc) {

        dom.targetDesc.textContent =
            `dari target Rp ${formatRupiah(
                nominalTarget
            )}`;

    }


    if (dom.targetProgress) {

        dom.targetProgress.style.width =
            `${progress}%`;

    }


    if (dom.targetStatus) {

        dom.targetStatus.textContent =
            `${progress.toFixed(1)}%`;

    }


    // ------------------------------------------------------------
    // TARGET PAGE
    // ------------------------------------------------------------

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
            formatRupiah(
                totalTabungan
            );

    }


    if (dom.targetSisa) {

        dom.targetSisa.textContent =
            'sisa Rp ' +
            formatRupiah(
                sisa
            );

    }


    if (dom.targetNamaInput) {

        dom.targetNamaInput.value =
            target.nama;

    }


    if (dom.targetNominalInput) {

        dom.targetNominalInput.value =
            nominalTarget;

    }


    renderTargetSavingHistory();

}


// ================================================================
// TARGET STATUS
// ================================================================

function getTargetStatus(progress) {

    if (progress >= 100) {

        return '🎉 Target tercapai!';

    }

    if (progress >= 75) {

        return '🚀 Hampir tercapai';

    }

    if (progress >= 50) {

        return '💪 Sudah setengah jalan';

    }

    if (progress >= 25) {

        return '🔥 Mulai berkembang';

    }

    return '🌱 Baru mulai';

}


// ================================================================
// RENDER SAVING HISTORY
// ================================================================

function renderTargetSavingHistory() {

    const container =
        dom.targetSavingHistory;


    if (!container) return;


    const savings =
        Array.isArray(
            target.savings
        )
            ? [...target.savings]
            : [];


    savings.sort(
        (a, b) =>
            new Date(
                b.tanggal
            ) -
            new Date(
                a.tanggal
            )
    );


    if (dom.jmlSetoran) {

        dom.jmlSetoran.textContent =
            `${savings.length} setoran`;

    }


    if (
        savings.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-saving-state">

                <i class="fas fa-piggy-bank"></i>

                <div>

                    Belum ada setoran.

                    <br>

                    Mulai sisihkan uang untuk
                    mencapai targetmu.

                </div>

            </div>

        `;

        return;

    }


    let html = '';


    savings.forEach(
        saving => {

            const id =
                escapeHtml(
                    String(
                        saving.id
                    )
                );


            const catatan =
                saving.catatan ||
                'Setoran tabungan';


            html += `

                <div
                    class="target-saving-item"
                    data-id="${id}"
                >

                    <div
                        class="target-saving-icon"
                    >

                        <i class="fas fa-piggy-bank"></i>

                    </div>


                    <div
                        class="target-saving-info"
                    >

                        <strong>

                            ${escapeHtml(
                                catatan
                            )}

                        </strong>


                        <span>

                            ${formatTanggal(
                                saving.tanggal
                            )}

                        </span>

                    </div>


                    <div
                        class="target-saving-amount"
                    >

                        +Rp${formatRupiah(
                            saving.nominal
                        )}

                    </div>


                    <div
                        class="target-saving-actions"
                    >

                        <button
                            type="button"
                            class="saving-edit"
                            data-id="${id}"
                            title="Edit setoran"
                        >

                            <i class="fas fa-pen"></i>

                        </button>


                        <button
                            type="button"
                            class="saving-delete"
                            data-id="${id}"
                            title="Hapus setoran"
                        >

                            <i class="fas fa-trash"></i>

                        </button>

                    </div>

                </div>

            `;

        }
    );


    container.innerHTML =
        html;


    // EDIT

    container
        .querySelectorAll(
            '.saving-edit'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();

                        event.stopPropagation();

                        editSaving(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    // DELETE

    container
        .querySelectorAll(
            '.saving-delete'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    event => {

                        event.preventDefault();

                        event.stopPropagation();

                        deleteSaving(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


// ================================================================
// OPEN SAVING MODAL
// ================================================================

function openSavingModal(
    editData = null
) {

    if (!dom.modalTabungan) {

        alert(
            'Modal tabungan belum tersedia di HTML.'
        );

        return;

    }


    dom.modalTabungan.style.display =
        'flex';


    if (editData) {

        editingSavingId =
            String(
                editData.id
            );


        if (dom.modalTabunganTitle) {

            dom.modalTabunganTitle.textContent =
                'Edit Tabungan';

        }


        if (dom.fTabunganNominal) {

            dom.fTabunganNominal.value =
                editData.nominal;

        }


        if (dom.fTabunganTanggal) {

            dom.fTabunganTanggal.value =
                editData.tanggal;

        }


        if (dom.fTabunganCatatan) {

            dom.fTabunganCatatan.value =
                editData.catatan || '';

        }


        if (
            dom.btnSimpanTabunganText
        ) {

            dom.btnSimpanTabunganText.textContent =
                'Simpan Perubahan';

        }

    } else {

        editingSavingId =
            null;


        if (dom.modalTabunganTitle) {

            dom.modalTabunganTitle.textContent =
                'Tambah Tabungan';

        }


        if (dom.fTabunganNominal) {

            dom.fTabunganNominal.value =
                '';

        }


        if (dom.fTabunganTanggal) {

            dom.fTabunganTanggal.value =
                getLocalDateString();

        }


        if (dom.fTabunganCatatan) {

            dom.fTabunganCatatan.value =
                '';

        }


        if (
            dom.btnSimpanTabunganText
        ) {

            dom.btnSimpanTabunganText.textContent =
                'Simpan Tabungan';

        }

    }


    setTimeout(
        () => {

            if (
                dom.fTabunganNominal
            ) {

                dom.fTabunganNominal.focus();

            }

        },
        100
    );

}


// ================================================================
// CLOSE SAVING MODAL
// ================================================================

function closeSavingModal() {

    if (
        dom.modalTabungan
    ) {

        dom.modalTabungan.style.display =
            'none';

    }


    editingSavingId =
        null;

}


// ================================================================
// SUBMIT SAVING
// ================================================================

function handleSavingSubmit(e) {

    e.preventDefault();


    if (
        !Array.isArray(
            target.savings
        )
    ) {

        target.savings = [];

    }


    const nominal =
        parseFloat(
            dom.fTabunganNominal?.value
        );


    const tanggal =
        dom.fTabunganTanggal?.value;


    const catatan =
        dom.fTabunganCatatan
            ?.value
            ?.trim() || '';


    if (
        !Number.isFinite(nominal) ||
        nominal <= 0
    ) {

        alert(
            'Masukkan nominal tabungan yang valid.'
        );

        return;

    }


    if (!tanggal) {

        alert(
            'Pilih tanggal tabungan.'
        );

        return;

    }


    // ------------------------------------------------------------
    // EDIT
    // ------------------------------------------------------------

    if (
        editingSavingId !== null
    ) {

        const index =
            target.savings.findIndex(
                saving =>
                    String(
                        saving.id
                    ) ===
                    String(
                        editingSavingId
                    )
            );


        if (index === -1) {

            alert(
                'Setoran tidak ditemukan.'
            );

            return;

        }


        target.savings[index] = {

            ...target.savings[index],

            nominal,
            tanggal,
            catatan

        };

    }


    // ------------------------------------------------------------
    // TAMBAH
    // ------------------------------------------------------------

    else {

        target.savings.push({

            id:
                createId(
                    'saving'
                ),

            nominal,
            tanggal,
            catatan

        });

    }


    saveData();

    closeSavingModal();

    renderAll();


    // Cek target

    const total =
        getTotalTabungan();


    const targetNominal =
        Number(
            target.nominal
        ) || 0;


    if (
        total >= targetNominal &&
        targetNominal > 0
    ) {

        setTimeout(
            () => {

                alert(
                    '🎉 Selamat! Target tabungan kamu sudah tercapai!'
                );

            },
            200
        );

    }

}


// ================================================================
// EDIT SAVING
// ================================================================

function editSaving(id) {

    if (
        !Array.isArray(
            target.savings
        )
    ) return;


    const saving =
        target.savings.find(
            item =>
                String(
                    item.id
                ) ===
                String(id)
        );


    if (!saving) {

        alert(
            'Setoran tidak ditemukan.'
        );

        return;

    }


    openSavingModal(
        saving
    );

}


// ================================================================
// DELETE SAVING
// ================================================================

function deleteSaving(id) {

    if (
        !Array.isArray(
            target.savings
        )
    ) return;


    const saving =
        target.savings.find(
            item =>
                String(
                    item.id
                ) ===
                String(id)
        );


    if (!saving) {

        alert(
            'Setoran tidak ditemukan.'
        );

        return;

    }


    const yakin =
        confirm(

            `Hapus setoran Rp${formatRupiah(
                saving.nominal
            )}?\n\n` +

            `Setoran ini akan dikurangi dari progress target.`

        );


    if (!yakin) return;


    target.savings =
        target.savings.filter(
            item =>
                String(
                    item.id
                ) !==
                String(id)
        );


    saveData();

    renderAll();


    alert(
        'Setoran berhasil dihapus.'
    );

}


// ================================================================
// KATEGORI CHART
// ================================================================

function renderKategoriChart() {

    if (
        !dom.kategoriChart
    ) return;


    const now =
        new Date();


    const bulanIni =
        now.getMonth();


    const tahunIni =
        now.getFullYear();


    const kategoriMap =
        {};


    let total =
        0;


    transactions.forEach(
        transaction => {

            const d =
                new Date(
                    transaction.tanggal +
                    'T00:00:00'
                );


            if (

                d.getMonth() ===
                bulanIni &&

                d.getFullYear() ===
                tahunIni &&

                transaction.jenis ===
                'pengeluaran'

            ) {

                const nominal =
                    Number(
                        transaction.nominal
                    ) || 0;


                kategoriMap[
                    transaction.kategori
                ] =
                    (
                        kategoriMap[
                            transaction.kategori
                        ] || 0
                    ) +
                    nominal;


                total += nominal;

            }

        }
    );


    const entries =
        Object.entries(
            kategoriMap
        ).sort(
            (a, b) =>
                b[1] - a[1]
        );


    dom.kategoriChart.innerHTML =
        '';


    if (
        entries.length === 0
    ) {

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


        if (
            dom.kategoriTeratas
        ) {

            dom.kategoriTeratas.textContent =
                '—';

        }


        return;

    }


    if (
        dom.kategoriTeratas
    ) {

        dom.kategoriTeratas.textContent =
            `${entries[0][0]} (${
                Math.round(
                    (
                        entries[0][1] /
                        total
                    ) * 100
                )
            }%)`;

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
        .forEach(
            (
                [kategori, nominal],
                index
            ) => {

                const persen =
                    (
                        nominal /
                        total
                    ) * 100;


                const item =
                    document.createElement(
                        'div'
                    );


                item.className =
                    'kategori-item';


                item.innerHTML = `

                    <span>

                        ${escapeHtml(
                            kategori
                        )}

                    </span>


                    <div
                        class="bar"
                        style="
                            width:${Math.max(
                                10,
                                persen * 1.2
                            )}px;

                            background:${
                                colors[
                                    index %
                                    colors.length
                                ]
                            };
                        "
                    ></div>


                    <span class="persen">

                        ${persen.toFixed(0)}%

                    </span>

                `;


                dom.kategoriChart.appendChild(
                    item
                );

            }
        );

}


// ================================================================
// LAPORAN
// ================================================================

function renderLaporan() {

    if (
        !dom.laporanBulanan ||
        !dom.laporanRingkasan
    ) return;


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


    transactions.forEach(
        transaction => {

            const d =
                new Date(
                    transaction.tanggal +
                    'T00:00:00'
                );


            if (
                d.getFullYear() !==
                tahunIni
            ) {

                return;

            }


            const idx =
                d.getMonth();


            const nominal =
                Number(
                    transaction.nominal
                ) || 0;


            if (
                transaction.jenis ===
                'pemasukan'
            ) {

                pemasukanBulan[idx] +=
                    nominal;

            } else {

                pengeluaranBulan[idx] +=
                    nominal;

            }

        }
    );


    const maxVal =
        Math.max(
            1,
            ...pemasukanBulan,
            ...pengeluaranBulan
        );


    dom.laporanBulanan.innerHTML =
        '';


    for (
        let i = 0;
        i < 12;
        i++
    ) {

        const pemasukanHeight =
            (
                pemasukanBulan[i] /
                maxVal
            ) * 160;


        const pengeluaranHeight =
            (
                pengeluaranBulan[i] /
                maxVal
            ) * 160;


        const div =
            document.createElement(
                'div'
            );


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
                    style="
                        width:30%;
                        background:#00d4aa;
                        border-radius:
                            4px 4px 0 0;
                        height:
                            ${pemasukanHeight}px;
                        min-height:2px;
                        transition:0.3s;
                    "
                ></div>


                <div
                    style="
                        width:30%;
                        background:#ff6b6b;
                        border-radius:
                            4px 4px 0 0;
                        height:
                            ${pengeluaranHeight}px;
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


        dom.laporanBulanan.appendChild(
            div
        );

    }


    const totalPem =
        pemasukanBulan.reduce(
            (a, b) =>
                a + b,
            0
        );


    const totalPeng =
        pengeluaranBulan.reduce(
            (a, b) =>
                a + b,
            0
        );


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
                        rgba(
                            0,
                            212,
                            170,
                            0.06
                        );
                    padding:12px;
                    border-radius:16px;
                "
            >

                <div
                    style="
                        color:
                            var(--text-secondary);
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

                    Rp ${formatRupiah(
                        totalPem
                    )}

                </div>

            </div>


            <div
                style="
                    background:
                        rgba(
                            255,
                            107,
                            107,
                            0.06
                        );
                    padding:12px;
                    border-radius:16px;
                "
            >

                <div
                    style="
                        color:
                            var(--text-secondary);
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

                    Rp ${formatRupiah(
                        totalPeng
                    )}

                </div>

            </div>

        </div>


        <div
            style="
                margin-top:12px;
                padding:12px;
                background:
                    rgba(
                        255,
                        255,
                        255,
                        0.02
                    );
                border-radius:16px;
            "
        >

            <div
                style="
                    display:flex;
                    justify-content:
                        space-between;
                    color:
                        var(--text-secondary);
                    font-size:13px;
                "
            >

                <span>
                    Selisih
                </span>


                <span
                    style="
                        font-weight:600;
                        color:${
                            totalPem >=
                            totalPeng
                                ? 'var(--success)'
                                : 'var(--danger)'
                        };
                    "
                >

                    Rp ${formatRupiah(
                        totalPem -
                        totalPeng
                    )}

                </span>

            </div>


            <div
                style="
                    display:flex;
                    justify-content:
                        space-between;
                    color:
                        var(--text-secondary);
                    font-size:13px;
                    margin-top:4px;
                "
            >

                <span>
                    Transaksi
                </span>


                <span>
                    ${transactions.length}
                    transaksi
                </span>

            </div>

        </div>

    `;

}


// ================================================================
// NAVIGATION
// ================================================================

function navigateTo(page) {

    if (!page) return;


    currentPage =
        page;


    document
        .querySelectorAll(
            '.page-section'
        )
        .forEach(
            section => {

                section.style.display =
                    'none';

            }
        );


    const pageId =
        'page' +
        page
            .charAt(0)
            .toUpperCase() +
        page.slice(1);


    const targetPage =
        document.getElementById(
            pageId
        );


    if (targetPage) {

        targetPage.style.display =
            'block';

    }


    document
        .querySelectorAll(
            '.nav-icons a'
        )
        .forEach(
            link => {

                link.classList.remove(
                    'active'
                );

            }
        );


    const navLink =
        document.querySelector(
            `.nav-icons a[data-page="${page}"]`
        );


    if (navLink) {

        navLink.classList.add(
            'active'
        );

    }

}


function updatePage() {

    navigateTo(
        currentPage
    );

}


// ================================================================
// MODAL TRANSAKSI
// ================================================================

function openModal(
    editData = null
) {

    if (!dom.modal) {

        alert(
            'Modal transaksi belum tersedia di HTML.'
        );

        return;

    }


    dom.modal.style.display =
        'flex';


    if (editData) {

        if (dom.modalTitle) {

            dom.modalTitle.textContent =
                'Edit Transaksi';

        }


        if (dom.fKeterangan) {

            dom.fKeterangan.value =
                editData.keterangan;

        }


        if (dom.fNominal) {

            dom.fNominal.value =
                editData.nominal;

        }


        if (dom.fKategori) {

            dom.fKategori.value =
                editData.kategori;

        }


        if (dom.fTanggal) {

            dom.fTanggal.value =
                editData.tanggal;

        }


        const radio =
            document.querySelector(
                `input[name="jenis"][value="${editData.jenis}"]`
            );


        if (radio) {

            radio.checked =
                true;

        }


        editingId =
            String(
                editData.id
            );

    } else {

        if (dom.modalTitle) {

            dom.modalTitle.textContent =
                'Tambah Transaksi';

        }


        if (dom.fKeterangan) {

            dom.fKeterangan.value =
                '';

        }


        if (dom.fNominal) {

            dom.fNominal.value =
                '';

        }


        if (dom.fKategori) {

            dom.fKategori.value =
                'Makanan';

        }


        if (dom.fTanggal) {

            dom.fTanggal.value =
                getLocalDateString();

        }


        const radio =
            document.querySelector(
                'input[name="jenis"][value="pemasukan"]'
            );


        if (radio) {

            radio.checked =
                true;

        }


        editingId =
            null;

    }

}


// ================================================================
// CLOSE MODAL TRANSAKSI
// ================================================================

function closeModal() {

    if (dom.modal) {

        dom.modal.style.display =
            'none';

    }


    editingId =
        null;

}


// ================================================================
// SUBMIT TRANSAKSI
// ================================================================

function handleFormSubmit(e) {

    e.preventDefault();


    const radio =
        document.querySelector(
            'input[name="jenis"]:checked'
        );


    if (!radio) {

        alert(
            'Pilih jenis transaksi terlebih dahulu.'
        );

        return;

    }


    const jenis =
        radio.value;


    const keterangan =
        dom.fKeterangan?.value
            ?.trim() || '';


    const nominal =
        parseFloat(
            dom.fNominal?.value
        );


    const kategori =
        dom.fKategori?.value ||
        'Lainnya';


    const tanggal =
        dom.fTanggal?.value;


    if (!keterangan) {

        alert(
            'Masukkan keterangan.'
        );

        return;

    }


    if (
        !Number.isFinite(nominal) ||
        nominal <= 0
    ) {

        alert(
            'Masukkan nominal yang valid.'
        );

        return;

    }


    if (!tanggal) {

        alert(
            'Pilih tanggal.'
        );

        return;

    }


    // ------------------------------------------------------------
    // EDIT
    // ------------------------------------------------------------

    if (
        editingId !== null
    ) {

        const index =
            transactions.findIndex(
                t =>
                    String(
                        t.id
                    ) ===
                    String(
                        editingId
                    )
            );


        if (index === -1) {

            alert(
                'Data transaksi tidak ditemukan.'
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

    }


    // ------------------------------------------------------------
    // TAMBAH
    // ------------------------------------------------------------

    else {

        transactions.push({

            id:
                createId(
                    'transaction'
                ),

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
// BIND EVENTS
// ================================================================

function bindEvents() {


    // ============================================================
    // NAVIGATION
    // ============================================================

    $$('.nav-icons a')
        .forEach(
            link => {

                on(
                    link,
                    'click',
                    function(e) {

                        e.preventDefault();


                        const page =
                            this.dataset.page;


                        if (page) {

                            navigateTo(
                                page
                            );

                        }

                    }
                );

            }
        );


    // ============================================================
    // TAMBAH TRANSAKSI
    // ============================================================

    on(
        dom.btnTambah,
        'click',
        () => {

            openModal();

        }
    );


    on(
        dom.btnTambahPage,
        'click',
        () => {

            openModal();

        }
    );


    // ============================================================
    // MODAL TRANSAKSI
    // ============================================================

    on(
        dom.modalClose,
        'click',
        closeModal
    );


    on(
        dom.modalCancel,
        'click',
        closeModal
    );


    on(
        dom.modal,
        'click',
        function(e) {

            if (
                e.target ===
                this
            ) {

                closeModal();

            }

        }
    );


    // ============================================================
    // FORM TRANSAKSI
    // ============================================================

    on(
        dom.form,
        'submit',
        handleFormSubmit
    );


    // ============================================================
    // FILTER KATEGORI
    // ============================================================

    on(
        dom.filterKategori,
        'change',
        () => {

            renderHistory();

        }
    );


    // ============================================================
    // SIMPAN TARGET
    // ============================================================

    on(
        dom.btnSimpanTarget,
        'click',
        function(e) {

            e.preventDefault();


            const nama =
                dom.targetNamaInput
                    ?.value
                    ?.trim() ||
                'Tabungan Darurat';


            const nominal =
                parseFloat(
                    dom.targetNominalInput
                        ?.value
                );


            if (
                !Number.isFinite(
                    nominal
                ) ||
                nominal <= 0
            ) {

                alert(
                    'Masukkan nominal target yang valid.'
                );

                return;

            }


            target.nama =
                nama;


            target.nominal =
                nominal;


            if (
                !Array.isArray(
                    target.savings
                )
            ) {

                target.savings =
                    [];

            }


            saveData();

            renderAll();


            alert(
                '✅ Target berhasil disimpan!'
            );

        }
    );


    // ============================================================
    // EDIT TARGET
    // ============================================================

    on(
        dom.btnEditTarget,
        'click',
        function(e) {

            e.preventDefault();

            navigateTo(
                'target'
            );

        }
    );


    // ============================================================
    // TAMBAH TABUNGAN
    // ============================================================

    on(
        dom.btnTambahTabungan,
        'click',
        function(e) {

            e.preventDefault();

            openSavingModal();

        }
    );


    // ============================================================
    // MODAL TABUNGAN
    // ============================================================

    on(
        dom.modalTabunganClose,
        'click',
        closeSavingModal
    );


    on(
        dom.modalTabunganCancel,
        'click',
        closeSavingModal
    );


    on(
        dom.modalTabungan,
        'click',
        function(e) {

            if (
                e.target ===
                this
            ) {

                closeSavingModal();

            }

        }
    );


    // ============================================================
    // FORM TABUNGAN
    // ============================================================

    on(
        dom.formTabungan,
        'submit',
        handleSavingSubmit
    );


    // ============================================================
    // FILTER PERIODE
    // ============================================================

    on(
        dom.btnFilterPeriod,
        'click',
        function(e) {

            e.preventDefault();


            filterMode =
                filterMode === 'bulan'
                    ? 'tahun'
                    : 'bulan';


            updatePeriodDisplay();


            renderAll();

        }
    );


    // ============================================================
    // ESC KEY
    // ============================================================

    on(
        document,
        'keydown',
        function(e) {

            if (
                e.key !==
                'Escape'
            ) {

                return;

            }


            if (
                dom.modalTabungan &&
                dom.modalTabungan.style.display ===
                'flex'
            ) {

                closeSavingModal();

                return;

            }


            if (
                dom.modal &&
                dom.modal.style.display ===
                'flex'
            ) {

                closeModal();

            }

        }
    );

}


// ================================================================
// FORMAT RUPIAH
// ================================================================

function formatRupiah(angka) {

    return Number(
        angka || 0
    ).toLocaleString(
        'id-ID'
    );

}


// ================================================================
// CREATE ID
// ================================================================

function createId(
    prefix = 'id'
) {

    return (

        prefix +
        '-' +
        Date.now() +
        '-' +
        Math.random()
            .toString(36)
            .substring(2, 9)

    );

}


// ================================================================
// LOCAL DATE
// ================================================================

function getLocalDateString() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            '0'
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            '0'
        );


    return (
        `${year}-${month}-${day}`
    );

}


// ================================================================
// FORMAT TANGGAL
// ================================================================

function formatTanggal(
    dateStr
) {

    if (!dateStr) {

        return '-';

    }


    const d =
        new Date(
            dateStr +
            'T00:00:00'
        );


    if (
        Number.isNaN(
            d.getTime()
        )
    ) {

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


    return `

        ${d.getDate()}
        ${bulan[d.getMonth()]}
        ${d.getFullYear()}

    `;

}


// ================================================================
// ESCAPE HTML
// ================================================================

function escapeHtml(text) {

    const div =
        document.createElement(
            'div'
        );


    div.textContent =
        text == null
            ? ''
            : String(text);


    return div.innerHTML;

}


// ================================================================
// INIT
// ================================================================

function init() {

    console.log(
        'Keuangan Dashboard: initializing...'
    );


    loadData();


    // Set tanggal default

    if (dom.fTanggal) {

        dom.fTanggal.value =
            getLocalDateString();

    }


    if (
        dom.fTabunganTanggal
    ) {

        dom.fTabunganTanggal.value =
            getLocalDateString();

    }


    renderAll();

    bindEvents();


    console.log(
        'Keuangan Dashboard: ready.'
    );

}


// ================================================================
// START
// ================================================================

if (
    document.readyState ===
    'loading'
) {

    document.addEventListener(
        'DOMContentLoaded',
        init
    );

} else {

    init();

}
