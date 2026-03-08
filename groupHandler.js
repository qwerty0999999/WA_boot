const config = require('./config');

async function handleGroupParticipantsUpdate(sock, update) {
    const { id, participants, action } = update;
    try {
        const groupMetadata = await sock.groupMetadata(id);
        const groupName = groupMetadata.subject;

        if (action === 'add') {
            for (let num of participants) {
                const jid = typeof num === 'string' ? num : (num.id || String(num));
                if (!jid) continue;
                // Send welcome message
                const msg = `Halo @${jid.split('@')[0]}, selamat datang di grup *${groupName}* (The Choliest)! 🎉\n\nJangan lupa baca deskripsi grup ya. Ketik ${config.prefix}menu untuk melihat fitur Si-Choli.`;
                await sock.sendMessage(id, { text: msg, mentions: [jid] });
            }
        } else if (action === 'remove') {
            for (let num of participants) {
                const jid = typeof num === 'string' ? num : (num.id || String(num));
                if (!jid) continue;
                // Send goodbye message (optional, but good to have)
                const msg = `Selamat jalan @${jid.split('@')[0]} dari grup *${groupName}*. 👋`;
                await sock.sendMessage(id, { text: msg, mentions: [jid] });
            }
        }
    } catch (err) {
        console.error('Error in handling group update:', err);
    }
}

module.exports = { handleGroupParticipantsUpdate };
