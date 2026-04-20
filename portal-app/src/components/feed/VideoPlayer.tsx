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
    onPlay?: () => void;
    onWatch?: (data: { durationSeconds: number; segments: number[] }) => void;
    className?: string;
}

export function VideoPlayer({ src, poster, autoPlayEnabled = false, onPlay, onWatch, className = "" }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(autoPlayEnabled);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(true);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showRateMenu, setShowRateMenu] = useState(false);
    const [bufferProgress, setBufferProgress] = useState(0);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    const [hasError, setHasError] = useState(false);
    
    // Watch Session Tracking — use REFS (not state) to avoid re-render cascades
    const watchedSegments = useRef<Set<number>>(new Set());
    const totalWatchTimeRef = useRef<number>(0);
    const lastSessionUpdate = useRef<number>(Date.now());
    const onPlayFiredRef = useRef(false);
    // Keep stable references to callbacks
    const onWatchRef = useRef(onWatch);
    const onPlayRef = useRef(onPlay);
    useEffect(() => { onWatchRef.current = onWatch; }, [onWatch]);
    useEffect(() => { onPlayRef.current = onPlay; }, [onPlay]);

    const controlsTimeoutRef = useRef<number | null>(null);
    const volumeTimeoutRef = useRef<number | null>(null);

    // Auto-hide controls after 3 seconds of inactivity
    const resetControlsTimeout = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = window.setTimeout(() => {
            if (videoRef.current && !videoRef.current.paused) setShowControls(false);
        }, 3000);
    }, []);

    // Report watch session — stable function, reads from refs
    const reportWatchSession = useCallback(() => {
        if (watchedSegments.current.size > 0 && onWatchRef.current) {
            onWatchRef.current({
                durationSeconds: Math.round(totalWatchTimeRef.current),
                segments: Array.from(watchedSegments.current).sort((a, b) => a - b)
            });
        }
    }, []); // No dependencies — reads from refs

    useEffect(() => {
        resetControlsTimeout();
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, [resetControlsTimeout]);

    // Reset state when src changes — now safe because reportWatchSession is stable
    useEffect(() => {
        reportWatchSession();
        setIsPlaying(false);
        setIsLoading(true);
        setProgress(0);
        setCurrentTime(0);
        setBufferProgress(0);
        setHasError(false);
        totalWatchTimeRef.current = 0;
        watchedSegments.current.clear();
        onPlayFiredRef.current = false;
        lastSessionUpdate.current = Date.now();
        if (videoRef.current) {
            videoRef.current.load();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [src]); // Only re-run when src actually changes

    // Sync volume to video element whenever volume or muted state changes
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
            videoRef.current.muted = isMuted;
        }
    }, [volume, isMuted]);

    // Intersection Observer for auto-play/pause
    useEffect(() => {
        if (!autoPlayEnabled) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        videoRef.current?.play().catch(e => console.log("Autoplay blocked:", e));
                    } else {
                        videoRef.current?.pause();
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

    // Listen for fullscreen changes (e.g. user presses Esc)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Report session when component unmounts
    useEffect(() => {
        return () => {
            reportWatchSession();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const togglePlay = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (!videoRef.current) return;
        
        if (videoRef.current.paused || videoRef.current.ended) {
            videoRef.current.play().catch(err => {
                console.error('Play failed:', err);
            });
        } else {
            videoRef.current.pause();
        }
        resetControlsTimeout();
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        
        if (isMuted) {
            const newVol = volume === 0 ? 1 : volume;
            setVolume(newVol);
            setIsMuted(false);
        } else {
            setIsMuted(true);
        }
        
        setShowVolumeSlider(prev => !prev);
        if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
        volumeTimeoutRef.current = window.setTimeout(() => setShowVolumeSlider(false), 4000);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const val = parseFloat(e.target.value);
        setVolume(val);
        setIsMuted(val === 0);
        
        if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
        volumeTimeoutRef.current = window.setTimeout(() => setShowVolumeSlider(false), 4000);
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        
        const currentPos = videoRef.current.currentTime;
        const dur = videoRef.current.duration || 0;
        if (!isFinite(dur) || dur <= 0) return;

        setProgress((currentPos / dur) * 100);
        setCurrentTime(currentPos);

        // Track segments (5s buckets) — writes to refs, no re-renders
        if (!videoRef.current.paused) {
            const segmentIndex = Math.floor(currentPos / 5);
            watchedSegments.current.add(segmentIndex);

            const now = Date.now();
            const delta = (now - lastSessionUpdate.current) / 1000;
            if (delta > 0 && delta < 2) {
                totalWatchTimeRef.current += delta;
            }
            lastSessionUpdate.current = now;
        }
    };

    const handleBufferProgress = () => {
        if (!videoRef.current) return;
        const vid = videoRef.current;
        if (vid.buffered.length > 0 && isFinite(vid.duration) && vid.duration > 0) {
            const bufferedEnd = vid.buffered.end(vid.buffered.length - 1);
            setBufferProgress((bufferedEnd / vid.duration) * 100);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const dur = videoRef.current.duration || 0;
        if (!isFinite(dur) || dur <= 0) return;
        const seekTime = (parseFloat(e.target.value) / 100) * dur;
        videoRef.current.currentTime = seekTime;
        setProgress(parseFloat(e.target.value));
        setCurrentTime(seekTime);
    };

    const toggleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!containerRef.current) return;

        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const seekBackward = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    };

    const seekForward = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 10);
    };

    const handleDoubleTap = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) {
            if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        } else if (x > (rect.width * 2) / 3) {
            if (videoRef.current) videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 10);
        } else {
            togglePlay();
        }
    };

    const formatTime = (seconds: number) => {
        if (!isFinite(seconds) || seconds < 0) return "0:00";
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
            className={`relative group bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 aspect-video ${className}`}
            onMouseEnter={() => { setShowControls(true); }}
            onMouseLeave={() => { if (isPlaying) setShowControls(false); setShowVolumeSlider(false); }}
            onMouseMove={resetControlsTimeout}
            onClick={resetControlsTimeout}
        >
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                playsInline
                preload="metadata"
                muted={isMuted}
                className="w-full h-full object-contain cursor-pointer"
                onTimeUpdate={handleTimeUpdate}
                onProgress={handleBufferProgress}
                onLoadedMetadata={() => { 
                    const dur = videoRef.current?.duration || 0;
                    setDuration(isFinite(dur) ? dur : 0); 
                    setCurrentTime(videoRef.current?.currentTime || 0);
                    setIsLoading(false);
                    setHasError(false);
                    if (videoRef.current) {
                        videoRef.current.volume = volume;
                        videoRef.current.muted = isMuted;
                    }
                }}
                onWaiting={() => setIsLoading(true)}
                onCanPlay={() => setIsLoading(false)}
                onPlaying={() => {
                    setIsPlaying(true);
                    setIsLoading(false);
                    setHasError(false);
                    lastSessionUpdate.current = Date.now();
                    if (!onPlayFiredRef.current) {
                        onPlayFiredRef.current = true;
                        if (onPlayRef.current) onPlayRef.current();
                    }
                }}
                onPause={() => {
                    setIsPlaying(false);
                    reportWatchSession();
                }}
                onEnded={() => {
                    setIsPlaying(false);
                    setProgress(100);
                    reportWatchSession();
                }}
                onClick={togglePlay}
                onDoubleClick={handleDoubleTap}
                onError={(e) => {
                    const videoError = (e.target as HTMLVideoElement).error;
                    console.error('Video Player Error:', {
                        code: videoError?.code,
                        message: videoError?.message,
                        src: src
                    });
                    setIsLoading(false);
                    setHasError(true);
                }}
                onVolumeChange={() => {
                    if (videoRef.current) {
                        setVolume(videoRef.current.volume);
                        setIsMuted(videoRef.current.muted);
                    }
                }}
                onStalled={() => {
                    // Video data is not forthcoming — show loading but don't error
                    if (!videoRef.current?.paused) setIsLoading(true);
                }}
            />

            {/* Premium Buffering Indicator */}
            <AnimatePresence>
                {isLoading && !hasError && (
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

            {/* Error State */}
            <AnimatePresence>
                {hasError && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 gap-3"
                    >
                        <p className="text-white/80 text-sm font-medium">Video failed to load</p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setHasError(false);
                                setIsLoading(true);
                                if (videoRef.current) {
                                    videoRef.current.load();
                                    videoRef.current.play().catch(() => {});
                                }
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg font-medium transition-colors"
                        >
                            Retry
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Play/Pause Large Center Icon */}
            <AnimatePresence>
                {!isPlaying && !isLoading && !hasError && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                    >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
                            <Play size={32} fill="white" className="text-white ml-1 sm:ml-2" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Gradient Overlay */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 transition-opacity duration-500 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

            {/* Bottom Controls Bar */}
            <motion.div 
                animate={{ y: showControls || !isPlaying ? 0 : 20, opacity: showControls || !isPlaying ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 z-20"
            >
                {/* Progress Bar */}
                <div className="relative w-full h-2 sm:h-1.5 bg-white/10 rounded-full mb-2 sm:mb-4 group/progress cursor-pointer">
                    {/* Buffered Bar */}
                    <div 
                        className="absolute top-0 left-0 h-full bg-white/20 rounded-full z-10 transition-all duration-300" 
                        style={{ width: `${bufferProgress}%` }}
                    />
                    {/* Playback Progress */}
                    <div 
                        className="absolute top-0 left-0 h-full bg-blue-500 rounded-full z-20" 
                        style={{ width: `${progress}%` }}
                    />
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-30"
                        style={{ WebkitAppearance: 'none', touchAction: 'manipulation' }}
                    />
                    {/* Progress handle */}
                    <div 
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-blue-500 z-30 transition-opacity opacity-0 group-hover/progress:opacity-100 pointer-events-none"
                        style={{ left: `${progress}%`, marginLeft: '-8px' }}
                    />
                </div>

                <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors p-1 min-w-[32px] min-h-[32px] flex items-center justify-center">
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                        </button>
                        
                        {/* Volume Control - click-based toggle for mobile */}
                        <div className="flex items-center gap-1 relative">
                            <button onClick={toggleMute} className="text-white hover:text-blue-400 transition-colors p-1 min-w-[32px] min-h-[32px] flex items-center justify-center">
                                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>
                            {showVolumeSlider && (
                                <div 
                                    className="flex items-center w-20 animate-in fade-in slide-in-from-left-2 duration-200"
                                    onMouseEnter={() => {
                                        if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
                                    }}
                                    onMouseLeave={() => {
                                        volumeTimeoutRef.current = window.setTimeout(() => setShowVolumeSlider(false), 2000);
                                    }}
                                    onTouchStart={() => {
                                        if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
                                    }}
                                    onTouchEnd={() => {
                                        volumeTimeoutRef.current = window.setTimeout(() => setShowVolumeSlider(false), 4000);
                                    }}
                                >
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={isMuted ? 0 : volume}
                                        onChange={handleVolumeChange}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer accent-blue-500"
                                        style={{ touchAction: 'none' }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="text-white text-[10px] sm:text-sm font-medium tabular-nums whitespace-nowrap">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-4">
                        {/* Playback Speed - hidden on very small screens */}
                        <div className="relative hidden sm:block">
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

                        <button onClick={seekBackward} className="text-white/70 hover:text-white transition-colors p-1 min-w-[32px] min-h-[32px] hidden sm:flex items-center justify-center" title="Back 10s">
                            <RotateCcw size={18} />
                        </button>
                        <button onClick={seekForward} className="text-white/70 hover:text-white transition-colors p-1 min-w-[32px] min-h-[32px] hidden sm:flex items-center justify-center" title="Forward 10s">
                            <RotateCw size={18} />
                        </button>
                        
                        <button onClick={toggleFullscreen} className="text-white hover:text-blue-400 transition-colors p-1 min-w-[32px] min-h-[32px] flex items-center justify-center">
                            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
