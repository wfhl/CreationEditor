
import { fal } from "@fal-ai/client";

fal.config({ credentials: import.meta.env.VITE_FAL_KEY });

export const updateFalApiKey = (newKey: string) => {
    fal.config({ credentials: newKey });
};

export interface FalGenerationRequest {
    model: string;
    prompt: string;
    aspectRatio?: string;
    image_url?: string;
    video_url?: string;
    image_urls?: string[];
    contentParts?: any[];
    signal?: AbortSignal;
    videoConfig?: { durationSeconds: string; resolution: string; withAudio: boolean; cameraFixed?: boolean; };
    editConfig?: { imageSize?: string; numImages?: number; enableSafety?: boolean; enhancePromptMode?: "standard" | "fast"; };
    loras?: Array<{ path: string; scale?: number }>;
    onEnqueue?: (requestId: string, endpoint: string) => void;
}

export const falService = {
    async generateMedia(request: FalGenerationRequest): Promise<string[]> {
        let endpoint = "";
        let input: any = {};
        try {
            let primaryImageUrl = "";
            const additionalImageUrls: string[] = [];
            if (request.contentParts && request.contentParts.length > 0) {
                const imageParts = request.contentParts.filter(p => p.inlineData && p.inlineData.data);
                if (imageParts.length > 0) {
                    const p1 = imageParts[0];
                    primaryImageUrl = await this.uploadBase64ToFal(p1.inlineData.data, p1.inlineData.mimeType);
                    for (let i = 1; i < imageParts.length; i++) {
                        additionalImageUrls.push(await this.uploadBase64ToFal(imageParts[i].inlineData.data, imageParts[i].inlineData.mimeType));
                    }
                }
            } else if (request.image_url) {
                primaryImageUrl = request.image_url;
            }

            if (request.model.includes('xai/grok-imagine-video/image-to-video')) {
                endpoint = "xai/grok-imagine-video/image-to-video";
                let duration = request.videoConfig?.durationSeconds ? parseInt(request.videoConfig.durationSeconds.replace('s', '')) : 5;
                if (duration > 5 && duration < 10) duration = 5;
                if (duration > 10) duration = 10;
                input = { prompt: request.prompt, image_url: primaryImageUrl, duration, aspect_ratio: request.aspectRatio === 'auto' ? 'auto' : (request.aspectRatio || 'auto') };
            } else if (request.model === 'xai/grok-imagine-image/edit') {
                endpoint = "xai/grok-imagine-image/edit";
                input = { prompt: request.prompt, image_url: primaryImageUrl, num_images: request.editConfig?.numImages || 1, output_format: "jpeg" };
            } else if (request.model === 'xai/grok-imagine-image/text-to-image') {
                endpoint = "xai/grok-imagine-image/text-to-image";
                input = { prompt: request.prompt, num_images: request.editConfig?.numImages || 1, aspect_ratio: request.aspectRatio || "3:4", output_format: "jpeg" };
            } else if (request.model.includes('seedream') && request.model.includes('edit')) {
                endpoint = request.model;
                let imageSize = request.editConfig?.imageSize || "auto_4K";
                if (request.model.includes('v5/lite') && imageSize === "auto_4K") imageSize = "auto_2K";
                input = { prompt: request.prompt, image_urls: [primaryImageUrl, ...additionalImageUrls], image_size: imageSize, num_images: request.editConfig?.numImages || 1, enable_safety_checker: request.editConfig?.enableSafety ?? false, enhance_prompt_mode: request.editConfig?.enhancePromptMode || "standard" };
            } else if (request.model.includes('seedream') && request.model.includes('text-to-image')) {
                endpoint = request.model;
                let imageSize = request.editConfig?.imageSize || "auto_4K";
                if (request.model.includes('v5/lite') && imageSize === "auto_4K") imageSize = "auto_2K";
                input = { prompt: request.prompt, image_size: imageSize, num_images: request.editConfig?.numImages || 1, image_urls: primaryImageUrl ? [primaryImageUrl, ...additionalImageUrls] : undefined, enable_safety_checker: request.editConfig?.enableSafety ?? false, enhance_prompt_mode: request.editConfig?.enhancePromptMode || "standard" };
            } else if (request.model.includes('wan/v2.6/image-to-video/flash')) {
                endpoint = "wan/v2.6/image-to-video/flash";
                input = { prompt: request.prompt, image_url: primaryImageUrl, resolution: request.videoConfig?.resolution || "1080p", duration: request.videoConfig?.durationSeconds?.replace('s', '') || "5", enable_prompt_expansion: true, enable_safety_checker: request.editConfig?.enableSafety ?? false };
            } else if (request.model.includes('fal-ai/wan-25-preview/image-to-video')) {
                endpoint = "fal-ai/wan-25-preview/image-to-video";
                input = { prompt: request.prompt, image_url: primaryImageUrl, resolution: request.videoConfig?.resolution || "1080p", duration: request.videoConfig?.durationSeconds?.replace('s', '') || "5", enable_prompt_expansion: true, enable_safety_checker: request.editConfig?.enableSafety ?? false };
            } else if (request.model.includes('seedance/v1.5/pro')) {
                endpoint = "fal-ai/bytedance/seedance/v1.5/pro/image-to-video";
                const apiAspectRatio = (request.aspectRatio === 'auto' || !request.aspectRatio) ? "16:9" : request.aspectRatio;
                input = { prompt: request.prompt, image_url: primaryImageUrl, aspect_ratio: apiAspectRatio, resolution: request.videoConfig?.resolution || "720p", duration: request.videoConfig?.durationSeconds?.replace('s', '') || "5", camera_fixed: request.videoConfig?.cameraFixed || false, generate_audio: request.videoConfig?.withAudio ?? true, enable_safety_checker: request.editConfig?.enableSafety ?? false };
            } else if (request.model.includes('wan/v2.2-a14b/image-to-video/lora')) {
                endpoint = "fal-ai/wan/v2.2-a14b/image-to-video/lora";
                const durationStr = request.videoConfig?.durationSeconds?.replace('s', '') || "5";
                const filteredLoras = (request.loras || []).filter(l => l.path && l.path.trim() !== "");
                let apiAspectRatio = request.aspectRatio || "auto";
                if (!["auto", "16:9", "9:16", "1:1"].includes(apiAspectRatio)) apiAspectRatio = "auto";
                input = { prompt: request.prompt.trim(), image_url: primaryImageUrl, resolution: request.videoConfig?.resolution === "1080p" ? "720p" : (request.videoConfig?.resolution || "720p"), aspect_ratio: apiAspectRatio, enable_safety_checker: request.editConfig?.enableSafety ?? false };
                if (durationStr === "10" || durationStr === "15") { input.num_frames = 161; input.frames_per_second = 16; }
                if (filteredLoras.length > 0) input.loras = filteredLoras;
            } else if (request.model === 'fal-ai/wan/v2.2-14b/animate/move') {
                endpoint = "fal-ai/wan/v2.2-14b/animate/move";
                input = { video_url: request.video_url, image_url: primaryImageUrl, guidance_scale: 1, num_inference_steps: 20, enable_safety_checker: request.editConfig?.enableSafety ?? false };
            } else if (request.model === 'fal-ai/wan/v2.2-14b/animate/replace') {
                endpoint = "fal-ai/wan/v2.2-14b/animate/replace";
                input = { video_url: request.video_url, image_url: primaryImageUrl, guidance_scale: 1, num_inference_steps: 20, enable_safety_checker: request.editConfig?.enableSafety ?? false };
            } else if (request.model === 'xai/grok-imagine-video/edit-video') {
                endpoint = "xai/grok-imagine-video/edit-video";
                input = { prompt: request.prompt, video_url: request.video_url, resolution: request.videoConfig?.resolution || "auto" };
            } else {
                throw new Error(`Unsupported Fal model: ${request.model}`);
            }

            let enqueuedCalled = false;
            const result: any = await fal.subscribe(endpoint, {
                input,
                logs: true,
                signal: request.signal,
                onQueueUpdate: (update: any) => {
                    if (request.onEnqueue && update.request_id && !enqueuedCalled) {
                        enqueuedCalled = true;
                        request.onEnqueue(update.request_id, endpoint);
                    }
                }
            });

            const mediaUrls: string[] = [];
            if (result.data?.video?.url) mediaUrls.push(result.data.video.url);
            else if (result.video?.url) mediaUrls.push(result.video.url);
            if (result.data?.images?.length > 0) result.data.images.forEach((img: any) => mediaUrls.push(img.url));
            else if (result.images?.length > 0) result.images.forEach((img: any) => mediaUrls.push(img.url));

            if (mediaUrls.length > 0) {
                const isVideo = (url: string) => ['.mp4', '.mov', '.webm', '.m4v', '.ogv'].some(ext => url.split('?')[0].toLowerCase().endsWith(ext));
                await Promise.all(mediaUrls.map(async (url) => { if (!isVideo(url)) { try { await fetch(url); } catch {} } }));
                return mediaUrls;
            }
            throw new Error(`No media URL in Fal response.`);
        } catch (e: any) {
            let detail = e.message || e;
            if (e.body && typeof e.body === 'object') detail += " - " + JSON.stringify(e.body);
            throw new Error(`Fal Failed: ${detail}`);
        }
    },

    async uploadBase64ToFal(base64Data: string, mimeType: string = 'image/jpeg'): Promise<string> {
        const dataURI = base64Data.startsWith('data:') ? base64Data : `data:${mimeType};base64,${base64Data}`;
        const blob = await (await fetch(dataURI)).blob();
        return await this.uploadFile(blob);
    },

    async uploadFile(file: File | Blob): Promise<string> {
        return await fal.storage.upload(file);
    },

    async checkGenerationStatus(requestId: string, endpoint: string, retries = 3): Promise<{ status: 'pending' | 'success' | 'failed', mediaUrls?: string[], error?: string }> {
        try {
            const statusResult: any = await fal.queue.status(endpoint, { requestId, logs: false });
            if (statusResult.status === 'COMPLETED') {
                const result: any = await fal.queue.result(endpoint, { requestId });
                const mediaUrls: string[] = [];
                if (result.data?.video?.url) mediaUrls.push(result.data.video.url);
                else if (result.video?.url) mediaUrls.push(result.video.url);
                if (result.data?.images?.length > 0) result.data.images.forEach((img: any) => mediaUrls.push(img.url));
                else if (result.images?.length > 0) result.images.forEach((img: any) => mediaUrls.push(img.url));
                if (mediaUrls.length > 0) return { status: 'success', mediaUrls };
                return { status: 'failed', error: 'No media URLs found' };
            } else if (['IN_PROGRESS', 'IN_QUEUE'].includes(statusResult.status)) {
                return { status: 'pending' };
            }
            return { status: 'failed', error: `Status: ${statusResult.status}` };
        } catch (e: any) {
            if (retries > 0) {
                await new Promise(res => setTimeout(res, (4 - retries) * 1000));
                return this.checkGenerationStatus(requestId, endpoint, retries - 1);
            }
            return { status: 'failed', error: e.message || 'Unknown error' };
        }
    }
};
