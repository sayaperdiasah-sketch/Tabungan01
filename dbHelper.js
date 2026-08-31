// ================================================================
//  dbHelper.js - Database Helper untuk SQLite
//  Semua operasi CRUD ada di sini, tanpa perlu software tambahan
// ================================================================

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Koneksi database (singleton)
let db = null;

function getDB() {
    if (!db) {
        db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
            if (err) {
                console.error('❌ Gagal koneksi ke database:', err.message);
            } else {
                console.log('✅ Database terhubung');
                initTables();
            }
        });
    }
    return db;
}

// ================================================================
//  INISIALISASI TABEL
// ================================================================
function initTables() {
    const db = getDB();
    
    // Tabel transaksi
    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            jenis TEXT NOT NULL,
            keterangan TEXT NOT NULL,
            nominal REAL NOT NULL,
            kategori TEXT NOT NULL,
            tanggal TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) console.error('Error create transactions:', err);
        else console.log('📋 Tabel transactions siap');
    });

    // Tabel settings (target, dll)
    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `, (err) => {
        if (err) console.error('Error create settings:', err);
        else {
            console.log('📋 Tabel settings siap');
            // Default target jika belum ada
            db.get("SELECT value FROM settings WHERE key = 'target'", (err, row) => {
                if (!row) {
                    const defaultTarget = JSON.stringify({ nama: 'Tabungan Darurat', nominal: 10000000 });
                    db.run("INSERT INTO settings (key, value) VALUES (?, ?)", ['target', defaultTarget]);
                    console.log('🎯 Target default dibuat');
                }
            });
        }
    });
}

// ================================================================
//  FUNGSI CRUD TRANSAKSI
// ================================================================

// --- GET semua transaksi ---
function getAllTransactions() {
    return new Promise((resolve, reject) => {
        const db = getDB();
        db.all("SELECT * FROM transactions ORDER BY tanggal DESC, id DESC", (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
}

// --- GET transaksi berdasarkan ID ---
function getTransactionById(id) {
    return new Promise((resolve, reject) => {
        const db = getDB();
        db.get("SELECT * FROM transactions WHERE id = ?", [id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

// --- TAMBAH transaksi ---
function addTransaction(data) {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const { jenis, keterangan, nominal, kategori, tanggal } = data;
        const sql = `INSERT INTO transactions (jenis, keterangan, nominal, kategori, tanggal) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [jenis, keterangan, nominal, kategori, tanggal], function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, message: 'Transaksi berhasil ditambahkan' });
        });
    });
}

// --- UPDATE transaksi ---
function updateTransaction(id, data) {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const { jenis, keterangan, nominal, kategori, tanggal } = data;
        const sql = `UPDATE transactions SET jenis=?, keterangan=?, nominal=?, kategori=?, tanggal=? WHERE id=?`;
        db.run(sql, [jenis, keterangan, nominal, kategori, tanggal, id], function(err) {
            if (err) reject(err);
            else if (this.changes === 0) reject(new Error('Transaksi tidak ditemukan'));
            else resolve({ message: 'Transaksi berhasil diupdate' });
        });
    });
}

// --- HAPUS transaksi ---
function deleteTransaction(id) {
    return new Promise((resolve, reject) => {
        const db = getDB();
        db.run("DELETE FROM transactions WHERE id = ?", [id], function(err) {
            if (err) reject(err);
            else if (this.changes === 0) reject(new Error('Transaksi tidak ditemukan'));
            else resolve({ message: 'Transaksi berhasil dihapus' });
        });
    });
}

// --- HAPUS SEMUA transaksi (opsional) ---
function deleteAllTransactions() {
    return new Promise((resolve, reject) => {
        const db = getDB();
        db.run("DELETE FROM transactions", function(err) {
            if (err) reject(err);
            else resolve({ message: 'Semua transaksi dihapus' });
        });
    });
}

// ================================================================
//  FUNGSI TARGET (settings)
// ================================================================

// --- GET target ---
function getTarget() {
    return new Promise((resolve, reject) => {
        const db = getDB();
        db.get("SELECT value FROM settings WHERE key = 'target'", (err, row) => {
            if (err) reject(err);
            else {
                if (row) {
                    try {
                        resolve(JSON.parse(row.value));
                    } catch {
                        resolve({ nama: 'Tabungan Darurat', nominal: 10000000 });
                    }
                } else {
                    resolve({ nama: 'Tabungan Darurat', nominal: 10000000 });
                }
            }
        });
    });
}

// --- SAVE target ---
function saveTarget(data) {
    return new Promise((resolve, reject) => {
        const db = getDB();
        const { nama, nominal } = data;
        if (!nama || !nominal) {
            reject(new Error('Nama dan nominal wajib diisi'));
            return;
        }
        const value = JSON.stringify({ nama, nominal });
        db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, ['target', value], function(err) {
            if (err) reject(err);
            else resolve({ message: 'Target berhasil disimpan' });
        });
    });
}

// ================================================================
//  FUNGSI UTILITY (untuk debugging / backup)
// ================================================================

// --- Lihat semua data (debug) ---
async function debugView() {
    try {
        const transactions = await getAllTransactions();
        const target = await getTarget();
        console.log('\n📊 === DATA TERKINI ===');
        console.log('📌 Target:', target);
        console.log(`📌 Total transaksi: ${transactions.length}`);
        console.log('📌 5 transaksi terakhir:');
        transactions.slice(0, 5).forEach(t => {
            console.log(`   - ${t.tanggal} | ${t.keterangan} | Rp${t.nominal} (${t.jenis})`);
        });
        console.log('========================\n');
    } catch (e) {
        console.error('Error debug:', e);
    }
}

// --- Backup database ke file JSON ---
async function backupToJSON(filename = 'backup.json') {
    try {
        const transactions = await getAllTransactions();
        const target = await getTarget();
        const data = { transactions, target, backupDate: new Date().toISOString() };
        const fs = require('fs');
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        console.log(`✅ Backup berhasil ke ${filename}`);
        return data;
    } catch (e) {
        console.error('❌ Gagal backup:', e);
        throw e;
    }
}

// --- Restore dari JSON ---
async function restoreFromJSON(filename = 'backup.json') {
    try {
        const fs = require('fs');
        const raw = fs.readFileSync(filename, 'utf8');
        const data = JSON.parse(raw);
        const db = getDB();
        
        // Hapus semua data lama
        await deleteAllTransactions();
        
        // Insert data dari backup
        for (const t of data.transactions) {
            const sql = `INSERT INTO transactions (jenis, keterangan, nominal, kategori, tanggal) VALUES (?, ?, ?, ?, ?)`;
            await new Promise((resolve, reject) => {
                db.run(sql, [t.jenis, t.keterangan, t.nominal, t.kategori, t.tanggal], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
        
        // Restore target
        if (data.target) {
            await saveTarget(data.target);
        }
        
        console.log(`✅ Restore berhasil dari ${filename}`);
        return data;
    } catch (e) {
        console.error('❌ Gagal restore:', e);
        throw e;
    }
}

// ================================================================
//  EXPORT
// ================================================================
module.exports = {
    // CRUD
    getAllTransactions,
    getTransactionById,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteAllTransactions,
    
    // Target
    getTarget,
    saveTarget,
    
    // Utility
    debugView,
    backupToJSON,
    restoreFromJSON,
    
    // Database
    getDB,
    initTables
};
