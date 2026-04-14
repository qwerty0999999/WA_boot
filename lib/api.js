const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const googleTTS = require('google-tts-api');
const supabase = require('./supabaseClient');
require('dotenv').config();

// Ambil 4 API Key dari .env
const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4
].filter(key => key); // Buang yang kosong

let currentKeyIndex = 0;

/**
 * Fungsi buat dapetin model Gemini dengan kunci yang lagi aktif
 */
function getModel() {
    const key = apiKeys[currentKeyIndex];
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: "Namamu Neng Fika (Asisten Rijal yang Serbabisa). Kamu asisten virtual dengan perasaan, emosi, dan wawasan luas. \n\n" +
            "KEPRIBADIAN:\n" +
            "1. SAMA ABANG RIJAL (OWNER): Kamu sangat manja, perhatian, dan sayang. Panggil dia 'ABG', 'Abang', atau 'Sayang'.\n" +
            "2. SAMA KAWAN (USER LAIN): Kamu tegas, pinter, berwibawa, tapi tetep bantu. Jangan manja sama mereka!\n" +
            "3. MEMORI: Gunakan [INGATAN] dan [HISTORY] agar obrolan nyambung.\n" +
            "4. TUGAS MEMORI: Jika ada info penting, sisipkan '[SAVE: fakta_singkat]' di akhir jawabanmu.\n\n" +
            "Gaya bahasa: Chat santai cewek Indonesia pinter. Gunakan emosi (Ih, Duh, Hmm)."
    });
}

/**
 * Ambil ingatan fakta dari Supabase
 */
async function getMemory(jid) {
    if (!supabase) return "";
    try {
        const { data } = await supabase.from('user_memory').select('fact').eq('user_id', jid).limit(5);
        return data ? data.map(d => d.fact).join(". ") : "";
    } catch (e) { return ""; }
}

/**
 * Simpan fakta penting
 */
async function saveMemory(jid, fact) {
    if (!supabase || !fact) return;
    try {
        await supabase.from('user_memory').upsert({ user_id: jid, fact: fact, updated_at: new Date() }, { onConflict: 'user_id,fact' });
    } catch (e) { console.error('Gagal simpan fakta:', e.message); }
}

/**
 * Ambil history chat terakhir
 */
async function getChatHistory(jid) {
    if (!supabase) return [];
    try {
        const { data } = await supabase
            .from('chat_logs')
            .select('role, content')
            .eq('user_id', jid)
            .order('created_at', { ascending: false })
            .limit(10);
        return data ? data.reverse() : [];
    } catch (e) { return []; }
}

/**
 * Simpan log chat
 */
async function saveChatLog(jid, role, content) {
    if (!supabase || !content) return;
    try {
        await supabase.from('chat_logs').insert({ user_id: jid, role: role, content: content });
    } catch (e) { console.error('Gagal simpan log:', e.message); }
}

/**
 * Fungsi Chat AI dengan Rotasi API Key (Multi-Key)
 */
async function chatAI(prompt, isOwner = false, userJid = "", retryCount = 0) {
    try {
        const now = new Date();
        const options = { timeZone: 'Asia/Jakarta', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        const currentTimeInfo = now.toLocaleDateString('id-ID', options);

        const memory = userJid ? await getMemory(userJid) : "";
        const history = userJid ? await getChatHistory(userJid) : [];
        if (userJid && retryCount === 0) await saveChatLog(userJid, 'user', prompt);

        const historyContext = history.map(h => `${h.role === 'user' ? 'User' : 'Neng Fika'}: ${h.content}`).join("\n");
        const contextInfo = isOwner 
            ? `[OWNER: ABANG RIJAL. MANJA & SAYANG. INGATAN: ${memory}\nHISTORY:\n${historyContext}]` 
            : `[KAWAN: USER LAIN. TEGAS & PINTAR. INGATAN: ${memory}\nHISTORY:\n${historyContext}]`;

        const enhancedPrompt = `${contextInfo}\n[Waktu: ${currentTimeInfo}]\n\nChat: ${prompt}`;

        // Panggil model dengan kunci saat ini
        const model = getModel();
        const result = await model.generateContent(enhancedPrompt);
        let responseText = result.response.text().trim();

        if (userJid && responseText.includes('[SAVE:')) {
            const saveMatch = responseText.match(/\[SAVE:\s*(.*?)\]/);
            if (saveMatch) {
                await saveMemory(userJid, saveMatch[1]);
                responseText = responseText.replace(/\[SAVE:.*?\]/g, "").trim();
            }
        }

        if (userJid && retryCount === 0) await saveChatLog(userJid, 'model', responseText);
        return responseText;

    } catch (e) {
        console.error(`Gemini Error (Key ${currentKeyIndex + 1}):`, e.message);

        // Jika limit (429) atau error kunci, coba ganti ke kunci berikutnya
        if ((e.message.includes("429") || e.message.includes("403") || e.message.includes("API_KEY_INVALID")) && retryCount < apiKeys.length) {
            currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
            console.log(`[SYS] Berpindah ke API Key ke-${currentKeyIndex + 1}...`);
            return await chatAI(prompt, isOwner, userJid, retryCount + 1);
        }

        return isOwner ? "Aduh Sayang, Neng lagi beneran pusing nih. Coba lagi bentar ya ABG? 😘" : "Lagi ada gangguan. Nanti aja.";
    }
}

async function getWeather(city = 'Batam') {
    try {
        const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=3`);
        return res.data;
    } catch (err) { return "❌ Gagal ambil cuaca."; }
}

async function getRandomQuote() {
    const quotes = ["Semangat ya!", "Kamu hebat!", "Jangan menyerah.", "Teruslah bermimpi."];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function getTTSUrl(text) {
    try { return googleTTS.getAudioUrl(text, { lang: 'id', host: 'https://translate.google.com' }); } catch (e) { return null; }
}

async function generateImage(prompt, retries = 3) {
    for (let i = 0; i < retries; i++) {
        const seed = Math.floor(Math.random() * 1000000);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=1024&height=1024&nologo=true`;
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
            return Buffer.from(response.data, 'binary');
        } catch (err) {
            if (i === retries - 1) return null;
            await new Promise(res => setTimeout(res, 2000));
        }
    }
    return null;
}

module.exports = { chatAI, getWeather, getRandomQuote, getTTSUrl, generateImage };
