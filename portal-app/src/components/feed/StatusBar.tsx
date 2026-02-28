import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smile, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { StatusUpdate } from '../../types';

const STATUS_BG_GRADIENTS = [
    'from-blue-600 to-indigo-700',
    'from-purple-600 to-pink-600',
    'from-emerald-600 to-teal-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-rose-500 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-lime-500 to-green-600',
];

const MOOD_EMOJIS = ['😊', '🎉', '💪', '🙏', '❤️', '🔥', '✨', '🌟', '😎', '🤔', '📚', '🎵'];

interface StatusBarProps {
    statuses: StatusUpdate[];
    onAddStatus: (text: string, emoji: string, bgColor: string) => void;
}

export function StatusBar({ statuses, onAddStatus }: StatusBarProps) {
    const { member } = useAuth();
    const { t } = useLanguage();
    const [showComposer, setShowComposer] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('😊');
    const [selectedBg, setSelectedBg] = useState(STATUS_BG_GRADIENTS[0]);
    const [viewingStatus, setViewingStatus] = useState<StatusUpdate | null>(null);

    const handlePost = () => {
        if (!statusText.trim()) return;
        onAddStatus(statusText, selectedEmoji, selectedBg);
        setStatusText('');
        setShowComposer(false);
    };

    return (
        <>
            {/* Status bar */}
            <div className="mb-5">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                    {/* Add status button */}
                    <button
                        onClick={() => setShowComposer(true)}
                        className="shrink-0 flex flex-col items-center gap-1.5"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-dashed border-blue-500/40 flex items-center justify-center hover:border-blue-400 transition-colors">
                            <Smile size={22} className="text-blue-400" />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{t('common', 'status') || 'Status'}</span>
                    </button>

                    {/* Existing statuses */}
                    {statuses.map((status) => (
                        <button
                            key={status.id}
                            onClick={() => setViewingStatus(status)}
                            className="shrink-0 flex flex-col items-center gap-1.5 group"
                        >
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${status.bgColor} flex items-center justify-center text-2xl shadow-lg transition-transform group-hover:scale-105`}>
                                {status.emoji}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium truncate w-14 text-center">
                                {(status.authorName || 'User').split(' ')[0]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Composer Modal */}
            <AnimatePresence>
                {showComposer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowComposer(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm"
                        >
                            {/* Preview Card */}
                            <div className={`bg-gradient-to-br ${selectedBg} rounded-3xl p-8 mb-4 min-h-[220px] flex flex-col items-center justify-center shadow-2xl relative`}>
                                <button
                                    onClick={() => setShowComposer(false)}
                                    className="absolute top-3 right-3 p-1.5 bg-black/20 rounded-full text-white/80 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                                <span className="text-5xl mb-4">{selectedEmoji}</span>
                                {statusText ? (
                                    <p className="text-white text-center text-lg font-semibold leading-relaxed">{statusText}</p>
                                ) : (
                                    <p className="text-white/50 text-center text-sm">What's on your mind?</p>
                                )}
                                <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-white/40 text-xs">
                                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                                        {(member?.name || '?')[0].toUpperCase()}
                                    </div>
                                    <span>{(member?.name || 'User').split(' ')[0]}</span>
                                </div>
                            </div>

                            {/* Status text input */}
                            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 space-y-4">
                                <input
                                    type="text"
                                    value={statusText}
                                    onChange={(e) => setStatusText(e.target.value)}
                                    placeholder="What's on your mind?"
                                    maxLength={100}
                                    className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-2.5 text-sm border border-slate-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-500"
                                    autoFocus
                                />

                                {/* Emoji picker */}
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 block">Mood</label>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {MOOD_EMOJIS.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => setSelectedEmoji(emoji)}
                                                className={`text-xl p-1.5 rounded-lg transition-all ${selectedEmoji === emoji ? 'bg-blue-500/20 scale-110 ring-1 ring-blue-500' : 'hover:bg-slate-700/50'}`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Background picker */}
                                <div>
                                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 block">Background</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {STATUS_BG_GRADIENTS.map(bg => (
                                            <button
                                                key={bg}
                                                onClick={() => setSelectedBg(bg)}
                                                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${bg} transition-all ${selectedBg === bg ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : 'opacity-70 hover:opacity-100'}`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Post button */}
                                <button
                                    onClick={handlePost}
                                    disabled={!statusText.trim()}
                                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Send size={16} />
                                    <span>Share Status</span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* View Status Modal */}
            <AnimatePresence>
                {viewingStatus && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setViewingStatus(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className={`bg-gradient-to-br ${viewingStatus.bgColor} rounded-3xl p-10 max-w-sm w-full min-h-[300px] flex flex-col items-center justify-center shadow-2xl relative`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setViewingStatus(null)}
                                className="absolute top-4 right-4 p-2 bg-black/20 rounded-full text-white/80 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                            <span className="text-6xl mb-6">{viewingStatus.emoji}</span>
                            <p className="text-white text-center text-xl font-bold leading-relaxed">{viewingStatus.text}</p>
                            <div className="absolute bottom-4 left-5 flex items-center gap-2 text-white/60 text-sm">
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                                    {(viewingStatus.authorName || '?')[0].toUpperCase()}
                                </div>
                                <span>{viewingStatus.authorName}</span>
                            </div>
                            <span className="absolute bottom-4 right-5 text-white/30 text-xs">
                                {new Date(viewingStatus.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
