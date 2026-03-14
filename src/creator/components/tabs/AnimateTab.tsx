import React, { useEffect, useState, type ChangeEvent } from 'react';
import { Video as VideoIcon, ImagePlus, X, RefreshCw, Play, Save, Download, Layers, Sparkles, Upload, Trash2, ChevronDown, Loader2 } from 'lucide-react';
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
    isGeneratingI2V: boolean;
    onGenerateI2V: () => void;
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
    isGeneratingI2V,
    onGenerateI2V,
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
            <div className="w-[360px] flex-shrink-0 flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)] relative overflow-y-auto">
                <div className="px-6 py-6 flex-1 flex flex-col gap-6">
                    <div className="flex items-center justify-between pb-8 border-b border-[var(--border)] mb-6">
                        <div className="flex items-center gap-5 px-2 pt-2">
                            <h2 className="text-sm font-black text-white uppercase tracking-[0.15em] flex items-center gap-4">
                                <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <VideoIcon className="w-5 h-5 text-emerald-500" />
                                </div>
                                Setup
                            </h2>
                        </div>
                    </div>

                    {/* Source Media */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Source Image</label>
                        {i2vTarget ? (
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-emerald-500/30 shadow-lg group">
                                <img src={i2vTarget.url} alt="Source" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label className="cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 transition-all">
                                        <ImagePlus className="w-4 h-4 text-emerald-400" />
                                        <span className="text-[9px] text-white font-bold uppercase tracking-widest">Replace</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleI2VImageUpload} />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center aspect-video w-full border-2 border-dashed border-white/10 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 hover:border-emerald-500/50 transition-all group">
                                <Upload className="w-6 h-6 text-white/20 group-hover:text-emerald-400 mb-2" />
                                <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Upload Image</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleI2VImageUpload} />
                            </label>
                        )}
                    </div>

                    {/* AI Model & Params */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/40 uppercase tracking-widest block">AI Model Engine</label>
                            <div className="relative">
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white appearance-none focus:outline-none focus:border-emerald-500/50"
                                >
                                    <option value="wan/v2.6/image-to-video/flash">Wan 2.6 Flash</option>
                                    <option value="fal-ai/wan-25-preview/image-to-video">Wan 2.5 Preview</option>
                                    <option value="fal-ai/bytedance/seedance/v1.5/pro/image-to-video">Seedance 1.5 Pro</option>
                                    <option value="xai/grok-imagine-video/image-to-video">Grok 2 Video</option>
                                    <option value="veo-3.1-generate-preview">Veo 3.1 (Google)</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] text-white/40 uppercase tracking-widest block">Resolution</label>
                                <div className="relative">
                                    <select
                                        value={videoResolution}
                                        onChange={(e) => setVideoResolution(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white appearance-none"
                                    >
                                        <option value="1080p">1080p</option>
                                        <option value="720p">720p</option>
                                        <option value="480p">480p</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-white/40 uppercase tracking-widest block">Length</label>
                                <div className="relative">
                                    <select
                                        value={videoDuration}
                                        onChange={(e) => setVideoDuration(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white appearance-none"
                                    >
                                        <option value="5s">5s</option>
                                        <option value="10s">10s</option>
                                        <option value="15s">15s</option>
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-white/40 uppercase tracking-widest block">Aspect Ratio</label>
                            <div className="relative">
                                <select
                                    value={i2vAspectRatio}
                                    onChange={(e) => setI2VAspectRatio(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white appearance-none"
                                >
                                    <option value="auto">Auto (Matches Image)</option>
                                    <option value="16:9">16:9 Landscape</option>
                                    <option value="9:16">9:16 Vertical</option>
                                    <option value="1:1">1:1 Square</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Seedance Options */}
                    {selectedModel.includes('seedance') && (
                        <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-4">
                            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-white/5 transition-colors">
                                <input type="checkbox" checked={withAudio} onChange={(e) => setWithAudio?.(e.target.checked)} className="w-3 h-3 rounded bg-black/40 border-white/20 text-emerald-500 focus:ring-emerald-500/50" />
                                <span className="text-[10px] text-white/60 uppercase tracking-widest font-bold">Audio</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded hover:bg-white/5 transition-colors">
                                <input type="checkbox" checked={cameraFixed} onChange={(e) => setCameraFixed?.(e.target.checked)} className="w-3 h-3 rounded bg-black/40 border-white/20 text-emerald-500 focus:ring-emerald-500/50" />
                                <span className="text-[10px] text-white/60 uppercase tracking-widest font-bold">Fix Cam</span>
                            </label>
                        </div>
                    )}

                    {/* LoRA Controls */}
                    {selectedModel.includes('lora') && (
                        <div className="border-t border-[var(--border)] pt-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] text-white/50 font-bold uppercase tracking-widest flex items-center gap-1"><Layers className="w-3 h-3 text-emerald-500" /> LoRAs</label>
                                <button onClick={() => setLoras([...loras, { path: '', scale: 1.0 }])} className="text-[9px] text-emerald-400 font-bold uppercase">Add</button>
                            </div>
                            <div className="space-y-2">
                                {loras.map((lora, idx) => (
                                    <div key={idx} className="bg-black/20 border border-white/5 rounded-lg p-2 space-y-2">
                                        <div className="flex justify-between items-center gap-2">
                                            <input type="text" placeholder="URL" value={lora.path} onChange={(e) => { const nl = [...loras]; nl[idx].path = e.target.value; setLoras(nl); }} className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-[9px] text-white outline-none" />
                                            <button onClick={() => setLoras(loras.filter((_, i) => i !== idx))} className="text-red-400"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                        <input type="range" min="0" max="2" step="0.05" value={lora.scale} onChange={(e) => { const nl = [...loras]; nl[idx].scale = parseFloat(e.target.value); setLoras(nl); }} className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-emerald-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Left Action Bottom */}
                <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] sticky bottom-0 z-10 flex flex-col gap-2">
                    {(() => {
                        const needsFal = !!selectedModel.toLowerCase().match(/grok|seedance|wan|fal/i);
                        const missingFal = needsFal && !apiKeys.fal;
                        const missingGemini = !needsFal && !apiKeys.gemini;
                        const isDisabled = isGeneratingI2V || !i2vTarget || !i2vPrompt || missingFal || missingGemini;

                        return (
                            <>
                                <button
                                    onClick={onGenerateI2V}
                                    disabled={isDisabled}
                                    className={`w-full py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${isDisabled ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-emerald-500/20 hover:-translate-y-0.5'}`}
                                >
                                    {isGeneratingI2V ? <Loader2 className="w-4 h-4 animate-spin" /> : <VideoIcon className="w-4 h-4" />}
                                    {isGeneratingI2V ? "Animating..." : "Animate Media"}
                                </button>
                                {missingFal && <p className="text-[8px] font-bold text-red-400 uppercase tracking-tight text-center animate-pulse">Fal.ai Key Required</p>}
                                {missingGemini && <p className="text-[8px] font-bold text-red-400 uppercase tracking-tight text-center animate-pulse">Gemini Key Required</p>}
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* === RIGHT COLUMN: CONTENT & PREVIEW === */}
            <div className="flex-1 min-w-0 flex flex-col h-full bg-[var(--bg-deep)] overflow-y-auto relative">
                <div className="p-6 max-w-5xl mx-auto w-full space-y-6 pb-32">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-8">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                <VideoIcon className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-[0.2em]">Animate</h2>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Turn images into video</p>
                            </div>
                        </div>
                    </div>

                    {/* Motion Prompt Area */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                <Play className="w-3 h-3 text-emerald-400" /> Motion Prompt
                            </label>
                            {presetsDropdown}
                        </div>
                        <textarea
                            ref={promptRef}
                            value={i2vPrompt}
                            onChange={(e) => setI2VPrompt(e.target.value)}
                            placeholder="Describe motion... (e.g., 'Camera pans right, person smiles')"
                            className="w-full h-24 p-4 bg-black/40 border border-white/10 rounded-xl text-base text-white/90 focus:outline-none focus:border-emerald-500/50 shadow-inner"
                        />
                        <div className="flex flex-wrap gap-2">
                            {["Handheld vlog style", "Static camera", "Slow zoom in", "Cinematic drone shot"].map(s => (
                                <button key={s} onClick={() => setI2VPrompt(i2vPrompt ? `${i2vPrompt}, ${s}` : s)} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-[9px] uppercase font-bold tracking-wider text-white/40 hover:text-emerald-400 border border-white/5 transition-all">{s}</button>
                            ))}
                        </div>
                    </div>

                    {/* Result Area */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Output Video</h3>
                            {generatedI2VUrl && (
                                <button onClick={onDiscardI2V} className="text-[10px] text-white/40 hover:text-white uppercase tracking-widest font-bold flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" /> Reset
                                </button>
                            )}
                        </div>

                        {isGeneratingI2V ? (
                            <div className="min-h-[400px] border-2 border-dashed border-emerald-500/20 bg-emerald-500/5 rounded-2xl flex flex-col items-center justify-center p-8 animate-pulse text-center">
                                <LoadingIndicator title="Animating Video..." modelName={selectedModel} type="video" />
                            </div>
                        ) : generatedI2VUrl ? (
                            <div className="relative aspect-video w-full bg-black/40 rounded-2xl overflow-hidden border-2 border-emerald-500/20 shadow-2xl flex items-center justify-center group">
                                <video src={generatedI2VUrl} controls autoPlay loop className="max-w-full max-h-full object-contain" />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onDownload(generatedI2VUrl, 'animated')} className="p-2 bg-black/60 backdrop-blur-md rounded-xl text-white border border-white/10 hover:bg-white/10"><Download className="w-5 h-5" /></button>
                                    <button onClick={() => onSaveToAssets(generatedI2VUrl, 'video')} className="p-2 bg-black/60 backdrop-blur-md rounded-xl text-white border border-white/10 hover:bg-emerald-500/20"><Save className="w-5 h-5" /></button>
                                </div>
                                <div className="absolute bottom-6 inset-x-6 flex justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={onApproveI2V} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-bold uppercase tracking-widest rounded-xl shadow-xl shadow-emerald-900/40 transform active:scale-95 transition-all">Save & Add to Post</button>
                                </div>
                            </div>
                        ) : (
                            <div className="min-h-[400px] border-2 border-dashed border-white/5 bg-white/[0.02] rounded-2xl flex flex-col items-center justify-center p-8 text-center group">
                                <VideoIcon className="w-16 h-16 text-white/10 mb-4 group-hover:text-emerald-500/20 transition-colors" />
                                <h4 className="text-white/60 font-bold uppercase tracking-widest text-xs mb-2">Ready to Animate</h4>
                                <p className="text-white/30 text-[10px] max-w-[250px] mx-auto mb-6">
                                    Describe the motion you want to see and click "Animate Media" in the left pane.
                                </p>
                                {!i2vTarget && (
                                    <label className="px-6 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-[10px] font-bold uppercase tracking-widest text-emerald-400 transition-all cursor-pointer">
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
