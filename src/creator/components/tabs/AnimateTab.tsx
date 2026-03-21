import React, { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Video as VideoIcon, ImagePlus, X, RefreshCw, Play, Save, Download, Layers, Sparkles, Upload, Trash2, Loader2, Camera } from 'lucide-react';
import { CustomSelect } from '../CustomSelect';

import LoadingIndicator from '../loading-indicator';
import { ImageWithLoader } from '../image-with-loader';
import { dbService } from '../../lib/dbService';
import { generateUUID } from '../../lib/uuid';

interface AnimateTabProps {
    i2vTarget: { url: string, index: number } | null;
    setI2VTarget: (val: { url: string, index: number } | null) => void;
    i2vPrompt: string;
    setI2VPrompt: (val: string) => void;
    i2vAspectRatio: string;
    setI2VAspectRatio: (val: string) => void;
    videoDuration: string;
    setVideoDuration: (val: string) => void;
    videoResolution: string;
    setVideoResolution: (val: string) => void;
    selectedModel: string;
    setSelectedModel: (val: string) => void;
    i2vScript: string;
    setI2VScript: (val: string) => void;
    isGeneratingI2V: boolean;
    onGenerateI2V: () => void;
    onCancelI2V: () => void;
    generatedI2VUrl: string | null;
    onExit: () => void;

    onApproveI2V: () => void;
    onDiscardI2V: () => void;
    presetsDropdown: React.ReactNode;
    onSaveToAssets: (url: string, type: 'image' | 'video', name?: string) => void;
    onPreview: (url: string, urls?: string[]) => void;
    onDownload: (url: string, prefix?: string) => void;

    // New Props for Seedance
    withAudio?: boolean;
    setWithAudio?: (val: boolean) => void;
    cameraFixed?: boolean;
    setCameraFixed?: (val: boolean) => void;

    loras: Array<{ path: string; scale: number }>;
    setLoras: (loras: Array<{ path: string; scale: number }>) => void;
    onLoRAUpload: (file: File) => Promise<void>;
    promptRef?: React.Ref<HTMLTextAreaElement>;
    apiKeys: { gemini: string; fal: string };
    onNavigateTo?: (tab: string) => void;
}

