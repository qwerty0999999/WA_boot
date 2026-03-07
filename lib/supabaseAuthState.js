const { proto, BufferJSON, initAuthCreds } = require('@whiskeysockets/baileys');

module.exports = async (supabase, tableName = 'whatsapp_sessions') => {
    // Pastikan tabel sudah ada (Anda perlu membuat tabel 'whatsapp_sessions' dengan kolom 'id' (text, primary key) dan 'data' (jsonb))

    // In-memory cache to speed up reads and minimize database hits
    const cache = new Map();

    const writeData = async (data, id) => {
        try {
            const informationToStore = JSON.parse(JSON.stringify(data, BufferJSON.replacer));
            // Update cache
            const parsedData = JSON.parse(JSON.stringify(informationToStore), BufferJSON.reviver);
            cache.set(id, parsedData);

            const { error } = await supabase
                .from(tableName)
                .upsert({ id: id, data: informationToStore }, { onConflict: 'id' });

            if (error) console.error(`[Supabase Error] Gagal save session ${id}:`, error.message);
        } catch (err) {
            console.error(err);
        }
    };

    const readData = async (id) => {
        // Return from cache if available (very fast)
        if (cache.has(id)) {
            return cache.get(id);
        }

        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('data')
                .eq('id', id)
                .single();

            if (data && data.data) {
                const parsed = JSON.parse(JSON.stringify(data.data), BufferJSON.reviver);
                // Save to cache for future requests
                cache.set(id, parsed);
                return parsed;
            }
            return null;
        } catch (error) {
            // Error "Row not found" is normal for new keys
            return null;
        }
    };

    const removeData = async (id) => {
        try {
            // Remove from cache
            cache.delete(id);

            await supabase
                .from(tableName)
                .delete()
                .eq('id', id);
        } catch (error) { }
    };

    let creds = await readData('creds');
    if (!creds) {
        creds = initAuthCreds();
        await writeData(creds, 'creds'); // writeData will also cache it
    }

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const upsertDataRows = [];
                    const deleteIds = [];

                    for (const category of Object.keys(data)) {
                        for (const id of Object.keys(data[category])) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;

                            if (value) {
                                const informationToStore = JSON.parse(JSON.stringify(value, BufferJSON.replacer));
                                const parsedData = JSON.parse(JSON.stringify(informationToStore), BufferJSON.reviver);

                                // Update cache synchronously
                                cache.set(key, parsedData);

                                upsertDataRows.push({ id: key, data: informationToStore });
                            } else {
                                // Delete from cache synchronously
                                cache.delete(key);

                                deleteIds.push(key);
                            }
                        }
                    }

                    // Run Supabase requests in parallel
                    const tasks = [];

                    if (upsertDataRows.length > 0) {
                        // Bulk upsert is much faster than individual upserts
                        tasks.push(
                            supabase
                                .from(tableName)
                                .upsert(upsertDataRows, { onConflict: 'id' })
                                .then(({ error }) => {
                                    if (error) console.error('[Supabase Error] Gagal batch upsert:', error.message);
                                })
                        );
                    }

                    if (deleteIds.length > 0) {
                        // Bulk delete
                        tasks.push(
                            supabase
                                .from(tableName)
                                .delete()
                                .in('id', deleteIds)
                                .then(({ error }) => {
                                    if (error) console.error('[Supabase Error] Gagal batch delete:', error.message);
                                })
                        );
                    }

                    // Await all bulk operations before returning
                    await Promise.all(tasks);
                },
            }
        },
        saveCreds: () => {
            return writeData(creds, 'creds');
        },
        clearState: async () => {
            try {
                cache.clear();
                const { error } = await supabase
                    .from(tableName)
                    .delete()
                    .neq('id', '');

                if (error) {
                    console.error('[Supabase Error] Gagal clear session:', error.message);
                } else {
                    console.log(`[Supabase] Semua session berhasil dihapus dari tabel ${tableName}`);
                }
            } catch (err) {
                console.error('[Supabase Error] Terjadi kesalahan saat clear session:', err);
            }
        }
    };
};
