# Langkah 1: Inisialisasi Project (Node.js + TypeScript)

**Tujuan:** Membuat kerangka dasar proyek Node.js menggunakan TypeScript.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi:

1. **Buka Terminal** dan pastikan Anda berada di root direktori proyek (`/home/rhmdee/projects/trackoo`).
2. **Inisialisasi `package.json`**:
   Jalankan perintah ini untuk membuat file `package.json` default:
   ```bash
   npm init -y
   ```
3. **Install Dependencies Utama**:
   Kita akan menggunakan `telegraf` sebagai framework bot Telegram, dan `dotenv` untuk membaca variabel environment.
   ```bash
   npm install telegraf dotenv
   ```
4. **Install Dependencies untuk Development (TypeScript)**:
   ```bash
   npm install -D typescript @types/node ts-node nodemon
   ```
5. **Inisialisasi Konfigurasi TypeScript**:
   Jalankan perintah ini untuk membuat file `tsconfig.json`:
   ```bash
   npx tsc --init
   ```
6. **Sesuaikan `tsconfig.json`** (Opsional, tapi disarankan):
   Pastikan di dalam file `tsconfig.json` baris berikut aktif:
   ```json
   "outDir": "./dist",
   "rootDir": "./src",
   ```
7. **Buat Struktur Folder**:
   Buat folder bernama `src` di root proyek. Di dalam folder `src`, buat file kosong bernama `index.ts`.
   ```bash
   mkdir src
   touch src/index.ts
   ```
8. **Tambahkan Script di `package.json`**:
   Buka `package.json`, lalu edit bagian `"scripts"` menjadi seperti ini:
   ```json
   "scripts": {
     "dev": "nodemon src/index.ts",
     "build": "tsc",
     "start": "node dist/index.js"
   }
   ```
9. **Tes Hasilnya**:
   Buka `src/index.ts` dan ketik:
   ```typescript
   console.log("Trackoo Bot siap dijalankan!");
   ```
   Lalu di terminal jalankan:
   ```bash
   npm run dev
   ```
   Jika muncul tulisan "Trackoo Bot siap dijalankan!", maka tahap ini selesai.
