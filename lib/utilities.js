const moment = require('moment-timezone');
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
                return `Nih jadwal sholat buat wilayah Batam & sekitarnya hari ini:\n\n` +
                    `📅 ${jadwalToday.hari}, ${jadwalToday.tanggal_lengkap}\n` +
                    `⌚ Sekarang jam ${timeNow} WIB\n\n` +
                    `✨ Imsak: ${jadwalToday.imsak}\n` +
                    `🌅 Subuh: ${jadwalToday.subuh}\n` +
                    `☀️ Dzuhur: ${jadwalToday.dzuhur}\n` +
                    `🌤️ Ashar: ${jadwalToday.ashar}\n` +
                    `🌇 Maghrib: ${jadwalToday.maghrib}\n` +
                    `🌃 Isya: ${jadwalToday.isya}\n\n` +
                    `Jangan lupa ibadah ya!`;
            }
        }
        return `Sekarang jam ${timeNow} WIB tanggal ${now.format('DD/MM/YYYY')}. Maaf ya, jadwal sholatnya gagal aku ambil.`;
    } catch (error) {
        return `Sekarang jam ${moment().tz('Asia/Jakarta').format('HH:mm:ss')} WIB. Lagi ada gangguan nih pas mau ambil jadwal sholat.`;
    }
}

function getNaturalTime() {
    const now = moment().tz('Asia/Jakarta');
    const time = now.format('HH:mm');
    const dayName = now.format('dddd');
    const dateStr = now.format('DD MMMM YYYY');
    const hour = now.hour();

    let greeting = "Halo";
    if (hour >= 4 && hour < 11) greeting = "Selamat pagi";
    else if (hour >= 11 && hour < 15) greeting = "Selamat siang";
    else if (hour >= 15 && hour < 18) greeting = "Selamat sore";
    else greeting = "Selamat malem";

    const variations = [
        `${greeting}! Sekarang jam ${time}. Hari ini ${dayName}, ${dateStr}.`,
        `Jam ${time} nih. Oh ya, sekarang hari ${dayName} ya.`,
        `Pukul ${time} WIB. Hari ${dayName} ini mah!`,
        `Dah jam ${time} aja di hari ${dayName} ini.`,
        `Sekarang jam ${time}, ${dayName} ${dateStr}. Semangat ya!`
    ];
    
    const randomRes = variations[Math.floor(Math.random() * variations.length)];
    return randomRes;
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
