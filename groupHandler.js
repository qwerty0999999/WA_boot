const config = require('./config');

async function handleGroupParticipantsUpdate(sock, update) {
    const { id, participants, action } = update;
    try {
        const groupMetadata = await sock.groupMetadata(id);
        const groupName = groupMetadata.subject;

        if (action === 'add') {
            for (let num of participants) {
                // Send welcome message
                const msg = `Halo @${num.split('@')[0]}, selamat datang di grup *${groupName}* (The Choliest)! 🎉\n\nJangan lupa baca deskripsi grup ya. Ketik ${config.prefix}menu untuk melihat fitur Si-Choli.`;
                await sock.sendMessage(id, { text: msg, mentions: [num] });
            }
        } else if (action === 'remove') {
            for (let num of participants) {
                // Send goodbye message (optional, but good to have)
                const msg = `Selamat jalan @${num.split('@')[0]} dari grup *${groupName}*. 👋`;
                await sock.sendMessage(id, { text: msg, mentions: [num] });
            }
        }
    } catch (err) {
        console.error('Error in handling group update:', err);
    }
}

module.exports = { handleGroupParticipantsUpdate };
