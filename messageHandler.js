const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('./config');
const { generateImage, chatAI, getWeather, getRandomQuote, getTTSUrl } = require('./lib/api');
const { getHaluMeter, getCekJodoh, getRandomTruth, getRandomDare, getZodiac } = require('./lib/games');
const { getPrayerTimes, getItDictionary, getRecipe } = require('./lib/utilities');
const { startTebak, checkTebak } = require('./lib/trivia');
const { downloadTikTok, downloadIG } = require('./lib/downloader');

const absensi = {};

async function handleMessage(sock, msg) {
    // Add default empty string OR '' to prevent undefined from optional chaining
    const messageContent = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || "").toString();
    const sender = msg.key.remoteJid;
    const isGroup = sender.endsWith('@g.us');
    const fromMe = msg.key.fromMe || false;

    // Prevent infinite loop from bot's own response
    if (fromMe && !messageContent.startsWith(config.prefix)) {
        return;
    }

    // Check auto-responses first
    const lowerMsg = messageContent.toLowerCase();

    // Check trivia answers
    if (isGroup && checkTebak(sender, lowerMsg)) {
        await sock.sendMessage(sender, { text: `🎉 *BENAR SEKALI!* 🎉\n@${msg.key.participant.split('@')[0]} berhasil menjawab dengan cepat!`, mentions: [msg.key.participant] }, { quoted: msg });
        return;
    }

    if (!messageContent.startsWith(config.prefix) && (lowerMsg.includes('choli') || lowerMsg === 'bot' || lowerMsg.includes(' si bot'))) {
        // Prevent bot from replying to its own bot response
        if (fromMe) return;

        // Pesan loading dihapus sesuai request

        // Persona asik agar AI membalas seperti teman/manusia biasa dan TIDAK BERTELE-TELE
        const personaPrompt = `Kamu adalah teman ngobrol dari Indonesia bernama Choli. Jawablah obrolan berikut dengan ramah dan santai menggunakan bahasa sehari-hari. 
        ATURAN SANGAT PENTING: Jawablah dengan SANGAT SINGKAT, padat,ceria dan langsung ke intinya saja. Jangan bertele-tele, jangan memberikan penjelasan panjang lebar atau edukasi jika tidak diminta. Jangan pernah menyebutkan kamu adalah AI bot. 
        Obrolan/pertanyaan: "${messageContent}"`;

        const aiResponse = await chatAI(personaPrompt);
        await sock.sendMessage(sender, { text: aiResponse }, { quoted: msg });
        return;
    }

    // Anti-Link System
    if (isGroup && (lowerMsg.includes('http://') || lowerMsg.includes('https://'))) {
        // Warn and delete message (Baileys cannot easily delete others' msgs without admin rights, so we just warn)
        await sock.sendMessage(sender, { text: `⚠️ *ANTI-LINK SYSTEM*\n\n@${msg.key.participant.split('@')[0]}, dilarang mengirim link mencurigakan di grup ini!`, mentions: [msg.key.participant] }, { quoted: msg });
        // NOTE: Kick/Delete requires group admin logic, simplified to warning for now.
    }

    if (!messageContent.startsWith(config.prefix)) return;

    const args = messageContent.slice(config.prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const textArgs = args.join(" ");

    // Context helpers
    const reply = (text) => sock.sendMessage(sender, { text }, { quoted: msg });

    // Basic routing
    switch (command) {
        case 'menu':
            const menuText = `*Robot Si-Choli* 🤖\n\n` +
                `🛡️ *Fitur Grup*\n` +
                `- ${config.prefix}everyone\n` +
                `- ${config.prefix}hidetag [pesan]\n` +
                `- ${config.prefix}dev\n\n` +
                `🎮 *Hiburan*\n` +
                `- ${config.prefix}stiker (kirim/reply gambar)\n` +
                `- ${config.prefix}siapa\n` +
                `- ${config.prefix}truth / ${config.prefix}dare\n` +
                `- ${config.prefix}confess [nomor] [pesan]\n` +
                `- ${config.prefix}tebak\n` +
                `- ${config.prefix}cekjodoh [nama1] [nama2]\n` +
                `- ${config.prefix}halu [nama]\n` +
                `- ${config.prefix}zodiak [zodiak]\n` +
                `- ${config.prefix}quotes\n\n` +
                `📚 *Edukasi & Pengetahuan*\n` +
                `- ${config.prefix}apa-itu [istilah]\n` +
                `- ${config.prefix}makeqr [teks/link]\n\n` +
                `📅 *Utilitas & Daily*\n` +
                `- ${config.prefix}jadwal\n` +
                `- ${config.prefix}absen / ${config.prefix}resetabsen\n` +
                `- ${config.prefix}ingatkan [menit] [pesan]\n` +
                `- ${config.prefix}masak [bahan]\n` +
                `- ${config.prefix}cuaca\n\n` +
                `🚀 *Fitur Baru!*\n` +
                `- ${config.prefix}tiktok [link]\n` +
                `- ${config.prefix}ig [link]\n` +
                `- ${config.prefix}tts [teks]\n` +
                `- ${config.prefix}gambar [deskripsi]\n`;
            await reply(menuText);
            break;
        case 'dev':
            const devText = `*👑 Developer Si-Choli 👑*\n\n` +
                `👨‍💻 *Rijalul Fikri (RF Digital)*\n\n` +
                `💻 _"Sang kreator cerdas pencipta bot ajaib ini!"_\n` +
                `Beliau adalah sosok kreatif asal Universitas Putera Batam (UPB) yang sukses merangkai fitur-fitur keren di dalam bot ini! 🚀🔥💻`;

            await reply(devText);
            break;

        // --- GRUP & SECURITY ---
        case 'everyone':
            if (!isGroup) return reply(config.messages.groupOnly);
            const groupMetadata = await sock.groupMetadata(sender);
            const participants = groupMetadata.participants.map(p => p.id);
            await sock.sendMessage(sender, { text: "📢 *PERHATIAN SEMUANYA!!*\n\nTag All by Si-Choli!", mentions: participants }, { quoted: msg });
            break;
        case 'hidetag':
            if (!isGroup) return reply(config.messages.groupOnly);
            if (!textArgs) return reply(`Masukkan pesan! Contoh: ${config.prefix}hidetag Woy ngopi`);
            const metadata = await sock.groupMetadata(sender);
            const mems = metadata.participants.map(p => p.id);
            await sock.sendMessage(sender, { text: textArgs, mentions: mems });
            break;

        // --- HIBURAN ---
        case 'halu':
            if (!textArgs) return reply(`Masukkan nama! Contoh: ${config.prefix}halu Budi`);
            await reply(getHaluMeter(textArgs));
            break;
        case 'jodoh':
        case 'cekjodoh':
            if (args.length < 2) return reply(`Masukkan 2 nama! Contoh: ${config.prefix}cekjodoh Budi Siti`);
            await reply(getCekJodoh(args[0], args[1]));
            break;
        case 'truth':
            await reply(getRandomTruth());
            break;
        case 'dare':
            await reply(getRandomDare());
            break;
        case 'zodiak':
            if (!textArgs) return reply(`Masukkan zodiak! Contoh: ${config.prefix}zodiak Aries`);
            await reply(getZodiac(textArgs));
            break;
        case 'quotes':
            await reply(await getRandomQuote());
            break;
        case 'broadcastquote':
            if (sender !== config.ownerNumber + '@s.whatsapp.net') return reply('Hanya owner yang bisa pakai command ini!');
            await reply('Sedang memproses broadcast quote ke semua grup...');
            try {
                const quoteText = await getRandomQuote();
                const groups = await sock.groupFetchAllParticipating();
                let groupCount = 0;
                for (const groupId in groups) {
                    await sock.sendMessage(groupId, { text: `[Penyemangat Harimu ✨]\n\n${quoteText}` });
                    await new Promise(res => setTimeout(res, 2000));
                    groupCount++;
                }
                await reply(`✅ Berhasil mengirim quote ke ${groupCount} grup!`);
            } catch (err) {
                await reply(`❌ Gagal membroadcast quote: ${err.message}`);
            }
            break;
        case 'siapa':
            if (!isGroup) return reply(config.messages.groupOnly);
            const grpMeta = await sock.groupMetadata(sender);
            const randomMember = grpMeta.participants[Math.floor(Math.random() * grpMeta.participants.length)];
            await sock.sendMessage(sender, { text: `🎲 *Group Roulette*\n\nSi-Choli memilih: @${randomMember.id.split('@')[0]} !!`, mentions: [randomMember.id] }, { quoted: msg });
            break;

        // --- EDUKASI & API ---
        case 'cuaca':
            await reply(config.messages.wait);
            const weather = await getWeather('Batam');
            await reply(weather);
            break;
        case 'apa-itu':
            if (!textArgs) return reply(`Masukkan kata! Contoh: ${config.prefix}apa-itu Makanan`);
            await reply(config.messages.wait);
            await reply(await getItDictionary(textArgs));
            break;
        case 'masak':
            if (!textArgs) return reply(`Bahan masaknya apa? Contoh: ${config.prefix}masak Telur`);
            await reply(getRecipe(textArgs));
            break;
        case 'absen':
            if (!isGroup) return reply(config.messages.groupOnly);
            if (!absensi[sender]) absensi[sender] = [];
            const absenParticipant = msg.key.participant;
            if (absensi[sender].includes(absenParticipant)) {
                return reply("Bro, kamu sudah absen!");
            }
            absensi[sender].push(absenParticipant);
            let txtAbsen = `*Daftar Hadir Grup* 📋\n\n`;
            absensi[sender].forEach((p, i) => txtAbsen += `${i + 1}. @${p.split('@')[0]}\n`);
            await sock.sendMessage(sender, { text: txtAbsen, mentions: absensi[sender] }, { quoted: msg });
            break;
        case 'resetabsen':
            if (!isGroup) return reply(config.messages.groupOnly);
            absensi[sender] = [];
            await reply("DAFTAR ABSEN BERHASIL DIRESET! 🗑️");
            break;
        case 'jadwal':
            await reply(getPrayerTimes());
            break;
        case 'makeqr':
            if (!textArgs) return reply(`Kirim teks/link yang mau dibikin QR!`);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(textArgs)}`;
            await sock.sendMessage(sender, { image: { url: qrUrl }, caption: `Bip bop! QR Code dadi nih!` }, { quoted: msg });
            break;
        case 'waktu':
        case 'jam':
            const now = new Date();
            const options = { timeZone: 'Asia/Jakarta', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
            await reply(`⏱️ *Waktu Saat Ini (WIB)*\n\n${now.toLocaleDateString('id-ID', options)}`);
            break;

        // --- FITUR BARU ---
        case 'tts':
            if (!textArgs) return reply(`Masukkan teksnya! Contoh: ${config.prefix}tts Halo semua`);
            const audioUrl = getTTSUrl(textArgs);
            if (!audioUrl) return reply('❌ Gagal membuat suara (TTS).');
            await sock.sendMessage(sender, {
                audio: { url: audioUrl },
                mimetype: 'audio/mp4',
                ptt: true // Kirim sebagai Voice Note
            }, { quoted: msg });
            break;

        case 'gambar':
            if (!textArgs) return reply(`Masukkan deskripsi gambar! Contoh: ${config.prefix}gambar robot kucing minum kopi`);
            await reply(config.messages.wait);
            const imageUrl = generateImage(textArgs);
            await sock.sendMessage(sender, {
                image: { url: imageUrl },
                caption: `Bip bop! 🎨 Gambar berhasil dibuat untuk: ${textArgs}`
            }, { quoted: msg });
            break;

        case 'tiktok':
        case 'tt':
            if (!textArgs || !textArgs.includes('tiktok')) return reply(`Kirim link TikTok! Contoh: ${config.prefix}tiktok https://vt.tiktok.com/...`);
            await reply(config.messages.wait);
            const ttData = await downloadTikTok(textArgs);
            if (!ttData || !ttData.videoUrl) return reply('❌ Gagal mendownload TikTok. Link mungkin private atau server sibuk.');
            await sock.sendMessage(sender, {
                video: { url: ttData.videoUrl },
                caption: `🎵 *TikTok Downloader*\n\nJudul: ${ttData.title || '-'}`
            }, { quoted: msg });
            break;

        case 'ig':
        case 'instagram':
            if (!textArgs || !textArgs.includes('instagram.com')) return reply(`Kirim link Instagram! Contoh: ${config.prefix}ig https://www.instagram.com/p/...`);
            await reply(config.messages.wait);
            const igData = await downloadIG(textArgs);
            if (!igData || igData.length === 0) return reply('❌ Gagal mendownload IG. Pastikan akun tidak diprivate atau URL valid.');

            for (const mediaUrl of igData) {
                if (mediaUrl.includes('.mp4') || mediaUrl.includes('video')) {
                    await sock.sendMessage(sender, { video: { url: mediaUrl } }, { quoted: msg });
                } else {
                    await sock.sendMessage(sender, { image: { url: mediaUrl } }, { quoted: msg });
                }
            }
            break;

        // --- UTILS MENUNGGU IMPLEMENTASI ---    
        case 'stiker':
            try {
                const isQuotedImage = msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
                const isQuotedVideo = msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
                const isImage = msg.message.imageMessage;
                const isVideo = msg.message.videoMessage;

                let mediaMsg;
                let ext;
                if (isImage || isVideo) {
                    mediaMsg = msg;
                    ext = isImage ? 'jpg' : 'mp4';
                } else if (isQuotedImage || isQuotedVideo) {
                    mediaMsg = {
                        key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                        message: msg.message.extendedTextMessage.contextInfo.quotedMessage
                    };
                    ext = isQuotedImage ? 'jpg' : 'mp4';
                } else {
                    return await reply(`Kirim atau balas gambar/video durasi max 5 detik dengan caption ${config.prefix}stiker`);
                }

                await reply(config.messages.wait);
                const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage });

                const { createSticker } = require('./lib/sticker');
                const stickerBuffer = await createSticker(buffer, ext);

                await sock.sendMessage(sender, { sticker: stickerBuffer }, { quoted: msg });
            } catch (err) {
                console.error('Error making sticker:', err);
                await reply('Gagal membuat stiker. Pastikan FFMPEG terinstal di server.');
            }
            break;
        case 'tebak':
            if (!isGroup) return reply(config.messages.groupOnly);
            await reply(config.messages.wait);
            await reply(await startTebak(sender));
            break;
        case 'confess':
            if (args.length < 2) return reply(`Gunakan format: ${config.prefix}confess [nomor tujuan] [pesan]\nContoh: ${config.prefix}confess 628123... Halo aku suka kamu`);
            const targetNum = args.shift();
            const confessMsg = args.join(" ");
            const targetJid = `${targetNum.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
            try {
                await sock.sendMessage(targetJid, { text: `💌 *PESAN RAHASIA (CONFESS)*\n\nSeseorang menjapri Si-Choli untuk mengirimimu pesan ini:\n\n"${confessMsg}"\n\n_Pesan ini dikirim anonim via Si-Choli Bot._` });
                await reply('✅ Pesan rahasia berhasil dikirim lewat jalur dalem!');
            } catch (err) {
                await reply('❌ Gagal ngirim pesan. Pastikan nomor tujuan pakai kode negara (62...) dan aktif di WA.');
            }
            break;
        case 'ingatkan':
            if (!isGroup) return reply(config.messages.groupOnly);
            if (args.length < 2) return reply(`Format salah! Contoh: ${config.prefix}ingatkan 10 Jangan lupa absen SIAKAD`);

            const minutes = parseInt(args.shift());
            if (isNaN(minutes) || minutes <= 0) return reply(`Waktu harus berupa angka menit! Contoh: ${config.prefix}ingatkan 10 Waktunya absen`);

            const reminderMsg = args.join(" ");
            await reply(`⏱️ *Group Reminder Diaktifkan!*\n\nBot akan mengingatkan grup ini dalam ${minutes} menit untuk:\n"${reminderMsg}"`);

            setTimeout(async () => {
                const metadata = await sock.groupMetadata(sender);
                const mems = metadata.participants.map(p => p.id);
                // Tag everyone for the reminder
                await sock.sendMessage(sender, { text: `⏰ *PENGINGAT (REMINDER)!!*\n\n"${reminderMsg}"\n\n- Dari Si-Choli untuk warga grup.`, mentions: mems });
            }, minutes * 60 * 1000);
            break;

        default:
            // Unrecognized command
            break;
    }
}

module.exports = { handleMessage };
