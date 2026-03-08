# 🤖 Si-Choli WhatsApp Bot

Si-Choli adalah bot WhatsApp yang lengkap, canggih, dan kaya fitur yang dirancang oleh Mahasiswa IT Universitas Putera Batam (UPB), **Rijalul Fikri (RF Digital)**.

Bot ini dibuat menggunakan library [Baileys](https://github.com/WhiskeySockets/Baileys).

## ✨ Fitur Unggulan
*   🕌 **Sistem Notifikasi Sholat & Buka Puasa**: Pengingat otomatis untuk wilayah Batam setiap masuk waktu ibadah.
*   ☕ **Penyegar Anak IT (Auto-Quote)**: Broadcast jokes/quotes setiap 2 jam.
*   📋 **Absensi Grup**: Member grup dapat melakukan daftar hadir (`#absen` / `#resetabsen`).
*   🎮 **Bermain & Hiburan**: Truth/Dare, Cek Jodoh, Roulette Group, Halu-Meter, Zodiak.
*   💌 **Menfess Anonim**: Pesan rahasia ke nomor target.
*   🤖 **Integrasi AI Chat & Gambar**: Integrasi Pollinations AI untuk Text dan Generator Gambar.
*   🛡️ **Sistem Anti-Link**: Peringatan otomatis untuk link URL.
*   🌦️ **Info Cuaca Real-Time**: Cek cuaca akurat per-kota.
*   🎫 **Sticker Maker**: Konversi Image/Video ke Stiker WhatsApp secara instan (Syarat: FFMPEG harus diinstal).

## 🚀 Instalasi & Menjalankan Lokal (PC/Laptop)
1.  **Clone repositori ini:**
    ```bash
    git clone https://github.com/UsernameAnda/si-choli-bot.git
    cd si-choli-bot
    ```
2.  **Instal dependensi:**
    ```bash
    npm install
    ```
3.  **Setup Environment:**
    Buat file `.env` di folder utama:
    ```env
    BOT_NAME="Si-Choli"
    OWNER_NUMBER="628xxxxxxxxxx"
    PREFIX="#"
    PORT=3000
    ```
4.  **Jalankan Bot:**
    ```bash
    node index.js
    ```
    *Selanjutnya, scan QR Code yang muncul di terminal menggunakan aplikasi WhatsApp Anda.*

## ☁️ Deployment ke Railway (24 Jam Non-stop)
Projek ini sudah dilengkapi dengan sistem **Health Check (Express)** dan pengaturan otomatis **Nixpacks** sehingga sangat mudah di-deploy ke Railway.
1. Upload folder kode ini ke GitHub Anda.
2. Buat layanan baru di [Railway.app](https://railway.app/).
3. Pilih "Deploy from GitHub repo" dan pilih repositori Anda.
4. Di panel Railway, masuk ke tab **Variables** dan tambahkan `PORT` dengan nilai `3000`.
5. Railway akan mendeteksi `nixpacks.toml` milik Anda, menginstal Node.js + FFMPEG, dan bot Anda akan langsung beroperasi.

---
*Dibuat dengan ❤️ oleh RF Digital*
