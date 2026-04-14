const moment = require('moment-timezone');
require('moment/locale/id'); // Set ke Bahasa Indonesia
moment.locale('id'); 
const { chatAI } = require('./api');
const axios = require('axios');

async function getPrayerTimes() {
    try {
        const tz = 'Asia/Jakarta';
        const now = moment().tz(tz);
        const day = now.date();
        const month = now.month() + 1;
        const year = now.year();
        const timeNow = now.format('HH:mm:ss');

        const response = await axios.post('https://equran.id/api/v2/shalat', {
            provinsi: 'Kepulauan Riau',
            kabkota: 'Kota Batam',
            bulan: month,
            tahun: year
        }, { timeout: 10000 });

        if (response.data && response.data.code === 200) {
            const jadwalToday = response.data.data.jadwal.find(j => j.tanggal === day);
            if (jadwalToday) {
                return `Nih Sayang, jadwal sholat buat Batam hari ini ya:\n\n` +
                    `📅 ${jadwalToday.hari}, ${jadwalToday.tanggal_lengkap}\n` +
                    `⌚ Jam: ${timeNow} WIB\n\n` +
                    `✨ Imsak: ${jadwalToday.imsak}\n` +
                    `🌅 Subuh: ${jadwalToday.subuh}\n` +
                    `☀️ Dzuhur: ${jadwalToday.dzuhur}\n` +
                    `🌤️ Ashar: ${jadwalToday.ashar}\n` +
                    `🌇 Maghrib: ${jadwalToday.maghrib}\n` +
                    `🌃 Isya: ${jadwalToday.isya}\n\n` +
                    `Abang jangan telat sholatnya ya, Neng ingetin nih! 😘`;
            }
        }
        return `Sekarang jam ${timeNow} WIB, tanggal ${now.format('DD MMMM YYYY')}. Jadwal sholatnya lagi nggak bisa Neng ambil, maaf ya ABG...`;
    } catch (error) {
        return `Jam ${moment().tz('Asia/Jakarta').format('HH:mm')} WIB nih. Server jadwal sholatnya lagi ngambek kayaknya.`;
    }
}

function getNaturalTime(type = 'all') {
    const now = moment().tz('Asia/Jakarta');
    const time = now.format('HH:mm');
    const dayName = now.format('dddd');
    const dateStr = now.format('LL'); // Format: 15 April 2026
    const hour = now.hour();

    let greeting = "Halo";
    if (hour >= 4 && hour < 11) greeting = "Pagi";
    else if (hour >= 11 && hour < 15) greeting = "Siang";
    else if (hour >= 15 && hour < 18) greeting = "Sore";
    else greeting = "Malem";

    if (type === 'time') {
        const res = [
            `Sekarang jam ${time} WIB ya Abang sayang.`,
            `Dah jam ${time} nih, kenapa nanya jam? Kangen ya?`,
            `Jam ${time} tepat! Semangat ya ABG ganteng!`,
            `Baru jam ${time} kok, masih pagi banget ini.`
        ];
        return res[Math.floor(Math.random() * res.length)];
    }

    if (type === 'day') {
        return `Sekarang hari ${dayName} ya Sayang.`;
    }

    if (type === 'date') {
        return `Hari ini tanggal ${dateStr} ya ABG.`;
    }

    return `${greeting} Abang! Sekarang jam ${time}, hari ${dayName} tanggal ${dateStr}. Ada yang bisa Neng bantu lagi?`;
}

async function getItDictionary(word) {
    try {
        const aiResponse = await chatAI(`Jelaskan secara singkat dan santai apa itu: '${word}'.`);
        return aiResponse.trim();
    } catch (error) {
        return `Aduh, aku bingung mau jelasin apa itu "${word}". Maaf ya!`;
    }
}

function getRecipe(ingredient) {
    return `Bingung mau masak apa pake *${ingredient}*? Coba bikin ini aja:\n\n` +
        `*${ingredient} Sambal Bawang Simple*\n\n` +
        `Caranya gampang:\n` +
        `1. Cuci bersih dulu ${ingredient}-nya.\n` +
        `2. Goreng atau tumis sampai mateng.\n` +
        `3. Ulek cabe rawit, bawang merah, bawang putih, garem, sama dikit kaldu bubuk.\n` +
        `4. Campurin sambelnya ke ${ingredient}, terus siram dikit pake minyak panas.\n\n` +
        `Selesai! Selamat makan yaa! ✨`;
}

module.exports = {
    getPrayerTimes,
    getNaturalTime,
    getItDictionary,
    getRecipe
};
