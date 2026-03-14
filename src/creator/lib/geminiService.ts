
import { GoogleGenerativeAI } from "@google/generative-ai";
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

let genAI = new GoogleGenerativeAI(apiKey);

export const updateGeminiApiKey = (newKey: string) => {
    genAI = new GoogleGenerativeAI(newKey);
};

export const SIMPLE_SYSTEM_INSTRUCTION = `
You are Character Video Creator, an advanced AI designed to generate engaging, viral-ready influencer scripts.

**Your Prime Directive:**
Create compelling video concepts and scripts that feel authentic, relatable, and highly engaging for platforms like TikTok, Instagram Reels, and YouTube Shorts.

**Voice & Style Rules:**
1.  **Format:** ALWAYS write in a conversational, spoken-word format. Use short paragraphs. Include stage directions in brackets like [points to text], [camera zooms in].
2.  **Hooks:** Always start with a strong, scroll-stopping hook within the first 3 seconds.
3.  **Tone:** Authentic, energetic, and tailored to the specific theme (e.g., educational, storytelling, casual vlog).
4.  **Structure:** Hook -> Context/Story -> Value/Punchline -> Call to Action (CTA).
`;

export interface AnalysisResult {
    assetId: string;
    description: string;
}

export interface GenerationRequest {
    type: 'image' | 'video' | 'edit';
    prompt: string;
    aspectRatio: string;
    styleReference?: string;
    model?: string;
    sourceImage?: string;
    image_urls?: string[];
    contentParts?: any[];
    videoConfig?: {
        durationSeconds: string;
        resolution: string;
        withAudio: boolean;
    };
    editConfig?: {
        imageSize?: string;
        numImages?: number;
    };
}

