const axios = require('axios');
const igdl = require('fg-ig');

async function downloadTikTok(url) {
    try {
        const res = await axios.post('https://tikwm.com/api/', { url: url, count: 12, cursor: 0, web: 1, hd: 1 });
        if (res.data && res.data.code === 0) {
            return {
                title: res.data.data.title,
                videoUrl: res.data.data.play,
                hdUrl: res.data.data.hdplay,
                audioUrl: res.data.data.music
            };
        }
        return null;
    } catch (e) {
        console.error('TikTok DL Error:', e);
        return null;
    }
}

async function downloadIG(url) {
    try {
        // fg-ig returns something like { url_list: [...] } or array, let's just make it flexible
        const result = await igdl(url);
        if (result && result.url_list && result.url_list.length > 0) {
            return result.url_list;
        } else if (Array.isArray(result) && result.length > 0) {
            // some versions of fg-ig return array of objects like [{url: "...", type: "video"}]
            return result.map(m => m.url || m);
        }
        return null;
    } catch (e) {
        console.error('IG DL Error:', e);
        return null;
    }
}

module.exports = { downloadTikTok, downloadIG };
