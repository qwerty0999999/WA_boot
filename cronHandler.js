const moment = require('moment-timezone');
const cron = require('node-cron');
const axios = require('axios');
const { chatAI } = require('./lib/api');

const delay = ms => new Promise(res => setTimeout(res, ms));

let jadwalHariIni = {};
let tanggalJadwal = "";
let lastSholatSent = "";
let lastMotivasiHour = -1;

async function startCronJobs(sock) {
    console.log('[CRON] Auto-prayer & hourly motivation engine started.');

    // Run precisely at the top of every minute using node-cron
    cron.schedule('* * * * *', async () => {
        const timeNow = moment().tz('Asia/Jakarta');
        const hour = timeNow.hour();
        const minute = timeNow.minute();
        const timeString = timeNow.format('HH:mm');
        const dateString = timeNow.format('YYYY/MM/DD');

        // 1. Motivasi setiap jam (00 menit) - kecuali jam tidur 00:00 - 05:00
        if (minute === 0 && hour !== lastMotivasiHour) {
            lastMotivasiHour = hour;
            if (hour > 5) {
                try {
                    const AI_prompt = "Berikan satu kalimat motivasi singkat yang sangat acak, lucu, namun penuh semangat untuk para member di grup WhatsApp. Bisa juga diselipi jokes programming/IT. Jawab langsung kalimatnya saja tanpa basa-basi pengantar.";
                    const ai_text = await chatAI(AI_prompt);
                    const pesan_motivasi = `✨ *Motivasi Jam ${hour.toString().padStart(2, '0')}:00* ✨\n\n${ai_text}`;

                    const groups = await sock.groupFetchAllParticipating();
                    let count = 0;
                    for (const groupId in groups) {
                        await sock.sendMessage(groupId, { text: pesan_motivasi });
                        await delay(1500);
                        count++;
                    }
                    console.log(`[CRON] Motivasi AI berhasil dikirim ke ${count} grup.`);
                } catch (err) {
                    console.error('[CRON Error] Gagal generate & ngirim motivasi AI:', err);
                }
            }
        }

        // 2. Persiapan & Fetch Jadwal Sholat Dinamis
        if (dateString !== tanggalJadwal) {
            try {
                // 0801 adalah kode kota Batam di api.myquran.com
                const res = await axios.get(`https://api.myquran.com/v2/sholat/jadwal/0801/${dateString}`);
                if (res.data && res.data.data && res.data.data.jadwal) {
                    jadwalHariIni = res.data.data.jadwal;
                    tanggalJadwal = dateString;
                    console.log(`[CRON] Berhasil fetch jadwal sholat untuk ${dateString}`);
                }
            } catch (err) {
                console.error('[CRON Error] Gagal fetch jadwal sholat:', err);
            }
        }

        // 3. Cek pengingat waktu sholat (HH:MM)
        if (jadwalHariIni && Object.keys(jadwalHariIni).length > 0) {
            const daftarWaktu = {
                "Imsak (Persiapan Puasa)": jadwalHariIni.imsak,
                "Subuh": jadwalHariIni.subuh,
                "Dzuhur": jadwalHariIni.dzuhur,
                "Ashar": jadwalHariIni.ashar,
                "Maghrib (Buka Puasa)": jadwalHariIni.maghrib,
                "Isya": jadwalHariIni.isya
            };

            for (const [namaWaktu, jam] of Object.entries(daftarWaktu)) {
                if (timeString === jam && jam !== lastSholatSent) {
                    lastSholatSent = jam;
                    let pesanSholat = `🕌 *PENGINGAT WAKTU*\n\nTelah masuk waktu ${namaWaktu} untuk wilayah Batam dan sekitarnya.\nMari siapkan diri Anda!`;

                    // Custom message untuk Maghrib
                    if (namaWaktu.includes("Maghrib")) {
                        pesanSholat = `🕌 *Waktunya Sholat Maghrib & Selamat Berbuka Puasa!* 🕌\n\nUntuk wilayah Batam dan sekitarnya (Jam ${jam} WIB).\nSelamat menikmati hidangan berbuka bagi yang menjalankan puasa! 🍽️ Jangan lupa sholat Maghrib ya!`;
                    }

                    try {
                        const groups = await sock.groupFetchAllParticipating();
                        let count = 0;
                        for (const groupId in groups) {
                            await sock.sendMessage(groupId, { text: pesanSholat });
                            await delay(1500);
                            count++;
                        }
                        console.log(`[CRON] Notifikasi sholat ${namaWaktu} dikirim ke ${count} grup.`);
                    } catch (err) {
                        console.error('[CRON Error] Gagal ngirim notifikasi sholat:', err);
                    }
                }
            }
        }
    }, {
        timezone: "Asia/Jakarta"
    });
}

module.exports = { startCronJobs };

