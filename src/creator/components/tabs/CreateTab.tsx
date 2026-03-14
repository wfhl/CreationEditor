import React, { type ChangeEvent } from 'react';
import { Sparkles, Edit2, ChevronDown, Wand2, ImagePlus, Upload, Trash2, Copy, Save, Layers, Loader2, Video as VideoIcon, X, Download, Dices, Image as ImageIcon } from 'lucide-react';
import LoadingIndicator from '../loading-indicator';
import { ImageWithLoader } from '../image-with-loader';
import type { DBAsset as Asset } from '../../lib/dbService';
import { dbService } from '../../lib/dbService';
import { generateUUID } from '../../lib/uuid';
import { AssetUploader } from '../asset-uploader';

import { type Theme, type CaptionStyle } from './SettingsTab';

interface CreateTabProps {
    themes: Theme[];
    captionStyles: CaptionStyle[];
    selectedThemeId: string;
    setSelectedThemeId: (id: string) => void;
    customTheme: string;
    setCustomTheme: (val: string) => void;
    specificVisuals: string;
    setSpecificVisuals: (val: string) => void;
    specificOutfit: string;
    setSpecificOutfit: (val: string) => void;
    assets: Asset[];
    onAssetsAdd: (files: FileList) => void;
    onAssetRemove: (id: string) => void;
    onAssetToggle: (id: string) => void;
    handleInputImageUpload: (e: ChangeEvent<HTMLInputElement>, target: 'visuals' | 'outfit') => void;
    visualsImage: string | null;
    outfitImage: string | null;
    generatedPrompt: string;
    setGeneratedPrompt: (val: string) => void;
    selectedModel: string;
    setSelectedModel: (val: string) => void;
    mediaType: 'image' | 'video';
    setMediaType: (val: 'image' | 'video') => void;
    aspectRatio: string;
    setAspectRatio: (val: string) => void;
    createImageSize: string;
    setCreateImageSize: (val: string) => void;
    createNumImages: number;
    setCreateNumImages: (val: number) => void;
    videoResolution: string;
    setVideoResolution: (val: string) => void;
    videoDuration: string;
    setVideoDuration: (val: string) => void;
    topic: string;
    setTopic: (val: string) => void;
    captionType: string;
    setCaptionType: (val: string) => void;
    generatedCaption: string;
    setGeneratedCaption: (val: string) => void;
    isDreaming: boolean;
    handleDreamConcept: () => void;
    handleGenerateContent: () => void;
    isGeneratingMedia: boolean;
    isGeneratingCaption: boolean;
    handleGenerateRandomPost: () => void;
    generatedMediaUrls: string[];
    handleRefineEntry: (url: string, index: number) => void;
    handleI2VEntry: (url: string, index: number) => void;
    handleCopy: (text: string) => void;
    handleSavePost: () => void;
    isSaving: boolean;
    showSaveForm: boolean;
    setShowSaveForm: (val: boolean) => void;
    presetsDropdown: React.ReactNode;
    apiKeys: { gemini: string; fal: string };
    onGenerateCaptionOnly: () => void;
    onSaveToAssets: (url: string, type: 'image' | 'video', name?: string) => void;
    onPreview: (url: string) => void;
    onDownload: (url: string, prefix?: string) => void;
    onUploadToPost: (files: FileList | null) => void;
    onRemoveMedia: (index: number) => void;
    onRerollMedia: (index: number) => void;
    loras: Array<{ path: string; scale: number }>;
    setLoras: (loras: Array<{ path: string; scale: number }>) => void;
    onLoRAUpload: (file: File) => Promise<void>;
    promptRef?: React.Ref<HTMLTextAreaElement>;
    onNavigateTo?: (tab: string) => void;
    onExit?: () => void;
}

