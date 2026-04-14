function getHaluMeter(name) {
    const haluPercent = Math.floor(Math.random() * 101);
    let desc = '';
    if (haluPercent < 20) desc = 'Masih aman kok, masih sadar banget ini mah.';
    else if (haluPercent < 50) desc = 'Mulai halu dikit nih, kayaknya butuh asupan kopi.';
    else if (haluPercent < 80) desc = 'Duh, halunya udah parah! Sadar woy, bangun!';
    else desc = 'FIX INI MAH HALU BANGET!! Perlu diruqyah kayaknya 😂';

    return `*Halu-Meter 🌡️*\nNama: ${name}\nTingkat Halu: ${haluPercent}%\n\nCatatan: ${desc}`;
}

function getCekJodoh(name1, name2) {
    const percent = Math.floor(Math.random() * 101);
    let desc = '';
    if (percent < 20) desc = 'Kayaknya mending cari yang lain aja deh, daripada sakit hati 😢';
    else if (percent < 50) desc = 'Bisa jadi temen deket aja sih ini mah.';
    else if (percent < 80) desc = 'Wah cocok nih! Gas terus jangan sampe lolos!';
    else desc = 'JODOH DUNIA AKHIRAT!! Langsung sebar undangan aja yuk! 🎉';

    return `*Cek Jodoh 💖*\nPasangan: ${name1} & ${name2}\nKecocokan: ${percent}%\n\nPrediksi: ${desc}`;
}

function getRandomTruth() {
    const truths = [
        "Siapa orang terakhir yang kamu stalk sosmednya? Jujur ya!",
        "Pernah nggak sih salah kirim chat? Isinya apa tuh?",
        "Rahasia terbesar kamu apa nih yang belum ada yang tau di grup ini?",
        "Siapa di grup ini yang paling bikin kamu risih atau kesal?",
        "Kalau disuruh pilih satu orang di sini buat jadi pacar, siapa tuh?"
    ];
    return `*Truth 🤫*\n\n${truths[Math.floor(Math.random() * truths.length)]}`;
}

function getRandomDare() {
    const dares = [
        "Japri mantan kamu terus bilang 'Aku kangen', terus SS kirim sini ya!",
        "Coba VN nyanyi lagu Balonku tapi semua huruf vokalnya diganti jadi 'O'.",
        "Ganti foto profil WA kamu pake meme paling lucu selama seharian.",
        "Chat salah satu admin terus bilang 'Kamu manis banget deh', SS kirim sini.",
        "Ganti bio WA kamu jadi 'Aku hobi rebahan doang' sampe besok."
    ];
    return `*Dare 😈*\n\n${dares[Math.floor(Math.random() * dares.length)]}`;
}

function getZodiac(sign) {
    const zodiakData = {
        aries: "Dompet mulai tipis nih, tapi semangat harus tetep ada dong. Jaga emosi ya!",
        taurus: "Santai dikit napa, jangan kerja terus, nanti tipes lho.",
        gemini: "Lagi ada drama kecil nih. Jangan terlalu dipikirin ya, bawa happy aja.",
        cancer: "Lagi sensitif banget ya hari ini? Jangan baperan dong sama omongan orang.",
        leo: "PD kamu lagi tinggi-tingginya nih, banyak yang ngelirik lho!",
        virgo: "Nggak usah terlalu perfeksionis, nanti malah pusing sendiri tau.",
        libra: "Keuangan lagi agak seret nih, coba mulai hemat-hemat ya.",
        scorpio: "Ciee, ada yang lagi merhatiin kamu diem-diem tuh...",
        sagittarius: "Pengen healing mulu tapi dompet lagi nggak mendukung nih.",
        capricorn: "Hasil kerja keras kamu mulai kelihatan kok, tapi jangan lupa istirahat.",
        aquarius: "Lagi banyak ide seru nih, yuk langsung eksekusi aja!",
        pisces: "Jangan gampang percaya janji manis ya, liat buktinya aja langsung."
    };

    const s = sign.toLowerCase();
    if (zodiakData[s]) {
        return `*Zodiak ${s.charAt(0).toUpperCase() + s.slice(1)} 🌟*\n\nKata aku hari ini:\n"${zodiakData[s]}"`;
    }
    return `Zodiak "${sign}" nggak ada tuh. Coba ketik yang bener, misal: Aries, Taurus, dll.`;
}

module.exports = {
    getHaluMeter,
    getCekJodoh,
    getRandomTruth,
    getRandomDare,
    getZodiac
};
