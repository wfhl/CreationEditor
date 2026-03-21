import React, { useState, type ChangeEvent } from 'react';
import { Sparkles, Edit2, ImagePlus, X, RefreshCw, Download, Video as VideoIcon, Save, Image as ImageIcon, Layers, Loader2, Upload } from 'lucide-react';
import { CustomSelect } from '../CustomSelect';

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
            <div className="creator-panel">
                <div className="creator-panel-body">
                    {/* Header */}
                    <div className="creator-panel-header">
                        <div className="creator-panel-header-icon">
                            <Edit2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="creator-panel-title">Setup</span>
                    </div>

                    {/* Source Reference */}
                    <div className="creator-field">
                        <label className="creator-label">Source Reference</label>
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
                                        <span style={{ fontSize: '9px', color: 'white', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-ui)' }}>Replace</span>
                                        <input type="file" className="hidden" accept="image/*,video/*" onChange={handleRefineImageUpload} />
                                    </label>
                                    <button onClick={() => setRefineTarget(null)} className="absolute top-2 right-2 p-1 text-white/40 hover:text-red-400"><X className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ) : (
                            <label className="creator-upload-zone">
                                <Upload className="w-5 h-5 creator-upload-zone-icon" />
                                <span className="creator-upload-zone-label">Upload Source</span>
                                <input type="file" className="hidden" accept="image/*,video/*" onChange={handleRefineImageUpload} />
                            </label>
                        )}
                    </div>

                    {/* Additional References (Only for relevant image models) */}
                    {!isVideo && (selectedModel.includes('seedream') || selectedModel.includes('banana') || selectedModel.includes('grok')) && (
                        <div className="creator-field">
                            <label className="creator-label">Additional References</label>
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
                        <div className="creator-field">
                            <label className="creator-label" style={{color: '#10b981'}}>Subject Reference (Required)</label>
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
                    <div className="creator-section-divider" />

                    <div className="creator-field">
                        <label className="creator-label">AI Model Engine</label>
                        <CustomSelect
                            value={selectedModel}
                            onChange={setSelectedModel}
                            options={availableModels.map(m => ({ value: m.id, label: m.name }))}
                        />
                    </div>

                    {(selectedModel.includes('seedream') || selectedModel.includes('banana') || selectedModel.includes('gemini')) && (
                        <div className="creator-field">
                            <label className="creator-label">Size / Ratio</label>
                            <CustomSelect
                                value={refineImageSize}
                                onChange={setRefineImageSize}
                                options={selectedModel.includes('banana') || selectedModel.includes('gemini') ? [
                                    { value: '1:1', label: '1:1 Square' },
                                    { value: '16:9', label: '16:9 Cinematic' },
                                    { value: '9:16', label: '9:16 Vertical' },
                                    { value: '4:3', label: '4:3 TV' },
                                ] : [
                                    { value: 'auto_4K', label: 'Auto 4K' },
                                    { value: 'square_hd', label: 'Square 2K' },
                                    { value: 'portrait_4_3', label: 'Portrait 4:3' },
                                    { value: 'landscape_16_9', label: 'Landscape 16:9' },
                                ]}
                            />
                        </div>
                    )}

                    {!isVideo && (
                        <div className="creator-field">
                            <label className="creator-label">Batch Quantity</label>
                            <CustomSelect
                                value={refineNumImages}
                                onChange={(val) => setRefineNumImages(Number(val))}
                                options={[1,2,3,4,6].map(n => ({ value: n, label: `${n} Image${n > 1 ? 's' : ''}` }))}
                            />
                        </div>
                    )}
                </div>

                {/* Left Action Bottom */}
                <div className="creator-panel-footer">
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
                                    className="creator-btn-primary"
                                >
                                    {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    {isRefining ? "Refining..." : "Refine Media"}
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
                                <Edit2 className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <div className="creator-content-title">Refine</div>
                                <div className="creator-content-subtitle">Fine-tune your media</div>
                            </div>
                        </div>
                    </div>

                    {/* Prompt Section */}
                    <div className="creator-field">
                        <div className="creator-prompt-row">
                            <label className="creator-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Sparkles style={{ width: 12, height: 12, color: 'rgb(52,211,153)' }} /> Improvement Instructions
                            </label>
                            {presetsDropdown}
                        </div>
                        <textarea
                            ref={promptRef}
                            value={refinePrompt}
                            onChange={(e) => setRefinePrompt(e.target.value)}
                            placeholder="Describe changes... (e.g., 'Make eyes blue', 'Change background to forest')"
                            className="creator-textarea"
                            style={{ minHeight: '120px' }}
                        />
                    </div>

                    {/* Results Section */}
                    <div className="creator-result-section">
                        <div className="creator-result-header">
                            <span className="creator-result-title">Result Variations</span>
                            {refineResultUrls.length > 0 && (
                                <button onClick={() => setRefineResultUrls([])} className="creator-result-action">
                                    <RefreshCw style={{ width: 12, height: 12 }} /> Reset
                                </button>
                            )}
                        </div>

                        {isRefining ? (
                            <div className="creator-loading-state">
                                <LoadingIndicator title="Refining Media..." modelName={selectedModel} type="edit" />
                                {refineProgress > 0 && (
                                    <div style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden', marginTop: '-20px', zIndex: 10 }}>
                                        <div style={{ height: '100%', background: 'rgb(52,211,153)', width: `${refineProgress}%`, transition: 'width 0.5s', boxShadow: '0 0 10px rgba(52,211,153,0.5)' }} />
                                    </div>
                                )}
                            </div>
                        ) : refineResultUrls.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                                {refineResultUrls.map((url, idx) => (
                                    <div key={idx} className="relative group aspect-[3/4] bg-black/40 rounded-2xl overflow-hidden border-2 border-emerald-500/20 shadow-2xl">
                                        <ImageWithLoader src={url} alt="Refined" className="w-full h-full" onClick={() => onPreview(url, refineResultUrls)} />
                                        <div className="absolute top-2 right-2 flex gap-1 bg-black/60 backdrop-blur-md p-1.5 rounded-xl border border-white/10 opacity-100 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setRefineTarget({ url: url, index: -1 })} className="p-1.5 hover:bg-white/10 rounded-lg" title="Edit again"><Edit2 className="w-4 h-4 text-emerald-400" /></button>
                                            <button onClick={() => onDownload(url, `refine_${idx}`)} className="p-1.5 hover:bg-white/10 rounded-lg text-white" title="Download"><Download className="w-4 h-4" /></button>
                                        </div>
                                        <div className="absolute bottom-4 inset-x-4 flex flex-col gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={() => onApproveRefinement('replace', url)} className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-lg">Replace Original</button>
                                                <button onClick={() => onApproveRefinement('add', url)} className="py-2.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg border border-white/10">Add As New</button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={() => onI2VEntry(url)} className="py-2.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5">
                                                    <VideoIcon className="w-3.5 h-3.5" /> Send to Animate
                                                </button>
                                                <button onClick={() => onSaveToAssets(url, 'image')} className="py-2.5 bg-white/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5">
                                                    <Save className="w-3.5 h-3.5" /> Save to Media
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="creator-empty-state">
                                <Edit2 style={{ width: 40, height: 40 }} className="creator-empty-state-icon" />
                                <div className="creator-empty-state-title">Ready to Refine</div>
                                <p className="creator-empty-state-text">
                                    Set up your instructions and click "Refine Media" in the left panel.
                                </p>
                                {!refineTarget && (
                                    <label className="creator-empty-state-btn">
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
