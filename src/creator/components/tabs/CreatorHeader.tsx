import { CheckCircle2, ArrowRight, Send, Settings, Archive, Folder } from 'lucide-react';

type CreatorStep = 'create' | 'edit' | 'scripts' | 'animate' | 'settings' | 'posts' | 'assets';

interface CreatorHeaderProps {
    activeTab: CreatorStep;
    onTabChange: (tab: CreatorStep) => void;
    onSendToEditor: () => void;
    hasMedia: boolean;
}

const STEPS: { id: CreatorStep | 'editor'; label: string; num: number; icon?: React.ReactNode }[] = [
    { id: 'create', label: 'Create (Image)', num: 1 },
    { id: 'edit', label: 'Refine (Image)', num: 2 },
    { id: 'scripts', label: 'Script (Dialog)', num: 3 },
    { id: 'animate', label: 'Animate (I2V)', num: 4 },
];

export function CreatorHeader({ activeTab, onTabChange, onSendToEditor, hasMedia }: CreatorHeaderProps) {
    const currentStep = STEPS.find(s => s.id === activeTab)?.num ?? 1;

    return (
        <div className="sticky top-0 z-50 bg-[#0e0e11]/95 backdrop-blur-xl border-b border-white/5 px-4 h-12 flex items-center justify-between gap-4 shadow-lg shadow-black/40">
            {/* Step progress */}
            <nav className="flex items-center gap-1">
                {STEPS.map((step, i) => {
                    const done = step.num < currentStep;
                    const active = step.num === currentStep;
                    return (
                        <div key={step.id} className="flex items-center">
                            <button
                                onClick={() => onTabChange(step.id as CreatorStep)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-all text-[10px] font-bold uppercase tracking-widest
                                ${active ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 font-black'
                                    : done ? 'text-emerald-400/70 hover:text-emerald-300'
                                        : 'text-white/20 hover:text-white/40'}`}
                            >
                                {done
                                    ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                    : <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] border
                                        ${active ? 'border-emerald-400 text-emerald-300' : 'border-white/15 text-white/20'}`}>
                                        {step.num}
                                    </span>
                                }
                                <span className={`hidden sm:block ${done ? 'line-through opacity-60' : ''}`}>{step.label}</span>
                            </button>
                            {i < STEPS.length - 1 && (
                                <ArrowRight className={`w-3 h-3 mx-0.5 ${step.num < currentStep ? 'text-emerald-500/50' : 'text-white/10'}`} />
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="flex items-center gap-1">
                {/* Library button */}
                <button
                    onClick={() => onTabChange('posts')}
                    title="Saved Generations (Library)"
                    className={`p-2 rounded-lg transition-all border ${activeTab === 'posts'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                        }`}
                >
                    <Archive className="w-4 h-4" />
                </button>

                {/* Assets button */}
                <button
                    onClick={() => onTabChange('assets')}
                    title="Asset Management (Uploads)"
                    className={`p-2 rounded-lg transition-all border ${activeTab === 'assets'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                        }`}
                >
                    <Folder className="w-4 h-4" />
                </button>

                {/* Settings button */}
                <button
                    onClick={() => onTabChange('settings')}
                    title="Configuration & Settings"
                    className={`p-2 rounded-lg transition-all border ${activeTab === 'settings'
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                        }`}
                >
                    <Settings className="w-4 h-4" />
                </button>
            </div>

            {/* Send to editor */}
            <button
                onClick={onSendToEditor}
                disabled={!hasMedia}
                title={hasMedia ? 'Send generated media to ClipVid editor' : 'Generate some media first'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all
                    ${hasMedia
                        ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-black shadow-md shadow-emerald-900/40 hover:-translate-y-px'
                        : 'bg-white/5 border-white/10 text-white/20 cursor-not-allowed'}`}
            >
                <Send className="w-3 h-3" />
                <span className="hidden sm:block">Send to Editor</span>
            </button>
        </div>
    );
}
