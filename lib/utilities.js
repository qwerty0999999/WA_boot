const moment = require('moment-timezone');
const { chatAI } = require('./api');

function getPrayerTimes() {
    // Statis mock for Batam
    const tz = 'Asia/Jakarta';
    const time = moment().tz(tz).format('DD-MM-YYYY');
    return `*Jadwal Sholat Batam - ${time}*\nSubuh: 04:55 WIB\nDzuhur: 12:15 WIB\nAshar: 15:35 WIB\nMaghrib: 18:20 WIB\nIsya: 19:30 WIB`;
}

async function getItDictionary(word) {
    try {
        const aiResponse = await chatAI(`Jelaskan secara singkat, jelas, dan mudah dipahami oleh orang awam apa itu: '${word}'. Buat penjelasan langsung to the point.`);
        return `*Kamus Pintar 📚*\n\n${aiResponse.trim()}`;
    } catch (error) {
        return `Istilah "${word}" sedang tidak bisa dicari saat ini. Koneksi ke otak Si-Choli sedang sibuk!`;
    }
}

function getRecipe(ingredient) {
    return `*Resep Spesial 🍳*\n\nIde masakan berbahan dasar *${ingredient}*:\n\n` +
        `*${ingredient} Sambal Bawang Simple*\n` +
        `Cara buat:\n` +
        `1. Bersihkan dan siapkan ${ingredient}.\n` +
        `2. Panaskan minyak, goreng atau tumis ${ingredient} hingga matang.\n` +
        `3. Ulek cabai rawit, bawang merah, bawang putih, garam, dan kaldu bubuk.\n` +
        `4. Sambal yang diulek ditaburkan ke atas ${ingredient}, lalu siram dengan sedikit minyak panas sisa menggoreng tadi.\n\n` +
        `Selamat menikmati sajian yang lezat! 💪`;
}

module.exports = {
    getPrayerTimes,
    getItDictionary,
    getRecipe
};
