import { Loader2, Wand2, AlignLeft, ChevronDown, Copy, Save, X } from 'lucide-react';

export interface ScriptsTabProps {
    topic: string;
    setTopic: (val: string) => void;
    captionType: string;
    setCaptionType: (val: string) => void;
    generatedCaption: string;
    setGeneratedCaption: (val: string) => void;
    captionStyles: { id: string; label: string; prompt: string }[];
    onGenerateCaptionOnly: () => void;
    isGeneratingCaption: boolean;
    onSave?: () => void;
    onExit?: () => void;
    onNavigateTo?: (tab: string) => void;
    apiKeys: { gemini: string; fal: string };
}

export function ScriptsTab({
    topic,
    setTopic,
    captionType,
    setCaptionType,
    generatedCaption,
    setGeneratedCaption,
    captionStyles,
    onGenerateCaptionOnly,
    isGeneratingCaption,
    onSave,
    onExit,
    onNavigateTo,
    apiKeys
}: ScriptsTabProps) {
    return (
        <div className="flex h-full w-full pointer-events-auto">

            {/* === LEFT COLUMN: CONTROLS === */}
            <div className="creator-panel">
                <div className="creator-panel-body" id="scripts-setup-pane">
                    {/* Header */}
                    <div className="creator-panel-header">
                        <div className="creator-panel-header-icon">
                            <AlignLeft className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="creator-panel-title">Setup</span>
                    </div>

                    <div className="flex items-center gap-5 mb-1">
                        <span className="creator-section-label">
                            <AlignLeft className="w-3 h-3 text-emerald-400" /> Script Strategy
                        </span>
                    </div>

                    <div className="creator-field">
                        <label className="creator-label">Concept / Topic</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Morning thoughts, AI future..."
                            className="creator-input"
                        />
                    </div>

                    <div className="creator-field">
                        <label className="creator-label">Style</label>
                        <div className="creator-select-wrap">
                            <select
                                value={captionType}
                                onChange={(e) => setCaptionType(e.target.value)}
                                className="creator-select"
                            >
                                {captionStyles.map(t => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 creator-chevron" />
                        </div>
                    </div>
                </div>

                {/* Left Action Bottom */}
                <div className="creator-panel-footer">
                    <button
                        onClick={onGenerateCaptionOnly}
                        disabled={isGeneratingCaption || !apiKeys.gemini}
                        className="creator-btn-primary"
                    >
                        {isGeneratingCaption ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        {isGeneratingCaption ? "Writing..." : "Generate Script"}
                    </button>
                    {!apiKeys.gemini && (
                        <p className="creator-key-warning">Gemini Key Required in Settings</p>
                    )}
                </div>
            </div>

            {/* === RIGHT COLUMN: PREVIEW/CANVAS === */}
            <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[var(--bg-deep)] relative">
                <div className="p-6 max-w-5xl mx-auto w-full space-y-6 pb-32">
                    
                    {/* Header: Script View Label */}
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-8">
                        <div className="flex items-center gap-6">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                <AlignLeft className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-[0.2em]">Script</h2>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Video Script / Narration</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedCaption);
                                    alert("Copied to clipboard!");
                                }} 
                                className="text-[10px] flex items-center gap-1 text-white/40 hover:text-white transition-colors"
                            >
                                <Copy className="w-3 h-3" /> Copy
                            </button>
                            {onSave && (
                                <button 
                                    onClick={onSave} 
                                    className="px-4 py-2 bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                                >
                                    <Save className="w-3 h-3 inline mr-2" /> Save to Library
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Script Output Area */}
                    <div className="space-y-4">
                        <div className="relative flex flex-col gap-4">
                            <textarea
                                value={generatedCaption}
                                onChange={(e) => setGeneratedCaption(e.target.value)}
                                placeholder="Generated script will appear here. Edit it or generate a new one."
                                className="w-full min-h-[50vh] p-6 bg-black/40 border border-white/10 rounded-2xl text-base text-white/90 font-serif leading-relaxed resize-none focus:outline-none focus:border-emerald-500/50 transition-colors shadow-inner"
                            />
                            
                            {isGeneratingCaption && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center border border-white/5 z-10">
                                    <div className="flex items-center gap-3 text-emerald-400 font-bold uppercase tracking-widest">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Writing Script...
                                    </div>
                                    <p className="text-white/40 text-xs mt-3 italic font-serif">Channeling creativity...</p>
                                </div>
                            )}

                            {/* Additional Actions Row */}
                            {!isGeneratingCaption && generatedCaption && (
                                <div className="flex justify-end gap-3">
                                    <button 
                                        onClick={() => setGeneratedCaption("")}
                                        className="px-4 py-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                                    >
                                        Clear
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
