import React from 'react';
import { Loader2, Wand2, AlignLeft, Copy, Save, X } from 'lucide-react';
import { CustomSelect } from '../CustomSelect';


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
                        <CustomSelect
                            value={captionType}
                            onChange={setCaptionType}
                            options={captionStyles.map(t => ({ value: t.id, label: t.label }))}
                        />
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
            <div className="creator-content-panel">
                <div className="creator-content-body">

                    {/* Page Header */}
                    <div className="creator-content-header">
                        <div className="creator-content-title-wrap">
                            <div className="creator-content-icon">
                                <AlignLeft className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <div className="creator-content-title">Script</div>
                                <div className="creator-content-subtitle">Video script / narration</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                onClick={() => { navigator.clipboard.writeText(generatedCaption); alert('Copied to clipboard!'); }}
                                className="creator-result-action"
                                style={{ display: 'flex' }}
                            >
                                <Copy style={{ width: 12, height: 12 }} /> Copy
                            </button>
                            {onSave && (
                                <button
                                    onClick={onSave}
                                    style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <Save style={{ width: 13, height: 13 }} /> Save
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Script Output Area */}
                    <div className="creator-field" style={{ position: 'relative' }}>
                        <label className="creator-label">
                            <Wand2 style={{ width: 12, height: 12, color: 'rgb(52,211,153)' }} /> Script Output
                        </label>
                        <textarea
                            value={generatedCaption}
                            onChange={(e) => setGeneratedCaption(e.target.value)}
                            placeholder="Generated script will appear here. Edit it or generate a new one."
                            className="creator-textarea"
                            style={{ minHeight: '55vh', fontFamily: 'var(--font-body)', lineHeight: 1.7 }}
                        />
                        {isGeneratingCaption && (
                            <div style={{
                                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(8px)', borderRadius: '8px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                gap: '12px', zIndex: 10,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgb(52,211,153)', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                                    <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
                                    Writing Script...
                                </div>
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontStyle: 'italic' }}>Channeling creativity...</p>
                            </div>
                        )}
                    </div>

                    {!isGeneratingCaption && generatedCaption && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setGeneratedCaption('')}
                                style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
