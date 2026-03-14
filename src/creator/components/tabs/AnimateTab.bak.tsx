
import React, { useEffect, useState, type ChangeEvent } from 'react';
import { Video as VideoIcon, ImagePlus, X, RefreshCw, Play, Save, Download, Layers, Sparkles, Upload, Trash2 } from 'lucide-react';
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
    apiKeys
}: AnimateTabProps) {
    const [isDragging, setIsDragging] = useState(false);

    // Ensure we are on a video model when mounting or if model is invalid
    useEffect(() => {
        const isVideoModel = selectedModel.includes('video') || selectedModel.includes('veo') || selectedModel.includes('seedance');
        if (!isVideoModel) {
            // Default to Grok Video
            setSelectedModel('xai/grok-imagine-video/image-to-video');
            setVideoDuration('5s');
            setVideoResolution('720p');
        } else {
            // Validate constraints for current video model
            if (selectedModel.includes('grok')) {
                if (!['5s', '6s', '9s', '10s', '15s'].includes(videoDuration)) setVideoDuration('6s');
                if (videoResolution !== '720p') setVideoResolution('720p');
            } else if (selectedModel.includes('veo-3')) {
                if (videoResolution === '1080p' && videoDuration !== '8s') setVideoDuration('8s');
            } else if (selectedModel.includes('seedance')) {
                // Seedance supports 4-12s, allow standard fallback
            } else if (selectedModel.includes('wan')) {
                // Wan 2.2: 5s, 10s. Wan 2.5: 5, 10. Wan 2.6: 5, 10, 15.
                if (selectedModel.includes('v2.2')) {
                    if (!['5s', '10s'].includes(videoDuration)) setVideoDuration('5s');
                    if (videoResolution !== '720p' && videoResolution !== '480p') setVideoResolution('720p');
                } else {
                    if (!['5s', '10s', '15s'].includes(videoDuration)) setVideoDuration('5s');
                    if (selectedModel.includes('wan-25') && videoDuration === '15s') setVideoDuration('10s');
                    // Wan 2.6 Flash only supports 720p, 1080p
                    if (selectedModel.includes('flash') && videoResolution === '480p') setVideoResolution('720p');
                }
            }
        }
    }, [selectedModel, videoDuration, videoResolution, setSelectedModel, setVideoDuration, setVideoResolution]);

    // Helper to process a file to a data URL
    const processFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (re) => {
            if (re.target?.result) {
                setI2VTarget({ url: re.target.result as string, index: -1 });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleI2VImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    // Drag and Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleSaveLoRA = async (url: string) => {
        if (!url) return;
        try {
            const folders = await dbService.getAllFolders();
            let folder = folders.find(f => f.name === 'WAN LoRA');
            if (!folder) {
                folder = {
                    id: generateUUID(),
                    name: 'WAN LoRA',
                    parentId: null,
                    timestamp: Date.now(),
                    icon: 'layers'
                };
                await dbService.saveFolder(folder);
            }

            const name = url.split('/').pop()?.split('?')[0] || 'Unknown LoRA';
            await dbService.saveAsset({
                id: generateUUID(),
                name: name,
                type: 'lora',
                base64: url,
                folderId: folder.id,
                timestamp: Date.now()
            });
            alert(`Saved "${name}" to WAN LoRA folder!`);
        } catch (e) {
            console.error("Failed to save LoRA", e);
            alert("Failed to save LoRA to library.");
        }
    };

    if (!i2vTarget) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center min-h-[50vh] animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <VideoIcon className="w-10 h-10 text-white/40" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 font-serif">Animate Media</h2>
                <p className="text-white/40 max-w-sm mx-auto mb-8 font-serif leading-relaxed">
                    Select an image from Refine or Create to animate.
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full pointer-events-auto">

            {/* === LEFT COLUMN: CONTROLS === */}
            <div className="w-[280px] flex-shrink-0 flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)] overflow-y-auto">
                <div className="p-4 flex-1 flex flex-col gap-6">
                    <div className="flex items-center gap-2 pb-4 border-b border-[var(--border)]">
                        <VideoIcon className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-sm font-bold text-white uppercase tracking-widest">Setup</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                                <Play className="w-3 h-3 text-emerald-400" /> Motion Prompt
                            </label>
                            {presetsDropdown}
                        </div>
                        <textarea
                            ref={promptRef}
                            value={i2vPrompt}
                            onChange={(e) => setI2VPrompt(e.target.value)}
                            placeholder="Describe motion... (e.g., camera pans, hair blowing)"
                            className="w-full h-24 p-3 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:border-emerald-500/50 focus:outline-none transition-all resize-none font-serif leading-relaxed"
                        />
                        <div className="space-y-2">
                            <label className="text-[10px] text-white/40 uppercase tracking-widest block">Camera Style</label>
                            <div className="flex flex-wrap gap-1">
                                {[
                                    { label: "Handheld", value: "Handheld vlog style " },
                                    { label: "Tripod", value: "Static camera on tripod " },
                                    { label: "Walk & Talk", value: "Dynamic follow shot " },
                                ].map(style => (
                                    <button
                                        key={style.label}
                                        onClick={() => {
                                            const newVal = i2vPrompt ? `${i2vPrompt.trim()} ${style.value}` : style.value;
                                            setI2VPrompt(newVal);
                                        }}
                                        className="px-2 py-1 bg-white/5 hover:bg-emerald-500/20 text-emerald-400 border border-white/10 hover:border-emerald-500/30 rounded text-[9px] uppercase font-bold tracking-wider transition-colors"
                                    >
                                        {style.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setI2VPrompt("")}
                                    className="px-2 py-1 bg-white/5 hover:bg-red-500/20 text-red-400 border border-white/10 hover:border-red-500/30 rounded text-[9px] uppercase font-bold tracking-wider transition-colors ml-auto"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/40 uppercase tracking-widest block">AI Model Engine</label>
                            <select
                                value={selectedModel}
                                onChange={(e) => {
                                    const newModel = e.target.value;
                                    setSelectedModel(newModel);
                                    if (newModel.includes('grok')) {
                                        setVideoDuration('5s');
                                        setVideoResolution('720p');
                                    } else if (newModel.includes('veo-3')) {
                                        setVideoDuration('8s');
                                        setVideoResolution('1080p');
                                    } else if (newModel.includes('seedance')) {
                                        setVideoDuration('5s');
                                        setVideoResolution('720p');
                                        setWithAudio?.(true);
                                    } else if (newModel.includes('wan')) {
                                        if (newModel.includes('flash')) {
                                            setVideoDuration('5s');
                                            setVideoResolution('720p');
                                        } else {
                                            setVideoDuration('5s');
                                            setVideoResolution('1080p');
                                        }
                                    } else {
                                        setVideoDuration('6s');
                                        setVideoResolution('720p');
                                    }
                                }}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:border-emerald-500/50 outline-none"
                            >
                                <option value="xai/grok-imagine-video/image-to-video">Grok 2 Video (Beta)</option>
                                <option value="fal-ai/bytedance/seedance/v1.5/pro/image-to-video">Seedance 1.5 Pro</option>
                                <option value="fal-ai/wan-25-preview/image-to-video">Wan 2.5 Preview</option>
                                <option value="wan/v2.6/image-to-video/flash">Wan 2.6 Flash</option>
                                <option value="fal-ai/wan/v2.2-a14b/image-to-video/lora">Wan 2.2 LoRA</option>
                                <option value="veo-3.1-generate-preview">Veo 3.1 (Google)</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[10px] text-white/40 uppercase tracking-widest block">Resolution</label>
                                <select
                                    value={videoResolution}
                                    onChange={(e) => {
                                        const newRes = e.target.value;
                                        setVideoResolution(newRes);
                                        if (selectedModel.includes('veo-3')) {
                                            if (newRes === '1080p') setVideoDuration('8s');
                                            else if (newRes === '720p' && !['4s', '6s', '8s'].includes(videoDuration)) setVideoDuration('6s');
                                        }
                                    }}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:border-emerald-500/50 outline-none"
                                >
                                    {selectedModel.includes('grok') ? (
                                        <option value="720p">720p (Std)</option>
                                    ) : selectedModel.includes('seedance') ? (
                                        <>
                                            <option value="1080p">1080p</option>
                                            <option value="720p">720p</option>
                                            <option value="480p">480p</option>
                                        </>
                                    ) : selectedModel.includes('wan') && selectedModel.includes('flash') ? (
                                        <>
                                            <option value="2160p">4K UHD</option>
                                            <option value="1080p">1080p</option>
                                            <option value="720p">720p</option>
                                        </>
                                    ) : selectedModel.includes('wan') ? (
                                        <>
                                            <option value="1080p">1080p</option>
                                            {selectedModel.includes('wan-25') && <option value="480p">480p</option>}
                                            <option value="720p">720p</option>
                                        </>
                                    ) : selectedModel.includes('veo-3') ? (
                                        <>
                                            <option value="1080p">1080p (8s)</option>
                                            <option value="720p">720p Fast</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="720p">720p</option>
                                            <option value="480p">480p</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-white/40 uppercase tracking-widest block">Length</label>
                                <select
                                    value={videoDuration}
                                    onChange={(e) => setVideoDuration(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:border-emerald-500/50 outline-none"
                                >
                                    {selectedModel.includes('grok') ? (
                                        <><option value="5s">5s</option><option value="6s">6s</option><option value="9s">9s</option><option value="10s">10s</option><option value="15s">15s</option></>
                                    ) : selectedModel.includes('seedance') ? (
                                        Array.from({ length: 9 }, (_, i) => i + 4).map(s => <option key={s} value={`${s}s`}>{s}s</option>)
                                    ) : selectedModel.includes('wan') ? (
                                        <><option value="5s">5s</option><option value="10s">10s</option>{selectedModel.includes('2.6') && <option value="15s">15s</option>}</>
                                    ) : selectedModel.includes('veo-3') ? (
                                        videoResolution === '1080p' ? <option value="8s">8s</option> : <><option value="4s">4s</option><option value="6s">6s</option><option value="8s">8s</option></>
                                    ) : (
                                        <><option value="4s">4s</option><option value="6s">6s</option></>
                                    )}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/40 uppercase tracking-widest block">Ratio</label>
                            <select
                                value={i2vAspectRatio}
                                onChange={(e) => setI2VAspectRatio(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:border-emerald-500/50 outline-none"
                            >
                                <option value="auto">Matches Image</option>
                                <option value="16:9">16:9 Landscape</option>
                                <option value="9:16">9:16 Portrait</option>
                                <option value="1:1">1:1 Square</option>
                                <option value="4:3">4:3 TV</option>
                                <option value="21:9">21:9 Cinema</option>
                            </select>
                        </div>
                    </div>

                    {selectedModel.includes('seedance') && (
                        <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-4">
                            <label className="flex items-center gap-2 cursor-pointer group p-1.5 rounded hover:bg-white/5 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={withAudio}
                                    onChange={(e) => setWithAudio?.(e.target.checked)}
                                    className="w-3 h-3 rounded bg-black/40 border-white/20 text-emerald-500 focus:ring-emerald-500/50"
                                />
                                <span className="text-[10px] text-white/60 group-hover:text-white select-none uppercase tracking-widest font-bold">Audio</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group p-1.5 rounded hover:bg-white/5 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={cameraFixed}
                                    onChange={(e) => setCameraFixed?.(e.target.checked)}
                                    className="w-3 h-3 rounded bg-black/40 border-white/20 text-emerald-500 focus:ring-emerald-500/50"
                                />
                                <span className="text-[10px] text-white/60 group-hover:text-white select-none uppercase tracking-widest font-bold">Fix Cam</span>
                            </label>
                        </div>
                    )}

                    {selectedModel.includes('lora') && (
                        <div className="border-t border-white/5 pt-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] text-white/50 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <Layers className="w-3 h-3 text-emerald-500" />
                                    LoRA Weights
                                </label>
                                <div className="flex gap-2">
                                    <label className="cursor-pointer text-[9px] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-bold uppercase tracking-wider">
                                        <Upload className="w-3 h-3" /> Upload
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".safetensors"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) onLoRAUpload(file);
                                            }}
                                        />
                                    </label>
                                    <button
                                        onClick={() => setLoras([...loras, { path: '', scale: 1.0 }])}
                                        className="text-[9px] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-bold uppercase tracking-wider"
                                    >
                                        <Sparkles className="w-3 h-3" /> Add
                                    </button>
                                </div>
                            </div>
                            {loras.length === 0 ? (
                                <div className="text-[9px] text-white/20 italic p-3 border border-dashed border-white/10 rounded-lg text-center">
                                    No LoRAs added.
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {loras.map((lora, idx) => (
                                        <div key={idx} className="bg-black/20 border border-white/5 rounded-lg p-2 space-y-2">
                                            <div className="flex justify-between items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="URL/Path"
                                                    value={lora.path}
                                                    onChange={(e) => {
                                                        const newLoras = [...loras];
                                                        newLoras[idx].path = e.target.value;
                                                        setLoras(newLoras);
                                                    }}
                                                    className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-emerald-500/50 outline-none"
                                                />
                                                <button onClick={() => handleSaveLoRA(lora.path)} className="p-1 hover:bg-emerald-500/20 text-emerald-400" disabled={!lora.path}><Save className="w-3 h-3" /></button>
                                                <button onClick={() => setLoras(loras.filter((_, i) => i !== idx))} className="p-1 hover:bg-red-500/20 text-red-400"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="range"
                                                    min="0" max="2" step="0.05"
                                                    value={lora.scale}
                                                    onChange={(e) => {
                                                        const newLoras = [...loras];
                                                        newLoras[idx].scale = parseFloat(e.target.value);
                                                        setLoras(newLoras);
                                                    }}
                                                    className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                                />
                                                <span className="text-[9px] text-white/40 w-6 font-mono">{(lora.scale).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Submit Action */}
                <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] flex flex-col gap-3 sticky bottom-0 z-10">
                    <button
                        onClick={onGenerateI2V}
                        disabled={!i2vPrompt || (selectedModel.toLowerCase().match(/grok|seedance|wan/i) ? !apiKeys.fal : !apiKeys.gemini)}
                        className={`w-full py-3 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${!i2vPrompt || (selectedModel.toLowerCase().match(/grok|seedance|wan/i) ? !apiKeys.fal : !apiKeys.gemini) ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-emerald-500/20 hover:-translate-y-0.5'}`}
                    >
                        {isGeneratingI2V ? <RefreshCw className="w-4 h-4 animate-spin" /> : <VideoIcon className="w-4 h-4" />}
                        {isGeneratingI2V ? "ANIMATING..." : "GENERATE"}
                    </button>
                    {(() => {
                        const needsFal = !!selectedModel.toLowerCase().match(/grok|seedance|wan/i);
                        const missingFal = needsFal && !apiKeys.fal;
                        const missingGemini = !needsFal && !apiKeys.gemini;
                        if (missingFal) return <p className="text-[9px] font-bold text-red-400 uppercase tracking-tighter animate-pulse text-center">Fal.ai Key Required</p>;
                        if (missingGemini) return <p className="text-[9px] font-bold text-red-400 uppercase tracking-tighter animate-pulse text-center">Gemini Key Required</p>;
                        return null;
                    })()}
                </div>
            </div>

            {/* === RIGHT COLUMN: PREVIEW/CANVAS === */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[var(--bg-deep)] p-4 relative">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-[var(--border)] pb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-white/90">Animate Media</h2>
                        <span className="text-xs text-white/40 uppercase tracking-widest hidden md:inline-block">Image to Video</span>
                    </div>
                    <button
                        onClick={onExit}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 text-xs transition-all border border-white/10 flex items-center gap-2 w-fit"
                    >
                        <X className="w-3 h-3" /> Exit
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto h-full pb-20">
                    
                    {/* Source Media */}
                    <div className="flex flex-col h-full bg-white/5 border border-white/5 rounded-2xl p-4 gap-4">
                        <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                            Source Media
                        </label>
                        <div className="aspect-[3/4] bg-black/40 rounded-xl overflow-hidden border border-white/10 shadow-inner group relative mt-auto max-h-[70vh] w-auto mx-auto object-contain flex items-center justify-center">
                            <ImageWithLoader src={i2vTarget.url} alt="Target" className="max-w-full max-h-full object-contain cursor-zoom-in" onClick={() => onPreview(i2vTarget.url, [i2vTarget.url])} />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center pointer-events-none">
                                <label className="pointer-events-auto cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 transition-all">
                                    <ImagePlus className="w-4 h-4 text-emerald-400" />
                                    <span className="text-[10px] text-white font-bold uppercase tracking-widest">Replace</span>
                                    <input type="file" accept="image/*,video/*" className="hidden" onChange={handleI2VImageUpload} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Results / Status */}
                    <div className="flex flex-col h-full bg-white/5 border border-white/5 rounded-2xl p-4 gap-4">
                        <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <VideoIcon className="w-3 h-3" /> Output Video
                        </label>

                        <div className="flex-1 flex flex-col justify-center border border-white/5 rounded-xl bg-black/20 overflow-hidden relative">
                            {isGeneratingI2V ? (
                                <div className="flex flex-col items-center justify-center p-6 h-full">
                                    <LoadingIndicator title="Animating Video" modelName={selectedModel} type="video" />
                                </div>
                            ) : !generatedI2VUrl ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-40">
                                    <Sparkles className="w-12 h-12 mb-4 text-white/20" />
                                    <p className="text-xs uppercase tracking-widest text-center px-4">Awaiting generation</p>
                                </div>
                            ) : (
                                <div className="w-full h-full relative group flex flex-col justify-center items-center overflow-hidden">
                                    <video src={generatedI2VUrl} controls autoPlay loop className="max-w-full max-h-full object-contain cursor-zoom-in" onClick={(e) => { if (e.target === e.currentTarget) onPreview(generatedI2VUrl, [generatedI2VUrl]); }} />
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-lg p-1 z-10">
                                        <button onClick={() => onDownload(generatedI2VUrl, 'animated')} className="p-1 hover:bg-white/20 rounded" title="Download"><Download className="w-4 h-4 text-white" /></button>
                                        <button onClick={() => onSaveToAssets(generatedI2VUrl, 'video')} className="p-1 hover:bg-emerald-500/40 rounded" title="Save Asset"><Save className="w-4 h-4 text-white" /></button>
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-2">
                                        <button onClick={onApproveI2V} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-[10px] font-bold text-black rounded uppercase shadow-lg">Save & Add to Post</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {generatedI2VUrl && (
                            <div className="text-center pt-2">
                                <button onClick={onDiscardI2V} className="text-[10px] text-white/40 hover:text-white uppercase tracking-widest font-bold flex flex-row items-center gap-1 mx-auto"><RefreshCw className="w-3 h-3"/> Discard</button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
