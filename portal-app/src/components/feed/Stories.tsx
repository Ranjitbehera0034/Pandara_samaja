import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Type, Palette } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { Story } from '../../types';

interface StoriesProps {
    stories: Story[];
    onAddStory: (file: File, textOverlay?: string, textPosition?: 'top' | 'center' | 'bottom', textColor?: string) => void;
}

const TEXT_COLORS = ['#ffffff', '#000000', '#fbbf24', '#22d3ee', '#f472b6', '#a78bfa', '#34d399'];

export function Stories({ stories, onAddStory }: StoriesProps) {
    const { member } = useAuth();
    const { t } = useLanguage();
    const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
    const [activeStoryGroup, setActiveStoryGroup] = useState<Story[] | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Text overlay editor state
    const [showEditor, setShowEditor] = useState(false);
    const [editorFile, setEditorFile] = useState<File | null>(null);
    const [editorPreview, setEditorPreview] = useState<string>('');
    const [overlayText, setOverlayText] = useState('');
    const [textPosition, setTextPosition] = useState<'top' | 'center' | 'bottom'>('center');
    const [textColor, setTextColor] = useState('#ffffff');

    // Group stories by author
    const groupedStories = stories.reduce((acc, story) => {
        if (!acc[story.authorId]) {
            acc[story.authorId] = [];
        }
        acc[story.authorId].push(story);
        return acc;
    }, {} as Record<string, Story[]>);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // If it's an image, show the text overlay editor
        if (file.type.startsWith('image')) {
            setEditorFile(file);
            setEditorPreview(URL.createObjectURL(file));
            setOverlayText('');
            setTextPosition('center');
            setTextColor('#ffffff');
            setShowEditor(true);
        } else {
            // Videos: post directly
            onAddStory(file);
        }
        e.target.value = '';
    };

    const handleEditorPost = () => {
        if (!editorFile) return;
        onAddStory(
            editorFile,
            overlayText || undefined,
            overlayText ? textPosition : undefined,
            overlayText ? textColor : undefined
        );
        setShowEditor(false);
        setEditorFile(null);
        setEditorPreview('');
    };

    const openStory = (authorId: string) => {
        const userStories = groupedStories[authorId];
        if (userStories && userStories.length > 0) {
            setActiveStoryGroup(userStories);
            setSelectedStoryIndex(0);
        }
    };

    const closeStory = () => {
        setActiveStoryGroup(null);
        setSelectedStoryIndex(null);
    };

    const nextStory = () => {
        if (activeStoryGroup && selectedStoryIndex !== null) {
            if (selectedStoryIndex < activeStoryGroup.length - 1) {
                setSelectedStoryIndex(selectedStoryIndex + 1);
            } else {
                closeStory();
            }
        }
    };

    const prevStory = () => {
        if (activeStoryGroup && selectedStoryIndex !== null && selectedStoryIndex > 0) {
            setSelectedStoryIndex(selectedStoryIndex - 1);
        }
    };

    // Auto-advance
    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (activeStoryGroup && selectedStoryIndex !== null) {
            timer = setTimeout(nextStory, 5000);
        }
        return () => clearTimeout(timer);
    }, [selectedStoryIndex, activeStoryGroup]);

    // Text overlay helper
    const getTextPositionClass = (pos: 'top' | 'center' | 'bottom') => {
        switch (pos) {
            case 'top': return 'items-start pt-16';
            case 'center': return 'items-center';
            case 'bottom': return 'items-end pb-16';
        }
    };

    const getTextSizeClass = (size: string = 'md') => {
        switch (size) {
            case 'sm': return 'text-lg';
            case 'lg': return 'text-3xl';
            default: return 'text-xl';
        }
    };

    return (
        <div className="relative mb-6">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1">
                {/* Add Story Button */}
                <div className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-16 h-16 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center relative overflow-hidden group-hover:border-blue-500 transition-colors"
                    >
                        {member?.profile_photo_url ? (
                            <img src={member.profile_photo_url} referrerPolicy="no-referrer" alt="You" className="w-full h-full object-cover opacity-50" />
                        ) : (
                            <div className="w-full h-full bg-slate-700/50" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-blue-600 rounded-full p-1 shadow-lg shadow-blue-500/50">
                                <Plus size={20} className="text-white" />
                            </div>
                        </div>
                    </div>
                    <span className="text-xs font-medium text-slate-300">{t('stories', 'addStory')}</span>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                    />
                </div>

                {/* User Stories */}
                {Object.entries(groupedStories).map(([authorId, userStories]) => {
                    const latestStory = userStories[userStories.length - 1];
                    const isSeen = userStories.every(s => s.viewed);

                    return (
                        <div
                            key={authorId}
                            onClick={() => openStory(authorId)}
                            className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"
                        >
                            <div className={`w-16 h-16 rounded-full p-[2px] ${isSeen ? 'bg-slate-600' : 'bg-gradient-to-tr from-yellow-400 via-orange-500 to-rose-500'}`}>
                                <div className="w-full h-full rounded-full border-2 border-slate-900 overflow-hidden bg-slate-800">
                                    {latestStory.authorAvatar ? (
                                        <img src={latestStory.authorAvatar} alt={latestStory.authorName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 bg-slate-700">
                                            {latestStory.authorName[0]}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className="text-xs font-medium text-slate-300 w-16 truncate text-center">
                                {latestStory.authorName.split(' ')[0]}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* ─── Story Text Overlay Editor ─── */}
            <AnimatePresence>
                {showEditor && editorPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
                        onClick={() => setShowEditor(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-sm"
                        >
                            {/* Preview */}
                            <div className="relative aspect-[9/16] rounded-2xl overflow-hidden mb-4 shadow-2xl">
                                <img
                                    src={editorPreview}
                                    alt="Story preview"
                                    className="w-full h-full object-cover"
                                />
                                {/* Text Overlay Preview */}
                                {overlayText && (
                                    <div className={`absolute inset-0 flex flex-col justify-center ${getTextPositionClass(textPosition)} px-6`}>
                                        <p
                                            className={`font-bold text-center ${getTextSizeClass('md')} leading-tight`}
                                            style={{
                                                color: textColor,
                                                textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)',
                                            }}
                                        >
                                            {overlayText}
                                        </p>
                                    </div>
                                )}
                                {/* Close */}
                                <button
                                    onClick={() => setShowEditor(false)}
                                    className="absolute top-3 right-3 p-2 bg-black/40 rounded-full text-white hover:bg-black/60"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Editor Controls */}
                            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3">
                                {/* Text input */}
                                <div className="flex items-center gap-2">
                                    <Type size={16} className="text-slate-400 shrink-0" />
                                    <input
                                        type="text"
                                        value={overlayText}
                                        onChange={(e) => setOverlayText(e.target.value)}
                                        placeholder="Add text to your story..."
                                        maxLength={80}
                                        className="flex-1 bg-slate-900/50 text-white rounded-lg px-3 py-2 text-sm border border-slate-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                                    />
                                </div>

                                {/* Text Position */}
                                {overlayText && (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold shrink-0">Position</span>
                                            <div className="flex gap-1 flex-1">
                                                {(['top', 'center', 'bottom'] as const).map(pos => (
                                                    <button
                                                        key={pos}
                                                        onClick={() => setTextPosition(pos)}
                                                        className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${textPosition === pos
                                                                ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                                                                : 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50'
                                                            }`}
                                                    >
                                                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Text Color */}
                                        <div className="flex items-center gap-2">
                                            <Palette size={14} className="text-slate-400 shrink-0" />
                                            <div className="flex gap-1.5">
                                                {TEXT_COLORS.map(color => (
                                                    <button
                                                        key={color}
                                                        onClick={() => setTextColor(color)}
                                                        className={`w-6 h-6 rounded-full border-2 transition-transform ${textColor === color ? 'border-white scale-110' : 'border-transparent'
                                                            }`}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Post button */}
                                <button
                                    onClick={handleEditorPost}
                                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-medium transition-all"
                                >
                                    Share Story
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Full Screen Story Viewer ─── */}
            <AnimatePresence>
                {activeStoryGroup && selectedStoryIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center"
                    >
                        <button
                            onClick={closeStory}
                            className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white z-50"
                        >
                            <X size={24} />
                        </button>

                        <div className="relative w-full max-w-md aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-2xl">
                            {/* Progress Bar */}
                            <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
                                {activeStoryGroup.map((_, idx) => (
                                    <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: idx < selectedStoryIndex ? '100%' : '0%' }}
                                            animate={{ width: idx === selectedStoryIndex ? '100%' : (idx < selectedStoryIndex ? '100%' : '0%') }}
                                            transition={{ duration: idx === selectedStoryIndex ? 5 : 0, ease: "linear" }}
                                            className="h-full bg-white"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Author Info */}
                            <div className="absolute top-6 left-4 flex items-center gap-3 z-20">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[1px]">
                                    <div className="w-full h-full rounded-full bg-black overflow-hidden">
                                        {activeStoryGroup[selectedStoryIndex].authorAvatar ? (
                                            <img src={activeStoryGroup[selectedStoryIndex].authorAvatar} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-bold text-xs text-white">
                                                {activeStoryGroup[selectedStoryIndex].authorName[0]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="font-semibold text-white text-sm shadow-black drop-shadow-md">
                                    {activeStoryGroup[selectedStoryIndex].authorName}
                                </span>
                                <span className="text-white/60 text-xs shadow-black drop-shadow-md">
                                    {new Date(activeStoryGroup[selectedStoryIndex].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            {/* Media */}
                            <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                {activeStoryGroup[selectedStoryIndex].mediaType === 'video' ? (
                                    <video
                                        src={activeStoryGroup[selectedStoryIndex].mediaUrl}
                                        autoPlay
                                        className="w-full h-full object-cover"
                                        onEnded={nextStory}
                                    />
                                ) : (
                                    <img
                                        src={activeStoryGroup[selectedStoryIndex].mediaUrl}
                                        alt="Story"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>

                            {/* Text Overlay on Viewer */}
                            {activeStoryGroup[selectedStoryIndex].textOverlay && (
                                <div className={`absolute inset-0 flex flex-col justify-center ${getTextPositionClass(activeStoryGroup[selectedStoryIndex].textPosition || 'center')} px-6 z-15 pointer-events-none`}>
                                    <motion.p
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className={`font-bold text-center ${getTextSizeClass(activeStoryGroup[selectedStoryIndex].textSize)} leading-tight`}
                                        style={{
                                            color: activeStoryGroup[selectedStoryIndex].textColor || '#ffffff',
                                            textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)',
                                        }}
                                    >
                                        {activeStoryGroup[selectedStoryIndex].textOverlay}
                                    </motion.p>
                                </div>
                            )}

                            {/* Controls */}
                            <div className="absolute inset-0 flex z-10">
                                <div className="w-1/2 h-full" onClick={prevStory} />
                                <div className="w-1/2 h-full" onClick={nextStory} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
