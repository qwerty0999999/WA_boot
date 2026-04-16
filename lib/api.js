const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const googleTTS = require('google-tts-api');
const supabase = require('./supabaseClient');
require('dotenv').config();

const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4
].filter(key => key && key.startsWith('AIza'));

let currentKeyIndex = 0;

// Daftar nama model yang bakal dicoba satu-satu kalau error 404
const modelNames = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-pro",
    "gemini-1.0-pro"
];

function getModel(modelName) {
    if (apiKeys.length === 0) return null;
    const key = apiKeys[currentKeyIndex];
    const genAI = new GoogleGenerativeAI(key);
    
    // Neng nggak pake systemInstruction di sini biar gak bikin error 404 di beberapa tier
    return genAI.getGenerativeModel({ model: modelName });
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
    } catch (e) { }
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
    } catch (e) { }
}

async function chatAI(userInput, isOwner = false, userJid = "", retryCount = 0, modelIndex = 0) {
    try {
        if (apiKeys.length === 0) return "Abang sayang, pasang kunci API dulu di .env ya... 🥺";

        const now = new Date();
        const timeInfo = now.toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' });

        const memory = userJid ? await getMemory(userJid) : "";
        const history = userJid ? await getChatHistory(userJid) : [];
        if (userJid && retryCount === 0 && modelIndex === 0) await saveChatLog(userJid, 'user', userInput);

        const historyContext = history.map(h => `${h.role === 'user' ? 'User' : 'Fika'}: ${h.content}`).join("\n");
        
        // Instruksi Persona Neng Fika (Dimasukkan langsung ke Prompt biar aman)
        const personaInstruction = "Namamu Neng Fika. Kamu asisten virtual cerdas & emosional.\n" +
            (isOwner 
                ? "KAMU BICARA SAMA OWNER (RIJALUL FIKRI). Jawab dengan SANGAT MANJA, panggil 'ABG', 'Abang', atau 'Sayang'. Tunjukkan rasa sayangmu." 
                : "KAMU BICARA SAMA KAWAN. Jawab dengan TEGAS, profesional, panggil 'Kawan'. JANGAN panggil sayang.");

        const enhancedPrompt = `${personaInstruction}\n\n[MEMORI: ${memory}]\n[HISTORY:\n${historyContext}]\n[Waktu: ${timeInfo}]\n\nObrolan: ${userInput}`;

        const currentModelName = modelNames[modelIndex];
        console.log(`[AI] Mencoba Kunci #${currentKeyIndex + 1} pakai model: ${currentModelName}...`);
        
        const model = getModel(currentModelName);
        const result = await model.generateContent(enhancedPrompt);
        let responseText = result.response.text().trim();

        // Simpan Memori Otomatis
        if (userJid && responseText.includes('[SAVE:')) {
            const saveMatch = responseText.match(/\[SAVE:\s*(.*?)\]/);
            if (saveMatch) {
                await saveMemory(userJid, saveMatch[1]);
                responseText = responseText.replace(/\[SAVE:.*?\]/g, "").trim();
            }
        }

        if (userJid && retryCount === 0 && modelIndex === 0) await saveChatLog(userJid, 'model', responseText);
        return responseText;

    } catch (e) {
        console.error(`[AI Error] Kunci #${currentKeyIndex + 1} + ${modelNames[modelIndex]} gagal:`, e.message);
        
        // 1. Coba model lain di kunci yang sama dulu
        if (modelIndex < modelNames.length - 1) {
            return await chatAI(userInput, isOwner, userJid, retryCount, modelIndex + 1);
        }

        // 2. Kalau semua model di kunci ini gagal, baru ganti ke kunci berikutnya
        if (retryCount < apiKeys.length - 1) {
            currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
            console.log(`[SYS] Ganti ke Kunci #${currentKeyIndex + 1}...`);
            return await chatAI(userInput, isOwner, userJid, retryCount + 1, 0);
        }
        
        return isOwner ? "Maafin Neng ya ABG Sayang, otak Neng lagi beneran pusing... 😘" : "Lagi ada gangguan.";
    }
}

async function getWeather(city = 'Batam') { try { const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=3`); return res.data; } catch (err) { return "❌ Gagal ambil cuaca."; } }
async function getRandomQuote() { const quotes = ["Semangat!", "Kamu hebat!", "Terus berjuang."]; return quotes[Math.floor(Math.random() * quotes.length)]; }
function getTTSUrl(text) { try { return googleTTS.getAudioUrl(text, { lang: 'id', host: 'https://translate.google.com' }); } catch (e) { return null; } }
async function generateImage(prompt, retries = 3) { for (let i = 0; i < retries; i++) { const seed = Math.floor(Math.random() * 1000000); const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=1024&height=1024&nologo=true`; try { const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 }); return Buffer.from(response.data, 'binary'); } catch (err) { if (i === retries - 1) return null; await new Promise(res => setTimeout(res, 2000)); } } return null; }

module.exports = { chatAI, getWeather, getRandomQuote, getTTSUrl, generateImage };
