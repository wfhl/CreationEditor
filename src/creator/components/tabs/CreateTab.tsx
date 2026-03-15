import React, { type ChangeEvent } from 'react';
import { Sparkles, Edit2, Wand2, ImagePlus, Upload, Trash2, Copy, Save, Layers, Loader2, Video as VideoIcon, X, Download, Dices, Image as ImageIcon } from 'lucide-react';
import LoadingIndicator from '../loading-indicator';
import { ImageWithLoader } from '../image-with-loader';
import type { DBAsset as Asset } from '../../lib/dbService';
import { dbService } from '../../lib/dbService';
import { generateUUID } from '../../lib/uuid';
import { AssetUploader } from '../asset-uploader';
import { CustomSelect } from '../CustomSelect';

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
            {/* ═══════════════════ LEFT PANEL ═══════════════════ */}
            <div className="creator-panel">

                {/* Scrollable body */}
                <div className="creator-panel-body">

                    {/* ── Header ── */}
                    <div className="creator-panel-header">
                        <div className="creator-panel-header-icon">
                            <Layers className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                            <p className="creator-panel-title">Setup</p>
                            <p style={{fontSize: '9px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px'}}>Configure your creation</p>
                        </div>
                    </div>

                    {/* ── Dream Concept Button ── */}
                    <div style={{ marginBottom: '24px' }}>
                        <button
                            onClick={handleDreamConcept}
                            disabled={isDreaming || !apiKeys.gemini}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                padding: '14px',
                                borderRadius: '12px',
                                border: '1px solid rgba(16,185,129,0.25)',
                                background: 'rgba(16,185,129,0.08)',
                                fontSize: '11px',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.14em',
                                color: apiKeys.gemini ? 'rgba(52,211,153,1)' : 'rgba(255,255,255,0.2)',
                                cursor: (isDreaming || !apiKeys.gemini) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s'
                            }}
                        >
                            {isDreaming
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Wand2 className="w-4 h-4" />
                            }
                            {isDreaming ? 'Thinking...' : 'Dream Concept'}
                        </button>
                        {!apiKeys.gemini && (
                            <p className="creator-key-warning" style={{ marginTop: '8px' }}>Gemini Key Required in Settings</p>
                        )}
                    </div>

                    {/* Core Theme */}
                    <div className="creator-field">
                        <label className="creator-label">Core Theme</label>
                        <CustomSelect
                            value={selectedThemeId}
                            onChange={(val) => {
                                setSelectedThemeId(val);
                                if (val === 'CUSTOM') setSpecificVisuals("");
                            }}
                            options={[
                                ...themes.map(theme => ({ value: theme.id, label: theme.name })),
                                { value: 'CUSTOM', label: 'Custom / Manual' },
                            ]}
                        />
                    </div>

                    {/* Custom Concept (conditional) */}
                    {selectedThemeId === 'CUSTOM' && (
                        <div className="creator-field">
                            <label className="creator-label">Custom Concept</label>
                            <textarea
                                value={customTheme}
                                onChange={(e) => setCustomTheme(e.target.value)}
                                placeholder="Enter theme or quote..."
                                className="creator-textarea"
                                rows={3}
                            />
                        </div>
                    )}

                    {/* Visual Concept */}
                    <div className="creator-field">
                        <div className="flex justify-between items-center">
                            <label className="creator-label">Visual Concept</label>
                            <label className="flex items-center gap-1 cursor-pointer" style={{color: '#10b981', fontSize: '10px', fontWeight: 700}}>
                                <ImagePlus className="w-3 h-3" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleInputImageUpload(e, 'visuals')} />
                            </label>
                        </div>
                        {visualsImage ? (
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-emerald-500/30 group">
                                <img src={visualsImage} alt="Ref" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => setSpecificVisuals("")}
                                    title="Remove Reference Image"
                                    className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <textarea
                                value={specificVisuals}
                                onChange={(e) => setSpecificVisuals(e.target.value)}
                                placeholder={(currentTheme as any).defaultSetting || "Describe the visual setting..."}
                                className="creator-textarea"
                                rows={3}
                            />
                        )}
                    </div>

                    {/* Subject Outfit */}
                    <div className="creator-field">
                        <div className="flex justify-between items-center">
                            <label className="creator-label">Subject Outfit</label>
                            <label className="flex items-center gap-1 cursor-pointer" style={{color: '#10b981', fontSize: '10px', fontWeight: 700}}>
                                <ImagePlus className="w-3 h-3" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleInputImageUpload(e, 'outfit')} />
                            </label>
                        </div>
                        {outfitImage ? (
                            <div className="relative w-24 aspect-[4/3] rounded-xl overflow-hidden border border-emerald-500/30 group">
                                <img src={outfitImage} alt="Outfit" className="w-full h-full object-cover" />
                                <button onClick={() => setSpecificOutfit("")} title="Remove Outfit Image" className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white/60 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ) : (
                            <textarea
                                value={specificOutfit}
                                onChange={(e) => setSpecificOutfit(e.target.value)}
                                placeholder={currentTheme.defaultOutfit}
                                className="creator-textarea"
                                rows={3}
                            />
                        )}
                    </div>

                    {/* Subject Identity */}
                    <div className="creator-field">
                        <div className="creator-section-divider" />
                        <AssetUploader
                            assets={assets}
                            onAdd={onAssetsAdd}
                            onRemove={onAssetRemove}
                            onToggleSelection={onAssetToggle}
                            label="Subject Identity"
                        />
                    </div>

                    {/* LoRA Controls (conditional) */}
                    {selectedModel.includes('lora') && (
                        <div className="creator-field">
                            <div className="creator-section-divider" />
                            <div className="flex justify-between items-center">
                                <label className="creator-label">
                                    <Layers className="w-3 h-3 text-emerald-500" />
                                    Model Weights
                                </label>
                                <button onClick={() => setLoras([...loras, { path: '', scale: 1.0 }])} style={{fontSize: '9px', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em'}}>+ Add</button>
                            </div>
                            <div className="flex flex-col gap-2">
                                {loras.map((lora, idx) => (
                                    <div key={idx} className="bg-black/20 border border-white/5 rounded-lg p-3 flex flex-col gap-2">
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder="LoRA URL"
                                                value={lora.path}
                                                onChange={(e) => { const nl = [...loras]; nl[idx].path = e.target.value; setLoras(nl); }}
                                                className="creator-input flex-1"
                                                style={{padding: '6px 10px', fontSize: '11px'}}
                                            />
                                            <button onClick={() => setLoras(loras.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-300 p-1 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                        <input type="range" min="0" max="2" step="0.05" value={lora.scale}
                                            onChange={(e) => { const nl = [...loras]; nl[idx].scale = parseFloat(e.target.value); setLoras(nl); }}
                                            className="w-full accent-emerald-500" style={{height: '4px'}}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Section Divider ── */}
                    <div className="creator-section-divider" style={{ margin: '8px 0' }} />

                    {/* ── Section: Generation Parameters ── */}

                    {/* Creation Mode toggle */}
                    <div className="creator-field">
                        <label className="creator-label">Creation Mode</label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '4px',
                            padding: '4px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            background: 'rgba(0,0,0,0.5)',
                            height: '44px',
                            boxSizing: 'border-box',
                        }}>
                            <button
                                onClick={() => setMediaType('image')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '7px',
                                    borderRadius: '7px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    transition: 'all 0.15s',
                                    background: mediaType === 'image' ? 'rgb(16,185,129)' : 'transparent',
                                    color: mediaType === 'image' ? 'black' : 'rgba(255,255,255,0.35)',
                                    boxShadow: mediaType === 'image' ? '0 2px 12px rgba(16,185,129,0.3)' : 'none',
                                }}
                            >
                                <ImageIcon style={{ width: '15px', height: '15px', color: mediaType === 'image' ? 'black' : 'rgba(16,185,129,0.5)' }} />
                                Image
                            </button>
                            <button
                                onClick={() => setMediaType('video')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '7px',
                                    borderRadius: '7px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    transition: 'all 0.15s',
                                    background: mediaType === 'video' ? 'rgb(16,185,129)' : 'transparent',
                                    color: mediaType === 'video' ? 'black' : 'rgba(255,255,255,0.35)',
                                    boxShadow: mediaType === 'video' ? '0 2px 12px rgba(16,185,129,0.3)' : 'none',
                                }}
                            >
                                <VideoIcon style={{ width: '15px', height: '15px', color: mediaType === 'video' ? 'black' : 'rgba(16,185,129,0.5)' }} />
                                Video
                            </button>
                        </div>
                    </div>

                    {/* Engine */}
                    <div className="creator-field">
                        <label className="creator-label">Engine</label>
                        <CustomSelect
                            value={selectedModel}
                            onChange={setSelectedModel}
                            options={mediaType === 'image' ? [
                                { value: 'gemini-3-pro-image-preview', label: 'Nano Banana Pro' },
                                { value: 'gemini-3.1-flash-image-preview', label: 'Nano Banana 2' },
                                { value: 'gemini-2.5-flash-image', label: 'Nano Banana' },
                                { value: 'fal-ai/bytedance/seedream/v5/lite/text-to-image', label: 'Seedream 5.1 Lite' },
                                { value: 'fal-ai/bytedance/seedream/v4.5/text-to-image', label: 'Seedream v4.5' },
                            ] : [
                                { value: 'veo-3.1-generate-preview', label: 'Veo 3.1 (Video)' },
                                { value: 'fal-ai/wan/v2.2-a14b/image-to-video/lora', label: 'Wan 2.2 w/ LoRA' },
                            ]}
                        />
                    </div>

                    {/* Size + Batch */}
                    <div className="creator-field-grid">
                        <div className="creator-field">
                            <label className="creator-label">Size</label>
                            <CustomSelect
                                value={selectedModel.includes('v4.5') ? createImageSize : aspectRatio}
                                onChange={(val) => selectedModel.includes('v4.5') ? setCreateImageSize(val) : setAspectRatio(val)}
                                options={[
                                    { value: '1:1', label: '1:1 Square' },
                                    { value: '16:9', label: '16:9 Wide' },
                                    { value: '9:16', label: '9:16 Tall' },
                                    { value: '4:3', label: '4:3' },
                                ]}
                            />
                        </div>

                        <div className="creator-field">
                            <label className="creator-label">Batch</label>
                            <CustomSelect
                                value={createNumImages}
                                onChange={(val) => setCreateNumImages(Number(val))}
                                options={[
                                    { value: 1, label: '1 Image' },
                                    { value: 2, label: '2 Images' },
                                    { value: 4, label: '4 Images' },
                                ]}
                            />
                        </div>
                    </div>

                </div>{/* end creator-panel-body */}

                {/* Footer Action Area */}
                <div className="creator-panel-footer">
                    {(() => {
                        const isFalModel = !!selectedModel.toLowerCase().match(/grok|seedream|seedance|wan|banana|fal/i);
                        const missingFal = isFalModel && !apiKeys.fal;
                        const missingGemini = !isFalModel && !apiKeys.gemini;
                        const isDisabled = isGeneratingMedia || missingFal || missingGemini;

                        return (
                            <>
                                <button
                                    onClick={handleGenerateContent}
                                    disabled={isDisabled}
                                    className="creator-btn-primary"
                                >
                                    {isGeneratingMedia ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                    {isGeneratingMedia ? "Creating..." : "Generate"}
                                </button>
                                {missingFal && <p className="creator-key-warning">Fal.ai Key Required in Settings</p>}
                                {missingGemini && <p className="creator-key-warning">Gemini Key Required in Settings</p>}
                            </>
                        );
                    })()}
                </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col h-full bg-[#0e0e11] relative">
                <div className="flex-1 flex flex-col h-full overflow-y-auto hidden-scrollbar relative min-h-0" style={{ padding: '32px 40px' }}>
                    <div className="max-w-5xl mx-auto w-full" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                        {/* Header: Title and Mode Toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16,185,129,0.2)', flexShrink: 0 }}>
                                    <Sparkles className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '18px', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.2em', lineHeight: 1 }}>Create</h2>
                                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, marginTop: '4px' }}>Synthesize new high-fidelity media assets</p>
                                </div>
                            </div>
                        </div>

                        {/* Final Prompt Area */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Wand2 className="w-3 h-3 text-emerald-400" /> Final Prompt
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {presetsDropdown}
                                    <button onClick={() => handleCopy(generatedPrompt)} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.4)' }}>
                                        <Copy className="w-3 h-3" /> Copy
                                    </button>
                                </div>
                            </div>
                            <textarea
                                ref={promptRef}
                                value={generatedPrompt}
                                onChange={(e) => setGeneratedPrompt(e.target.value)}
                                style={{
                                    width: '100%',
                                    height: '140px',
                                    padding: '16px 20px',
                                    background: 'rgba(0,0,0,0.4)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '16px',
                                    color: 'rgba(255,255,255,0.9)',
                                    fontSize: '13px',
                                    lineHeight: '1.7',
                                    fontFamily: 'inherit',
                                    resize: 'vertical',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="Generate a prompt first, or paste one here..."
                            />
                        </div>

                        {/* Results / Empty State */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                                                <button onClick={() => handleRefineEntry(url, idx)} className="p-2 hover:bg-white/10 rounded-xl" title="Refine Media in Editor"><Edit2 className="w-4 h-4 text-emerald-400" /></button>
                                                <button onClick={() => onDownload(url, `gen_${idx}`)} className="p-2 hover:bg-white/10 rounded-xl text-white" title="Download Media Output"><Download className="w-4 h-4" /></button>
                                                <button onClick={() => onRemoveMedia(idx)} className="p-2 hover:bg-red-500/20 rounded-xl text-red-500" title="Delete Media"><Trash2 className="w-4 h-4 text-red-500" /></button>
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
                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                        <button
                                            onClick={() => onNavigateTo?.('media')}
                                            style={{
                                                padding: '14px 28px',
                                                background: 'rgba(16,185,129,0.15)',
                                                border: '1px solid rgba(16,185,129,0.35)',
                                                borderRadius: '10px',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                color: 'rgb(52,211,153)',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                            }}
                                        >
                                            Import from Library
                                        </button>
                                        <label
                                            style={{
                                                padding: '14px 28px',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.12)',
                                                borderRadius: '10px',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                color: 'rgba(255,255,255,0.6)',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                            }}
                                        >
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
