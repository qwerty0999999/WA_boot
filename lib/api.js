const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Konfigurasi AI Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyD0sUsJ03CwgLUL8q5Uu3rrKQOClPiggh8");
// Gunakan model gemini-pro yang lebih stabil di semua versi API
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Konfigurasi Zhipu AI (Z AI)
const Z_AI_KEY = process.env.Z_AI_KEY || "4bc1127ab4dc461a802c5b49808b3e20.RxyeLnozv2gyl0tn";

// Konfigurasi Hugging Face AI
const HF_API_KEY = process.env.HF_API_KEY || "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";

/**
 * Kombinasi AI optimal: Gemini -> Zhipu -> Hugging Face
 */
async function chatAI(prompt) {
    try {
        const result = await model.generateContent(prompt);
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
                console.log(`Semua AI gagal. Error terakhir: ${e3.message}`);
                return "🙏 Waduh, otak bot lagi blank nih (Semua server AI lagi penuh). Coba beberapa saat lagi ya!";
            }
        }
    }
}

async function generateImage(query) {
    try {
        const url = `https://pollinations.ai/p/${encodeURIComponent(query)}`;
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (err) {
        throw new Error("Gagal generate gambar dari Pollinations AI.");
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
    generateImage,
    getWeather,
    getRandomQuote
};
