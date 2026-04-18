import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
    RotateCcw, RotateCw, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoPlayerProps {
    src: string;
    poster?: string;
    autoPlayEnabled?: boolean;
    className?: string;
}

export function VideoPlayer({ src, poster, autoPlayEnabled = false, className = "" }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true); // Default muted for auto-play friendliness
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showRateMenu, setShowRateMenu] = useState(false);

    const controlsTimeoutRef = useRef<any>(null);

    // Auto-hide controls after 3 seconds of inactivity
    const resetControlsTimeout = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    }, [isPlaying]);

    useEffect(() => {
        resetControlsTimeout();
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, [resetControlsTimeout]);

    // Intersection Observer for auto-play/pause
    useEffect(() => {
        if (!autoPlayEnabled) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        videoRef.current?.play().catch(e => console.log("Autoplay blocked:", e));
                        setIsPlaying(true);
                    } else {
                        videoRef.current?.pause();
                        setIsPlaying(false);
                    }
                });
            },
            { threshold: 0.6 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [autoPlayEnabled]);

    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!videoRef.current) return;
        
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
        resetControlsTimeout();
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            videoRef.current.muted = val === 0;
            setIsMuted(val === 0);
        }
    };

    const handleProgress = () => {
        if (!videoRef.current) return;
        const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setProgress(currentProgress);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const seekTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
        videoRef.current.currentTime = seekTime;
        setProgress(parseFloat(e.target.value));
    };

    const toggleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const seekBackward = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) videoRef.current.currentTime -= 10;
    };

    const seekForward = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) videoRef.current.currentTime += 10;
    };

    const handleDoubleTap = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) {
            // Left side double tap
            if (videoRef.current) videoRef.current.currentTime -= 10;
        } else if (x > (rect.width * 2) / 3) {
            // Right side double tap
            if (videoRef.current) videoRef.current.currentTime += 10;
        } else {
            togglePlay();
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return [h, m, s]
            .map(v => v < 10 ? "0" + v : v)
            .filter((v, i) => v !== "00" || i > 0)
            .join(":");
    };

    return (
        <div 
            ref={containerRef}
            className={`relative group bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 ${className}`}
            onMouseEnter={() => { setShowControls(true); }}
            onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
            onMouseMove={resetControlsTimeout}
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                loop
                playsInline
                muted={isMuted}
                className="w-full h-full object-contain cursor-pointer"
                onTimeUpdate={handleProgress}
                onLoadedMetadata={() => { setDuration(videoRef.current?.duration || 0); setIsLoading(false); }}
                onWaiting={() => setIsLoading(true)}
                onPlaying={() => setIsLoading(false)}
                onClick={togglePlay}
                onDoubleClick={handleDoubleTap}
            />

            {/* Premium Buffering Indicator */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] z-10"
                    >
                        <Loader2 size={48} className="text-blue-500 animate-spin" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Play/Pause Large Center Icon for Visual Feedback */}
            <AnimatePresence>
                {!isPlaying && !isLoading && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                    >
                        <div className="w-20 h-20 bg-blue-600/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
                            <Play size={40} fill="white" className="text-white ml-2" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Gradient Overlay for Controls */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-500 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

            {/* Bottom Controls Bar */}
            <motion.div 
                animate={{ y: showControls || !isPlaying ? 0 : 20, opacity: showControls || !isPlaying ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-0 right-0 p-4 z-20"
            >
                {/* Progress Bar */}
                <div className="relative w-full h-1.5 bg-white/20 rounded-full mb-4 group/progress cursor-pointer">
                    <div 
                        className="absolute top-0 left-0 h-full bg-blue-500 rounded-full z-10" 
                        style={{ width: `${progress}%` }}
                    />
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />
                    {/* Progress handle (visible on hover) */}
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-blue-500 z-30 transition-opacity opacity-0 group-hover/progress:opacity-100 pointer-events-none"
                        style={{ left: `${progress}%`, marginLeft: '-8px' }}
                    />
                </div>

                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
                            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                        </button>
                        
                        <div className="flex items-center gap-2 group/volume relative">
                            <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors">
                                {isMuted || volume === 0 ? <VolumeX size={22} /> : <Volume2 size={22} />}
                            </button>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-0 group-hover/volume:w-20 transition-all overflow-hidden h-1 bg-white/30 rounded-full appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        <div className="text-white text-sm font-medium tabular-nums">
                            {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Playback Speed Menu */}
                        <div className="relative">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowRateMenu(!showRateMenu); }}
                                className="text-white hover:text-blue-400 transition-colors text-xs font-bold border border-white/30 px-2 py-1 rounded"
                            >
                                {playbackRate}x
                            </button>
                            {showRateMenu && (
                                <div className="absolute bottom-full right-0 mb-2 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col min-w-[80px]">
                                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                                        <button 
                                            key={rate}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPlaybackRate(rate);
                                                if (videoRef.current) videoRef.current.playbackRate = rate;
                                                setShowRateMenu(false);
                                            }}
                                            className={`px-4 py-2 text-xs text-left hover:bg-white/10 transition-colors ${playbackRate === rate ? 'text-blue-400 font-bold' : 'text-white'}`}
                                        >
                                            {rate}x
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button onClick={seekBackward} className="text-white/70 hover:text-white transition-colors" title="Back 10s">
                            <RotateCcw size={20} />
                        </button>
                        <button onClick={seekForward} className="text-white/70 hover:text-white transition-colors" title="Forward 10s">
                            <RotateCw size={20} />
                        </button>
                        
                        <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition-colors">
                            {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
