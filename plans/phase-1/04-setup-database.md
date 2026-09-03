# Langkah 4: Setup Database PostgreSQL

**Tujuan:** Menyiapkan database PostgreSQL untuk menyimpan data user dan merancang tabel `users`.
**Target Implementator:** Junior Programmer / AI Model.

## Prasyarat:
Pastikan Anda memiliki koneksi PostgreSQL yang aktif. Jika tidak punya *local* database, Anda bisa mendaftar gratis di layanan cloud seperti **Supabase** atau **Neon.tech** lalu ambil `DATABASE_URL`-nya dan masukkan ke file `.env` (Langkah 3).

## Langkah-langkah Implementasi:

1. **Install Driver PostgreSQL**:
   Kita akan menggunakan `pg` (node-postgres) untuk koneksi yang sederhana.
   ```bash
   npm install pg
   npm install -D @types/pg
   ```
2. **Buat File Konfigurasi Database**:
   Di dalam folder `src`, buat folder `db`. Di dalamnya buat file `index.ts`.
   ```bash
   mkdir src/db
   touch src/db/index.ts
   ```
3. **Tulis Kode Koneksi di `src/db/index.ts`**:
   ```typescript
   import { Pool } from 'pg';
   import * as dotenv from 'dotenv';
   
   dotenv.config();

   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
   });

   export const query = (text: string, params?: any[]) => pool.query(text, params);
   ```
4. **Buat Fungsi Migrasi Sederhana (Tabel Users)**:
   Buat file `src/db/migrate.ts` dengan kode berikut:
   ```typescript
   import { query } from './index';

   async function createTables() {
     const createUsersTableQuery = `
       CREATE TABLE IF NOT EXISTS users (
         telegram_id VARCHAR(255) PRIMARY KEY,
         first_name VARCHAR(255),
         username VARCHAR(255),
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       );
     `;
     
     try {
       await query(createUsersTableQuery);
       console.log("✅ Tabel 'users' berhasil dibuat/sudah ada.");
     } catch (err) {
       console.error("❌ Gagal membuat tabel:", err);
     } finally {
       process.exit();
     }
   }

   createTables();
   ```
5. **Jalankan Migrasi**:
   Di terminal, jalankan perintah ini (menggunakan ts-node):
   ```bash
   npx ts-node src/db/migrate.ts
   ```
   Pastikan muncul pesan sukses: "✅ Tabel 'users' berhasil dibuat/sudah ada."
