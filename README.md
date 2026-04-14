# 🤖 Si-Choli WhatsApp Bot - High Performance & Reliable

Si-Choli adalah bot WhatsApp yang lengkap, canggih, dan kaya fitur yang dirancang oleh Mahasiswa IT Universitas Putera Batam (UPB), **Rijalul Fikri (RF Digital)**.

Bot ini telah diaudit dan ditingkatkan untuk stabilitas tinggi menggunakan library [Baileys](https://github.com/WhiskeySockets/Baileys).

## ✨ Fitur Unggulan & Pembaruan Sistem
*   🕌 **Sistem Notifikasi Sholat & Buka Puasa**: Pengingat otomatis untuk wilayah Batam setiap masuk waktu ibadah.
*   📋 **Absensi Grup dengan Persistensi**: Daftar hadir (`#absen` / `#resetabsen`) kini tersimpan aman di database Supabase (tidak hilang saat bot restart).
*   🛡️ **Keamanan Admin & Grup**: Perintah administratif (`#everyone`, `#hidetag`, `#resetabsen`) kini hanya dapat digunakan oleh Admin grup.
*   ⏱️ **Rate Limiting (Anti-Spam)**: Pembatasan penggunaan pada fitur anonim (`#confess`) untuk mencegah penyalahgunaan.
*   🤖 **Integrasi AI Canggih (Gemini & Pollinations)**: Chat AI yang santai (Gemini 2.5 Flash) dan Generator Gambar (Pollinations AI).
*   📦 **Stabilitas Koneksi**: Logika penyambungan ulang (reconnection) yang lebih cerdas dengan sistem delay/backoff.
*   📊 **Logging Profesional**: Menggunakan `pino` logger untuk pemantauan sistem yang lebih bersih dan informatif.
*   🚀 **Fitur Hiburan Lengkap**: Truth/Dare, Cek Jodoh, Roulette Group, Halu-Meter, Zodiak, Quotes, dan Sticker Maker (FFMPEG required).

## 🚀 Instalasi & Konfigurasi Lokal
1.  **Clone repositori ini:**
    ```bash
    git clone https://github.com/qwerty0999999/WA_boot.git
    cd WA_boot
    ```
2.  **Instal dependensi:**
    ```bash
    npm install
    ```
3.  **Setup Environment Variabel (`.env`):**
    Buat file `.env` di direktori utama dan isi dengan kredensial Anda:
    ```env
    # WhatsApp Configuration
    OWNER_NUMBER="628xxxxxxxxxx"
    PREFIX="#"
    PORT=3000

    # AI & External APIs
    GEMINI_API_KEY="AIzaSy..."

    # Database Persistence (Optional but Recommended)
    SUPABASE_URL="https://your-project.supabase.co"
    SUPABASE_KEY="your-anon-key"

    # System Logging
    LOG_LEVEL="info"
    ```
4.  **Jalankan Bot:**
    ```bash
    npm start
    ```
    *Selanjutnya, scan QR Code yang muncul di terminal menggunakan aplikasi WhatsApp Anda.*

## ☁️ Deployment ke Railway
Projek ini sudah dioptimalkan untuk **Railway.app**:
1. Hubungkan repositori GitHub Anda ke Railway.
2. Tambahkan variabel lingkungan yang diperlukan di panel Railway.
3. Railway akan mendeteksi `nixpacks.toml`, menginstal Node.js + FFMPEG secara otomatis.
4. Bot akan berjalan 24/7 dengan sistem Health Check terintegrasi.

---
*Developed with ❤️ by **Rijalul Fikri (RF Digital)** - Auditor: Gemini CLI Senior Engineer*
