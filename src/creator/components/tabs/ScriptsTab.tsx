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
            <div className="w-[360px] flex-shrink-0 flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)] relative overflow-y-auto">
                <div className="px-6 py-6 flex-1 flex flex-col gap-6" id="scripts-setup-pane">
                    <div className="flex items-center justify-between pb-8 border-b border-[var(--border)] mb-6">
                        <div className="flex items-center gap-5 px-2 pt-2">
                            <h2 className="text-sm font-black text-white uppercase tracking-[0.15em] flex items-center gap-4">
                                <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                    <AlignLeft className="w-4 h-4 text-emerald-500" />
                                </div>
                                Setup
                            </h2>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-[10px] font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                                <AlignLeft className="w-3 h-3 text-emerald-400" /> Script Strategy
                            </label>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] text-white/50 uppercase tracking-widest block font-bold">Concept / Topic</label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Morning thoughts, AI future..."
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] text-white/50 uppercase tracking-widest block font-bold">Style</label>
                            <div className="relative">
                                <select
                                    value={captionType}
                                    onChange={(e) => setCaptionType(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-white appearance-none focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                                >
                                    {captionStyles.map(t => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronDown className="w-4 h-4 text-white/40" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Left Action Bottom */}
                <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-2)] flex flex-col gap-3 sticky bottom-0 z-10">
                    <button
                        onClick={onGenerateCaptionOnly}
                        disabled={isGeneratingCaption || !apiKeys.gemini}
                        className={`w-full py-3 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${isGeneratingCaption || !apiKeys.gemini ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-emerald-500/20 hover:-translate-y-0.5'}`}
                    >
                        {isGeneratingCaption ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                        {isGeneratingCaption ? "Writing..." : "Generate Script"}
                    </button>
                    {!apiKeys.gemini && (
                        <p className="text-[8px] font-bold text-red-400 uppercase tracking-tight text-center animate-pulse">Gemini Key Required in Settings</p>
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
