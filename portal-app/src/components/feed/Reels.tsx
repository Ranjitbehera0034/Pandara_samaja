import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import {
    Play, Volume2, VolumeX, Heart, MessageSquare,
    Share2, Bookmark, Music2, X, ChevronUp, ChevronDown
} from 'lucide-react';

interface Reel {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    videoUrl: string;
    caption: string;
    musicName?: string;
    likes: number;
    comments: number;
    shares: number;
    isLiked: boolean;
    isBookmarked: boolean;
}

// Mock Reels data
const SAMPLE_REELS: Reel[] = [
    {
        id: 'r1',
        authorName: 'Sasmita Das',
        authorId: '103',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        caption: 'Beautiful sunset at Puri beach! 🌅 #Odisha #Beach #Sunset',
        musicName: 'Original Audio',
        likes: 234,
        comments: 45,
        shares: 12,
        isLiked: false,
        isBookmarked: false,
    },
    {
        id: 'r2',
        authorName: 'Rajesh Patel',
        authorId: '105',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        caption: 'Community gathering was amazing! 🎉 #PandaraSamaja #Community',
        musicName: 'Festival Vibes',
        likes: 412,
        comments: 89,
        shares: 28,
        isLiked: true,
        isBookmarked: false,
    },
    {
        id: 'r3',
        authorName: 'Amit Kumar',
        authorId: '107',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        caption: 'Traditional dance performance 💃 #Culture #Tradition',
        musicName: 'Folk Music',
        likes: 567,
        comments: 123,
        shares: 45,
        isLiked: false,
        isBookmarked: true,
    },
];

// ─── Single Reel Item ────────────────────────────────
function ReelItem({
    reel, isActive, onLike, onBookmark
}: {
    reel: Reel;
    isActive: boolean;
    onLike: (id: string) => void;
    onBookmark: (id: string) => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [liked, setLiked] = useState(reel.isLiked);
    const [likeCount, setLikeCount] = useState(reel.likes);
    const [bookmarked, setBookmarked] = useState(reel.isBookmarked);
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

    return (
        <div className="relative w-full h-full bg-black snap-start snap-always">
            {/* Video */}
            <video
                ref={videoRef}
                src={reel.videoUrl}
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
                        {reel.authorAvatar ? (
                            <img src={reel.authorAvatar} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-white font-bold text-sm">{(reel.authorName || '?')[0].toUpperCase()}</span>
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
                    <span className="text-white text-[11px] font-medium">{reel.comments}</span>
                </button>

                {/* Share */}
                <button className="flex flex-col items-center gap-0.5">
                    <Share2 size={26} className="text-white" />
                    <span className="text-white text-[11px] font-medium">{reel.shares}</span>
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
                <h3 className="font-bold text-white text-sm mb-1 drop-shadow-lg">{reel.authorName}</h3>
                <p className="text-white/90 text-sm leading-snug drop-shadow-lg mb-2">{reel.caption}</p>
                {reel.musicName && (
                    <div className="flex items-center gap-2 text-white/70 text-xs">
                        <Music2 size={12} />
                        <span className="truncate">{reel.musicName}</span>
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
    const [reels] = useState<Reel[]>(SAMPLE_REELS);
    const containerRef = useRef<HTMLDivElement>(null);
    const y = useMotionValue(0);
    const opacity = useTransform(y, [-100, 0, 100], [0.5, 1, 0.5]);

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

    const handleLike = (_id: string) => {
        // Will wire to backend
    };

    const handleBookmark = (_id: string) => {
        // Will wire to backend
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
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-50">
                        <h2 className="text-white font-bold text-lg">Reels</h2>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        >
                            <X size={22} />
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
                            animate={{ y: -currentIndex * window.innerHeight }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="w-full"
                        >
                            {reels.map((reel, index) => (
                                <div key={reel.id} style={{ height: window.innerHeight }} className="w-full">
                                    <ReelItem
                                        reel={reel}
                                        isActive={index === currentIndex}
                                        onLike={handleLike}
                                        onBookmark={handleBookmark}
                                    />
                                </div>
                            ))}
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
                </motion.div>
            )}
        </AnimatePresence>
    );
}
