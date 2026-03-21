import { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save, X, ChevronDown, ChevronUp, Cloud, RefreshCw, Key, Eye, EyeOff } from 'lucide-react';
import { generateUUID } from '../../lib/uuid';
import { AssetUploader } from '../asset-uploader';
import { type DBAsset as Asset } from '../../lib/dbService';
// Auth excluded from ClipVid integration

export interface Theme {
    id: string;
    name: string;
    description: string;
    context?: string;
    basePrompt: string;
    defaultOutfit?: string;
    defaultSetting?: string;
    defaultVisuals?: string;
    defaultAction?: string;
}

export interface CreatorProfile {
    subject: string;
    negativePrompt: string;
    defaultParams: string;
}

export interface CaptionStyle {
    id: string;
    label: string;
    prompt: string;
}

interface SettingsTabProps {
    themes: Theme[];
    setThemes: (themes: Theme[]) => void;
    captionStyles: CaptionStyle[];
    setCaptionStyles: (styles: CaptionStyle[]) => void;
    profile: CreatorProfile;
    setProfile: (profile: CreatorProfile) => void;
    apiKeys: { gemini: string; fal: string };
    onUpdateApiKeys: (keys: { gemini: string; fal: string }) => void;
    onExit: () => void;
    assets: Asset[];
    onAssetsAdd: (files: FileList) => void;
    onAssetRemove: (id: string) => void;
    onAssetToggle: (id: string) => void;
}

