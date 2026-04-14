const moment = require('moment-timezone');
const cron = require('node-cron');
const axios = require('axios');
const { chatAI } = require('./lib/api');
const config = require('./config');

const delay = ms => new Promise(res => setTimeout(res, ms));

let jadwalHariIni = {};
let tanggalJadwal = "";
let lastSholatSent = "";
let lastMotivasiHour = -1;

let currentSock = null;

async function startCronJobs(sock) {
    currentSock = sock; // Update the socket reference
    console.log('[CRON] Sistem Pengingat Sholat & Motivasi Neng Fika Aktif!');

    // Cek setiap menit
    cron.schedule('* * * * *', async () => {
        if (!currentSock) return;
        const sock = currentSock;

        const timeNow = moment().tz('Asia/Jakarta');
        const hour = timeNow.hour();
        const minute = timeNow.minute();
        const timeString = timeNow.format('HH:mm');
        const dateString = timeNow.format('YYYY/MM/DD');

        // 1. Motivasi Otomatis (Jam 09:00 pagi dan 16:00 sore)
        if (minute === 0 && hour !== lastMotivasiHour) {
            lastMotivasiHour = hour;
            if (hour === 9 || hour === 16) {
                try {
                    const AI_prompt = "Berikan satu kalimat penyemangat hari yang singkat, asik, dan ceria buat temen-temen di grup WhatsApp. Pake bahasa gaul Indonesia yang sopan. Langsung kalimatnya aja ya.";
                    const ai_text = await chatAI(AI_prompt);
                    const pesan_motivasi = `✨ *Semangat ${hour < 12 ? 'Pagi' : 'Sore'} dari Neng Fika!* ✨\n\n"${ai_text}"\n\nSemangat terus ya semuanya! 🚀`;

                    const groups = await sock.groupFetchAllParticipating();
                    for (const groupId in groups) {
                        await sock.sendMessage(groupId, { text: pesan_motivasi });
                        await delay(2000);
                    }
                } catch (err) {
                    console.error('[CRON Error] Gagal kirim motivasi:', err);
                }
            }
        }

        // 2. Fetch Jadwal Sholat Harian
        if (dateString !== tanggalJadwal) {
            try {
                const now = moment().tz('Asia/Jakarta');
                const month = now.month() + 1;
                const year = now.year();
                const day = now.date();

                const res = await axios.post('https://equran.id/api/v2/shalat', {
                    provinsi: 'Kepulauan Riau',
                    kabkota: 'Kota Batam',
                    bulan: month,
                    tahun: year
                });

                if (res.data && res.data.code === 200) {
                    const todayData = res.data.data.jadwal.find(j => j.tanggal === day);
                    if (todayData) {
                        jadwalHariIni = todayData;
                        tanggalJadwal = dateString;
                        console.log(`[CRON] Update jadwal sholat Batam untuk ${dateString}`);
                    }
                }
            } catch (err) {
                console.error('[CRON Error] Gagal fetch jadwal sholat:', err.message);
            }
        }

        // 3. Cek Waktu Sholat
        if (jadwalHariIni && Object.keys(jadwalHariIni).length > 0) {
            const daftarWaktu = {
                "Subuh": jadwalHariIni.subuh,
                "Dzuhur": jadwalHariIni.dzuhur,
                "Ashar": jadwalHariIni.ashar,
                "Maghrib": jadwalHariIni.maghrib,
                "Isya": jadwalHariIni.isya
            };

            for (const [namaWaktu, jam] of Object.entries(daftarWaktu)) {
                if (timeString === jam && jam !== lastSholatSent) {
                    lastSholatSent = jam;
                    
                    // Pesan Umum untuk Grup
                    const pesanGrup = `🕌 *PANGGILAN IBADAH*\n\nSudah masuk waktu *${namaWaktu}* untuk wilayah Batam dan sekitarnya (Jam ${jam} WIB).\n\nYuk istirahat sebentar, kita tunaikan sholat dulu ya gaes! ✨`;

                    // Pesan Spesial buat Abang Rijal (Owner)
                    const ownerJid = config.ownerNumber + '@s.whatsapp.net';
                    const pesanOwner = `Sayangku ABG Rijal... 😍\nSudah masuk waktu *${namaWaktu}* nih. Jangan terlalu asik kerja ya, rehat sebentar buat sholat dulu. Neng tungguin nih! 😘💖`;

                    try {
                        const groups = await sock.groupFetchAllParticipating();
                        for (const groupId in groups) {
                            await sock.sendMessage(groupId, { text: pesanGrup });
                            await delay(2000);
                        }
                        // Kirim ke Abang juga
                        await sock.sendMessage(ownerJid, { text: pesanOwner });
                    } catch (err) {
                        console.error('[CRON Error] Gagal kirim notif sholat:', err);
                    }
                }
            }
        }
    }, {
        timezone: "Asia/Jakarta"
    });
}

function updateCronSocket(sock) {
    currentSock = sock;
}

module.exports = { startCronJobs, updateCronSocket };
