import React, { useState, type ChangeEvent } from 'react';
import { Sparkles, Edit2, ImagePlus, X, RefreshCw, Download, Video as VideoIcon, Save, Image as ImageIcon, Layers, ChevronDown, Loader2, Upload } from 'lucide-react';
import LoadingIndicator from '../loading-indicator';
import { ImageWithLoader } from '../image-with-loader';
import type { DBAsset as Asset } from '../../lib/dbService';
import { generateUUID } from '../../lib/uuid';

interface EditTabProps {
    refineTarget: { url: string, index: number } | null;
    setRefineTarget: (target: { url: string, index: number } | null) => void;
    refinePrompt: string;
    setRefinePrompt: (val: string) => void;
    refineImageSize: string;
    setRefineImageSize: (val: string) => void;
    refineNumImages: number;
    setRefineNumImages: (val: number) => void;
    selectedModel: string;
    setSelectedModel: (val: string) => void;
    refineAdditionalImages: Asset[];
    setRefineAdditionalImages: React.Dispatch<React.SetStateAction<Asset[]>>;
    refineResultUrls: string[];
    setRefineResultUrls: (val: string[]) => void;
    isRefining: boolean;
    refineProgress?: number;
    onRefineSubmit: () => void;
    onApproveRefinement: (action: 'replace' | 'add', url?: string) => void;

    onExit: () => void;
    onI2VEntry: (url: string) => void;
    presetsDropdown: React.ReactNode;
    onSaveToAssets: (url: string, type: 'image' | 'video', name?: string) => void;
    onPreview: (url: string, urls?: string[]) => void;
    onDownload: (url: string, prefix?: string) => void;

    // New Props
    promptRef?: React.Ref<HTMLTextAreaElement>;
    apiKeys: { gemini: string; fal: string };
    onNavigateTo?: (tab: string) => void;
}

