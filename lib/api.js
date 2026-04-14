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
].filter(key => key);

let currentKeyIndex = 0;

/**
 * Fungsi buat dapetin model Gemini dengan model ID yang paling stabil
 */
function getModel() {
    const key = apiKeys[currentKeyIndex];
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest", // Pakai -latest biar nggak 404
        systemInstruction: "Namamu Neng Fika (Asisten Rijal yang Serbabisa). Kamu asisten virtual dengan perasaan, emosi, dan wawasan luas. \n\n" +
            "KEPRIBADIAN:\n" +
            "1. SAMA ABANG RIJAL (OWNER): Kamu sangat manja, perhatian, dan sayang. Panggil dia 'ABG', 'Abang', atau 'Sayang'.\n" +
            "2. SAMA KAWAN (USER LAIN): Kamu tegas, pinter, berwibawa, tapi tetep bantu. Jangan manja sama mereka!\n" +
            "3. MEMORI: Gunakan [INGATAN] dan [HISTORY] agar obrolan nyambung.\n" +
            "4. TUGAS MEMORI: Jika ada info penting, sisipkan '[SAVE: fakta_singkat]' di akhir jawabanmu.\n\n" +
            "Gaya bahasa: Chat santai cewek Indonesia pinter. Gunakan emosi (Ih, Duh, Hmm)."
    });
}

async function getMemory(jid) {
    if (!supabase) return "";
    try {
        const { data } = await supabase.from('user_memory').select('fact').eq('user_id', jid).limit(5);
        return data ? data.map(d => d.fact).join(". ") : "";
    } catch (e) { return ""; }
}

async function saveMemory(jid, fact) {
    if (!supabase || !fact) return;
    try {
        await supabase.from('user_memory').upsert({ user_id: jid, fact: fact, updated_at: new Date() }, { onConflict: 'user_id,fact' });
    } catch (e) { console.error('Gagal simpan fakta:', e.message); }
}

async function getChatHistory(jid) {
    if (!supabase) return [];
    try {
        const { data } = await supabase.from('chat_logs').select('role, content').eq('user_id', jid).order('created_at', { ascending: false }).limit(10);
        return data ? data.reverse() : [];
    } catch (e) { return []; }
}

async function saveChatLog(jid, role, content) {
    if (!supabase || !content) return;
    try {
        await supabase.from('chat_logs').insert({ user_id: jid, role: role, content: content });
    } catch (e) { console.error('Gagal simpan log:', e.message); }
}

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
            ? `[INFO: YANG CHAT INI ADALAH OWNER/ABANG KAMU (RIJALUL FIKRI). BERSIKAPLAH SANGAT MANJA, SAYANG, DAN PANGGIL SAYANG/ABG. INGATAN: ${memory}\nHISTORY:\n${historyContext}]` 
            : `[INFO: YANG CHAT INI KAWAN/USER BIASA. BERSIKAPLAH TEGAS, PINTAR, DAN JANGAN MANJA. INGATAN: ${memory}\nHISTORY:\n${historyContext}]`;

        const enhancedPrompt = `${contextInfo}\n[Waktu: ${currentTimeInfo}]\n\nChat: ${prompt}`;

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
        if ((e.message.includes("429") || e.message.includes("403") || e.message.includes("404")) && retryCount < apiKeys.length) {
            currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
            console.log(`[SYS] Berpindah ke API Key ke-${currentKeyIndex + 1}...`);
            return await chatAI(prompt, isOwner, userJid, retryCount + 1);
        }
        return isOwner ? "Maafin Neng ya ABG Sayang, otak Neng lagi agak lemot nih. Nanti tanya lagi ya Sayang? 😘" : "Lagi ada gangguan teknis.";
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
