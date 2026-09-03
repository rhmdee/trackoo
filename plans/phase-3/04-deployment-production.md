# Langkah 4: Deployment ke Production

**Tujuan:** Menyebarkan bot ke layanan server gratis/murah (misal: Railway / Render) agar dapat berjalan 24/7 tanpa menggunakan laptop lokal Anda.
**Target Implementator:** Junior Programmer / AI Model.

## Langkah-langkah Implementasi (Contoh menggunakan Railway):

1. **Update `package.json`**:
   Pastikan Anda sudah memiliki script `start` dan menggunakan versi node.js yang benar.
   Di `package.json` ubah atau pastikan adanya bagian ini:
   ```json
   "scripts": {
     "build": "tsc",
     "start": "node dist/index.js",
     "dev": "nodemon src/index.ts"
   },
   ```

2. **Push Kode ke GitHub**:
   Pastikan seluruh kode dan perbaikan telah di-commit dan di-push ke GitHub di branch utama (`main`).
   ```bash
   git add .
   git commit -m "Siap deployment phase 3"
   git push origin main
   ```

3. **Deploy di Railway**:
   - Buat akun di [Railway.app](https://railway.app/).
   - Buat project baru: **New Project -> Deploy from GitHub repo**.
   - Pilih repo `trackoo`.
   
4. **Konfigurasi Environment Variables**:
   Masuk ke menu **Variables** di Railway dan masukkan:
   - `BOT_TOKEN`: Token dari BotFather
   - `DATABASE_URL`: URL dari Neon
   - `GEMINI_API_KEY`: API Key Google Gemini
   
5. **Jalankan Uji Coba Deployment**:
   Railway akan secara otomatis menjalankan `npm run build` dan `npm run start`. Tunggu hingga logs di Railway menampilkan `🚀 Trackoo Bot sedang berjalan...`.

6. **Selesai**:
   Coba *chat* bot Telegram Anda dari *smartphone* saat laptop Anda dimatikan. Jika bot membalas, artinya Deployment sukses!
