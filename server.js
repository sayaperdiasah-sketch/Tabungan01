const express = require('express');
const path = require('path');
const cors = require('cors');
const dbHelper = require('./dbHelper');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
//  API ROUTES
// ============================================================

// --- GET semua transaksi ---
app.get('/api/transactions', async (req, res) => {
    try {
        const rows = await dbHelper.getAllTransactions();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- POST tambah transaksi ---
app.post('/api/transactions', async (req, res) => {
    try {
        const { jenis, keterangan, nominal, kategori, tanggal } = req.body;
        if (!jenis || !keterangan || !nominal || !kategori || !tanggal) {
            return res.status(400).json({ error: 'Semua field wajib diisi' });
        }
        const result = await dbHelper.addTransaction({ jenis, keterangan, nominal, kategori, tanggal });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PUT edit transaksi ---
app.put('/api/transactions/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { jenis, keterangan, nominal, kategori, tanggal } = req.body;
        const result = await dbHelper.updateTransaction(id, { jenis, keterangan, nominal, kategori, tanggal });
        res.json(result);
    } catch (err) {
        res.status(err.message === 'Transaksi tidak ditemukan' ? 404 : 500)
           .json({ error: err.message });
    }
});

// --- DELETE hapus transaksi ---
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const result = await dbHelper.deleteTransaction(id);
        res.json(result);
    } catch (err) {
        res.status(err.message === 'Transaksi tidak ditemukan' ? 404 : 500)
           .json({ error: err.message });
    }
});

// --- GET target ---
app.get('/api/target', async (req, res) => {
    try {
        const target = await dbHelper.getTarget();
        res.json(target);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- POST target ---
app.post('/api/target', async (req, res) => {
    try {
        const { nama, nominal } = req.body;
        const result = await dbHelper.saveTarget({ nama, nominal });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- DEBUG: backup database ke JSON ---
app.get('/api/backup', async (req, res) => {
    try {
        const data = await dbHelper.backupToJSON('backup_' + Date.now() + '.json');
        res.json({ message: 'Backup berhasil', file: 'backup_' + Date.now() + '.json' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Root ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================================
//  JALANKAN SERVER
// ============================================================
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📂 Database: ${path.join(__dirname, 'database.db')}`);
    
    // Tampilkan debug data saat startup (opsional)
    setTimeout(() => {
        dbHelper.debugView();
    }, 1000);
});
