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

    const controlsTimeoutRef = useRef<number | null>(null);
    const volumeTimeoutRef = useRef<number | null>(null);

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

    // Reset state when src changes
    useEffect(() => {
        setIsPlaying(false);
        setIsLoading(true);
        setProgress(0);
        setCurrentTime(0);
        setBufferProgress(0);
        if (videoRef.current) {
            videoRef.current.load();
        }
    }, [src]);

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
        
        if (isMuted) {
            // Unmuting - restore previous volume (or default to 1)
            const newVol = volume === 0 ? 1 : volume;
            setVolume(newVol);
            setIsMuted(false);
        } else {
            setIsMuted(true);
        }
        
        // Toggle volume slider visibility on mobile (click-based instead of hover)
        setShowVolumeSlider(prev => !prev);
        if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
        volumeTimeoutRef.current = setTimeout(() => setShowVolumeSlider(false), 4000);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const val = parseFloat(e.target.value);
        setVolume(val);
        setIsMuted(val === 0);
        
        // Keep slider visible while interacting
        if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
        volumeTimeoutRef.current = setTimeout(() => setShowVolumeSlider(false), 4000);
    };

    const handleProgress = () => {
        if (!videoRef.current) return;
        
        const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setProgress(currentProgress);
        setCurrentTime(videoRef.current.currentTime);

        if (videoRef.current.buffered.length > 0) {
            const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
            const dur = videoRef.current.duration;
            if (dur > 0) {
                setBufferProgress((bufferedEnd / dur) * 100);
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const seekTime = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
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
            if (videoRef.current) videoRef.current.currentTime -= 10;
        } else if (x > (rect.width * 2) / 3) {
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
                loop
                playsInline
                preload="metadata"
                muted={isMuted}
                className="w-full h-full object-contain cursor-pointer"
                onTimeUpdate={handleProgress}
                onProgress={handleProgress}
                onLoadedMetadata={() => { 
                    setDuration(videoRef.current?.duration || 0); 
                    setCurrentTime(videoRef.current?.currentTime || 0);
                    setIsLoading(false);
                    // Ensure volume is synced after metadata loads
                    if (videoRef.current) {
                        videoRef.current.volume = volume;
                        videoRef.current.muted = isMuted;
                    }
                }}
                onWaiting={() => setIsLoading(true)}
                onPlaying={() => setIsLoading(false)}
                onClick={togglePlay}
                onDoubleClick={handleDoubleTap}
                onVolumeChange={() => {
                    // Sync React state if native controls change volume
                    if (videoRef.current) {
                        setVolume(videoRef.current.volume);
                        setIsMuted(videoRef.current.muted);
                    }
                }}
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

            {/* Play/Pause Large Center Icon */}
            <AnimatePresence>
                {!isPlaying && !isLoading && (
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
                            <div 
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${showVolumeSlider ? 'w-20 opacity-100' : 'w-0 opacity-0 sm:group-hover/volume:w-20 sm:group-hover/volume:opacity-100'}`}
                                onMouseEnter={() => {
                                    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
                                }}
                                onMouseLeave={() => {
                                    volumeTimeoutRef.current = setTimeout(() => setShowVolumeSlider(false), 2000);
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
                                    className="w-20 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer accent-blue-500"
                                    style={{ WebkitAppearance: 'none', touchAction: 'manipulation' }}
                                />
                            </div>
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
