require('dotenv').config();
const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const NodeCache = require('node-cache');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');
const useSupabaseAuthState = require('./lib/supabaseAuthState');
const config = require('./config');
const { handleMessage } = require('./messageHandler');
const { handleGroupParticipantsUpdate } = require('./groupHandler');
const { startCronJobs, updateCronSocket } = require('./cronHandler');
const logger = require('./lib/logger');

// Caching options
const msgRetryCounterCache = new NodeCache();

let cronStarted = false;

const supabase = require('./lib/supabaseClient');

async function startBot() {
    let state, saveCreds, clearState;

    if (supabase) {
        logger.info('Menghubungkan ke Supabase (via client shared)...');
        const authInfo = await useSupabaseAuthState(supabase, 'whatsapp_sessions');
        state = authInfo.state;
        saveCreds = authInfo.saveCreds;
        clearState = authInfo.clearState;
    } else {
        logger.warn('Supabase URI/Key tidak ditemukan, menggunakan auto-save lokal (auth_info_baileys)...');
        const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
        const authInfo = await useMultiFileAuthState(config.sessionsDir);
        state = authInfo.state;
        saveCreds = authInfo.saveCreds;
        const fs = require('fs');
        clearState = async () => {
            if (fs.existsSync(config.sessionsDir)) {
                fs.rmSync(config.sessionsDir, { recursive: true, force: true });
                logger.info('[Local] Folder session lama berhasil dihapus.');
            }
        };
    }

    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.info(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }), // Still silences Baileys logs to keep terminal clean
        auth: state,
        msgRetryCounterCache,
        generateHighQualityLinkPreview: false, // Disabled due to a bug in Baileys that crashes on regex match when reading undefined messages
        syncFullHistory: false, // Prevents downloading huge message history on startup
        markOnlineOnConnect: true,
        getMessage: async (key) => {
            return {
                conversation: 'Permintaan tertunda',
            };
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            logger.info('QR Code received. Scan now!');
            console.log('\n======================================================');
            console.log('⚡ KLIK LINK INI UNTUK SCAN QR CODE (LEBIH JELAS) ⚡');
            console.log(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qr)}`);
            console.log('======================================================\n');
            // Tetap print di terminal sebagai backup cadangan
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            logger.error(`Connection closed due to ${lastDisconnect.error}. Reconnecting: ${shouldReconnect}`);
            // reconnect if not logged out
            if (shouldReconnect) {
                logger.info('Reconnecting in 5 seconds...');
                setTimeout(() => startBot(), 5000);
            } else {
                logger.warn('Sesi tidak valid / logged out. Menghapus sesi lama dan merestart dalam 3 detik...');
                if (clearState) {
                    await clearState();
                }
                setTimeout(() => startBot(), 3000);
            }
        } else if (connection === 'open') {
            logger.info('Connected to WhatsApp! Bot is ready.');
            if (!cronStarted) {
                startCronJobs(sock);
                cronStarted = true;
            } else {
                updateCronSocket(sock);
            }
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        if (!m.messages || !m.messages[0]) return;
        const msg = m.messages[0];
        if (!msg.message) return;

        // Log incoming messages for debugging
        const messageContent = msg.message.conversation || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || "";
        if (messageContent && !msg.key.fromMe) {
            logger.info(`[Pesan Masuk] Dari: ${msg.key.remoteJid} -> ${messageContent}`);
        }

        try {
            await handleMessage(sock, msg);
        } catch (error) {
            logger.error('Error handling message:', error);
            // Auto Report to Owner
            try {
                const ownerJid = config.ownerNumber + '@s.whatsapp.net';
                const errorReport = `⚠️ *AUTO REPORT: BOT ERROR!* ⚠️\n\n` +
                    `*Pesan dari:* ${msg.key.remoteJid}\n` +
                    `*Isi Pesan:* ${messageContent}\n\n` +
                    `*Pesan Error:*\n${error.message}\n\n` +
                    `_Tolong segera cek panel VS Code/Railway bos RF Digital!_`;

                await sock.sendMessage(ownerJid, { text: errorReport });
            } catch (err) {
                logger.error("Gagal mengirim laporan error ke owner:", err);
            }
        }
    });

    sock.ev.on('group-participants.update', async (update) => {
        try {
            await handleGroupParticipantsUpdate(sock, update);
        } catch (error) {
            logger.error('Error handling group participants update:', error);
        }
    });

    return sock;
}

// Minimal Express Web Server for Railway Health Check
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Si-Choli WA Bot is Running OK!');
});

app.listen(port, () => {
    logger.info(`[SYS] Health Check Web Server running on port ${port}`);
    startBot();
});
