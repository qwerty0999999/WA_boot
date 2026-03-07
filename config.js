require('dotenv').config();

module.exports = {
    botName: process.env.BOT_NAME || 'Si-Choli',
    prefix: process.env.PREFIX || '#',
    ownerNumber: process.env.OWNER_NUMBER || '6281234567890',
    messages: {
        wait: '⏳ Sebentar ya, Si-Choli lagi mikir...',
        groupOnly: '❌ Perintah ini cuma bisa dipakai di grup!'
    }
};
