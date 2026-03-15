import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { ChevronUp, ChevronDown, Sparkles, Trash2, BookMarked } from 'lucide-react';

interface PresetsDropdownProps {
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
    showSaveForm: boolean;
    setShowSaveForm: (val: boolean) => void;
    currentPostData: any;
    onSavePost: (data: any, name?: string) => Promise<string | undefined>;
    onLoadPreset: (preset: any) => void;
    presetsList: any[];
    onDeletePreset: (id: string) => void;
    direction?: 'up' | 'down';
    tab: string;
}

export function PresetsDropdown({
    isOpen,
    setIsOpen,
    showSaveForm,
    setShowSaveForm,
    currentPostData,
    onSavePost,
    onLoadPreset,
    presetsList,
    onDeletePreset,
    direction = 'up',
    tab
}: PresetsDropdownProps) {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [presetName, setPresetName] = useState('');
    const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number; openUp: boolean } | null>(null);

    const filteredPresets = presetsList.filter(p => p.tab === tab || (!p.tab && tab === 'create'));

    // Calculate portal position
    useLayoutEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const estimatedH = 320;
            const spaceAbove = rect.top;
            const spaceBelow = window.innerHeight - rect.bottom;
            const openUp = direction === 'up' || spaceBelow < estimatedH;
            setPanelPos({
                top: openUp ? rect.top : rect.bottom + 4,
                left: rect.right - 280, // right-align the 280px panel
                width: 280,
                openUp,
            });
        }
    }, [isOpen, direction]);

    // Outside click
    useEffect(() => {
        if (!isOpen) return;
        function onDown(e: MouseEvent) {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
                panelRef.current && !panelRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
                setShowSaveForm(false);
            }
        }
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [isOpen, setIsOpen, setShowSaveForm]);

    useEffect(() => {
        if (showSaveForm) setPresetName('');
    }, [showSaveForm]);

    const triggerBtnStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 10px',
        height: '28px',
        background: isOpen ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isOpen ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '7px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: isOpen ? 'rgb(52,211,153)' : 'rgba(255,255,255,0.45)',
        cursor: 'pointer',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
    };

    const portal = isOpen && panelPos ? ReactDOM.createPortal(
        <div
            ref={panelRef}
            style={{
                position: 'fixed',
                top: panelPos.top,
                left: Math.max(8, panelPos.left),
                width: panelPos.width,
                transform: panelPos.openUp ? 'translateY(-100%) translateY(-4px)' : 'none',
                background: '#14141a',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px',
                zIndex: 99999,
                boxShadow: '0 16px 48px rgba(0,0,0,0.75)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header action */}
            <div style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
                {showSaveForm ? (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSavePost(currentPostData, presetName);
                            setShowSaveForm(false);
                        }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                    >
                        <input
                            autoFocus
                            type="text"
                            placeholder="Name this preset..."
                            value={presetName}
                            onChange={e => setPresetName(e.target.value)}
                            style={{
                                width: '100%',
                                height: '36px',
                                background: 'rgba(0,0,0,0.5)',
                                border: '1px solid rgba(16,185,129,0.4)',
                                borderRadius: '8px',
                                color: 'rgba(255,255,255,0.9)',
                                fontSize: '13px',
                                fontFamily: 'inherit',
                                padding: '0 12px',
                                outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                                type="submit"
                                style={{
                                    flex: 1, height: '32px',
                                    background: 'rgb(16,185,129)', color: 'black',
                                    border: 'none', borderRadius: '7px',
                                    fontSize: '11px', fontWeight: 800,
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                    cursor: 'pointer',
                                }}
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowSaveForm(false)}
                                style={{
                                    height: '32px', padding: '0 12px',
                                    background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
                                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '7px',
                                    fontSize: '11px', fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => setShowSaveForm(true)}
                        style={{
                            width: '100%', height: '36px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                            background: 'rgba(16,185,129,0.1)',
                            border: '1px solid rgba(16,185,129,0.25)',
                            borderRadius: '8px',
                            color: 'rgb(52,211,153)',
                            fontSize: '11px', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.18)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.1)')}
                    >
                        <Sparkles style={{ width: 13, height: 13 }} />
                        Save Context
                    </button>
                )}
            </div>

            {/* Presets list */}
            <div style={{ overflowY: 'auto', maxHeight: '220px' }}>
                {filteredPresets.length === 0 ? (
                    <div style={{
                        padding: '24px 16px',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.2)',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                    }}>
                        No {tab} presets saved yet
                    </div>
                ) : (
                    filteredPresets.slice(0, 10).map((post, i) => (
                        <div
                            key={post.id}
                            onClick={() => { onLoadPreset(post); setIsOpen(false); }}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0 12px', height: '40px',
                                cursor: 'pointer',
                                borderBottom: i < Math.min(filteredPresets.length, 10) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                        >
                            <span style={{
                                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                fontSize: '13px', color: 'rgba(255,255,255,0.8)',
                            }}>
                                {post.name || post.topic || 'Untitled'}
                            </span>
                            <button
                                onMouseDown={e => {
                                    e.stopPropagation();
                                    onDeletePreset(post.id);
                                }}
                                style={{
                                    flexShrink: 0, width: '28px', height: '28px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'rgba(255,255,255,0.2)', borderRadius: '6px',
                                    transition: 'all 0.1s',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgb(239,68,68)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.12)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.2)'; (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                            >
                                <Trash2 style={{ width: 13, height: 13 }} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {filteredPresets.length > 10 && (
                <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                        Showing 10 of {filteredPresets.length}
                    </span>
                </div>
            )}
        </div>,
        document.body
    ) : null;

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
                ref={triggerRef}
                type="button"
                style={triggerBtnStyle}
                onClick={() => { setIsOpen(!isOpen); setShowSaveForm(false); }}
                onMouseEnter={e => {
                    if (!isOpen) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)';
                    }
                }}
                onMouseLeave={e => {
                    if (!isOpen) {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)';
                    }
                }}
            >
                <BookMarked style={{ width: 12, height: 12 }} />
                Presets
                {isOpen
                    ? <ChevronUp style={{ width: 11, height: 11 }} />
                    : <ChevronDown style={{ width: 11, height: 11 }} />
                }
            </button>
            {portal}
        </div>
    );
}
