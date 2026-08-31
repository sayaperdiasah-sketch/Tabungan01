const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
//  DATABASE SQLITE
// ============================================================
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('❌ Gagal koneksi ke database:', err.message);
    } else {
        console.log('✅ Terhubung ke SQLite database');
        initDatabase();
    }
});

function initDatabase() {
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
        if (err) console.error('Error create table transactions:', err);
        else console.log('📋 Tabel transactions siap');
    });

    // Tabel settings (untuk target, dll)
    db.run(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    `, (err) => {
        if (err) console.error('Error create table settings:', err);
        else {
            console.log('📋 Tabel settings siap');
            // Insert default target jika belum ada
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

// ============================================================
//  API ROUTES
// ============================================================

// --- GET semua transaksi ---
app.get('/api/transactions', (req, res) => {
    db.all("SELECT * FROM transactions ORDER BY tanggal DESC, id DESC", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// --- POST tambah transaksi ---
app.post('/api/transactions', (req, res) => {
    const { jenis, keterangan, nominal, kategori, tanggal } = req.body;
    if (!jenis || !keterangan || !nominal || !kategori || !tanggal) {
        res.status(400).json({ error: 'Semua field wajib diisi' });
        return;
    }

    const sql = `INSERT INTO transactions (jenis, keterangan, nominal, kategori, tanggal) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [jenis, keterangan, nominal, kategori, tanggal], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ id: this.lastID, message: 'Transaksi berhasil ditambahkan' });
    });
});

// --- PUT edit transaksi ---
app.put('/api/transactions/:id', (req, res) => {
    const id = req.params.id;
    const { jenis, keterangan, nominal, kategori, tanggal } = req.body;

    const sql = `UPDATE transactions SET jenis=?, keterangan=?, nominal=?, kategori=?, tanggal=? WHERE id=?`;
    db.run(sql, [jenis, keterangan, nominal, kategori, tanggal, id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Transaksi tidak ditemukan' });
            return;
        }
        res.json({ message: 'Transaksi berhasil diupdate' });
    });
});

// --- DELETE hapus transaksi ---
app.delete('/api/transactions/:id', (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM transactions WHERE id = ?", id, function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Transaksi tidak ditemukan' });
            return;
        }
        res.json({ message: 'Transaksi berhasil dihapus' });
    });
});

// --- GET target ---
app.get('/api/target', (req, res) => {
    db.get("SELECT value FROM settings WHERE key = 'target'", (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (row) {
            try {
                res.json(JSON.parse(row.value));
            } catch {
                res.json({ nama: 'Tabungan Darurat', nominal: 10000000 });
            }
        } else {
            res.json({ nama: 'Tabungan Darurat', nominal: 10000000 });
        }
    });
});

// --- POST / PUT update target ---
app.post('/api/target', (req, res) => {
    const { nama, nominal } = req.body;
    if (!nama || !nominal) {
        res.status(400).json({ error: 'Nama dan nominal wajib diisi' });
        return;
    }
    const value = JSON.stringify({ nama, nominal });
    db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, ['target', value], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Target berhasil disimpan' });
    });
});

// --- Root route ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Jalankan server ---
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📂 Database: ${path.join(__dirname, 'database.db')}`);
});
