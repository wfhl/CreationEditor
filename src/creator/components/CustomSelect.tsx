import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
    value: string | number;
    label: string;
}

interface CustomSelectProps {
    value: string | number;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
}

export function CustomSelect({ value, onChange, options, placeholder }: CustomSelectProps) {
    const [open, setOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState<{
        top: number; left: number; width: number; openUp: boolean; maxH: number;
    } | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selected = options.find(o => String(o.value) === String(value));

    // Position the portal dropdown relative to the trigger button
    useLayoutEffect(() => {
        if (open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const ITEM_H = 40;
            const PADDING = 8;
            const totalH = options.length * ITEM_H + PADDING;
            const maxH = Math.max(ITEM_H * 2, Math.min(totalH, 280)); // cap at 280px

            if (spaceBelow >= maxH || spaceBelow >= spaceAbove) {
                // Open downward
                setDropdownPos({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: rect.width,
                    openUp: false,
                    maxH: Math.min(maxH, spaceBelow - 8),
                });
            } else {
                // Flip upward
                setDropdownPos({
                    top: rect.top - 4,
                    left: rect.left,
                    width: rect.width,
                    openUp: true,
                    maxH: Math.min(maxH, spaceAbove - 8),
                });
            }
        }
    }, [open, options.length]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function onDown(e: MouseEvent) {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    const triggerStyle: React.CSSProperties = {
        width: '100%',
        height: 'var(--creator-ctrl-h, 36px)',
        background: open ? 'rgba(0,0,0,0.55)' : 'var(--creator-ctrl-bg, rgba(0,0,0,0.45))',
        border: `1px solid ${open ? 'rgba(16,185,129,0.5)' : 'var(--creator-ctrl-border, rgba(255,255,255,0.1))'}`,
        borderRadius: 'var(--creator-ctrl-radius, 8px)',
        color: 'rgba(255,255,255,0.9)',
        fontSize: 'var(--creator-ctrl-font, 13px)',
        fontFamily: 'var(--font-ui, inherit)',
        padding: '0 36px 0 12px',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        outline: 'none',
        boxSizing: 'border-box',
        textAlign: 'left',
        position: 'relative',
        transition: 'border-color 0.15s',
        boxShadow: open ? '0 0 0 2px rgba(16,185,129,0.08)' : 'none',
    };

    const dropdown = open && dropdownPos ? ReactDOM.createPortal(
        <div
            ref={dropdownRef}
            style={{
                position: 'fixed',
                top: dropdownPos.top,
                left: dropdownPos.left,
                width: dropdownPos.width,
                transform: dropdownPos.openUp ? 'translateY(-100%)' : 'none',
                maxHeight: `${dropdownPos.maxH}px`,
                overflowY: 'auto',
                background: '#16161d',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '10px',
                zIndex: 99999,
                boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
            }}
        >
            {options.map((opt, i) => {
                const isSelected = String(opt.value) === String(value);
                return (
                    <div
                        key={opt.value}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onChange(String(opt.value));
                            setOpen(false);
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 14px',
                            height: '40px',
                            fontSize: '13px',
                            fontFamily: 'var(--font-ui, inherit)',
                            color: isSelected ? 'rgb(52,211,153)' : 'rgba(255,255,255,0.82)',
                            background: isSelected ? 'rgba(16,185,129,0.12)' : 'transparent',
                            cursor: 'pointer',
                            fontWeight: isSelected ? 700 : 400,
                            borderBottom: i < options.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                            transition: 'background 0.08s',
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                            if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.07)';
                        }}
                        onMouseLeave={e => {
                            if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                        }}
                    >
                        {opt.label}
                    </div>
                );
            })}
        </div>,
        document.body
    ) : null;

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <button
                ref={triggerRef}
                type="button"
                style={triggerStyle}
                onClick={() => setOpen(v => !v)}
            >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected ? selected.label : (placeholder ?? 'Select...')}
                </span>
                <ChevronDown
                    style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
                        transition: 'transform 0.2s',
                        width: '14px',
                        height: '14px',
                        color: 'rgba(255,255,255,0.35)',
                        flexShrink: 0,
                    }}
                />
            </button>
            {dropdown}
        </div>
    );
}