export function SettingsTab({ 
    themes, 
    setThemes, 
    captionStyles, 
    setCaptionStyles, 
    profile, 
    setProfile, 
    apiKeys, 
    onUpdateApiKeys, 
    onExit,
    assets,
    onAssetsAdd,
    onAssetRemove,
    onAssetToggle
}: SettingsTabProps) {
    const user = null; // No auth in ClipVid integration
    const [activeSection, setActiveSection] = useState<'themes' | 'captions' | 'persona' | 'credentials'>('credentials');
    const [editingThemeId, setEditingThemeId] = useState<string | null>(null);
    const [editingStyleId, setEditingStyleId] = useState<string | null>(null);
    // API Keys Local State for editing
    const [localKeys, setLocalKeys] = useState(apiKeys);
    const [showGemini, setShowGemini] = useState(false);
    const [showFal, setShowFal] = useState(false);

    // Profile Local State
    const [localProfile, setLocalProfile] = useState(profile);

    // Temporary state for editing
    const [tempTheme, setTempTheme] = useState<Theme | null>(null);
    const [tempStyle, setTempStyle] = useState<CaptionStyle | null>(null);

    // Sync local state with props (important for async loading)
    useEffect(() => {
        setLocalKeys(apiKeys);
    }, [apiKeys]);

    useEffect(() => {
        setLocalProfile(profile);
    }, [profile]);

    const handleSaveTheme = () => {
        if (!tempTheme) return;
        if (editingThemeId === 'new') {
            setThemes([...themes, { ...tempTheme, id: generateUUID() }]);
        } else {
            setThemes(themes.map(t => t.id === tempTheme.id ? tempTheme : t));
        }
        setEditingThemeId(null);
        setTempTheme(null);
    };

    const handleDeleteTheme = (id: string) => {
        if (confirm("Are you sure you want to delete this theme?")) {
            setThemes(themes.filter(t => t.id !== id));
        }
    };

    const handleSaveStyle = () => {
        if (!tempStyle) return;
        if (editingStyleId === 'new') {
            setCaptionStyles([...captionStyles, { ...tempStyle, id: generateUUID() }]);
        } else {
            setCaptionStyles(captionStyles.map(s => s.id === tempStyle.id ? tempStyle : s));
        }
        setEditingStyleId(null);
        setTempStyle(null);
    };

    const handleDeleteStyle = (id: string) => {
        if (confirm("Are you sure you want to delete this caption style?")) {
            setCaptionStyles(captionStyles.filter(s => s.id !== id));
        }
    };

    const startEditTheme = (theme: Theme | 'new') => {
        if (theme === 'new') {
            setTempTheme({
                id: '',
                name: 'New Theme',
                description: '',
                basePrompt: '',
                defaultOutfit: '',
                defaultSetting: ''
            });
            setEditingThemeId('new');
        } else {
            setTempTheme({ ...theme });
            setEditingThemeId(theme.id);
        }
    };

    const startEditStyle = (style: CaptionStyle | 'new') => {
        if (style === 'new') {
            setTempStyle({
                id: '',
                label: 'New Style',
                prompt: ''
            });
            setEditingStyleId('new');
        } else {
            setTempStyle({ ...style });
            setEditingStyleId(style.id);
        }
    };

    return (
        <div className="flex h-full w-full pointer-events-auto bg-[var(--bg-deep)]">
            {/* ═══════════════════ LEFT PANEL: NAVIGATION ═══════════════════ */}
            <div className="creator-panel"> <div className="creator-panel-body">
                    {/* Header */}
                    <div className="creator-panel-header"> <div className="creator-panel-header-icon">
                            <Settings className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                            <p className="creator-panel-title">Configuration</p> <p className="creator-content-subtitle !mt-1">Studio System Settings</p>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex flex-col mt-4" style={{ gap: "8px" }}>
                        {[
                            { id: 'credentials', label: 'API Credentials', icon: Key },
                            { id: 'persona', label: 'Core Persona', icon: Cloud },
                            { id: 'themes', label: 'Visual Themes', icon: RefreshCw },
                            { id: 'captions', label: 'Style Strategies', icon: Save },
                        ].map(tab => {
                            const TabIcon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveSection(tab.id as any)}
                                    style={{ padding: '14px 20px' }}
                                    className={`flex items-center gap-3 rounded-xl transition-all font-bold text-[11px] uppercase tracking-widest ${activeSection === tab.id
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                                        : 'text-white/20 hover:bg-white/5 hover:text-white/40'
                                    }`}
                                >
                                    <TabIcon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                </div>
            </div>

            {/* ═══════════════════ RIGHT PANEL: SETTINGS CONTENT ═══════════════════ */}
            <div className="creator-content-panel">
                {/* Section Content */}
                <div className="creator-content-body">
                    {/* Page Header */}
                    <div className="creator-content-header"> <div className="creator-content-title-wrap">
                            <div className="creator-content-icon"> {activeSection === 'credentials' && <Key className="w-5 h-5 text-emerald-500" />}
                                {activeSection === 'persona' && <Cloud className="w-5 h-5 text-emerald-500" />} {activeSection === 'themes' && <RefreshCw className="w-5 h-5 text-emerald-500" />}
                                {activeSection === 'captions' && <Save className="w-5 h-5 text-emerald-500" />}
                            </div>
                            <div>
                                <div className="creator-content-title">
                                    {activeSection === 'credentials' && 'API Credentials'}
                                    {activeSection === 'persona' && 'Core Persona'}
                                    {activeSection === 'themes' && 'Visual Themes'}
                                    {activeSection === 'captions' && 'Style Strategies'}
                                </div>
                                <div className="creator-content-subtitle">
                                    {activeSection === 'credentials' && 'Configure external AI engine access'}
                                    {activeSection === 'persona' && 'Define the consistent subject identity'}
                                    {activeSection === 'themes' && 'Manage creative prompt templates'}
                                    {activeSection === 'captions' && 'Define writing styles for captions'}
                                </div>
                            </div>
                        </div>
                    </div>
                    {activeSection === 'themes' && (
                        <div>
                            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4"> <span className="creator-result-title">Visual Design Themes</span>
                                <button
                                    onClick={() => startEditTheme('new')}
                                    className="creator-result-action !text-emerald-400"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add New Theme
                                </button>
                            </div>

                            <div className="grid grid-cols-1 " style={{ gap: "16px" }}>
                                {themes.map(theme => (
                                    <div key={theme.id} className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all"> <div className="flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer" style={{ padding: "24px" }}
                                            onClick={() => editingThemeId === theme.id ? setEditingThemeId(null) : startEditTheme(theme)}
                                        >
                                            <div className="space-y-1"> <h4 className="font-bold text-white text-[13px] tracking-wide">{theme.name}</h4>
                                                <p className="text-[11px] text-white/30 font-medium">{theme.description}</p>
                                            </div>
                                            <div className="flex items-center " style={{ gap: "12px" }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteTheme(theme.id); }}
                                                    className="p-[10px] hover:bg-red-500/10 text-white/20 hover:text-red-400 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                {editingThemeId === theme.id ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
                                            </div>
                                        </div>

                                        {editingThemeId === theme.id && tempTheme && (
                                            <div className="space-y-6 animate-in slide-in-from-top-2 duration-300" style={{ padding: "8px 32px 32px" }}> <div className="grid grid-cols-2 ga" style={{ padding: "24px" }}>
                                                    <div className="creator-field"> <label className="creator-label">Theme Name</label>
                                                        <input
                                                            value={tempTheme.name}
                                                            onChange={e => setTempTheme({ ...tempTheme, name: e.target.value })}
                                                            className="creator-input"
                                                        />
                                                    </div>
                                                    <div className="creator-field"> <label className="creator-label">Short Description</label>
                                                        <input
                                                            value={tempTheme.description}
                                                            onChange={e => setTempTheme({ ...tempTheme, description: e.target.value })}
                                                            className="creator-input"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="creator-field"> <label className="creator-label">Base Prompt Template</label>
                                                    <textarea
                                                        value={tempTheme.basePrompt}
                                                        onChange={e => setTempTheme({ ...tempTheme, basePrompt: e.target.value })}
                                                        rows={3}
                                                        className="creator-textarea"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 ga" style={{ padding: "24px" }}> <div className="creator-field">
                                                        <label className="creator-label">Default Outfit</label>
                                                        <input
                                                            value={tempTheme.defaultOutfit || ''}
                                                            onChange={e => setTempTheme({ ...tempTheme, defaultOutfit: e.target.value })}
                                                            className="creator-input"
                                                        />
                                                    </div>
                                                    <div className="creator-field"> <label className="creator-label">Default Local/Visuals</label>
                                                        <input
                                                            value={tempTheme.defaultSetting || tempTheme.defaultVisuals || ''}
                                                            onChange={e => setTempTheme({ ...tempTheme, defaultSetting: e.target.value, defaultVisuals: e.target.value })}
                                                            className="creator-input"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end pt-4" style={{ gap: "12px" }}>
                                                    <button
                                                        onClick={() => { setEditingThemeId(null); setTempTheme(null); }}
                                                        className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors"
                                                    >
                                                        Discard
                                                    </button>
                                                    <button
                                                        onClick={handleSaveTheme}
                                                        className="creator-btn-primary !w-auto !py-2.5 !px-6"
                                                    >
                                                        <Save className="w-4 h-4" /> Save Theme
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {editingThemeId === 'new' && tempTheme && (
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-6 animate-in slide-in-from-bottom-4 duration-500" style={{ padding: "32px" }}>
                                        <div className="flex items-center mb-2" style={{ gap: "12px" }}>
                                            <Plus className="w-5 h-5 text-emerald-400" /> <h4 className="text-emerald-400 font-bold uppercase text-[12px] tracking-widest">Initialize New Creative Theme</h4>
                                        </div>
                                        <div className="grid grid-cols-2 ga" style={{ padding: "24px" }}> <div className="creator-field">
                                                <label className="creator-label">Name</label>
                                                <input
                                                    value={tempTheme.name}
                                                    onChange={e => setTempTheme({ ...tempTheme, name: e.target.value })}
                                                    className="creator-input"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="creator-field"> <label className="creator-label">Description</label>
                                                <input
                                                    value={tempTheme.description}
                                                    onChange={e => setTempTheme({ ...tempTheme, description: e.target.value })}
                                                    className="creator-input"
                                                />
                                            </div>
                                        </div>
                                        <div className="creator-field"> <label className="creator-label">Base Prompt Template</label>
                                            <textarea
                                                value={tempTheme.basePrompt}
                                                onChange={e => setTempTheme({ ...tempTheme, basePrompt: e.target.value })}
                                                rows={4}
                                                className="creator-textarea" placeholder="Use [Subject Definition], [Outfit], [Setting] placeholders..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 ga" style={{ padding: "24px" }}> <div className="creator-field">
                                                <label className="creator-label">Default Outfit</label>
                                                <input
                                                    value={tempTheme.defaultOutfit || ''}
                                                    onChange={e => setTempTheme({ ...tempTheme, defaultOutfit: e.target.value })}
                                                    className="creator-input"
                                                />
                                            </div>
                                            <div className="creator-field"> <label className="creator-label">Default Setting</label>
                                                <input
                                                    value={tempTheme.defaultSetting || tempTheme.defaultVisuals || ''}
                                                    onChange={e => setTempTheme({ ...tempTheme, defaultSetting: e.target.value, defaultVisuals: e.target.value })}
                                                    className="creator-input"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-4" style={{ gap: "12px" }}>
                                            <button
                                                onClick={() => { setEditingThemeId(null); setTempTheme(null); }}
                                                className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors"
                                            >
                                                Discard
                                            </button>
                                            <button
                                                onClick={handleSaveTheme}
                                                className="creator-btn-primary !w-auto !py-3 !px-8"
                                            >
                                                <Save className="w-4 h-4" /> Initialize Theme
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === 'captions' && (
                        <div>
                            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4"> <span className="creator-result-title">Style Strategies</span>
                                <button
                                    onClick={() => startEditStyle('new')}
                                    className="creator-result-action !text-emerald-400"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add New Strategy
                                </button>
                            </div>

                            <div className="grid grid-cols-1 " style={{ gap: "16px" }}>
                                {captionStyles.map(style => (
                                    <div key={style.id} className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all"> <div className="flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer" style={{ padding: "24px" }}
                                            onClick={() => editingStyleId === style.id ? setEditingStyleId(null) : startEditStyle(style)}
                                        >
                                            <div className="space-y-1"> <h4 className="font-bold text-white text-[13px] tracking-wide">{style.label}</h4>
                                                <p className="text-[11px] text-white/30 font-medium truncate max-w-xl">{style.prompt}</p>
                                            </div>
                                            <div className="flex items-center " style={{ gap: "12px" }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteStyle(style.id); }}
                                                    className="p-[10px] hover:bg-red-500/10 text-white/20 hover:text-red-400 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                {editingStyleId === style.id ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
                                            </div>
                                        </div>

                                        {editingStyleId === style.id && tempStyle && (
                                            <div className="space-y-6 animate-in slide-in-from-top-2 duration-300" style={{ padding: "8px 32px 32px" }}> <div className="creator-field">
                                                    <label className="creator-label">Strategy Label</label>
                                                    <input
                                                        value={tempStyle.label}
                                                        onChange={e => setTempStyle({ ...tempStyle, label: e.target.value })}
                                                        className="creator-input"
                                                    />
                                                </div>
                                                <div className="creator-field"> <label className="creator-label">System Instruction / Prompt Blueprint</label>
                                                    <textarea
                                                        value={tempStyle.prompt}
                                                        onChange={e => setTempStyle({ ...tempStyle, prompt: e.target.value })}
                                                        rows={6}
                                                        className="creator-textarea"
                                                    />
                                                </div>
                                                <div className="flex justify-end pt-2" style={{ gap: "12px" }}>
                                                    <button
                                                        onClick={() => { setEditingStyleId(null); setTempStyle(null); }}
                                                        className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors"
                                                    >
                                                        Discard
                                                    </button>
                                                    <button
                                                        onClick={handleSaveStyle}
                                                        className="creator-btn-primary !w-auto !py-2.5 !px-6"
                                                    >
                                                        <Save className="w-3.5 h-3.5" /> Update Strategy
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {editingStyleId === 'new' && tempStyle && (
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-6 animate-in slide-in-from-bottom-4 duration-500" style={{ padding: "32px" }}>
                                        <div className="flex items-center mb-2" style={{ gap: "12px" }}>
                                            <Plus className="w-5 h-5 text-emerald-400" /> <h4 className="text-emerald-400 font-bold uppercase text-[12px] tracking-widest">New Strategy</h4>
                                        </div>
                                        <div className="creator-field"> <label className="creator-label">Label</label>
                                            <input
                                                value={tempStyle.label}
                                                onChange={e => setTempStyle({ ...tempStyle, label: e.target.value })}
                                                className="creator-input"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="creator-field"> <label className="creator-label">System Instruction / Prompt</label>
                                            <textarea
                                                value={tempStyle.prompt}
                                                onChange={e => setTempStyle({ ...tempStyle, prompt: e.target.value })}
                                                rows={5}
                                                className="creator-textarea" placeholder="Describe how the caption should be written..."
                                            />
                                        </div>
                                        <div className="flex justify-end pt-4" style={{ gap: "12px" }}>
                                            <button
                                                onClick={() => { setEditingStyleId(null); setTempStyle(null); }}
                                                className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white/60 transition-colors"
                                            >
                                                Discard
                                            </button>
                                            <button
                                                onClick={handleSaveStyle}
                                                className="creator-btn-primary !w-auto !py-3 !px-8"
                                            >
                                                <Save className="w-4 h-4" /> Initialize Strategy
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === 'persona' && (
                        <div>
                            <div>
                                <div className="creator-field" style={{ marginBottom: "32px" }}>
                                    <label className="creator-label">Base Subject Definition</label>
                                    <textarea
                                        value={localProfile.subject}
                                        onChange={e => setLocalProfile({ ...localProfile, subject: e.target.value })}
                                        rows={6}
                                        className="creator-textarea font-serif italic !text-[15px]" placeholder="Describe the core persona (face, age, hair, mood)..."
                                    />
                                    <p className="text-[10px] text-white/20 font-medium italic" style={{ marginTop: "12px", padding: "0 4px" }}>This is the [Subject Definition] used in all automated prompts. Keep it consistent for best results.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "32px", marginBottom: "32px" }}>
                                    <div className="creator-field">
                                        <label className="creator-label">Global Negative Prompt</label>
                                        <textarea
                                            value={localProfile.negativePrompt}
                                            onChange={e => setLocalProfile({ ...localProfile, negativePrompt: e.target.value })}
                                            rows={4}
                                            className="creator-textarea font-mono" placeholder="Enter negative prompts to avoid globally..."
                                        />
                                    </div>
                                    <div className="creator-field"> <label className="creator-label">Engine Default Parameters</label>
                                        <textarea
                                            value={localProfile.defaultParams || ""}
                                            onChange={e => setLocalProfile({ ...localProfile, defaultParams: e.target.value })}
                                            rows={4}
                                            className="creator-textarea" placeholder="e.g. --v 6.1 --stylize 300"
                                        />
                                    </div>
                                </div>

                                <div className="creator-field" style={{ marginBottom: "40px" }}>
                                    <label className="creator-label">Subject Identity References</label>
                                    <div className="bg-black/20 border border-white/5 rounded-3xl" style={{ padding: "32px" }}>
                                        <AssetUploader
                                            assets={assets}
                                            onAdd={onAssetsAdd}
                                            onRemove={onAssetRemove}
                                            onToggleSelection={onAssetToggle}
                                            label="Upload and Manage Identity Assets"
                                        />
                                    </div>
                                </div>

                                <div style={{ paddingTop: "16px" }}>
                                    <button
                                        onClick={() => {
                                            setProfile(localProfile);
                                            alert("Persona configuration committed successfully.");
                                        }}
                                        className="creator-btn-primary"
                                    >
                                        <Save className="w-4 h-4" /> Commit Persona Configuration
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'credentials' && (
                        <div>
                            {/* Google Gemini */}
                            <div className="creator-field">
                                <div className="flex items-center border-b border-white/5" style={{ marginBottom: "24px", paddingBottom: "24px", gap: "20px" }}>
                                    <div className="bg-purple-500/10 rounded-xl border border-purple-500/20 flex-shrink-0" style={{ padding: "12px" }}>
                                        <Key className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-[15px] tracking-wide">Google Gemini API</h4> <p className="text-[10px] text-purple-400/60 uppercase tracking-widest font-black">Reasoning & Captioning Engine</p>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <input
                                        type={showGemini ? "text" : "password"}
                                        value={localKeys.gemini}
                                        onChange={e => setLocalKeys({ ...localKeys, gemini: e.target.value })}
                                        placeholder="Enter your Gemini Pro Key..."
                                        className="creator-input pr-14"
                                    />
                                    <button
                                        onClick={() => setShowGemini(!showGemini)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white transition-colors"
                                    >
                                        {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-white/30 font-medium italic mt-2 px-1">Get your key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">Google AI Studio</a>.</p>
                            </div>

                            <div className="creator-section-divider" style={{ margin: '24px 0' }} />

                            {/* Fal.ai */}
                            <div className="creator-field">
                                <div className="flex items-center border-b border-white/5" style={{ marginBottom: "24px", paddingBottom: "24px", gap: "20px" }}>
                                    <div className="bg-orange-500/10 rounded-xl border border-orange-500/20 flex-shrink-0" style={{ padding: "12px" }}>
                                        <Key className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-[15px] tracking-wide">Fal.ai API</h4> <p className="text-[10px] text-orange-400/60 uppercase tracking-widest font-black">High-Fidelity Media Core</p>
                                    </div>
                                </div>

                                <div className="relative group">
                                    <input
                                        type={showFal ? "text" : "password"}
                                        value={localKeys.fal}
                                        onChange={e => setLocalKeys({ ...localKeys, fal: e.target.value })}
                                        placeholder="Enter your Fal.ai Secret Key..."
                                        className="creator-input pr-14"
                                    />
                                    <button
                                        onClick={() => setShowFal(!showFal)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white transition-colors"
                                    >
                                        {showFal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-white/30 font-medium italic mt-2 px-1">Manage keys in your <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:text-orange-300 transition-colors">Fal Dashboard</a>.</p>
                            </div>

                            <div className="creator-field " style={{ marginTop: "24px" }}>
                                <button
                                    onClick={() => {
                                        onUpdateApiKeys(localKeys);
                                        const msg = "API Credentials updated successfully. Your keys are stored in private local storage.";
                                        alert(msg);
                                    }}
                                    className="creator-btn-primary w-auto pl-5 pr-6 justify-center shadow-lg shadow-emerald-500/10"
                                >
                                    <Key className="w-4 h-4" /> Commit API Credentials
                                </button>
                            </div>

                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl" style={{ padding: '24px', marginTop: '32px' }}> <div className="flex items-center  mb-3" style={{ gap: "8px" }}>
                                    <Settings className="w-3.5 h-3.5 text-white/40" /> <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Security & Data Persistence</span>
                                </div>
                                <p className="text-[11px] text-white/30 leading-relaxed font-medium">
                                    Your API credentials utilize **Hybrid Persistence**. They are currently saved in your browser's private IndexedDB instance. Login is required for encrypted cross-device synchronization and cloud backup.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
