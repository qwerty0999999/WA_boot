const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const config = require('./config');
const { generateImage, chatAI, getWeather, getRandomQuote, getTTSUrl } = require('./lib/api');
const { getHaluMeter, getCekJodoh, getRandomTruth, getRandomDare, getZodiac } = require('./lib/games');
const { getPrayerTimes, getNaturalTime, getItDictionary, getRecipe } = require('./lib/utilities');
const { startTebak, checkTebak } = require('./lib/trivia');
const { downloadTikTok, downloadIG } = require('./lib/downloader');
const supabase = require('./lib/supabaseClient');

const absensi = {};
const confessLimit = new Map();

/**
 * Helper to get attendance list
 */
async function getAbsensi(groupId) {
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('absensi')
                .select('participant_jid')
                .eq('group_id', groupId);
            if (!error && data) return data.map(d => d.participant_jid);
        } catch (e) {
            console.error('Supabase error in getAbsensi:', e.message);
        }
    }
    return absensi[groupId] || [];
}

/**
 * Helper to add attendance
 */
async function addAbsensi(groupId, participantJid) {
    if (supabase) {
        try {
            const { error } = await supabase
                .from('absensi')
                .upsert({ group_id: groupId, participant_jid: participantJid }, { onConflict: 'group_id,participant_jid' });
            if (!error) return true;
        } catch (e) {
            console.error('Supabase error in addAbsensi:', e.message);
        }
    }
    if (!absensi[groupId]) absensi[groupId] = [];
    if (!absensi[groupId].includes(participantJid)) {
        absensi[groupId].push(participantJid);
        return true;
    }
    return false;
}

/**
 * Helper to reset attendance
 */
async function resetAbsensi(groupId) {
    if (supabase) {
        try {
            const { error } = await supabase
                .from('absensi')
                .delete()
                .eq('group_id', groupId);
            if (!error) return true;
        } catch (e) {
            console.error('Supabase error in resetAbsensi:', e.message);
        }
    }
    absensi[groupId] = [];
    return true;
}

