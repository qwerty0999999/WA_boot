require('dotenv').config();

module.exports = {
    botName: process.env.BOT_NAME || 'Neng Fika',
    prefix: process.env.PREFIX || '#',
    ownerNumber: '62895709028882', // Nomor asli Abang
    // ID tetap Abang Rijal
    owners: [
        '62895709028882@s.whatsapp.net',
        '120363423771563458@g.us', // ID Abang di grup
        '119310097883318@lid',
        '142580314550307@lid'
    ],
    messages: {
        wait: 'Bentar ya Sayang, lagi diproses...',
        groupOnly: 'Eh, fitur ini cuma bisa dipake di grup tauu.'
    }
};
