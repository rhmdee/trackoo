# Langkah 1: Skema Database untuk Cicilan (Installments)

**Tujuan:** Membuat tabel baru di database PostgreSQL untuk melacak data cicilan (installment) terpisah dari transaksi biasa.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Buka file `src/db/migrate.ts`**.
2. **Tambahkan Query Pembuatan Tabel `installments`**:
   Di dalam blok `try {`, setelah pembuatan tabel `transactions`, tambahkan query berikut:
   ```typescript
   // Membuat tabel installments
   const createInstallmentsTable = \`
     CREATE TABLE IF NOT EXISTS installments (
       id SERIAL PRIMARY KEY,
       user_id VARCHAR(50) REFERENCES users(telegram_id) ON DELETE CASCADE,
       counterparty VARCHAR(100) NOT NULL,
       description VARCHAR(255) NOT NULL,
       total_amount DECIMAL(15, 2) NOT NULL,
       monthly_amount DECIMAL(15, 2) NOT NULL,
       tenor INT NOT NULL,
       paid_count INT DEFAULT 0,
       due_date INT, -- Tanggal jatuh tempo tiap bulan (1-31)
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       status VARCHAR(20) DEFAULT 'ACTIVE' -- ACTIVE atau COMPLETED
     );
   \`;
   await query(createInstallmentsTable);
   console.log("✅ Tabel 'installments' berhasil dipastikan ada.");
   ```
3. **Validasi & Uji Coba**:
   - Jalankan perintah kompilasi: `npm run build`.
   - Jalankan migrasi: `node dist/db/migrate.js`.
   - Pastikan muncul pesan sukses bahwa tabel `installments` berhasil dipastikan ada, tanpa error dari PostgreSQL.
