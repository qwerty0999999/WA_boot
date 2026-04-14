const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const googleTTS = require('google-tts-api');
require('dotenv').config();

// Konfigurasi AI Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Gunakan model terbaru gemini-2.5-flash sesuai Google AI Studio dengan instruksi khusus
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "Mulai sekarang namamu adalah Choli. Jika ada yang bertanya siapa pembuatmu, developer, pencipta, atau siapa yang menciptakanmu, kamu WAJIB menjawab bahwa penciptamu adalah Rijalul Fikri. Berikan juga sedikit pujian yang bagus dan sopan kepadanya seperti 'Beliau adalah programmer hebat yang membuat saya', atau pujian kreatif lainnya."
});

/**
 * Kombinasi AI: Hanya menggunakan Gemini
 */
async function chatAI(prompt) {
    try {
        // Sisipkan tanggal dan waktu saat ini secara dinamis agar AI tahu waktu yang akurat
        const now = new Date();
        const options = { timeZone: 'Asia/Jakarta', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
        const currentTimeInfo = now.toLocaleDateString('id-ID', options);

        const enhancedPrompt = `[Info Waktu Saat Ini Server (WIB): ${currentTimeInfo}]\n\nPertanyaan User: ${prompt}`;

        const result = await model.generateContent(enhancedPrompt);
        return result.response.text().trim();
    } catch (e) {
        const errorStr = e.message || "";
        console.log(`Gemini gagal. Error terakhir: ${errorStr}`);

        // Cek apakah error karena limit request (429)
        if (errorStr.includes("429") || errorStr.toLowerCase().includes("too many requests")) {
            return "choli lagi tidur lu jangan ganggu !!!";
        }

        return "🙏 Waduh, otak Choli lagi blank nih (Semua manuk lagi penuh). Coba beberapa saat lagi ya!";
    }
}

async function getWeather(city = 'Batam') {
    try {
        const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=3`);
        return res.data;
    } catch (err) {
        return "❌ Gagal mengambil data cuaca saat ini.";
    }
}

async function getRandomQuote() {
    const quotes = [
        "Jadilah dirimu sendiri, karena tidak ada yang bisa melakukannya lebih baik dari dirimu.",
        "Kesuksesan berawal dari keberanian untuk memulai.",
        "Setiap hari adalah kesempatan baru untuk menjadi lebih baik.",
        "Jangan takut salah, dari situlah kita belajar.",
        "Tetaplah rendah hati walau sudah berada di atas.",
        "Usaha tidak akan pernah mengkhianati hasil.",
        "Senyummu adalah ibadah termudah yang bisa kamu lakukan.",
        "Teruslah melangkah, walau terkadang pelan, yang penting tidak berhenti.",
        "Percayalah pada proses, karena hasil instan tidak selalu bertahan lama.",
        "Jangan menyerah, karena pemenang adalah pemimpi yang tidak pernah menyerah."
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function getTTSUrl(text) {
    try {
        return googleTTS.getAudioUrl(text, {
            lang: 'id',
            slow: false,
            host: 'https://translate.google.com',
        });
    } catch (e) {
        console.error("TTS Error:", e);
        return null;
    }
}

async function generateImage(prompt, retries = 3) {
    for (let i = 0; i < retries; i++) {
        const seed = Math.floor(Math.random() * 1000000);
        // Added different model parameter optionally to help bypass busy nodes
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=1024&height=1024&nologo=true&enhance=true`;

        try {
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
            return Buffer.from(response.data, 'binary');
        } catch (err) {
            console.error(`Gambar Error (Percobaan ${i + 1}/${retries}):`, err.message);
            if (i === retries - 1) return null; // Jika sudah percobaan terakhir, tetap gagal

            // Tunggu 2 detik sebelum mencoba lagi
            await new Promise(res => setTimeout(res, 2000));
        }
    }
    return null;
}

module.exports = {
    chatAI,
    getWeather,
    getRandomQuote,
    getTTSUrl,
    generateImage
};
