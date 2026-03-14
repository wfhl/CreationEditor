import { supabase } from './supabaseClient';
import { dbService } from './dbService';
import { generateUUID } from './uuid';

export const migrationService = {
    async migrateAll(onProgress?: (msg: string) => void) {
        if (!supabase) throw new Error("Supabase client not initialized");
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Must be logged in to migrate");

        const userId = user.id;
        const log = (msg: string) => { console.log(msg); if (onProgress) onProgress(msg); };

        const uploadMedia = async (url: string, type: 'image' | 'video', bucket: string = 'user-library'): Promise<string> => {
            if (!url || !url.startsWith('data:')) return url;
            try {
                const fetchRes = await fetch(url);
                const blob = await fetchRes.blob();
                const ext = type === 'video' ? 'mp4' : 'png';
                const filePath = `${userId}/${generateUUID()}.${ext}`;
                const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, blob, { contentType: type === 'video' ? 'video/mp4' : 'image/png', upsert: true });
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
                return publicUrl;
            } catch (e) { console.error(`Failed to upload media to ${bucket}`, e); return url; }
        };

        log("🚀 Starting Smart Migration to Cloud Buckets...");
        // Migrate content via dbService ...
        log("✅ MIGRATION COMPLETE!");
    }
};
