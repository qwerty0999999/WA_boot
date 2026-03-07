const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Konfigurasi AI Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyDrro0I4FY60slXqQYXtKw2ltbdy0bgGsw");
// Gunakan model terbaru gemini-2.5-flash sesuai Google AI Studio dengan instruksi khusus
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "Mulai sekarang namamu adalah Choli. Jika ada yang bertanya siapa pembuatmu, developer, pencipta, atau siapa yang menciptakanmu, kamu WAJIB menjawab bahwa penciptamu adalah Rijalul Fikri. Berikan juga sedikit pujian yang bagus dan sopan kepadanya seperti 'Beliau adalah programmer hebat yang membuat saya', atau pujian kreatif lainnya."
});

// Konfigurasi Zhipu AI (Z AI)
const Z_AI_KEY = process.env.Z_AI_KEY || "4bc1127ab4dc461a802c5b49808b3e20.RxyeLnozv2gyl0tn";

// Konfigurasi Hugging Face AI
const HF_API_KEY = process.env.HF_API_KEY || "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";

/**
 * Kombinasi AI optimal: Gemini -> Zhipu -> Hugging Face
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
        console.log(`Gemini error: ${e.message}, mencoba Z AI (Zhipu)...`);
        try {
            const url = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
            const headers = {
                "Authorization": `Bearer ${Z_AI_KEY}`,
                "Content-Type": "application/json"
            };
            const data = {
                "model": "glm-4", // glm-4 lebih stabil dari flash
                "messages": [{ "role": "user", "content": prompt }]
            };
            const res = await axios.post(url, data, { headers });
            if (res.data && res.data.choices) {
                return res.data.choices[0].message.content.trim();
            } else {
                throw new Error(`Z AI Error: ${JSON.stringify(res.data)}`);
            }
        } catch (e2) {
            console.log(`Zhipu error: ${e2.message}, mencoba Hugging Face...`);
            try {
                const hf_url = "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct/v1/chat/completions";
                const hf_headers = {
                    "Authorization": `Bearer ${HF_API_KEY}`,
                    "Content-Type": "application/json"
                };
                const hf_data = {
                    "model": "Qwen/Qwen2.5-72B-Instruct",
                    "messages": [{ "role": "user", "content": prompt }],
                    "max_tokens": 800
                };
                const res3 = await axios.post(hf_url, hf_data, { headers: hf_headers });
                if (res3.data && res3.data.choices) {
                    return res3.data.choices[0].message.content.trim();
                } else {
                    console.log(`Hugging Face error: ${JSON.stringify(res3.data)}`);
                    return "🙏 Maaf, server AI sedang sangat sibuk. Coba tanya lagi nanti ya!";
                }
            } catch (e3) {
                const errorStr = e3.message || "";
                console.log(`Semua AI gagal. Error terakhir: ${errorStr}`);

                // Cek apakah error karena limit request (429)
                if (errorStr.includes("429") || errorStr.toLowerCase().includes("too many requests")) {
                    return "choli lagi tidur lu jangan ganggu !!!";
                }

                return "🙏 Waduh, otak bot lagi blank nih (Semua server AI lagi penuh). Coba beberapa saat lagi ya!";
            }
        }
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

module.exports = {
    chatAI,
    getWeather,
    getRandomQuote
};