export function AnimateTab({
    i2vTarget,
    setI2VTarget,
    i2vPrompt,
    setI2VPrompt,
    i2vAspectRatio,
    setI2VAspectRatio,
    videoDuration,
    setVideoDuration,
    videoResolution,
    setVideoResolution,
    selectedModel,
    setSelectedModel,
    i2vScript,
    setI2VScript,
    isGeneratingI2V,
    onGenerateI2V,
    onCancelI2V,
    generatedI2VUrl,
    onExit,
    onApproveI2V,
    onDiscardI2V,
    presetsDropdown,
    onSaveToAssets,
    onPreview,
    onDownload,
    withAudio,
    setWithAudio,
    cameraFixed,
    setCameraFixed,
    loras,
    setLoras,
    onLoRAUpload,
    promptRef,
    apiKeys,
    onNavigateTo
}: AnimateTabProps) {
    const [isDragging, setIsDragging] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const captureFrame = (): string | null => {
        const video = videoRef.current;
        if (!video) return null;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0);
        return canvas.toDataURL('image/png');
    };

    // Ensure we are on a video model when mounting or if model is invalid
    useEffect(() => {
        const isVideoModel = selectedModel.includes('video') || selectedModel.includes('veo') || selectedModel.includes('seedance') || selectedModel.includes('wan');
        if (!isVideoModel) {
            setSelectedModel('wan/v2.6/image-to-video/flash');
            setVideoDuration('5s');
            setVideoResolution('720p');
        }
    }, [selectedModel, setSelectedModel, setVideoDuration, setVideoResolution]);

    const handleI2VImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (re) => {
                if (re.target?.result) {
                    setI2VTarget({ url: re.target.result as string, index: -1 });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveLoRA = async (url: string) => {
        if (!url) return;
        try {
            const folders = await dbService.getAllFolders();
            let folder = folders.find(f => f.name === 'WAN LoRA');
            if (!folder) {
                folder = { id: generateUUID(), name: 'WAN LoRA', parentId: null, timestamp: Date.now(), icon: 'layers' };
                await dbService.saveFolder(folder);
            }
            const name = url.split('/').pop()?.split('?')[0] || 'Unknown LoRA';
            await dbService.saveAsset({ id: generateUUID(), name, type: 'lora', base64: url, folderId: folder.id, timestamp: Date.now() });
            alert(`Saved "${name}" to WAN LoRA folder!`);
        } catch (e) {
            console.error(e);
            alert("Failed to save LoRA.");
        }
    };

    return (
        <div className="flex h-full w-full pointer-events-auto">
            {/* === LEFT COLUMN: CONTROLS === */}
            <div className="creator-panel">
                <div className="creator-panel-body">
                    {/* Header */}
                    <div className="creator-panel-header">
                        <div className="creator-panel-header-icon">
                            <VideoIcon className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="creator-panel-title">Setup</span>
                    </div>

                    {/* Source Media */}
                    <div className="creator-field">
                        <label className="creator-label">Source Image</label>
                        {i2vTarget ? (
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-emerald-500/30 shadow-lg group">
                                <img src={i2vTarget.url} alt="Source" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label className="cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 transition-all">
                                        <ImagePlus className="w-4 h-4 text-emerald-400" />
                                        <span style={{ fontSize: '9px', color: 'white', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-ui)' }}>Replace</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleI2VImageUpload} />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <label className="creator-upload-zone">
                                <Upload className="w-5 h-5 creator-upload-zone-icon" />
                                <span className="creator-upload-zone-label">Upload Image</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleI2VImageUpload} />
                            </label>
                        )}
                    </div>

                    {/* AI Model & Params */}
                    <div className="creator-field">
                        <label className="creator-label">AI Model Engine</label>
                        <CustomSelect
                            value={selectedModel}
                            onChange={setSelectedModel}
                            options={[
                                { value: 'wan/v2.6/image-to-video/flash', label: 'Wan 2.6 Flash' },
                                { value: 'fal-ai/wan-25-preview/image-to-video', label: 'Wan 2.5 Preview' },
                                { value: 'fal-ai/bytedance/seedance/v1.5/pro/image-to-video', label: 'Seedance 1.5 Pro' },
                                { value: 'xai/grok-imagine-video/image-to-video', label: 'Grok 2 Video' },
                                { value: 'veo-3.1-generate-preview', label: 'Veo 3.1 (Google)' },
                            ]}
                        />
                    </div>

                    <div className="creator-field-grid">
                        <div className="creator-field">
                            <label className="creator-label">Resolution</label>
                            <CustomSelect
                                value={videoResolution}
                                onChange={setVideoResolution}
                                options={[
                                    { value: '720p', label: '720p' },
                                    { value: '1080p', label: '1080p (8s only)' },
                                    { value: '4k', label: '4K (8s only)' },
                                ]}
                            />
                        </div>
                        <div className="creator-field">
                            <label className="creator-label">Length</label>
                            <CustomSelect
                                value={videoDuration}
                                onChange={setVideoDuration}
                                options={[
                                    { value: '4s', label: '4 Seconds' },
                                    { value: '6s', label: '6 Seconds' },
                                    { value: '8s', label: '8 Seconds' },
                                ]}
                            />
                        </div>
                    </div>

                    <div className="creator-field">
                        <label className="creator-label">Aspect Ratio</label>
                        <CustomSelect
                            value={i2vAspectRatio}
                            onChange={setI2VAspectRatio}
                            options={[
                                { value: 'auto', label: 'Auto (Matches Image)' },
                                { value: '16:9', label: '16:9 Landscape' },
                                { value: '9:16', label: '9:16 Vertical' },
                                { value: '1:1', label: '1:1 Square' },
                            ]}
                        />
                    </div>

                    {/* Seedance Options */}
                    {selectedModel.includes('seedance') && (
                        <div className="creator-field">
                            <div className="creator-section-divider" />
                            <div className="flex gap-2">
                                <label className="creator-checkbox-label flex-1">
                                    <input type="checkbox" checked={withAudio} onChange={(e) => setWithAudio?.(e.target.checked)} />
                                    <span>Audio</span>
                                </label>
                                <label className="creator-checkbox-label flex-1">
                                    <input type="checkbox" checked={cameraFixed} onChange={(e) => setCameraFixed?.(e.target.checked)} />
                                    <span>Fix Camera</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* LoRA Controls */}
                    {selectedModel.includes('lora') && (
                        <div className="creator-field">
                            <div className="creator-section-divider" />
                            <div className="flex justify-between items-center">
                                <label className="creator-label"><Layers className="w-3 h-3 text-emerald-500" /> LoRAs</label>
                                <button onClick={() => setLoras([...loras, { path: '', scale: 1.0 }])} style={{ fontSize: '9px', color: 'rgb(52,211,153)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-ui)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add</button>
                            </div>
                            <div className="flex flex-col gap-2">
                                {loras.map((lora, idx) => (
                                    <div key={idx} className="bg-black/20 border border-white/5 rounded-lg p-2.5 space-y-2">
                                        <div className="flex justify-between items-center gap-2">
                                            <input type="text" placeholder="URL" value={lora.path} onChange={(e) => { const nl = [...loras]; nl[idx].path = e.target.value; setLoras(nl); }} className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-[10px] text-white outline-none focus:border-emerald-500/50" />
                                            <button onClick={() => setLoras(loras.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                        <input type="range" min="0" max="2" step="0.05" value={lora.scale} onChange={(e) => { const nl = [...loras]; nl[idx].scale = parseFloat(e.target.value); setLoras(nl); }} className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-emerald-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Left Action Bottom */}
                <div className="creator-panel-footer">
                    {(() => {
                        const needsFal = !!selectedModel.toLowerCase().match(/grok|seedance|wan|fal/i);
                        const missingFal = needsFal && !apiKeys.fal;
                        const missingGemini = !needsFal && !apiKeys.gemini;
                        const isDisabled = isGeneratingI2V || !i2vTarget || (!i2vPrompt && !i2vScript) || missingFal || missingGemini;

                        return (
                            <>
                                <button
                                    onClick={onGenerateI2V}
                                    disabled={isDisabled}
                                    className="creator-btn-primary"
                                >
                                    {isGeneratingI2V ? <Loader2 className="w-4 h-4 animate-spin" /> : <VideoIcon className="w-4 h-4" />}
                                    {isGeneratingI2V ? "Animating..." : "Animate Media"}
                                </button>
                                {missingFal && <p className="creator-key-warning">Fal.ai Key Required in Settings</p>}
                                {missingGemini && <p className="creator-key-warning">Gemini Key Required in Settings</p>}
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* === RIGHT COLUMN: CONTENT & PREVIEW === */}
            <div className="creator-content-panel">
                <div className="creator-content-body">

                    {/* Page Header */}
                    <div className="creator-content-header">
                        <div className="creator-content-title-wrap">
                            <div className="creator-content-icon">
                                <VideoIcon className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <div className="creator-content-title">Animate</div>
                                <div className="creator-content-subtitle">Turn images into video</div>
                            </div>
                        </div>
                    </div>

                    {/* Motion & Visuals Prompt */}
                    <div className="creator-field">
                        <div className="creator-prompt-row">
                            <label className="creator-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Play style={{ width: 12, height: 12, color: 'rgb(52,211,153)' }} /> Motion & Visuals
                            </label>
                            {presetsDropdown}
                        </div>
                        <textarea
                            ref={promptRef}
                            value={i2vPrompt}
                            onChange={(e) => setI2VPrompt(e.target.value)}
                            placeholder="Describe motion and visuals... (e.g., 'Camera pans right slowly, warm golden light')"
                            className="creator-textarea"
                            style={{ minHeight: '80px' }}
                        />
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                            {['Handheld vlog style', 'Static camera', 'Slow zoom in', 'Cinematic drone shot'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setI2VPrompt(i2vPrompt ? `${i2vPrompt}, ${s}` : s)}
                                    className="creator-chip"
                                >{s}</button>
                            ))}
                        </div>
                    </div>

                    {/* Spoken Dialogue */}
                    <div className="creator-field">
                        <div className="creator-prompt-row">
                            <label className="creator-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Play style={{ width: 12, height: 12, color: 'rgba(52,211,153,0.5)' }} /> Spoken Voice / Dialogue
                                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional — words the character says out loud)</span>
                            </label>
                        </div>
                        <textarea
                            value={i2vScript}
                            onChange={(e) => setI2VScript(e.target.value)}
                            placeholder="Write the exact words the character speaks on screen. Use the Scripts page to generate this. Veo will render the character saying these words with lip-sync audio."
                            className="creator-textarea"
                            style={{ minHeight: '80px', opacity: 0.8 }}
                        />
                        {i2vScript && (
                            <button
                                onClick={() => setI2VScript('')}
                                style={{ marginTop: '4px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
                            >
                                Clear script
                            </button>
                        )}
                    </div>

                    {/* Result Area */}
                    <div className="creator-result-section">
                        <div className="creator-result-header">
                            <span className="creator-result-title">Output Video</span>
                            {generatedI2VUrl && (
                                <button onClick={onDiscardI2V} className="creator-result-action">
                                    <RefreshCw style={{ width: 12, height: 12 }} /> Reset
                                </button>
                            )}
                        </div>

                        {isGeneratingI2V ? (
                            <div className="creator-loading-state">
                                <LoadingIndicator title="Animating Video..." modelName={selectedModel} type="video" />
                                <button
                                    onClick={onCancelI2V}
                                    style={{
                                        marginTop: '16px',
                                        padding: '8px 20px',
                                        background: 'rgba(239,68,68,0.1)',
                                        border: '1px solid rgba(239,68,68,0.3)',
                                        borderRadius: '8px',
                                        color: 'rgb(239,68,68)',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : generatedI2VUrl ? (
                            <div className="flex flex-col gap-3">
                                <div className="relative aspect-video w-full bg-black/40 rounded-2xl overflow-hidden border-2 border-emerald-500/20 shadow-2xl flex items-center justify-center">
                                    <video ref={videoRef} src={generatedI2VUrl} controls autoPlay loop className="max-w-full max-h-full object-contain" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => onSaveToAssets(generatedI2VUrl, 'video')} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5">
                                        <Save className="w-3.5 h-3.5" /> Save to My Media
                                    </button>
                                    <button onClick={() => onDownload(generatedI2VUrl, 'animated')} className="p-3 bg-black/40 hover:bg-white/10 border border-white/10 rounded-xl text-white" title="Download">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { const f = captureFrame(); if (f) onSaveToAssets(f, 'image', 'frame'); else alert('Pause the video first, then click to capture the frame.'); }}
                                        className="flex-1 py-2.5 bg-black/40 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5"
                                        title="Pause the video first, then click to save this frame as an image"
                                    >
                                        <Camera className="w-3.5 h-3.5" /> Save Frame as Image
                                    </button>
                                    <button
                                        onClick={() => { const f = captureFrame(); if (f) setI2VTarget({ url: f, index: -1 }); else alert('Pause the video first, then click to capture the frame.'); }}
                                        className="flex-1 py-2.5 bg-black/40 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-1.5"
                                        title="Pause the video first, then click to use this frame as the source for a new animation"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" /> Use Frame as Source
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="creator-empty-state">
                                <VideoIcon style={{ width: 44, height: 44 }} className="creator-empty-state-icon" />
                                <div className="creator-empty-state-title">Ready to Animate</div>
                                <p className="creator-empty-state-text">
                                    Describe the motion and click "Animate Media" in the left panel.
                                </p>
                                {!i2vTarget && (
                                    <label className="creator-empty-state-btn">
                                        Import Image First
                                        <input type="file" className="hidden" accept="image/*" onChange={handleI2VImageUpload} />
                                    </label>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
