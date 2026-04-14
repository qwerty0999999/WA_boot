require('dotenv').config();

module.exports = {
    botName: process.env.BOT_NAME || 'Neng Fika',
    prefix: process.env.PREFIX || '#',
    ownerNumber: process.env.OWNER_NUMBER || '6281234567890',
    messages: {
        wait: 'Bentar ya, lagi diproses nih...',
        groupOnly: 'Eh, fitur ini cuma bisa dipake di grup tauu.'
    }
};
