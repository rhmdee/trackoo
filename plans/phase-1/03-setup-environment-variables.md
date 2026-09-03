# Langkah 3: Setup Environment Variables

**Tujuan:** Menyimpan kredensial rahasia (seperti Token Telegram dan Password Database) di tempat yang aman (file `.env`) agar tidak bocor.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Buat File `.env`**:
   Di root proyek (`/home/rhmdee/projects/trackoo`), buat sebuah file baru bernama `.env`.
   ```bash
   touch .env
   ```
2. **Isi File `.env`**:
   Buka file `.env` tersebut dan isi dengan format berikut:
   ```env
   # Token Telegram yang didapatkan dari BotFather pada Langkah 2
   BOT_TOKEN="masukkan_token_telegram_anda_disini"
   
   # URL koneksi database PostgreSQL (Akan kita gunakan di Langkah 4)
   DATABASE_URL="postgresql://user:password@localhost:5432/trackoo"
   ```
3. **Tambahkan `.gitignore`**:
   Agar file `.env` tidak ikut ter-upload ke Git (GitHub/GitLab), buat file `.gitignore` di root proyek.
   ```bash
   touch .gitignore
   ```
4. **Isi `.gitignore`**:
   Tambahkan baris berikut ke dalam file `.gitignore`:
   ```text
   node_modules
   dist
   .env
   ```
5. **Load Environment di Kode**:
   Buka kembali `src/index.ts`. Hapus kode sebelumnya dan tambahkan kode ini untuk memastikan `dotenv` bekerja:
   ```typescript
   import * as dotenv from "dotenv";
   dotenv.config();

   console.log("BOT_TOKEN:", process.env.BOT_TOKEN ? "Token ditemukan!" : "Token KOSONG!");
   ```
6. **Jalankan Tes**:
   Buka terminal, jalankan:
   ```bash
   npm run dev
   ```
   Pastikan outputnya adalah "Token ditemukan!".
