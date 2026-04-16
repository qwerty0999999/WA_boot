const { tmpdir } = require('os');
const { writeFileSync, readFileSync, unlinkSync } = require('fs');
const { join } = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Beritahu fluent-ffmpeg di mana lokasi mesin ffmpeg-static-nya
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Convert Image/Video to WebP Sticker format
 * @param {Buffer} mediaBuffer Media data
 * @param {string} ext Extension (e.g. 'jpg', 'mp4')
 * @returns {Promise<Buffer>}
 */
async function createSticker(mediaBuffer, ext) {
    return new Promise((resolve, reject) => {
        const tmpFileIn = join(tmpdir(), `${Date.now()}.${ext}`);
        const tmpFileOut = join(tmpdir(), `${Date.now()}.webp`);

        writeFileSync(tmpFileIn, mediaBuffer);

        const command = ffmpeg(tmpFileIn)
            .on('error', (err) => {
                try { unlinkSync(tmpFileIn); } catch (e) { }
                reject(err);
            })
            .on('end', () => {
                try {
                    const webpBuffer = readFileSync(tmpFileOut);
                    unlinkSync(tmpFileIn);
                    unlinkSync(tmpFileOut);
                    resolve(webpBuffer);
                } catch (e) {
                    reject(e);
                }
            });

        // Use appropriate ffmpeg args for image vs video
        if (ext === 'mp4') {
            command.addOutputOptions([
                "-vcodec", "libwebp",
                "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
                "-loop", "0",
                "-ss", "00:00:00.0",
                "-t", "00:00:05.0", // Max 5 seconds
                "-preset", "default",
                "-an",
                "-vsync", "0"
            ]);
        } else {
            command.addOutputOptions([
                "-vcodec", "libwebp",
                "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse"
            ]);
        }

        command.save(tmpFileOut);
    });
}

module.exports = { createSticker };