export function EditTab({
    refineTarget,
    setRefineTarget,
    refinePrompt,
    setRefinePrompt,
    refineImageSize,
    setRefineImageSize,
    refineNumImages,
    setRefineNumImages,
    selectedModel,
    setSelectedModel,
    refineAdditionalImages,
    setRefineAdditionalImages,
    refineResultUrls,
    setRefineResultUrls,
    isRefining,
    refineProgress = 0,
    onRefineSubmit,
    onApproveRefinement,

    onExit,
    onI2VEntry,
    presetsDropdown,
    onSaveToAssets,
    onPreview,
    onDownload,
    promptRef,
    apiKeys,
    onNavigateTo
}: EditTabProps) {
    const [isDragging, setIsDragging] = useState(false);

    // Derived state for media type
    const isVideo = React.useMemo(() => {
        if (!refineTarget?.url) return false;
        if (refineTarget.url.startsWith('data:video')) return true;
        const clean = refineTarget.url.split('?')[0].split('#')[0].toLowerCase();
        return ['.mp4', '.mov', '.webm', '.m4v', '.ogv'].some(ext => clean.endsWith(ext));
    }, [refineTarget?.url]);

    const availableModels = React.useMemo(() => isVideo ? [
        { id: 'xai/grok-imagine-video/edit-video', name: 'Grok Edit' },
        { id: 'fal-ai/wan/v2.2-14b/animate/move', name: 'Wan Move (Ref Only)' },
        { id: 'fal-ai/wan/v2.2-14b/animate/replace', name: 'Wan Replace' },
    ] : [
        { id: 'gemini-3-pro-image-preview', name: 'Nano Banana Pro' },
        { id: 'gemini-3.1-flash-image-preview', name: 'Nano Banana 2' },
        { id: 'gemini-2.5-flash-image', name: 'Nano Banana' },
        { id: 'fal-ai/bytedance/seedream/v5/lite/edit', name: 'Seedream 5.0 Lite Edit' },
        { id: 'fal-ai/bytedance/seedream/v4.5/edit', name: 'Seedream 4.5 Edit' },
        { id: 'xai/grok-imagine-image/edit', name: 'Grok Image Edit' }
    ], [isVideo]);

    // Ensure selected model is valid for current media type
    React.useEffect(() => {
        const isSelectedVideoModel = selectedModel.includes('video') || selectedModel.includes('animate') || selectedModel.includes('wan');
        const isCurrentMatch = isVideo ? isSelectedVideoModel : !isSelectedVideoModel;

        if (!isCurrentMatch || !availableModels.some(m => m.id === selectedModel)) {
            const modelToSet = availableModels[0].id;
            setSelectedModel(modelToSet);
        }
    }, [isVideo, selectedModel, setSelectedModel, availableModels]);

    const handleRefineImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (re) => {
                if (re.target?.result) {
                    setRefineTarget({ url: re.target.result as string, index: -1 });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAdditionalUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newEntries: Asset[] = [];
            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                const reader = new FileReader();
                const base64 = await new Promise<string>((resolve) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
                newEntries.push({
                    id: generateUUID(),
                    name: file.name,
                    base64,
                    type: 'image',
                    folderId: null,
                    timestamp: Date.now(),
                    selected: true
                });
            }
            setRefineAdditionalImages(prev => [...prev, ...newEntries]);
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
                                    <Edit2 className="w-5 h-5 text-emerald-500" />
                                </div>
                                Setup
                            </h2>
                        </div>
                    </div>

                    {/* Source Reference */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Source Reference</label>
                        {refineTarget ? (
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-emerald-500/30 shadow-lg group">
                                {isVideo ? (
                                    <video src={refineTarget.url} className="w-full h-full object-cover" autoPlay muted loop />
                                ) : (
                                    <img src={refineTarget.url} alt="Source" className="w-full h-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                                    <label className="cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2 transition-all">
                                        <ImagePlus className="w-4 h-4 text-emerald-400" />
                                        <span className="text-[9px] text-white font-bold uppercase tracking-widest">Replace</span>
                                        <input type="file" className="hidden" accept="image/*,video/*" onChange={handleRefineImageUpload} />
                                    </label>
                                    <button onClick={() => setRefineTarget(null)} className="absolute top-2 right-2 p-1 text-white/40 hover:text-red-400"><X className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center aspect-video w-full border-2 border-dashed border-white/10 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 hover:border-emerald-500/50 transition-all group">
                                <Upload className="w-6 h-6 text-white/20 group-hover:text-emerald-400 mb-2" />
                                <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Upload Source</span>
                                <input type="file" className="hidden" accept="image/*,video/*" onChange={handleRefineImageUpload} />
                            </label>
                        )}
                    </div>

                    {/* Additional References (Only for relevant image models) */}
                    {!isVideo && (selectedModel.includes('seedream') || selectedModel.includes('banana') || selectedModel.includes('grok')) && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">Additional References</label>
                            <div className="flex flex-wrap gap-2">
                                {refineAdditionalImages.map((img, idx) => (
                                    <div key={idx} className="relative w-12 h-12 group flex-shrink-0">
                                        <img src={img.base64} className="w-full h-full rounded-lg object-cover border border-white/10" alt="ref" />
                                        <button onClick={() => setRefineAdditionalImages(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white"><X className="w-2 h-2" /></button>
                                    </div>
                                ))}
                                <label className="w-12 h-12 bg-white/5 border border-white/10 border-dashed rounded-lg flex items-center justify-center hover:bg-white/10 cursor-pointer">
                                    <ImagePlus className="w-4 h-4 text-white/20" />
                                    <input type="file" className="hidden" multiple accept="image/*" onChange={handleAdditionalUpload} />
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Subject Reference (Only for Video Move/Replace) */}
                    {isVideo && (selectedModel.includes('move') || selectedModel.includes('replace')) && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Subject Reference (Required)</label>
                            {refineAdditionalImages.length > 0 ? (
                                <div className="relative w-20 h-20 group">
                                    <img src={refineAdditionalImages[0].base64} className="w-full h-full rounded-xl object-cover border border-white/10" alt="subject" />
                                    <button onClick={() => setRefineAdditionalImages([])} className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white shadow-lg"><X className="w-3 h-3" /></button>
                                </div>
                            ) : (
                                <label className="w-20 h-20 bg-white/5 border border-white/10 border-dashed rounded-xl flex flex-col items-center justify-center hover:bg-white/10 cursor-pointer group">
                                    <ImagePlus className="w-5 h-5 text-white/30 group-hover:text-emerald-400 mb-1" />
                                    <span className="text-[8px] text-white/40 uppercase font-bold">Subject</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                        if (e.target.files?.[0]) {
                                            const file = e.target.files[0];
                                            const reader = new FileReader();
                                            const base64 = await new Promise<string>((resolve) => {
                                                reader.onload = () => resolve(reader.result as string);
                                                reader.readAsDataURL(file);
                                            });
                                            setRefineAdditionalImages([{ id: generateUUID(), name: file.name, base64, type: 'image', folderId: null, timestamp: Date.now() }]);
                                        }
                                    }} />
                                </label>
                            )}
                        </div>
                    )}

                    {/* General Settings */}
                    <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-4">
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/40 uppercase tracking-widest block">AI Model Engine</label>
                            <div className="relative">
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white appearance-none focus:outline-none focus:border-emerald-500/50"
                                >
                                    {availableModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {(selectedModel.includes('seedream') || selectedModel.includes('banana') || selectedModel.includes('gemini')) && (
                                <div className="space-y-1">
                                    <label className="text-[10px] text-white/40 uppercase tracking-widest block">Size / Ratio</label>
                                    <div className="relative">
                                        <select
                                            value={refineImageSize}
                                            onChange={(e) => setRefineImageSize(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white appearance-none focus:outline-none focus:border-emerald-500/50"
                                        >
                                            {selectedModel.includes('banana') || selectedModel.includes('gemini') ? (
                                                <><option value="1:1">1:1 Square</option><option value="16:9">16:9 Cinematic</option><option value="9:16">9:16 Vertical</option><option value="4:3">4:3 TV</option></>
                                            ) : (
                                                <><option value="auto_4K">Auto 4K</option><option value="square_hd">Square 2K</option><option value="portrait_4_3">Portrait 4:3</option><option value="landscape_16_9">Landscape 16:9</option></>
                                            )}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            {!isVideo && (
                                <div className="space-y-1">
                                    <label className="text-[10px] text-white/40 uppercase tracking-widest block">Batch Quantity</label>
                                    <div className="relative">
                                        <select
                                            value={refineNumImages}
                                            onChange={(e) => setRefineNumImages(Number(e.target.value))}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white appearance-none focus:outline-none focus:border-emerald-500/50"
                                        >
                                            {[1, 2, 3, 4, 6].map(n => <option key={n} value={n}>{n} Image{n > 1 ? 's' : ''}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40 pointer-events-none" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Left Action Bottom */}
                <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] sticky bottom-0 z-10 flex flex-col gap-2">
                    {(() => {
                        const needsFal = !!selectedModel.toLowerCase().match(/grok|seedream|wan|fal/i);
                        const missingFal = needsFal && !apiKeys.fal;
                        const missingGemini = !needsFal && !apiKeys.gemini;
                        const isDisabled = isRefining || !refineTarget || !refinePrompt || missingFal || missingGemini;

                        return (
                            <>
                                <button
                                    onClick={onRefineSubmit}
                                    disabled={isDisabled}
                                    className={`w-full py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${isDisabled ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-emerald-500/20 hover:-translate-y-0.5'}`}
                                >
                                    {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {isRefining ? "Refining..." : "Refine Media"}
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
                    {/* Header: Title and Exit */}
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-8">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                <Edit2 className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-[0.2em]">Refine</h2>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Fine-tune your variations</p>
                            </div>
                        </div>
                    </div>

                    {/* Improvement Instructions Area */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-emerald-400" /> Improvement Instructions
                            </label>
                            {presetsDropdown}
                        </div>
                        <textarea
                            ref={promptRef}
                            value={refinePrompt}
                            onChange={(e) => setRefinePrompt(e.target.value)}
                            placeholder="Describe changes... (e.g., 'Make eyes blue', 'Change background to forest')"
                            className="w-full h-32 p-4 bg-black/40 border border-white/10 rounded-xl text-base text-white/90 leading-relaxed focus:outline-none focus:border-emerald-500/50 shadow-inner"
                        />
                    </div>

                    {/* Results / Empty State */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Result Variations</h3>
                            {refineResultUrls.length > 0 && (
                                <button onClick={() => setRefineResultUrls([])} className="text-[10px] text-white/40 hover:text-white uppercase tracking-widest font-bold flex items-center gap-1">
                                    <RefreshCw className="w-3 h-3" /> Reset
                                </button>
                            )}
                        </div>

                        {isRefining ? (
                            <div className="min-h-[300px] border-2 border-dashed border-emerald-500/20 bg-emerald-500/5 rounded-2xl flex flex-col items-center justify-center p-8 animate-pulse text-center space-y-4">
                                <LoadingIndicator />
                                <div className="space-y-2">
                                    <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest">Optimizing Media...</p>
                                    {refineProgress > 0 && (
                                        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mx-auto">
                                            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${refineProgress}%` }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : refineResultUrls.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                                {refineResultUrls.map((url, idx) => (
                                    <div key={idx} className="relative group aspect-[3/4] bg-black/40 rounded-2xl overflow-hidden border-2 border-emerald-500/20 shadow-2xl">
                                        <ImageWithLoader src={url} alt="Refined" className="w-full h-full" onClick={() => onPreview(url, refineResultUrls)} />
                                        <div className="absolute top-2 right-2 flex gap-1 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10 opacity-100 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setRefineTarget({ url: url, index: -1 })} className="p-1.5 hover:bg-white/10 rounded-lg" title="Edit again"><Edit2 className="w-4 h-4 text-emerald-400" /></button>
                                            <button onClick={() => onI2VEntry(url)} className="p-1.5 hover:bg-white/10 rounded-lg text-white" title="Animate"><VideoIcon className="w-4 h-4" /></button>
                                            <button onClick={() => onDownload(url, `refine_${idx}`)} className="p-1.5 hover:bg-white/10 rounded-lg text-white"><Download className="w-4 h-4" /></button>
                                            <button onClick={() => onSaveToAssets(url, 'image')} className="p-1.5 hover:bg-emerald-500/20 rounded-lg text-white"><Save className="w-4 h-4" /></button>
                                        </div>
                                        <div className="absolute bottom-4 inset-x-4 flex gap-2">
                                            <button onClick={() => onApproveRefinement('replace', url)} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-lg">Replace Original</button>
                                            <button onClick={() => onApproveRefinement('add', url)} className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/10">Add As New</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="min-h-[400px] border-2 border-dashed border-white/5 bg-white/[0.02] rounded-2xl flex flex-col items-center justify-center p-8 text-center">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4 text-white/20">
                                    <Edit2 className="w-8 h-8" />
                                </div>
                                <h4 className="text-white/60 font-bold uppercase tracking-widest text-xs mb-2">Ready to Refine</h4>
                                <p className="text-white/30 text-[10px] max-w-[250px] mx-auto mb-6 leading-relaxed">
                                    Set up your instructions and click "Refine Media" in the left pane to generate high-quality variations.
                                </p>
                                {!refineTarget && (
                                    <label className="px-6 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-[10px] font-bold uppercase tracking-widest text-emerald-400 transition-all cursor-pointer">
                                        Import Source Media
                                        <input type="file" className="hidden" accept="image/*,video/*" onChange={handleRefineImageUpload} />
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
