import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const loadingMessages = [
    "Warming up the digital director...",
    "Gathering pixels and photons...",
    "Storyboarding your vision...",
    "Consulting with the AI muse...",
    "Rendering the first scene...",
    "Applying cinematic lighting...",
    "This can take a few minutes, hang tight!",
    "Adding a touch of movie magic...",
    "Composing the final cut...",
    "Polishing the masterpiece...",
    "Teaching the AI to say 'I'll be back'...",
    "Checking for digital dust bunnies...",
    "Calibrating the irony sensors...",
    "Untangling the timelines...",
    "Enhancing to ludicrous speed...",
    "Don't worry, the pixels are friendly.",
    "Harvesting nano banana stems...",
    "Praying to the Gemini star...",
    "Starting a draft for your oscar speech..."
];

interface LoadingIndicatorProps {
    title?: string;
    modelName?: string;
    type?: 'image' | 'video' | 'edit' | 'text';
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
    title = "Generating Content",
    modelName,
    type = 'image'
}) => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
        }, 4000);
        return () => clearInterval(intervalId);
    }, []);

    const typeColors: Record<string, { primary: string; secondary: string }> = {
        video: { primary: '#3b82f6', secondary: '#8ab4f8' },
        edit: { primary: '#10b981', secondary: '#4ade80' },
        text: { primary: '#ef4444', secondary: '#f87171' },
        image: { primary: '#8b5cf6', secondary: '#a78bfa' },
    };

    const color = typeColors[type] || typeColors.image;

    return (
        <div className="flex flex-col items-center justify-center p-16 select-none relative w-full h-full max-w-2xl mx-auto">
            {/* 3D-ish Premium Spinner */}
            <div className="relative w-32 h-32 mb-12 group">
                {/* Background Ambient Glow */}
                <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.25, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full blur-3xl"
                    style={{ background: color.primary }}
                />

                {/* Outer Ring - Dynamic SVG */}
                <motion.svg
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="w-full h-full"
                    viewBox="0 0 100 100"
                >
                    <circle 
                        cx="50" cy="50" r="48" 
                        fill="none" 
                        stroke="rgba(255,255,255,0.03)" 
                        strokeWidth="0.5"
                    />
                    <circle 
                        cx="50" cy="50" r="48" 
                        fill="none" 
                        stroke={color.primary} 
                        strokeWidth="2.5"
                        strokeDasharray="60 240"
                        strokeLinecap="round"
                    />
                </motion.svg>

                {/* Inner Ring - Counter-rotate */}
                <div className="absolute inset-4">
                    <motion.svg
                        animate={{ rotate: -360 }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                        className="w-full h-full"
                        viewBox="0 0 100 100"
                    >
                        <circle 
                            cx="50" cy="50" r="46" 
                            fill="none" 
                            stroke={color.secondary} 
                            strokeWidth="1.5"
                            strokeDasharray="30 270"
                            strokeLinecap="round"
                            style={{ opacity: 0.3 }}
                        />
                    </motion.svg>
                </div>

                {/* Center Core */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <motion.div
                        animate={{ 
                            scale: [1, 1.15, 1],
                            opacity: [0.4, 0.8, 0.4],
                            boxShadow: [
                                `0 0 15px ${color.primary}33`,
                                `0 0 30px ${color.primary}66`,
                                `0 0 15px ${color.primary}33`
                            ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-14 h-14 rounded-full backdrop-blur-md border border-white/5 flex items-center justify-center bg-white/5"
                    >
                        <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_white]" />
                    </motion.div>
                </div>
            </div>

            {/* Typography */}
            <div className="text-center space-y-4">
                <motion.h2 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    style={{ fontFamily: 'var(--font-ui)', fontWeight: 900 }}
                    className="text-2xl text-white uppercase tracking-[0.45em] mb-2"
                >
                    {title}
                </motion.h2>

                <div className="h-10 relative w-full flex justify-center">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={messageIndex}
                            initial={{ opacity: 0, scale: 0.98, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.02, y: -8 }}
                            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                            style={{ fontFamily: 'var(--font-ui)', fontWeight: 500 }}
                            className="text-white/40 text-[13px] tracking-widest max-w-[320px] text-center"
                        >
                            {loadingMessages[messageIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>

                {modelName && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="pt-10 select-none pointer-events-none"
                    >
                        <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white/5 backdrop-blur-2xl border border-white/[0.06] rounded-2xl shadow-inner group-hover:border-white/[0.12] transition-colors">
                            <div 
                                className="w-2 h-2 rounded-full animate-pulse" 
                                style={{ background: color.primary, boxShadow: `0 0 10px ${color.primary}` }}
                            />
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">
                                Processor: <span className="text-white/50">{modelName}</span>
                            </span>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default LoadingIndicator;