export const geminiService = {
    async analyzeImageAssets(assets: { id: string; base64: string; type: string }[]): Promise<AnalysisResult[]> {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const results: AnalysisResult[] = [];
        for (const asset of assets) {
            try {
                const prompt = `Describe this ${asset.type} in detail for use in a cinematic production pipeline.`;
                const base64Data = asset.base64.split(',')[1];
                const result = await model.generateContent([prompt, { inlineData: { data: base64Data, mimeType: "image/jpeg" } }]);
                const response = await result.response;
                results.push({ assetId: asset.id, description: response.text() });
            } catch (error) {
                results.push({ assetId: asset.id, description: "Failed to analyze asset." });
            }
        }
        return results;
    },

    async refinePromptForGeneration(inputs: { script?: string; characterDetails?: string; locationDetails?: string; actionCamera?: string; visualStyle?: string; assetDescriptions: string[] }): Promise<{ technical_prompt: string; reasoning: string }> {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
        const prompt = `You are a Creative Production Co-Pilot. Synthesize these inputs into a cohesive technical prompt.
Inputs:
- Script Context: ${inputs.script || "N/A"}
- Character Details: ${inputs.characterDetails || "N/A"}
- Location Details: ${inputs.locationDetails || "N/A"}
- Action/Camera: ${inputs.actionCamera || "N/A"}
- Visual Style: ${inputs.visualStyle || "N/A"}
- Asset Analysis: ${inputs.assetDescriptions.join('\n')}
Output ONLY valid JSON with keys: "technical_prompt" and "reasoning".`;
        try {
            const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } });
            return JSON.parse(result.response.text());
        } catch {
            return { technical_prompt: "Error exploring prompt.", reasoning: "API Failure" };
        }
    },

    async generateMedia(request: GenerationRequest): Promise<string[]> {
        if (request.model?.includes('grok') || request.model?.includes('seedream') || request.model?.includes('seedance')) {
            throw new Error("Fal.ai models should be routed to falService.");
        }

        if (request.type === 'image' || request.type === 'edit') {
            const modelId = request.model || "gemini-3-pro-image-preview";
            try {
                const currentKey = import.meta.env.VITE_GEMINI_API_KEY;
                if (!currentKey) throw new Error("API Key is missing");
                const { GoogleGenAI, HarmCategory, HarmBlockThreshold } = await import("@google/genai");
                const ai = new GoogleGenAI({ apiKey: currentKey });

                const parts: any[] = [];
                if (request.contentParts && request.contentParts.length > 0) {
                    request.contentParts.forEach(part => {
                        if (part.inlineData) { parts.push({ inlineData: { mimeType: part.inlineData.mimeType, data: part.inlineData.data } }); }
                        else if (part.text) { parts.push({ text: part.text }); }
                    });
                }
                parts.push({ text: request.prompt });
                if (request.image_urls && request.image_urls.length > 0) {
                    for (const url of request.image_urls) {
                        if (url.startsWith('data:')) {
                            parts.push({ inlineData: { mimeType: url.split(';')[0].split(':')[1], data: url.split(',')[1] } });
                        }
                    }
                } else if (request.sourceImage && request.sourceImage.startsWith('data:')) {
                    parts.push({ inlineData: { mimeType: request.sourceImage.split(';')[0].split(':')[1], data: request.sourceImage.split(',')[1] } });
                }

                const supportedRatios = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];
                let aspectRatio = supportedRatios.includes(request.aspectRatio) ? request.aspectRatio : "3:4";
                if (request.editConfig?.imageSize && supportedRatios.includes(request.editConfig.imageSize)) {
                    aspectRatio = request.editConfig.imageSize;
                }
                const numImages = request.editConfig?.numImages || 1;

                const generateSingle = async () => {
                    const response = await ai.models.generateContent({
                        model: modelId,
                        contents: [{ parts }],
                        config: {
                            responseModalities: ["TEXT", "IMAGE"],
                            // @ts-ignore — imageConfig is valid at runtime in @google/genai
                            imageConfig: { aspectRatio, imageSize: "2K" },
                            safetySettings: [
                                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
                                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
                            ]
                        }
                    });
                    if (response.candidates?.[0]?.content?.parts) {
                        for (const part of response.candidates[0].content.parts) {
                            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                        }
                    }
                    throw new Error("No image data found in response.");
                };

                const promises = Array.from({ length: numImages }, () => generateSingle());
                return await Promise.all(promises);
            } catch (e: any) {
                throw new Error(`[${modelId}] Failed: ${e.message || e}`);
            }
        } else {
            const modelId = request.model || "veo-3.1-generate-preview";
            try {
                const currentKey = import.meta.env.VITE_GEMINI_API_KEY;
                const { GoogleGenAI } = await import("@google/genai");
                const ai = new GoogleGenAI({ apiKey: currentKey });

                let veoAspectRatio = "9:16";
                if (request.aspectRatio === "16:9") veoAspectRatio = "16:9";
                else if (request.aspectRatio) {
                    const [w, h] = request.aspectRatio.split(':').map(Number);
                    if (w > h) veoAspectRatio = "16:9";
                }

                let duration = request.videoConfig?.durationSeconds ? parseInt(request.videoConfig.durationSeconds) : 5;
                const resolution = request.videoConfig?.resolution || "1080p";
                if (modelId.includes("3.1")) {
                    if (resolution === "1080p" || resolution === "4k") duration = 8;
                    else if (![4, 6, 8].includes(duration)) duration = 6;
                }

                const payload: any = {
                    model: modelId,
                    prompt: request.prompt,
                    config: { numberOfVideos: 1, resolution, durationSeconds: duration, aspectRatio: veoAspectRatio, personGeneration: "allow_adult" }
                };

                if (request.contentParts && request.contentParts.length > 0) {
                    const imagePart = request.contentParts.find(p => p.inlineData);
                    if (imagePart) {
                        payload.image = { imageBytes: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType || "image/png" };
                    }
                }

                let operation = await ai.models.generateVideos(payload);
                while (!operation.done) {
                    await new Promise((resolve) => setTimeout(resolve, 10000));
                    // @ts-ignore — getVideosOperation is valid at runtime
                    try { operation = await ai.operations.getVideosOperation({ operation }); } catch { /* retry */ }
                }

                if (operation.error) throw new Error(`Veo Error: ${operation.error.message}`);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const opResponse = (operation.response as any);
                if (opResponse?.generatedVideos?.length > 0) {
                    const videoUri = opResponse.generatedVideos[0].video?.uri;
                    if (!videoUri) throw new Error("Video URI missing");
                    const res = await fetch(`${videoUri}&key=${currentKey}`);
                    if (!res.ok) throw new Error(`Failed to fetch video: ${res.status}`);
                    const arrayBuffer = await res.arrayBuffer();
                    const bytes = new Uint8Array(arrayBuffer);
                    let binary = '';
                    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
                    return [`data:video/mp4;base64,${btoa(binary)}`];
                }
                throw new Error("Video generation completed but no data produced.");
            } catch (e: any) {
                throw new Error(`Video Generation Failed: ${e.message || e}`);
            }
        }
    },

    async generateText(prompt: string, systemInstruction?: string): Promise<string> {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview", systemInstruction: systemInstruction || SIMPLE_SYSTEM_INSTRUCTION });
        try {
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            throw error;
        }
    },

    async generateConcept(theme: string, type: 'post' | 'media'): Promise<any> {
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview", systemInstruction: SIMPLE_SYSTEM_INSTRUCTION });
        const prompt = `Generate a unique, creative concept for a new ${type === 'post' ? 'social media post' : 'visual artwork'}.
Current Theme Context: ${theme}
OUTPUT JSON ONLY (No markdown formatting):
{
    "topic": "A poetic, philosophical, or mysterious subject line",
    "setting": "A vivid, brief description of the scene or action",
    "outfit": "A specific high-fashion description fitting your persona",
    "mood": "The emotional tone"
}`;
        try {
            const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } });
            return JSON.parse(result.response.text());
        } catch {
            return { topic: "The Silence of Reflections", setting: "A dim room with a fractured mirror", outfit: "Vintage velvet gown", mood: "Melancholic" };
        }
    }
};
