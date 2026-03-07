function getHaluMeter(name) {
    const haluPercent = Math.floor(Math.random() * 101);
    let desc = '';
    if (haluPercent < 20) desc = 'Warik, masih sadar ini mah.';
    else if (haluPercent < 50) desc = 'Agak halu, mungkin kurang ngopi.';
    else if (haluPercent < 80) desc = 'Halu parah tingkat dewa!! Woy sadar!!';
    else desc = 'SANGAT HALU!! Fix butuh diruqyah ini!';

    return `*Halu-Meter 🌡️*\nNama: ${name}\nTingkat Halu: ${haluPercent}%\n\n📝 ${desc}`;
}

function getCekJodoh(name1, name2) {
    const percent = Math.floor(Math.random() * 101);
    let desc = '';
    if (percent < 20) desc = 'Mending cari yang lain aja deh bro/sis 😢';
    else if (percent < 50) desc = 'Bisa jadi temen curhat aja nih kayaknya.';
    else if (percent < 80) desc = 'Cocok banget! Gas pelaminan!';
    else desc = 'JODOH SEHIDUP SEMATI!! Cepat sebar undangan!! 🎉';

    return `*Cek Jodoh 💖*\nPasangan: ${name1} ❌ ${name2}\nKecocokan: ${percent}%\n\n📝 ${desc}`;
}

function getRandomTruth() {
    const truths = [
        "Siapa orang terakhir yang kamu stalk sosmednya?",
        "Pernahkah kamu mengirim pesan kepada orang yang salah? Apa isinya?",
        "Apa rahasia terbesar yang belum pernah kamu bagikan dengan siapa pun di grup ini?",
        "Siapa orang di grup ini yang paling sering bikin kamu kesal?",
        "Kalau kamu harus memilih satu orang di grup ini untuk jadi pacar, siapa yang kamu pilih?"
    ];
    return `*Game Truth 🤫*\n\n${truths[Math.floor(Math.random() * truths.length)]}`;
}

function getRandomDare() {
    const dares = [
        "Japri salah satu mantan kamu lalu ucapkan 'Aku kangen'. Screenshot kirim sini.",
        "Kirim VN (Voice Note) nyanyi lirik lagu 'Balonku' tapi vokalnya diganti 'O'.",
        "Pakai foto profil WA kamu jadi foto meme terlucu selama 24 jam.",
        "Chat salah satu admin grup ini dan ketik 'Kamu manis deh kek gula'. Screenshot ke sini.",
        "Ganti bio WA kamu jadi 'Aku hobi rebahan' selama sehari."
    ];
    return `*Game Dare 😈*\n\n${dares[Math.floor(Math.random() * dares.length)]}`;
}

function getZodiac(sign) {
    const zodiakData = {
        aries: "Dompet menipis, tapi semangat membara. Awas emosi hari ini!",
        taurus: "Saatnya santai sedikit, kerja mulu juga nggak bikin kaya instan.",
        gemini: "Bakal ada drama kecil. Jangan terlalu overthinking ya.",
        cancer: "Sensitif banget hari ini, awas baperan sama omongan orang.",
        leo: "Kepercayaan diri lagi tinggi, pesonamu lagi memikat banyak orang!",
        virgo: "Perfeksionis boleh, tapi jangan sampai bikin pusing sendiri.",
        libra: "Ada sedikit masalah keuangan, cobalah lebih berhemat minggu ini.",
        scorpio: "Pesona misteriusmu lagi diincar seseorang diam-diam...",
        sagittarius: "Pengen jalan-jalan terus. Sayangnya dompet berteriak.",
        capricorn: "Kerja keras terbayar sedikit-sedikit. Jangan lupa istirahat.",
        aquarius: "Ide-ide kreatif lagi ngalir deras. Waktunya eksekusi!",
        pisces: "Hati-hati dengan janji manis, mending langsung buktikan saja."
    };

    const s = sign.toLowerCase();
    if (zodiakData[s]) {
        return `*Zodiak ${s.toUpperCase()} 🌟*\n\nRamalan kocak hari ini:\n${zodiakData[s]}`;
    }
    return `Zodiak "${sign}" tidak ditemukan. Coba: Aries, Taurus, Gemini, etc.`;
}

module.exports = {
    getHaluMeter,
    getCekJodoh,
    getRandomTruth,
    getRandomDare,
    getZodiac
};
