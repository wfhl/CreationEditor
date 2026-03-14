import { supabase } from './supabaseClient';
import { dbService, type DBStore } from './dbService';
import type { User } from '@supabase/supabase-js';

export const syncService = {
    user: null as User | null,
    recentlyDeleted: new Set<string>(),
    isSyncing: false,
    unsubscribe: null as (() => void) | null,

    init(user: User) {
        this.user = user;
        if (this.unsubscribe) this.unsubscribe();
        this.unsubscribe = dbService.subscribe(async (store, type, data) => {
            if (!this.user) return;
            try {
                if (type === 'delete') {
                    if (data.id === 'ALL') return;
                    if (data.id === 'BATCH' && data.ids && Array.isArray(data.ids)) {
                        for (const id of data.ids) this.recentlyDeleted.add(id);
                        dbService.trackDeletionBatch(data.ids).catch(console.error);
                        await this.removeFromCloudBatch(store, data.ids);
                    } else {
                        this.recentlyDeleted.add(data.id);
                        dbService.trackDeletion(data.id).catch(console.error);
                        await this.removeFromCloud(store, data.id);
                    }
                } else {
                    await this.syncToCloud(store, data);
                    this.recentlyDeleted.delete(data.id);
                }
            } catch (e) {
                console.error(`[Sync] Failed to sync ${store} ${type}:`, e);
            }
        });
        this.fullSync();
        this.subscribeToRealtime();
    },

    unsubscribeRealtime: null as (() => void) | null,

    subscribeToRealtime() {
        if (!this.user) return;
        const channels = ['assets', 'posts', 'presets', 'folders', 'generation_history'].map(table => {
            return supabase
                .channel(`remote-${table}-${this.user!.id}`)
                .on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${this.user!.id}` }, async (payload) => {
                    if (this.isSyncing) return;
                    const store = table as DBStore;
                    if (payload.eventType === 'DELETE') {
                        const id = (payload.old as any).id;
                        if (id) await dbService.deleteById(store, id);
                    } else {
                        const cloud = payload.new as any;
                        const mapped = this.mapFromCloud(store, cloud);
                        const exists = await dbService.getById(store, mapped.id);
                        if (exists && JSON.stringify(exists) === JSON.stringify(mapped)) return;
                        if (store === 'assets') { const dlAsset = await this.downloadAssetFromStorage(mapped); await dbService.saveAsset(dlAsset, true); }
                        else if (store === 'posts') await dbService.savePost(mapped, true);
                        else if (store === 'presets') await dbService.savePreset(mapped, true);
                        else if (store === 'folders') await dbService.saveFolder(mapped, true);
                        else if (store === 'generation_history') await dbService.saveGenerationHistory(mapped, true);
                    }
                }).subscribe();
        });
        this.unsubscribeRealtime = () => { channels.forEach(ch => supabase.removeChannel(ch)); };
    },

    async saveUserConfig(id: string, data: any) {
        if (!this.user) return;
        await supabase.auth.updateUser({ data: { [id]: data } });
    },

    async fullSync() {
        if (!this.user || this.isSyncing) return;
        this.isSyncing = true;
        try {
            await this.syncTable('folders');
            await this.syncTable('presets');
            await this.syncTable('posts');
            await this.syncTable('generation_history');
            await this.syncTable('assets');
        } catch (e) { console.error("[Sync] Full sync failed:", e); }
        finally { this.isSyncing = false; }
    },

    async syncTable(store: DBStore) {
        if (!this.user) return;
        const table = store;
        let localItems: any[] = [];
        if (store === 'assets') localItems = await dbService.getAllAssetsSlim();
        else if (store === 'posts') localItems = await dbService.getAllPostsSlim();
        else if (store === 'presets') localItems = await dbService.getAllPresets();
        else if (store === 'folders') localItems = await dbService.getAllFolders();
        else if (store === 'generation_history') localItems = await dbService.getRecentHistoryBatch(10000, 0, 'prev', undefined, true);

        const { data: cloudItems, error } = await supabase.from(table).select('id, user_id').eq('user_id', this.user.id);
        if (error) throw error;

        for (const local of localItems) {
            const existsInCloud = (cloudItems as any[])?.some(c => c.id === local.id);
            if (!existsInCloud) {
                let fullLocal = local;
                try {
                    if (store === 'generation_history') { const f = await dbService.getGenerationHistoryItem(local.id); if (f) fullLocal = f; }
                    else if (store === 'assets' || store === 'posts') { const f = await dbService.getById(store, local.id); if (f) fullLocal = f; }
                    await this.syncToCloud(store, fullLocal);
                } catch (e) { console.error(`[Sync] Skipping failed push:`, e); }
            }
        }

        const { data: fullCloudItems, error: fullError } = await supabase.from(table).select('*').eq('user_id', this.user.id);
        if (fullError) throw fullError;

        for (const cloud of fullCloudItems) {
            const isDeleted = await dbService.isDeleted(cloud.id);
            if (this.recentlyDeleted.has(cloud.id) || isDeleted) continue;
            const mapped = this.mapFromCloud(store, cloud);
            const existsLocally = localItems.find(l => l.id === cloud.id);
            if (existsLocally && !(store === 'generation_history' && existsLocally.status !== cloud.status)) continue;

            if (store === 'assets') { try { const dl = await this.downloadAssetFromStorage(mapped); await dbService.saveAsset(dl, true); } catch (e) { console.error(e); } }
            else if (store === 'posts') await dbService.savePost(mapped, true);
            else if (store === 'presets') await dbService.savePreset(mapped, true);
            else if (store === 'folders') await dbService.saveFolder(mapped, true);
            else if (store === 'generation_history') await dbService.saveGenerationHistory(mapped, true);
        }
    },

    async syncToCloud(store: DBStore, data: any) {
        if (!this.user) return;
        let payload = this.mapToCloud(store, data);
        payload.user_id = this.user.id;
        if (store === 'assets' && data.base64) {
            try { const { publicUrl, storagePath } = await this.uploadAssetToStorage(data); payload.public_url = publicUrl; payload.storage_path = storagePath; delete payload.base64; }
            catch (e) { console.error("Failed to upload asset", e); throw e; }
        } else if (store === 'assets') { delete payload.base64; }

        if (store === 'posts' || store === 'generation_history') {
            if (payload.media_urls?.length) {
                payload.media_urls = await Promise.all(payload.media_urls.map(async (url: string, i: number) => {
                    if (url?.startsWith('data:')) {
                        const ext = url.startsWith('data:video') ? 'mp4' : 'jpeg';
                        const folder = store === 'posts' ? 'posts' : 'history';
                        const fileName = `${folder}/${this.user!.id}/${data.id}_${i}_${Date.now()}.${ext}`;
                        const blob = await (await fetch(url)).blob();
                        const { error } = await supabase.storage.from('user-library').upload(fileName, blob, { contentType: blob.type, upsert: true });
                        if (error) throw error;
                        return supabase.storage.from('user-library').getPublicUrl(fileName).data.publicUrl;
                    }
                    return url;
                }));
            }
        }

        const { error } = await supabase.from(store).upsert(payload, { onConflict: 'id' });
        if (error) throw error;
    },

    async uploadAssetToStorage(asset: any): Promise<{ publicUrl: string; storagePath: string }> {
        const fileExt = asset.type === 'video' ? 'mp4' : 'jpeg';
        const fileName = `${this.user!.id}/${asset.id}.${fileExt}`;
        const blob = await (await fetch(asset.base64)).blob();
        const { error } = await supabase.storage.from('user-library').upload(fileName, blob, { contentType: asset.type === 'video' ? 'video/mp4' : 'image/jpeg', upsert: true });
        if (error) throw error;
        return { publicUrl: supabase.storage.from('user-library').getPublicUrl(fileName).data.publicUrl, storagePath: fileName };
    },

    async downloadAssetFromStorage(assetFromCloud: any): Promise<any> {
        const url = assetFromCloud.publicUrl || assetFromCloud.public_url;
        if (!url) throw new Error("No public URL for asset");
        const blob = await (await fetch(url)).blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve({ ...assetFromCloud, base64: reader.result as string });
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },

    async removeFromCloud(store: DBStore, id: string) {
        if (!this.user) return;
        await supabase.from(store).delete().eq('id', id).eq('user_id', this.user.id);
    },

    async removeFromCloudBatch(store: DBStore, ids: string[]) {
        if (!this.user || ids.length === 0) return;
        const chunkSize = 100;
        for (let i = 0; i < ids.length; i += chunkSize) {
            const chunk = ids.slice(i, i + chunkSize);
            await supabase.from(store).delete().in('id', chunk).eq('user_id', this.user.id);
        }
    },

    mapToCloud(_store: DBStore, data: any): any {
        const m: any = { ...data };
        if (data.folderId !== undefined) { m.folder_id = data.folderId; delete m.folderId; }
        if (data.parentId !== undefined) { m.parent_id = data.parentId; delete m.parentId; }
        if (data.timestamp !== undefined) { m.timestamp = new Date(data.timestamp).toISOString(); }
        if (data.withAudio !== undefined) { m.with_audio = data.withAudio; delete m.withAudio; }
        if (data.cameraFixed !== undefined) { m.camera_fixed = data.cameraFixed; delete m.cameraFixed; }
        if (data.mediaUrls !== undefined) { m.media_urls = data.mediaUrls; delete m.mediaUrls; }
        if (data.mediaType !== undefined) { m.media_type = data.mediaType; delete m.mediaType; }
        if (data.themeId !== undefined) { m.theme_id = data.themeId; delete m.themeId; }
        if (data.captionType !== undefined) { m.caption_type = data.captionType; delete m.captionType; }
        if (data.videoResolution !== undefined) { m.video_resolution = data.videoResolution; delete m.videoResolution; }
        if (data.videoDuration !== undefined) { m.video_duration = data.videoDuration; delete m.videoDuration; }
        if (data.imageSize !== undefined) { m.image_size = data.imageSize; delete m.imageSize; }
        if (data.numImages !== undefined) { m.num_images = data.numImages; delete m.numImages; }
        if (data.errorMessage !== undefined) { m.error_message = data.errorMessage; delete m.errorMessage; }
        if (data.themeName !== undefined) { m.theme_name = data.themeName; delete m.themeName; }
        if (data.basePrompt !== undefined) { m.base_prompt = data.basePrompt; delete m.basePrompt; }
        if (data.negativePrompt !== undefined) { m.negative_prompt = data.negativePrompt; delete m.negativePrompt; }
        if (data.aspectRatio !== undefined) { m.aspect_ratio = data.aspectRatio; delete m.aspectRatio; }
        if (data.inputImageUrl !== undefined) { m.input_image_url = data.inputImageUrl; delete m.inputImageUrl; }
        if (data.thumbnailUrls !== undefined) { m.thumbnail_urls = data.thumbnailUrls; delete m.thumbnailUrls; }
        if (data.requestId !== undefined) { m.request_id = data.requestId; delete m.requestId; }
        if (data.falEndpoint !== undefined) { m.fal_endpoint = data.falEndpoint; delete m.falEndpoint; }
        if (data.enhancePromptMode !== undefined) { m.enhance_prompt_mode = data.enhancePromptMode; delete m.enhancePromptMode; }
        return m;
    },

    mapFromCloud(_store: DBStore, data: any): any {
        const m: any = { ...data };
        if (data.folder_id !== undefined) { m.folderId = data.folder_id; delete m.folder_id; }
        if (data.parent_id !== undefined) { m.parentId = data.parent_id; delete m.parent_id; }
        if (data.timestamp !== undefined) { m.timestamp = new Date(data.timestamp).getTime(); }
        if (data.public_url !== undefined) { m.publicUrl = data.public_url; delete m.public_url; }
        if (data.storage_path !== undefined) { m.storagePath = data.storage_path; delete m.storage_path; }
        if (data.with_audio !== undefined) { m.withAudio = data.with_audio; delete m.with_audio; }
        if (data.camera_fixed !== undefined) { m.cameraFixed = data.camera_fixed; delete m.camera_fixed; }
        if (data.media_urls !== undefined) { m.mediaUrls = data.media_urls; delete m.media_urls; }
        if (data.media_type !== undefined) { m.mediaType = data.media_type; delete m.media_type; }
        if (data.theme_id !== undefined) { m.themeId = data.theme_id; delete m.theme_id; }
        if (data.caption_type !== undefined) { m.captionType = data.caption_type; delete m.caption_type; }
        if (data.video_resolution !== undefined) { m.videoResolution = data.video_resolution; delete m.video_resolution; }
        if (data.video_duration !== undefined) { m.videoDuration = data.video_duration; delete m.video_duration; }
        if (data.image_size !== undefined) { m.imageSize = data.image_size; delete m.image_size; }
        if (data.num_images !== undefined) { m.numImages = data.num_images; delete m.num_images; }
        if (data.error_message !== undefined) { m.errorMessage = data.error_message; delete m.error_message; }
        if (data.theme_name !== undefined) { m.themeName = data.theme_name; delete m.theme_name; }
        if (data.base_prompt !== undefined) { m.basePrompt = data.base_prompt; delete m.base_prompt; }
        if (data.negative_prompt !== undefined) { m.negativePrompt = data.negative_prompt; delete m.negative_prompt; }
        if (data.aspect_ratio !== undefined) { m.aspectRatio = data.aspect_ratio; delete m.aspect_ratio; }
        if (data.input_image_url !== undefined) { m.inputImageUrl = data.input_image_url; delete m.input_image_url; }
        if (data.thumbnail_urls !== undefined) { m.thumbnailUrls = data.thumbnail_urls; delete m.thumbnail_urls; }
        if (data.request_id !== undefined) { m.requestId = data.request_id; delete m.request_id; }
        if (data.fal_endpoint !== undefined) { m.falEndpoint = data.fal_endpoint; delete m.fal_endpoint; }
        if (data.enhance_prompt_mode !== undefined) { m.enhancePromptMode = data.enhance_prompt_mode; delete m.enhance_prompt_mode; }
        delete m.user_id;
        return m;
    }
};
