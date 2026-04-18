import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import {
    Play, Volume2, VolumeX, Heart, MessageSquare,
    Share2, Bookmark, Music2, X, ChevronUp, ChevronDown, Plus, Trash2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { UploadReelModal } from './UploadReelModal';
import { resolveMediaUrl } from '../../config/apiConfig';

interface Reel {
    id: string;
    author_id: string;
    author_name: string;
    author_photo?: string;
    video_url: string;
    caption: string;
    music_name?: string;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    views_count: number;
    liked_by_me: boolean;
    isBookmarked?: boolean;
}

// ─── Single Reel Item ────────────────────────────────
function ReelItem({
    reel, isActive, onLike, onBookmark, onDelete, onShare
}: {
    reel: Reel;
    isActive: boolean;
    onLike: (id: string) => void;
    onBookmark: (id: string) => void;
    onDelete?: (id: string) => void;
    onShare: (id: string) => void;
}) {
    const { member } = useAuth();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [liked, setLiked] = useState(reel.liked_by_me);
    const [likeCount, setLikeCount] = useState(reel.likes_count);
    const [shareCount, setShareCount] = useState(reel.shares_count);
    const [bookmarked, setBookmarked] = useState(!!reel.isBookmarked);
    const [showHeart, setShowHeart] = useState(false);

    useEffect(() => {
        if (isActive && videoRef.current) {
            videoRef.current.play().catch(() => { });
            setPlaying(true);
        } else if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setPlaying(false);
        }
    }, [isActive]);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (playing) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setPlaying(!playing);
    };

    const handleDoubleTap = () => {
        if (!liked) {
            setLiked(true);
            setLikeCount(prev => prev + 1);
            onLike(reel.id);
        }
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 800);
    };

    const handleLike = () => {
        setLiked(!liked);
        setLikeCount(prev => liked ? prev - 1 : prev + 1);
        onLike(reel.id);
    };

    const handleBookmark = () => {
        setBookmarked(!bookmarked);
        onBookmark(reel.id);
    };

    const handleShare = () => {
        onShare(reel.id);
        setShareCount(prev => prev + 1);
        // Simple share feedback
        if (navigator.share) {
            navigator.share({
                title: 'Pandara Samaja Reel',
                text: reel.caption,
                url: window.location.href,
            }).catch(() => {});
        } else {
            toast.info('Link copied to clipboard');
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const isAuthor = member?.membership_no === reel.author_id;

    return (
        <div className="relative w-full h-full bg-black snap-start snap-always">
            {/* Video */}
            <video
                ref={videoRef}
                src={resolveMediaUrl(reel.video_url)}
                loop
                muted={muted}
                playsInline
                className="w-full h-full object-cover"
                onClick={togglePlay}
                onDoubleClick={handleDoubleTap}
            />

            {/* Play/Pause Indicator */}
            <AnimatePresence>
                {!playing && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <div className="w-16 h-16 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Play size={32} className="text-white ml-1" fill="white" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Double-tap heart */}
            <AnimatePresence>
                {showHeart && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1.2 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <Heart size={80} className="text-red-500" fill="currentColor" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Right side action buttons */}
            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
                {/* Author avatar */}
                <div className="relative mb-2">
                    <div className="w-11 h-11 rounded-full border-2 border-white bg-slate-700 flex items-center justify-center overflow-hidden">
                        {reel.author_photo ? (
                            <img src={resolveMediaUrl(reel.author_photo)} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white font-bold text-sm">{(reel.author_name || '?')[0].toUpperCase()}</span>
                        )}
                    </div>
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs font-bold border border-black">
                        +
                    </div>
                </div>

                {/* Like */}
                <button onClick={handleLike} className="flex flex-col items-center gap-0.5">
                    <motion.div whileTap={{ scale: 0.8 }}>
                        <Heart
                            size={28}
                            className={liked ? 'text-red-500' : 'text-white'}
                            fill={liked ? 'currentColor' : 'none'}
                        />
                    </motion.div>
                    <span className="text-white text-[11px] font-medium">{likeCount}</span>
                </button>

                {/* Comments */}
                <button className="flex flex-col items-center gap-0.5">
                    <MessageSquare size={26} className="text-white" />
                    <span className="text-white text-[11px] font-medium">{reel.comments_count}</span>
                </button>

                {/* Share */}
                <button onClick={handleShare} className="flex flex-col items-center gap-0.5">
                    <Share2 size={26} className="text-white" />
                    <span className="text-white text-[11px] font-medium">{shareCount}</span>
                </button>

                {/* Bookmark */}
                <button onClick={handleBookmark}>
                    <Bookmark
                        size={26}
                        className={bookmarked ? 'text-amber-400' : 'text-white'}
                        fill={bookmarked ? 'currentColor' : 'none'}
                    />
                </button>

                {/* Mute toggle */}
                <button
                    onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                    className="p-2 bg-black/30 backdrop-blur-sm rounded-full"
                >
                    {muted ? <VolumeX size={18} className="text-white" /> : <Volume2 size={18} className="text-white" />}
                </button>
            </div>

            {/* Bottom overlay - author + caption */}
            <div className="absolute bottom-4 left-4 right-16 z-20">
                <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-white text-sm drop-shadow-lg">{reel.author_name}</h3>
                    {isAuthor && onDelete && (
                        <button onClick={() => onDelete(reel.id)} className="text-white/50 hover:text-red-400">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
                <p className="text-white/90 text-sm leading-snug drop-shadow-lg mb-2">{reel.caption}</p>
                {reel.music_name && (
                    <div className="flex items-center gap-2 text-white/70 text-xs text-balance">
                        <Music2 size={12} className="shrink-0" />
                        <span className="truncate">{reel.music_name}</span>
                    </div>
                )}
            </div>

            {/* Gradient overlays */}
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// ─── Reels Viewer (Full-Screen) ───────────────────────
// ═══════════════════════════════════════════════════════
interface ReelsViewerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ReelsViewer({ isOpen, onClose }: ReelsViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [reels, setReels] = useState<Reel[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [viewHeight, setViewHeight] = useState(window.innerHeight);
    const containerRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);
    const opacity = useTransform(y, [-100, 0, 100], [0.5, 1, 0.5]);

    useEffect(() => {
        const handleResize = () => setViewHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchReels();
        }
    }, [isOpen]);

    // Record view when currentIndex changes
    useEffect(() => {
        if (reels.length > 0 && reels[currentIndex]) {
            const timer = setTimeout(() => {
                api.post(`/reels/${reels[currentIndex].id}/view`).catch(() => {});
            }, 2000); // 2 seconds threshold for a "view"
            return () => clearTimeout(timer);
        }
    }, [currentIndex, reels]);

    const fetchReels = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/reels');
            setReels(data.reels);
        } catch (error) {
            toast.error('Failed to load reels');
        } finally {
            setLoading(false);
        }
    };

    const goToNext = useCallback(() => {
        if (currentIndex < reels.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentIndex, reels.length]);

    const goToPrev = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.y < -50) goToNext();
        if (info.offset.y > 50) goToPrev();
    };

    const handleLike = async (id: string) => {
        try {
            await api.post(`/reels/${id}/like`);
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const handleBookmark = (_id: string) => {
        toast.success('Saved to bookmarks');
    };

    const handleShare = async (id: string) => {
        try {
            await api.post(`/reels/${id}/share`);
        } catch (error) {
            console.error('Share record error:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this reel?')) return;
        try {
            await api.delete(`/reels/${id}`);
            setReels(prev => prev.filter(r => r.id !== id));
            if (currentIndex >= reels.length - 1) {
                setCurrentIndex(Math.max(0, reels.length - 2));
            }
            toast.success('Reel deleted');
        } catch (error) {
            toast.error('Failed to delete reel');
        }
    };

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || e.key === 'j') goToNext();
            if (e.key === 'ArrowUp' || e.key === 'k') goToPrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, goToNext, goToPrev, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black"
                >
                    <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-50 bg-gradient-to-b from-black/60 to-transparent">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            >
                                <X size={22} />
                            </button>
                            <h2 className="text-white font-bold text-lg">Reels</h2>
                        </div>
                        <button
                            onClick={() => setShowUpload(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full shadow-lg transition-all"
                        >
                            <Plus size={18} />
                            <span>Create</span>
                        </button>
                    </div>

                    {/* Navigation hints */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
                        <button
                            onClick={goToPrev}
                            disabled={currentIndex === 0}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white disabled:opacity-20 transition-all"
                        >
                            <ChevronUp size={20} />
                        </button>
                        <button
                            onClick={goToNext}
                            disabled={currentIndex === reels.length - 1}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white disabled:opacity-20 transition-all"
                        >
                            <ChevronDown size={20} />
                        </button>
                    </div>

                    {/* Reels container */}
                    <motion.div
                        ref={containerRef}
                        className="w-full h-full max-w-md mx-auto overflow-hidden"
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        onDragEnd={handleDragEnd}
                        style={{ y, opacity }}
                    >
                        <motion.div
                            animate={{ y: -currentIndex * viewHeight }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="w-full"
                        >
                            {loading ? (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-4" style={{ height: viewHeight }}>
                                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-white/60 text-sm">Loading reels...</p>
                                </div>
                            ) : reels.length === 0 ? (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-8 text-center" style={{ height: viewHeight }}>
                                    <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-2">
                                        <Music2 size={40} className="text-white/20" />
                                    </div>
                                    <h3 className="text-white font-bold text-xl">No reels yet</h3>
                                    <p className="text-white/60">Be the first to share a moment with the community!</p>
                                    <button 
                                        onClick={() => setShowUpload(true)}
                                        className="mt-4 px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:scale-105 transition-transform"
                                    >
                                        Create Reel
                                    </button>
                                </div>
                            ) : (
                                reels.map((reel, index) => (
                                    <div key={reel.id} style={{ height: viewHeight }} className="w-full">
                                        <ReelItem
                                            reel={reel}
                                            isActive={index === currentIndex}
                                            onLike={handleLike}
                                            onBookmark={handleBookmark}
                                            onShare={handleShare}
                                            onDelete={handleDelete}
                                        />
                                    </div>
                                ))
                            )}
                        </motion.div>
                    </motion.div>

                    {/* Reel counter */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1 z-50">
                        {reels.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/30'}`}
                            />
                        ))}
                    </div>

                    <UploadReelModal 
                        isOpen={showUpload} 
                        onClose={() => setShowUpload(false)} 
                        onSuccess={() => {
                            setShowUpload(false);
                            fetchReels();
                        }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