export function CreateTab({
    themes,
    captionStyles,
    selectedThemeId,
    setSelectedThemeId,
    customTheme,
    setCustomTheme,
    specificVisuals,
    setSpecificVisuals,
    specificOutfit,
    setSpecificOutfit,
    assets,
    onAssetsAdd,
    onAssetRemove,
    onAssetToggle,
    handleInputImageUpload,
    generatedPrompt,
    setGeneratedPrompt,
    selectedModel,
    setSelectedModel,
    mediaType,
    setMediaType,
    aspectRatio,
    setAspectRatio,
    createImageSize,
    setCreateImageSize,
    createNumImages,
    setCreateNumImages,
    videoResolution,
    setVideoResolution,
    videoDuration,
    setVideoDuration,
    topic,
    setTopic,
    captionType,
    setCaptionType,
    generatedCaption,
    setGeneratedCaption,
    isDreaming,
    handleDreamConcept,
    handleGenerateContent,
    isGeneratingMedia,
    isGeneratingCaption,
    handleGenerateRandomPost,
    generatedMediaUrls,
    handleRefineEntry,
    handleI2VEntry,
    handleCopy,
    handleSavePost,
    isSaving,
    showSaveForm,
    setShowSaveForm,
    presetsDropdown,
    onGenerateCaptionOnly,
    onSaveToAssets,
    onPreview,
    onDownload,
    onUploadToPost,
    onRemoveMedia,
    onRerollMedia,
    loras,
    setLoras,
    onLoRAUpload,
    promptRef,
    apiKeys,
    visualsImage,
    outfitImage,
    onNavigateTo,
    onExit
}: CreateTabProps) {

    const currentTheme = selectedThemeId === 'CUSTOM'
        ? { name: 'Custom', defaultOutfit: 'custom', defaultVisuals: 'custom' }
        : themes.find(t => t.id === selectedThemeId) || themes[0];

    return (
        <div className="flex h-full w-full pointer-events-auto bg-[var(--bg-deep)]">
            {/* === LEFT COLUMN: CONTROLS === */}
            <div className="w-[360px] flex-shrink-0 flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)] relative">
                <div className="flex-1 flex flex-col h-full px-6 py-6 min-h-0">
                    <div className="flex-1 flex flex-col gap-8 overflow-y-auto hidden-scrollbar pr-2 pt-1">
                        <div className="flex items-center justify-between pb-8 border-b border-[var(--border)] mb-6">
                            <div className="flex items-center gap-5 px-2 pt-2">
                                <h2 className="text-sm font-black text-white uppercase tracking-[0.15em] flex items-center gap-4">
                                    <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                        <Layers className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    Setup
                                </h2>
                            </div>
                        </div>

                        <div className="flex justify-between items-center -mt-2">
                            <button
                                onClick={handleDreamConcept}
                                disabled={isDreaming || !apiKeys.gemini}
                                className="w-full text-center text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 text-emerald-300 hover:text-white disabled:opacity-30 transition-all bg-emerald-500/10 py-2.5 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5 group"
                            >
                                {isDreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
                                {isDreaming ? 'Thinking...' : 'Dream Concept'}
                            </button>
                        </div>
                        {!apiKeys.gemini && (
                            <p className="text-[8px] font-bold text-red-400 uppercase tracking-tight text-center animate-pulse -mt-6">Gemini Key Required for AI Drafting</p>
                        )}

                        {/* Theme Selection */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest block">Core Theme</label>
                            <div className="relative">
                                <select
                                    value={selectedThemeId}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedThemeId(val);
                                        if (val === 'CUSTOM') setSpecificVisuals("");
                                    }}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white appearance-none focus:outline-none focus:border-emerald-500/50"
                                >
                                    {themes.map(theme => (
                                        <option key={theme.id} value={theme.id}>{theme.name}</option>
                                    ))}
                                    <option value="CUSTOM">Custom / Manual</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                            </div>
                        </div>

                        {/* Custom Theme Input */}
                        {selectedThemeId === 'CUSTOM' && (
                            <div className="space-y-3">
                                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest block">Custom Concept</label>
                                <textarea
                                    value={customTheme}
                                    onChange={(e) => setCustomTheme(e.target.value)}
                                    placeholder="Enter theme or quote..."
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors min-h-[80px]"
                                />
                            </div>
                        )}

                        {/* Visual Details */}
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest block">Visual Concept</label>
                                    <label className="cursor-pointer text-[12px] flex items-center gap-1 text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-widest transition-colors">
                                        <ImagePlus className="w-3 h-3" />
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleInputImageUpload(e, 'visuals')} />
                                    </label>
                                </div>
                                {visualsImage ? (
                                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-emerald-500/30 group bg-black/40">
                                        <img src={visualsImage} alt="Ref" className="w-full h-full object-cover" />
                                        <button onClick={() => setSpecificVisuals("")} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <textarea
                                        value={specificVisuals}
                                        onChange={(e) => setSpecificVisuals(e.target.value)}
                                        placeholder={(currentTheme as any).defaultSetting || "Describe the setting..."}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 min-h-[100px] leading-relaxed transition-all shadow-inner"
                                    />
                                )}
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest block">Subject Outfit</label>
                                    <label className="cursor-pointer text-[12px] flex items-center gap-1 text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-widest transition-colors">
                                        <ImagePlus className="w-3 h-3" />
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleInputImageUpload(e, 'outfit')} />
                                    </label>
                                </div>
                                {outfitImage ? (
                                    <div className="relative aspect-[4/3] w-24 rounded-lg overflow-hidden border border-emerald-500/30 group bg-black/40">
                                        <img src={outfitImage} alt="Outfit" className="w-full h-full object-cover" />
                                        <button onClick={() => setSpecificOutfit("")} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <textarea
                                        value={specificOutfit}
                                        onChange={(e) => setSpecificOutfit(e.target.value)}
                                        placeholder={currentTheme.defaultOutfit}
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 min-h-[100px] leading-relaxed transition-all shadow-inner"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="border-t border-[var(--border)] pt-8">
                            <AssetUploader
                                assets={assets}
                                onAdd={onAssetsAdd}
                                onRemove={onAssetRemove}
                                onToggleSelection={onAssetToggle}
                                label="Subject Identity"
                            />
                        </div>

                        {/* LoRA Controls */}
                        {selectedModel.includes('lora') && (
                            <div className="border-t border-[var(--border)] pt-8 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                        <Layers className="w-3 h-3 text-emerald-500" />
                                        Model Weights
                                    </label>
                                    <button onClick={() => setLoras([...loras, { path: '', scale: 1.0 }])} className="text-[11px] text-emerald-400 font-bold uppercase tracking-widest">Add</button>
                                </div>
                                <div className="space-y-2">
                                    {loras.map((lora, idx) => (
                                        <div key={idx} className="bg-black/20 border border-white/5 rounded-lg p-2 space-y-2">
                                            <div className="flex justify-between items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="URL"
                                                    value={lora.path}
                                                    onChange={(e) => {
                                                        const newLoras = [...loras];
                                                        newLoras[idx].path = e.target.value;
                                                        setLoras(newLoras);
                                                    }}
                                                    className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-[9px] text-white outline-none"
                                                />
                                                <button onClick={() => setLoras(loras.filter((_, i) => i !== idx))} className="text-red-400"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="2"
                                                step="0.05"
                                                value={lora.scale}
                                                onChange={(e) => {
                                                    const newLoras = [...loras];
                                                    newLoras[idx].scale = parseFloat(e.target.value);
                                                    setLoras(newLoras);
                                                }}
                                                className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-emerald-500"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Generation Parameters */}
                        <div className="border-t border-[var(--border)] pt-6 space-y-6">
                            {/* Media Type Toggle */}
                            <div className="space-y-3">
                                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest pl-1">Creation Mode</label>
                                <div className="grid grid-cols-2 bg-black/60 rounded-xl p-1.5 border border-white/10 gap-1.5 shadow-2xl">
                                    <button
                                        onClick={() => setMediaType('image')}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] transition-all ${mediaType === 'image' ? 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/40 scale-[1.02]' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
                                    >
                                        <ImageIcon className={`w-4 h-4 ${mediaType === 'image' ? 'text-black' : 'text-emerald-500/60'}`} />
                                        Image
                                    </button>
                                    <button
                                        onClick={() => setMediaType('video')}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] transition-all ${mediaType === 'video' ? 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/40 scale-[1.02]' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
                                    >
                                        <VideoIcon className={`w-4 h-4 ${mediaType === 'video' ? 'text-black' : 'text-emerald-500/60'}`} />
                                        Video
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest pl-1">Engine</label>
                                <div className="relative group">
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white appearance-none focus:outline-none focus:border-emerald-500/50 hover:border-white/20 transition-all"
                                    >
                                        {mediaType === 'image' ? (
                                            <>
                                                <option value="gemini-3-pro-image-preview">Nano Banana Pro</option>
                                                <option value="gemini-3.1-flash-image-preview">Nano Banana 2</option>
                                                <option value="gemini-2.5-flash-image">Nano Banana</option>
                                                <option value="fal-ai/bytedance/seedream/v5/lite/text-to-image">Seedream 5.1 Lite</option>
                                                <option value="fal-ai/bytedance/seedream/v4.5/text-to-image">Seedream v4.5</option>
                                            </>
                                        ) : (
                                            <>
                                                <option value="veo-3.1-generate-preview">Veo 3.1 (Video)</option>
                                                <option value="fal-ai/wan/v2.2-a14b/image-to-video/lora">Wan 2.2 w/ LoRA</option>
                                            </>
                                        )}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none group-hover:text-emerald-400 transition-colors" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-3">
                                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest pl-1">Size</label>
                                    <div className="relative group">
                                        <select
                                            value={selectedModel.includes('v4.5') ? createImageSize : aspectRatio}
                                            onChange={(e) => selectedModel.includes('v4.5') ? setCreateImageSize(e.target.value) : setAspectRatio(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white appearance-none focus:outline-none focus:border-emerald-500/50 hover:border-white/20 transition-all"
                                        >
                                            <option value="1:1">1:1</option>
                                            <option value="16:9">16:9</option>
                                            <option value="9:16">9:16</option>
                                            <option value="4:3">4:3</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none group-hover:text-emerald-400 transition-colors" />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest pl-1">Batch</label>
                                    <div className="relative group">
                                        <select
                                            value={createNumImages}
                                            onChange={(e) => setCreateNumImages(Number(e.target.value))}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white appearance-none focus:outline-none focus:border-emerald-500/50 hover:border-white/20 transition-all"
                                        >
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                            <option value={4}>4</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none group-hover:text-emerald-400 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Action Area */}
                    <div className="pt-4 border-t border-[var(--border)] mt-auto mb-2">
                        {(() => {
                            const isFalModel = !!selectedModel.toLowerCase().match(/grok|seedream|seedance|wan|banana|fal/i);
                            const missingFal = isFalModel && !apiKeys.fal;
                            const missingGemini = !isFalModel && !apiKeys.gemini;
                            const isDisabled = isGeneratingMedia || missingFal || missingGemini;

                            return (
                                <div className="space-y-3">
                                    <button
                                        onClick={handleGenerateContent}
                                        disabled={isDisabled}
                                        className={`w-full py-4 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center justify-center gap-3 ${isDisabled ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-emerald-500/20 hover:-translate-y-1 active:scale-95'}`}
                                    >
                                        {isGeneratingMedia ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                        {isGeneratingMedia ? "Creating..." : "Generate"}
                                    </button>
                                    {missingFal && <p className="text-[8px] font-bold text-red-400 uppercase tracking-tight text-center animate-pulse">Fal.ai Key Required in Settings</p>}
                                    {missingGemini && <p className="text-[8px] font-bold text-red-400 uppercase tracking-tight text-center animate-pulse">Gemini Key Required in Settings</p>}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* === RIGHT COLUMN: CONTENT & PREVIEW === */}
            <div className="flex-1 min-w-0 flex flex-col h-full bg-[#0e0e11] relative">
                <div className="flex-1 flex flex-col h-full p-8 overflow-y-auto hidden-scrollbar relative min-h-0">
                    <div className="max-w-5xl mx-auto w-full space-y-16 py-8">
                    
                        {/* Header: Title and Mode Toggle */}
                        <div className="flex items-center justify-between border-b border-[var(--border)] pb-8">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                    <Sparkles className="w-6 h-6 text-emerald-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white uppercase tracking-[0.2em]">Create</h2>
                                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Sythensize new high-fidelity media assets</p>
                                </div>
                            </div>
                        </div>

                        {/* Final Prompt Area */}
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                                    <Wand2 className="w-3 h-3 text-emerald-400" /> Final Prompt
                                </label>
                                <div className="flex items-center gap-3">
                                    {presetsDropdown}
                                    <button onClick={() => handleCopy(generatedPrompt)} className="text-[10px] flex items-center gap-1 text-white/40 hover:text-white transition-colors">
                                        <Copy className="w-3 h-3" /> Copy
                                    </button>
                                </div>
                            </div>
                            <textarea
                                ref={promptRef}
                                value={generatedPrompt}
                                onChange={(e) => setGeneratedPrompt(e.target.value)}
                                className="w-full h-40 p-5 bg-black/40 border border-white/10 rounded-2xl text-sm text-white/90 leading-relaxed focus:outline-none focus:border-emerald-500/50 shadow-inner"
                                placeholder="Generate a prompt first..."
                            />
                        </div>

                        {/* Results / Empty State */}
                        <div className="space-y-8 pt-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <h3 className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Creation Results</h3>
                                <div className="flex items-center gap-4">
                                    {generatedMediaUrls.length > 0 && (
                                        <>
                                            <button onClick={handleGenerateRandomPost} className="text-[11px] text-white/40 hover:text-emerald-400 uppercase tracking-widest font-bold flex items-center gap-1.5 transition-colors">
                                                <Dices className="w-3.5 h-3.5" /> Randomize
                                            </button>
                                            <button onClick={() => setShowSaveForm(true)} className="text-[11px] text-emerald-400 hover:text-emerald-300 uppercase tracking-widest font-bold flex items-center gap-1.5 transition-colors">
                                                <Save className="w-3.5 h-3.5" /> Save to Library
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {isGeneratingMedia ? (
                                <div className="min-h-[400px] border-2 border-dashed border-emerald-500/20 bg-emerald-500/5 rounded-2xl flex flex-col items-center justify-center p-12 animate-pulse text-center space-y-6">
                                    <LoadingIndicator title="Generating..." modelName={selectedModel} type={mediaType} />
                                </div>
                            ) : generatedMediaUrls.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-12">
                                    {generatedMediaUrls.map((url, idx) => (
                                        <div key={idx} className="relative group aspect-[3/4] bg-black/40 rounded-xl overflow-hidden border border-white/5 shadow-2xl hover:border-emerald-500/30 transition-all">
                                            <ImageWithLoader src={url} alt="Gen" className="w-full h-full" onClick={() => onPreview(url)} />
                                            <div className="absolute top-3 right-3 flex gap-2 bg-black/60 backdrop-blur-md p-2 rounded-2xl border border-white/10 opacity-100 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleRefineEntry(url, idx)} className="p-2 hover:bg-white/10 rounded-xl" title="Edit"><Edit2 className="w-4 h-4 text-emerald-400" /></button>
                                                <button onClick={() => onDownload(url, `gen_${idx}`)} className="p-2 hover:bg-white/10 rounded-xl text-white" title="Download"><Download className="w-4 h-4" /></button>
                                                <button onClick={() => onRemoveMedia(idx)} className="p-2 hover:bg-red-500/20 rounded-xl text-red-500" title="Remove"><Trash2 className="w-4 h-4 text-red-500" /></button>
                                            </div>
                                            <div className="absolute bottom-6 inset-x-6 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleI2VEntry(url, idx)} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-black text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center gap-2.5">
                                                    <VideoIcon className="w-4 h-4" /> Animate Video
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <label className="aspect-[3/4] border-2 border-dashed border-white/5 bg-white/[0.02] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-emerald-500/50 transition-all group">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:bg-emerald-500/10 group-hover:scale-110 transition-all">
                                            <Upload className="w-6 h-6 text-white/20 group-hover:text-emerald-400" />
                                        </div>
                                        <span className="text-[11px] text-white/40 font-bold uppercase tracking-widest">Import More</span>
                                        <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => onUploadToPost(e.target.files)} />
                                    </label>
                                </div>
                            ) : (
                                <div className="min-h-[500px] border border-dashed border-white/10 bg-white/[0.02] rounded-2xl flex flex-col items-center justify-center p-12 text-center group">
                                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 text-white/20 group-hover:scale-110 transition-transform">
                                        <ImageIcon className="w-10 h-10" />
                                    </div>
                                    <h4 className="text-white/60 font-bold uppercase tracking-widest text-sm mb-3">No Generations Yet</h4>
                                    <p className="text-white/30 text-[11px] max-w-[280px] mx-auto mb-8 leading-relaxed">
                                        Set up your theme and visuals in the left pane, then click "Generate Media" to start creating.
                                    </p>
                                    <div className="flex gap-4">
                                        <button onClick={() => onNavigateTo?.('media')} className="px-6 py-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-[11px] font-bold uppercase tracking-widest text-emerald-400 transition-all">
                                            Import from Library
                                        </button>
                                        <label className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-bold uppercase tracking-widest text-white/60 transition-all cursor-pointer">
                                            Upload Local
                                            <input type="file" multiple className="hidden" onChange={(e) => onUploadToPost(e.target.files)} />
                                        </label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Save Overlay */}
            {showSaveForm && (
                <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setShowSaveForm(false)}>
                    <div className="bg-[#0e0e11] border border-white/10 rounded-3xl p-8 w-full max-w-sm space-y-8" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white uppercase tracking-widest">Save Post</h3>
                            <button onClick={() => setShowSaveForm(false)} className="text-white/40"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Topic / Title</label>
                            <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic..." className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none" autoFocus />
                        </div>
                        <button onClick={() => { handleSavePost(); setShowSaveForm(false); }} className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold uppercase tracking-widest rounded-2xl transition-all">
                            Confirm Save
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
