import { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save, X, ChevronDown, ChevronUp, Cloud, RefreshCw, Key, Eye, EyeOff, Loader2 } from 'lucide-react';
import { migrationService } from '../../lib/migrationService';
import { syncService } from '../../lib/syncService';
import { dbService } from '../../lib/dbService';
import { createThumbnails } from '../../lib/imageUtils';
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
    const [migrationStatus, setMigrationStatus] = useState<string>('');
    const [isMigrating, setIsMigrating] = useState(false);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optProgress, setOptProgress] = useState("");

    const handleOptimizeLibrary = async () => {
        setIsOptimizing(true);
        setOptProgress("Starting optimization...");
        try {
            const posts = await dbService.getRecentPostsBatch(1000, 0, 'prev');
            setOptProgress(`Optimizing ${posts.length} posts...`);
            for (let i = 0; i < posts.length; i++) {
                const post = posts[i];
                if (!post.thumbnailUrls || post.thumbnailUrls.length === 0) {
                    setOptProgress(`Processing post ${i + 1}/${posts.length}...`);
                    post.thumbnailUrls = await createThumbnails(post.mediaUrls);
                    await dbService.savePost(post);
                }
            }

            const history = await dbService.getRecentHistoryBatch(1000, 0, 'prev');
            setOptProgress(`Optimizing ${history.length} history items...`);
            for (let i = 0; i < history.length; i++) {
                const item = history[i];
                if (item.status === 'success' && (!item.thumbnailUrls || item.thumbnailUrls.length === 0)) {
                    setOptProgress(`Processing history ${i + 1}/${history.length}...`);
                    item.thumbnailUrls = await createThumbnails(item.mediaUrls);
                    await dbService.saveGenerationHistory(item);
                }
            }
            setOptProgress("Optimization complete!");
            alert("Library optimization complete! All images now have fast-loading thumbnails.");
        } catch (e) {
            console.error(e);
            alert("Optimization failed.");
        } finally {
            setIsOptimizing(false);
            setOptProgress("");
        }
    };

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

    const handleMigration = async () => {
        if (!confirm("This will upload all local data to Supabase. Continue?")) return;

        setIsMigrating(true);
        setMigrationStatus("Initializing...");

        try {
            await migrationService.migrateAll((msg) => setMigrationStatus(msg));
            alert("Migration completed successfully!");
            setMigrationStatus("Completed");
        } catch (e: any) {
            console.error(e);
            alert("Migration failed: " + e.message);
            setMigrationStatus("Failed: " + e.message);
        } finally {
            setIsMigrating(false);
        }
    };

    return (
        <div className="max-w-[1200px] mx-auto w-full p-6 md:p-12 pb-32">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 pb-6 border-b border-white/10 gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                        <Settings className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold font-serif text-white/90">Configuration</h2>
                        <p className="text-[10px] text-emerald-500/60 uppercase tracking-[0.2em] font-black">Studio System Settings</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 md:gap-12">
                {/* Sidebar / Tabs */}
                <div className="flex md:flex-col gap-3 p-1 bg-white/5 rounded-2xl border border-white/5 md:bg-transparent md:border-0 md:p-0 md:w-72 shrink-0 overflow-x-auto no-scrollbar scroll-smooth snap-x">
                    {[
                        { id: 'credentials', label: 'API Credentials' },
                        { id: 'persona', label: 'Core Persona' },
                        { id: 'themes', label: 'Visual Themes' },
                        { id: 'captions', label: 'Style Strategies' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSection(tab.id as any)}
                            className={`flex-1 md:flex-none shrink-0 whitespace-nowrap snap-center text-center md:text-left px-5 py-3 md:py-4 rounded-xl transition-all font-black text-[10px] md:text-xs uppercase tracking-[0.15em] ${activeSection === tab.id
                                ? 'bg-emerald-500 text-black shadow-xl shadow-emerald-500/20 border-b-2 border-emerald-400/50'
                                : 'text-white/30 hover:bg-white/5 hover:text-white/70'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 md:p-12 min-h-[60vh] shadow-2xl shadow-black/40">
                    {activeSection === 'themes' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">Visual Design Themes</h3>
                                <button
                                    onClick={() => startEditTheme('new')}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-2"
                                >
                                    <Plus className="w-3 h-3" /> Add Theme
                                </button>
                            </div>

                            <div className="space-y-4">
                                {themes.map(theme => (
                                    <div key={theme.id} className="bg-black/20 border border-white/5 rounded-xl overflow-hidden">
                                        <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                                            onClick={() => editingThemeId === theme.id ? setEditingThemeId(null) : startEditTheme(theme)}
                                        >
                                            <div>
                                                <h4 className="font-bold text-white text-sm">{theme.name}</h4>
                                                <p className="text-xs text-white/40">{theme.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteTheme(theme.id); }}
                                                    className="p-2 hover:bg-red-500/20 hover:text-red-400 text-white/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                {editingThemeId === theme.id ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                                            </div>
                                        </div>

                                        {editingThemeId === theme.id && tempTheme && (
                                            <div className="p-4 border-t border-white/5 bg-black/40 space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Name</label>
                                                        <input
                                                            value={tempTheme.name}
                                                            onChange={e => setTempTheme({ ...tempTheme, name: e.target.value })}
                                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Description</label>
                                                        <input
                                                            value={tempTheme.description}
                                                            onChange={e => setTempTheme({ ...tempTheme, description: e.target.value })}
                                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                                        />
                                                    </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Base Prompt</label>
                                                    <textarea
                                                        value={tempTheme.basePrompt}
                                                        onChange={e => setTempTheme({ ...tempTheme, basePrompt: e.target.value })}
                                                        rows={4}
                                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-all font-mono"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Default Outfit</label>
                                                        <input
                                                            value={tempTheme.defaultOutfit || ''}
                                                            onChange={e => setTempTheme({ ...tempTheme, defaultOutfit: e.target.value })}
                                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Default Setting/Visuals</label>
                                                        <input
                                                            value={tempTheme.defaultSetting || tempTheme.defaultVisuals || ''}
                                                            onChange={e => setTempTheme({ ...tempTheme, defaultSetting: e.target.value, defaultVisuals: e.target.value })}
                                                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2 pt-2">
                                                    <button
                                                        onClick={() => { setEditingThemeId(null); setTempTheme(null); }}
                                                        className="px-3 py-2 text-xs text-white/60 hover:text-white"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveTheme}
                                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-2"
                                                    >
                                                        <Save className="w-3 h-3" /> Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {editingThemeId === 'new' && tempTheme && (
                                    <div className="bg-black/40 border border-emerald-500/20 rounded-[2rem] p-8 md:p-10 space-y-8 shadow-2xl shadow-emerald-500/5 animate-in slide-in-from-bottom-4 duration-500">
                                        <h4 className="text-emerald-400 font-black uppercase text-[10px] tracking-[0.2em] mb-2 px-1">Initialize New Creative Theme</h4>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black pl-1">Name</label>
                                                <input
                                                    value={tempTheme.name}
                                                    onChange={e => setTempTheme({ ...tempTheme, name: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black pl-1">Description</label>
                                                <input
                                                    value={tempTheme.description}
                                                    onChange={e => setTempTheme({ ...tempTheme, description: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black pl-1">Base Prompt Template</label>
                                            <textarea
                                                value={tempTheme.basePrompt}
                                                onChange={e => setTempTheme({ ...tempTheme, basePrompt: e.target.value })}
                                                rows={4}
                                                className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all font-mono"
                                                placeholder="Use [Subject Definition], [Outfit], [Setting] placeholders..."
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black pl-1">Default Outfit</label>
                                                <input
                                                    value={tempTheme.defaultOutfit || ''}
                                                    onChange={e => setTempTheme({ ...tempTheme, defaultOutfit: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black pl-1">Default Setting</label>
                                                <input
                                                    value={tempTheme.defaultSetting || tempTheme.defaultVisuals || ''}
                                                    onChange={e => setTempTheme({ ...tempTheme, defaultSetting: e.target.value, defaultVisuals: e.target.value })}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <button
                                                onClick={() => { setEditingThemeId(null); setTempTheme(null); }}
                                                className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                                            >
                                                Discard changes
                                            </button>
                                            <button
                                                onClick={handleSaveTheme}
                                                className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.25rem] flex items-center gap-3 shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                                            >
                                                <Save className="w-5 h-5" /> Initialize Theme
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === 'captions' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">Caption Strategies</h3>
                                <button
                                    onClick={() => startEditStyle('new')}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-2"
                                >
                                    <Plus className="w-3 h-3" /> Add Strategy
                                </button>
                            </div>

                            <div className="space-y-4">
                                {captionStyles.map(style => (
                                    <div key={style.id} className="bg-black/20 border border-white/5 rounded-xl overflow-hidden">
                                        <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                                            onClick={() => editingStyleId === style.id ? setEditingStyleId(null) : startEditStyle(style)}
                                        >
                                            <div>
                                                <h4 className="font-bold text-white text-sm">{style.label}</h4>
                                                <p className="text-xs text-white/40 truncate max-w-md">{style.prompt}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteStyle(style.id); }}
                                                    className="p-2 hover:bg-red-500/20 hover:text-red-400 text-white/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                {editingStyleId === style.id ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                                            </div>
                                        </div>

                                        {editingStyleId === style.id && tempStyle && (
                                            <div className="p-6 border-t border-white/5 bg-black/40 space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Strategy Label</label>
                                                    <input
                                                        value={tempStyle.label}
                                                        onChange={e => setTempStyle({ ...tempStyle, label: e.target.value })}
                                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">System Instruction / Prompt Blueprint</label>
                                                    <textarea
                                                        value={tempStyle.prompt}
                                                        onChange={e => setTempStyle({ ...tempStyle, prompt: e.target.value })}
                                                        rows={5}
                                                        className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:border-emerald-500/50 outline-none transition-all font-sans"
                                                    />
                                                </div>
                                                <div className="flex justify-end gap-3 pt-2">
                                                    <button
                                                        onClick={() => { setEditingStyleId(null); setTempStyle(null); }}
                                                        className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleSaveStyle}
                                                        className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                                                    >
                                                        <Save className="w-4 h-4" /> Update Strategy
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {editingStyleId === 'new' && tempStyle && (
                                    <div className="bg-black/20 border border-emerald-500/30 rounded-xl overflow-hidden p-4 space-y-4">
                                        <h4 className="text-emerald-400 font-bold uppercase text-xs tracking-widest">New Strategy</h4>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-white/40 uppercase tracking-widest">Label</label>
                                            <input
                                                value={tempStyle.label}
                                                onChange={e => setTempStyle({ ...tempStyle, label: e.target.value })}
                                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-emerald-500/50 outline-none"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-white/40 uppercase tracking-widest">System Instruction / Prompt</label>
                                            <textarea
                                                value={tempStyle.prompt}
                                                onChange={e => setTempStyle({ ...tempStyle, prompt: e.target.value })}
                                                rows={4}
                                                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-emerald-500/50 outline-none font-sans"
                                                placeholder="Describe how the caption should be written..."
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <button
                                                onClick={() => { setEditingStyleId(null); setTempStyle(null); }}
                                                className="px-3 py-2 text-xs text-white/60 hover:text-white"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveStyle}
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-2"
                                            >
                                                <Save className="w-3 h-3" /> Create Strategy
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeSection === 'persona' && (
                        <div className="space-y-10">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">Core Persona & Identity</h3>
                            </div>

                            <div className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Base Subject Definition</label>
                                    <textarea
                                        value={localProfile.subject}
                                        onChange={e => setLocalProfile({ ...localProfile, subject: e.target.value })}
                                        rows={6}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all font-serif italic selection:bg-emerald-500/20"
                                        placeholder="Describe the core persona (face, age, hair, mood)..."
                                    />
                                    <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
                                        <p className="text-[10px] text-white/30 italic">This is the [Subject Definition] used in all automated prompts. Keep it consistent for best results.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Global Negative Prompt</label>
                                    <textarea
                                        value={localProfile.negativePrompt}
                                        onChange={e => setLocalProfile({ ...localProfile, negativePrompt: e.target.value })}
                                        rows={4}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all font-mono selection:bg-emerald-500/20"
                                        placeholder="Enter negative prompts to avoid..."
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Default Parameters</label>
                                    <input
                                        type="text"
                                        value={localProfile.defaultParams || ""}
                                        onChange={e => setLocalProfile({ ...localProfile, defaultParams: e.target.value })}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-emerald-500/50 outline-none transition-all"
                                        placeholder="e.g. --v 6.0 --stylize 250"
                                    />
                                </div>

                                <div className="border-t border-white/5 pt-10">
                                    <AssetUploader
                                        assets={assets}
                                        onAdd={onAssetsAdd}
                                        onRemove={onAssetRemove}
                                        onToggleSelection={onAssetToggle}
                                        label="Subject Identity"
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        setProfile(localProfile);
                                        alert("Persona settings saved!");
                                    }}
                                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 mt-4"
                                >
                                    <Save className="w-5 h-5" /> Save Persona Configuration
                                </button>
                            </div>
                        </div>
                    )}



                    {activeSection === 'credentials' && (
                        <div className="space-y-10">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">API Credentials</h3>
                            </div>

                            <div className="space-y-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                                            <Key className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">Google Gemini API</h4>
                                            <p className="text-[10px] text-purple-400/60 uppercase tracking-[0.2em] font-black">Logic, Scripting & Captioning Engine</p>
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <input
                                            type={showGemini ? "text" : "password"}
                                            value={localKeys.gemini}
                                            onChange={e => setLocalKeys({ ...localKeys, gemini: e.target.value })}
                                            placeholder="Enter your Gemini API Key..."
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-purple-500/50 outline-none transition-all pr-14 shadow-inner"
                                        />
                                        <button
                                            onClick={() => setShowGemini(!showGemini)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-white/60 transition-colors"
                                        >
                                            {showGemini ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-white/30 italic pl-2">Get your key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Google AI Studio</a>.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-orange-500/10 rounded-2xl border border-orange-500/20">
                                            <Key className="w-6 h-6 text-orange-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">Fal.ai API</h4>
                                            <p className="text-[10px] text-orange-400/60 uppercase tracking-[0.2em] font-black">Media Generation & Upscaling Pipeline</p>
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <input
                                            type={showFal ? "text" : "password"}
                                            value={localKeys.fal}
                                            onChange={e => setLocalKeys({ ...localKeys, fal: e.target.value })}
                                            placeholder="Enter your Fal.ai API Key..."
                                            className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:border-orange-500/50 outline-none transition-all pr-14 shadow-inner"
                                        />
                                        <button
                                            onClick={() => setShowFal(!showFal)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/20 hover:text-white/60 transition-colors"
                                        >
                                            {showFal ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-white/30 italic pl-2">Get your key from the <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">Fal.ai Dashboard</a>.</p>
                                </div>

                                <button
                                    onClick={() => {
                                        onUpdateApiKeys(localKeys);
                                        const msg = user
                                            ? "API Credentials Saved!\n\nYour keys are stored securely and synced across your devices via your Cloud account. They are only accessible to you when logged in."
                                            : "API Credentials Saved Securely!\n\nYour keys are currently stored in your browser's private local storage. Log in to sync them cross-device.";
                                        alert(msg);
                                    }}
                                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                                >
                                    <Save className="w-5 h-5" /> Commit API Credentials
                                </button>
                            </div>

                            <div className="p-6 bg-white/[0.03] rounded-2xl border border-white/5 space-y-3 mt-8">
                                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Security & Privacy Architecture</h4>
                                <p className="text-[11px] text-white/30 leading-relaxed font-medium">
                                    Your API credentials utilize **Hybrid Persistence**.
                                    <br /><br />
                                    {user
                                        ? "Because you are logged in, your keys are securely synced to your private Cloud metadata. This allows you to jump between devices (e.g., Mobile and Desktop) without re-entering your credentials."
                                        : "You are currently in **Local-Only Mode**. Your keys are saved exclusively in your browser's private IndexedDB instance. Login to enable Cross-Device synchronization."
                                    }
                                </p>
                            </div>
                        </div>
                    )}


                </div>
            </div>
        </div>
    );
}