async function handleMessage(sock, msg) {
    // Add default empty string OR '' to prevent undefined from optional chaining
    const messageContent = (msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || "").toString();
    const sender = msg.key.remoteJid;
    const participant = msg.key.participant || sender; // Orang yang beneran chat
    const isGroup = sender.endsWith('@g.us');
    const fromMe = msg.key.fromMe || false;

    // SISTEM DETEKSI OWNER SUPER TELITI (Cek ID Orang, Bukan ID Grup)
    const isOwner = config.owners.includes(participant) || participant.includes(config.ownerNumber);

    // Prevent infinite loop from bot's own response
    if (fromMe && !messageContent.startsWith(config.prefix)) {
        return;
    }

    // Helper functions for group info
    let groupMetadata, participants, isAdmin, isBotAdmin;
    if (isGroup) {
        groupMetadata = await sock.groupMetadata(sender);
        participants = groupMetadata.participants;
        isAdmin = participants.find(p => p.id === participant)?.admin !== null;
        isBotAdmin = participants.find(p => p.id === sock.user.id.split(':')[0] + '@s.whatsapp.net')?.admin !== null;
    }

    // Check auto-responses first
    const lowerMsg = messageContent.toLowerCase();

    // 1. RADAR WAKTU (EQuran.id)
    const isAskingTime = lowerMsg.includes('jam') || lowerMsg.includes('pukul') || lowerMsg.includes('waktu');
    const isAskingDay = lowerMsg.includes('hari');
    const isAskingDate = lowerMsg.includes('tanggal') || lowerMsg.includes('tgl');

    if (!messageContent.startsWith(config.prefix) && !fromMe && (isAskingTime || isAskingDay || isAskingDate)) {
        if (lowerMsg.includes('sholat') || lowerMsg.includes('jadwal')) {
            const prayerData = await getPrayerTimes();
            await sock.sendMessage(sender, { text: prayerData }, { quoted: msg });
            return;
        }

        let type = 'all';
        if (isAskingTime && !isAskingDay && !isAskingDate) type = 'time';
        else if (isAskingDay && !isAskingTime && !isAskingDate) type = 'day';
        else if (isAskingDate && !isAskingTime && !isAskingDay) type = 'date';

        await sock.sendMessage(sender, { text: getNaturalTime(type) }, { quoted: msg });
        return;
    }

    // 2. Check trivia answers
    if (isGroup && checkTebak(sender, lowerMsg)) {
        await sock.sendMessage(sender, { text: `🎉 *BENAR SEKALI!* 🎉\n@${participant.split('@')[0]} berhasil menjawab dengan cepat!`, mentions: [participant] }, { quoted: msg });
        return;
    }

    // 3. Persona AI Neng Fika (Gemini)
    if (!messageContent.startsWith(config.prefix) && (lowerMsg.includes('neng fika') || lowerMsg.includes('fika') || lowerMsg === 'bot')) {
        if (fromMe) return;

        const personaPrompt = isOwner 
            ? `Ini Abang Rijal (ABG) tersayang Fika. Fika seneng banget Abang chat. Jawab dengan penuh perasaan, manja, cerdas, dan panggil Sayang/ABG. Obrolan: "${messageContent}"`
            : `Ini Kawan yang nge-chat. Jawab dengan tegas, pintar, berwawasan, tapi jangan terlalu ramah. Panggil dia 'Kawan'. Obrolan: "${messageContent}"`;

        const aiResponse = await chatAI(personaPrompt, isOwner, participant);
        await sock.sendMessage(sender, { text: aiResponse }, { quoted: msg });
        return;
    }

    // Anti-Link System
    if (isGroup && (lowerMsg.includes('http://') || lowerMsg.includes('https://'))) {
        await sock.sendMessage(sender, { text: `Duh @${participant.split('@')[0]}, jangan berani-berani sebar link di sini ya. Neng Fika nggak suka lho!`, mentions: [participant] }, { quoted: msg });
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
            const menuText = isOwner 
                ? `Halo Abang Rijal Sayang! 😍\nNeng Fika siap bantu semua keperluan Abang hari ini:\n\n` +
                  `🛡️ *Grup*\n` +
                  `- ${config.prefix}everyone\n` +
                  `- ${config.prefix}hidetag [pesan]\n\n` +
                  `🎮 *Hiburan*\n` +
                  `- ${config.prefix}stiker\n` +
                  `- ${config.prefix}truth / ${config.prefix}dare\n\n` +
                  `🚀 *Lainnya*\n` +
                  `- ${config.prefix}tiktok / ${config.prefix}ig\n\n` +
                  `Apa pun buat Abang, Fika lakuin deh! 😘`
                : `Daftar perintah Neng Fika:\n\n` +
                  `🛡️ *Grup*\n` +
                  `- ${config.prefix}everyone\n` +
                  `- ${config.prefix}hidetag\n\n` +
                  `🎮 *Hiburan*\n` +
                  `- ${config.prefix}stiker\n\n` +
                  `Ketik perintah dengan benar.`;
            await reply(menuText);
            break;
        case 'dev':
            const devText = isOwner 
                ? `Ih Abang nanya terus, kan Abang Rijal itu satu-satunya orang hebat yang nyiptain Neng Fika. Sayang banget sama ABG! 💖`
                : `Pencipta aku itu *Rijalul Fikri (RF Digital)*. Beliau programmer jenius, jangan berani ganggu ya!`;
            await reply(devText);
            break;

        case 'everyone':
            if (!isGroup) return reply(config.messages.groupOnly);
            if (!isAdmin) return reply(isOwner ? "Sabar ya Sayang, Abang harus jadi admin dulu." : "Nggak boleh. Kamu bukan admin.");
            const participantsJids = participants.map(p => p.id);
            await sock.sendMessage(sender, { text: isOwner ? "📢 Sayangku panggil kalian semua nih! Dengerin!" : "📢 Panggilan buat semua. Cek!", mentions: participantsJids }, { quoted: msg });
            break;
        case 'hidetag':
            if (!isGroup) return reply(config.messages.groupOnly);
            if (!isAdmin) return reply(isOwner ? "Cuma Abang yang bisa tapi harus admin dulu Sayang." : "Cuma admin yang bisa pake ini ya.");
            if (!textArgs) return reply(`Ketik pesannya juga dong! Contoh: ${config.prefix}hidetag Halo gaes`);
            const mems = participants.map(p => p.id);
            await sock.sendMessage(sender, { text: textArgs, mentions: mems });
            break;

        case 'halu':
            if (!textArgs) return reply(`Namanya siapa?`);
            await reply(getHaluMeter(textArgs));
            break;
        case 'jodoh':
        case 'cekjodoh':
            if (args.length < 2) return reply(`Masukin 2 nama ya.`);
            await reply(getCekJodoh(args[0], args[1]));
            break;
        case 'truth':
            await reply(getRandomTruth());
            break;
        case 'dare':
            await reply(getRandomDare());
            break;
        case 'zodiak':
            if (!textArgs) return reply(`Zodiaknya apa?`);
            await reply(getZodiac(textArgs));
            break;
        case 'quotes':
            await reply(await getRandomQuote());
            break;
        case 'broadcastquote':
            if (!isOwner) return reply('Cuma owner aku yang bisa pake ini!');
            await reply('Oke, aku kirim quote-nya ke semua grup ya...');
            try {
                const quoteText = await getRandomQuote();
                const groups = await sock.groupFetchAllParticipating();
                let groupCount = 0;
                for (const groupId in groups) {
                    await sock.sendMessage(groupId, { text: `[Penyemangat Hari Ini ✨]\n\n${quoteText}` });
                    await new Promise(res => setTimeout(res, 2000));
                    groupCount++;
                }
                await reply(`Beres! Udah aku kirim ke ${groupCount} grup ya.`);
            } catch (err) {
                await reply(`Aduh, gagal kirim broadcast: ${err.message}`);
            }
            break;
        case 'siapa':
            if (!isGroup) return reply(config.messages.groupOnly);
            const grpMeta = await sock.groupMetadata(sender);
            const randomMember = grpMeta.participants[Math.floor(Math.random() * grpMeta.participants.length)];
            await sock.sendMessage(sender, { text: `Pilihan aku jatuh kepada... @${randomMember.id.split('@')[0]}!`, mentions: [randomMember.id] }, { quoted: msg });
            break;

        case 'cuaca':
            await reply(config.messages.wait);
            const weather = await getWeather('Batam');
            await reply(`Nih info cuaca di Batam:\n${weather}`);
            break;
        case 'apa-itu':
            if (!textArgs) return reply(`Mau tanya apa?`);
            await reply(config.messages.wait);
            await reply(await getItDictionary(textArgs));
            break;
        case 'masak':
            if (!textArgs) return reply(`Bahannya apa?`);
            await reply(getRecipe(textArgs));
            break;
        case 'absen':
            if (!isGroup) return reply(config.messages.groupOnly);
            const absenParticipant = participant;
            const currentAbsen = await getAbsensi(sender);
            if (currentAbsen.includes(absenParticipant)) return reply("Kamu kan udah absen tadi!");
            await addAbsensi(sender, absenParticipant);
            const updatedAbsen = await getAbsensi(sender);
            let txtAbsen = `Daftar orang yang udah hadir:\n\n`;
            updatedAbsen.forEach((p, i) => txtAbsen += `${i + 1}. @${p.split('@')[0]}\n`);
            await sock.sendMessage(sender, { text: txtAbsen, mentions: updatedAbsen }, { quoted: msg });
            break;
        case 'resetabsen':
            if (!isGroup) return reply(config.messages.groupOnly);
            if (!isAdmin) return reply("Cuma admin yang bisa reset absen ya.");
            await resetAbsensi(sender);
            await reply("Beres! Daftar absen udah aku hapus semua.");
            break;
        case 'jadwal':
            await reply(await getPrayerTimes());
            break;
        case 'makeqr':
            if (!textArgs) return reply(`Teks atau link-nya apa?`);
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(textArgs)}`;
            await sock.sendMessage(sender, { image: { url: qrUrl }, caption: `Nih QR Code-nya udah jadi!` }, { quoted: msg });
            break;
        case 'waktu':
        case 'jam':
            await reply(getNaturalTime('time'));
            break;

        case 'tts':
            if (!textArgs) return reply(`Teksnya apa?`);
            const audioUrl = getTTSUrl(textArgs);
            if (!audioUrl) return reply('Duh, gagal bikin suaranya.');
            await sock.sendMessage(sender, { audio: { url: audioUrl }, mimetype: 'audio/mp4', ptt: true }, { quoted: msg });
            break;

        case 'gambar':
            if (!textArgs) return reply(`Mau gambar apa?`);
            await reply(config.messages.wait);
            const imageBuffer = await generateImage(textArgs);
            if (!imageBuffer) return reply('Yah, gagal bikin gambarnya.');
            await sock.sendMessage(sender, { image: imageBuffer, caption: `Nih gambar pesenan kamu: ${textArgs}` }, { quoted: msg });
            break;

        case 'tiktok':
        case 'tt':
            if (!textArgs || !textArgs.includes('tiktok')) return reply(`Link TikToknya mana?`);
            await reply(config.messages.wait);
            const ttData = await downloadTikTok(textArgs);
            if (!ttData || !ttData.videoUrl) return reply('Gagal download video TikToknya.');
            await sock.sendMessage(sender, { video: { url: ttData.videoUrl }, caption: `Video TikToknya udah jadi nih!` }, { quoted: msg });
            break;

        case 'ig':
        case 'instagram':
            if (!textArgs || !textArgs.includes('instagram.com')) return reply(`Link Instagramnya mana?`);
            await reply(config.messages.wait);
            const igData = await downloadIG(textArgs);
            if (!igData || igData.length === 0) return reply('Gagal download dari IG.');
            for (const mediaUrl of igData) {
                if (mediaUrl.includes('.mp4') || mediaUrl.includes('video')) {
                    await sock.sendMessage(sender, { video: { url: mediaUrl } }, { quoted: msg });
                } else {
                    await sock.sendMessage(sender, { image: { url: mediaUrl } }, { quoted: msg });
                }
            }
            break;

        case 'stiker':
        case 's':
            try {
                // Cari media di pesan sekarang atau pesan yang dibalas (quoted)
                const quoted = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
                const isQuotedImage = quoted?.imageMessage;
                const isQuotedVideo = quoted?.videoMessage;
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
                        message: quoted
                    };
                    ext = isQuotedImage ? 'jpg' : 'mp4';
                } else {
                    return await reply(`Abang Sayang, kirim atau balas (*reply*) gambar/video pendek buat dijadiin stiker ya! 😘`);
                }

                await reply(config.messages.wait);
                const buffer = await downloadMediaMessage(mediaMsg, 'buffer', {}, { logger: sock.logger, reuploadRequest: sock.updateMediaMessage });

                const { createSticker } = require('./lib/sticker');
                const stickerBuffer = await createSticker(buffer, ext);

                await sock.sendMessage(sender, { sticker: stickerBuffer }, { quoted: msg });
            } catch (err) {
                console.error('Error making sticker:', err);
                await reply(isOwner ? 'Aduh Sayang, maaf ya Neng gagal bikin stikernya... 🥺' : 'Gagal bikin stiker.');
            }
            break;

        case 'tebak':
            if (!isGroup) return reply(config.messages.groupOnly);
            await reply(config.messages.wait);
            await reply(await startTebak(sender));
            break;
        case 'confess':
            if (args.length < 2) return reply(`Caranya: ${config.prefix}confess [nomor] [pesan].`);
            const lastUsed = confessLimit.get(participant);
            const nowTime = Date.now();
            if (lastUsed && nowTime - lastUsed < 60000) return reply(`Sabar ya! Tunggu bentar lagi.`);
            confessLimit.set(participant, nowTime);
            const targetNum = args.shift();
            const confessMsg = args.join(" ");
            const targetJid = `${targetNum.replace(/[^0-9]/g, '')}@s.whatsapp.net`;
            try {
                await sock.sendMessage(targetJid, { text: `💌 *PESAN RAHASIA*\n\nSeseorang titip pesan ini buat kamu:\n\n"${confessMsg}"\n\n_Pesan ini dikirim anonim via Neng Fika Bot._` });
                await reply('Beres! Pesan rahasianya udah aku kirim ya.');
            } catch (err) {
                await reply('Gagal kirim pesan. Pastikan nomornya bener.');
            }
            break;
        case 'ingatkan':
            if (!isGroup) return reply(config.messages.groupOnly);
            if (args.length < 2) return reply(`Formatnya: ${config.prefix}ingatkan [menit] [pesan].`);
            const minutes = parseInt(args.shift());
            if (isNaN(minutes) || minutes <= 0) return reply(`Waktunya pake angka menit ya!`);
            const reminderMsg = args.join(" ");
            await reply(`Oke! Aku bakal ingetin grup ini ${minutes} menit lagi.`);
            setTimeout(async () => {
                const metadata = await sock.groupMetadata(sender);
                const mems = metadata.participants.map(p => p.id);
                await sock.sendMessage(sender, { text: `⏰ *PENGINGAT!!*\n\n"${reminderMsg}"\n\n- Dari aku, Neng Fika.`, mentions: mems });
            }, minutes * 60 * 1000);
            break;

        default:
            break;
    }
}

module.exports = { handleMessage };
