const { chatAI } = require('./api');
const tebakSessions = {};

const fallbackQuestions = [
    { q: "Ibu kota dari negara Indonesia adalah?", a: "jakarta" },
    { q: "Apa nama hewan mamalia laut yang cerdas dan suka melompat?", a: "lumba-lumba" },
    { q: "Gunung tertinggi di dunia adalah Gunung...", a: "everest" },
    { q: "Berapa jumlah kaki pada laba-laba?", a: "delapan" },
    { q: "Apa nama bot WhatsApp ini?", a: "si-choli" }
];

async function startTebak(groupId) {
    if (tebakSessions[groupId]) return "Masih ada soal yang belum terjawab di grup ini!";

    let questionText = "";
    let answerText = "";

    try {
        const randomSeed = Math.random().toString(36).substring(7);
        const aiResponse = await chatAI(`Buatkan 1 soal tebak-tebakan lucu atau soal pengetahuan umum tingkat dasar dalam bahasa Indonesia. (Kode unik rand: ${randomSeed}). Format balasan wajib persis seperti ini: SOAL|JAWABAN . Jangan beri teks sapaan atau penjelasan apa pun.`);
        const parts = aiResponse.split('|');
        if (parts.length === 2) {
            questionText = parts[0].trim();
            answerText = parts[1].trim().toLowerCase();
        } else {
            throw new Error("AI format failed");
        }
    } catch (error) {
        // Fallback kalau AI ngaco
        const randomQ = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
        questionText = randomQ.q;
        answerText = randomQ.a;
    }

    tebakSessions[groupId] = {
        answer: answerText,
        timer: setTimeout(() => {
            delete tebakSessions[groupId];
        }, 60000) // 60 seconds timeout
    };

    return `*Game Tebak-tebakan AI 🎮*\n\nSoal: ${questionText}\n\nWaktu menjawab: 60 detik!\nBalas pesan ini atau ketik langsung jawabannya.`;
}

function checkTebak(groupId, answer) {
    if (!tebakSessions[groupId]) return false;

    if (answer.toLowerCase() === tebakSessions[groupId].answer) {
        clearTimeout(tebakSessions[groupId].timer);
        delete tebakSessions[groupId];
        return true;
    }
    return false;
}

module.exports = {
    startTebak,
    checkTebak
};
