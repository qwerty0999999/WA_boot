require('dotenv').config();

module.exports = {
    botName: process.env.BOT_NAME || 'Neng Fika',
    prefix: process.env.PREFIX || '#',
    ownerNumber: process.env.OWNER_NUMBER || '62895709028882',
    // Daftar ID yang dianggap Owner (Abang Rijal)
    owners: [
        '62895709028882@s.whatsapp.net',
        '120363423771563458@g.us'
    ],
    messages: {
        wait: 'Bentar ya, lagi diproses nih...',
        groupOnly: 'Eh, fitur ini cuma bisa dipake di grup tauu.'
    }
};
