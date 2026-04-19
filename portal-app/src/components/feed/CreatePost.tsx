import { useState, useRef } from 'react';
import { Image, Video, MapPin, Send, X, AlertTriangle, Hash, BarChart, Wand2 } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { containsBannedContent } from './PostCard';
import { PollCreator } from './Poll';
import type { MediaItem, Poll } from '../../types';

interface CreatePostProps {
    onPostCreate: (content: string, media?: MediaItem[], files?: File[], poll?: Poll, location?: string) => void;
}

interface PreviewItem {
    url: string;
    type: 'image' | 'video';
    file: File;
}

export function CreatePost({ onPostCreate }: CreatePostProps) {
    const { member, user } = useAuth();
    const { t } = useLanguage();
    const [content, setContent] = useState('');
    const [previews, setPreviews] = useState<PreviewItem[]>([]);
    const [contentWarning, setContentWarning] = useState(false);
    const [showPollCreator, setShowPollCreator] = useState(false);
    const [poll, setPoll] = useState<Poll | undefined>(undefined);
    const [location, setLocation] = useState<string>('');
    const [showLocationInput, setShowLocationInput] = useState(false);
    const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
    const [activeFilter, setActiveFilter] = useState<string>('none');
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const handleContentChange = (value: string) => {
        setContent(value);
        setContentWarning(containsBannedContent(value));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        files.forEach(file => {
            // Validate video size (50MB limit)
            if (type === 'video' && file.size > 50 * 1024 * 1024) {
                toast.error('Video must be under 50MB');
                return;
            }

            const url = URL.createObjectURL(file);
            setPreviews(prev => [...prev, { url, type, file }]);
        });

        // Reset input so same file can be selected again
        e.target.value = '';
    };

    const removePreview = (index: number) => {
        setPreviews(prev => {
            URL.revokeObjectURL(prev[index].url);
            return prev.filter((_, i) => i !== index);
        });
    };

    const applyFilter = (filter: string) => {
        if (editingImageIndex === null) return;

        const preview = previews[editingImageIndex];
        const img = document.createElement('img');
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.filter = filter;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (!blob) return;
                const newFile = new File([blob], preview.file.name, { type: preview.file.type });
                const newUrl = URL.createObjectURL(newFile);

                setPreviews(prev => {
                    const newPreviews = [...prev];
                    URL.revokeObjectURL(newPreviews[editingImageIndex].url);
                    newPreviews[editingImageIndex] = { ...newPreviews[editingImageIndex], url: newUrl, file: newFile };
                    return newPreviews;
                });
                setEditingImageIndex(null);
                setActiveFilter('none');
                toast.success('Filter applied successfully!');
            }, preview.file.type);
        };
        img.src = preview.url;
    };

    const handlePost = () => {
        if (!content.trim() && previews.length === 0) return;

        if (containsBannedContent(content)) {
            toast.error('⚠️ Your post contains inappropriate content that violates community guidelines.', { duration: 5000 });
            return;
        }

        const media: MediaItem[] = previews.map(p => ({
            url: p.url,
            type: p.type,
        }));

        const files = previews.map(p => p.file);

        onPostCreate(content, media, files, poll, location);
        setContent('');
        setPreviews([]);
        setContentWarning(false);
        setPoll(undefined);
        setShowPollCreator(false);
        setLocation('');
        setShowLocationInput(false);
    };

    // Detect hashtags and mentions for highlighting
    const hasHashtags = content.includes('#');
    const hasMentions = content.includes('@');

    const displayName = user?.name || member?.name || '';
    const rawPhoto = user?.profile_photo_url || null;
    const cleanedPhoto = rawPhoto?.includes('drive.google.com/uc?id=')
        ? rawPhoto.replace('drive.google.com/uc?id=', 'lh3.googleusercontent.com/d/')
        : rawPhoto;
    const isFemale = ['female', 'f'].includes((user?.gender || '').toLowerCase());

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 mb-6 shadow-xl"
        >
            <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full overflow-hidden ring-2 ${isFemale ? 'ring-pink-500/50' : 'ring-blue-500/50'} shrink-0 flex items-center justify-center font-bold text-white shadow-lg`}>
                    {cleanedPhoto ? (
                        <img src={cleanedPhoto} referrerPolicy="no-referrer" alt={displayName}
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center ${isFemale ? 'bg-gradient-to-br from-rose-500 to-pink-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                            {displayName[0] || '?'}
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <textarea
                        value={content}
                        onChange={(e) => handleContentChange(e.target.value)}
                        placeholder={t('createPost', 'placeholder')}
                        className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none resize-none min-h-[60px] text-lg"
                    />

                    {/* Hashtag / Mention hints */}
                    {(hasHashtags || hasMentions) && (
                        <div className="flex gap-2 mt-1">
                            {hasHashtags && (
                                <span className="inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                                    <Hash size={10} /> Hashtags detected
                                </span>
                            )}
                            {hasMentions && (
                                <span className="inline-flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                                    @ Mentions detected
                                </span>
                            )}
                        </div>
                    )}

                    {contentWarning && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 mt-2">
                            <AlertTriangle size={16} className="shrink-0" />
                            <span>{t('createPost', 'contentViolation')}</span>
                        </div>
                    )}

                    {/* Media Previews */}
                    <AnimatePresence>
                        {previews.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex gap-2 overflow-x-auto pb-2 mt-3 scrollbar-thin scrollbar-thumb-slate-700"
                            >
                                {previews.map((preview, index) => (
                                    <div key={index} className="relative shrink-0 w-32 h-32 rounded-xl overflow-hidden group border border-slate-700">
                                        {preview.type === 'video' ? (
                                            <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                                                <VideoPlayer 
                                                    src={preview.url} 
                                                    className="w-full h-full" 
                                                    autoPlayEnabled={false} 
                                                />
                                                <span className="absolute top-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded font-medium z-30">
                                                    VIDEO
                                                </span>
                                            </div>
                                        ) : (
                                            <img src={preview.url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                        )}
                                        {preview.type === 'image' && (
                                            <button
                                                onClick={() => setEditingImageIndex(index)}
                                                className="absolute bottom-1 right-1 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                                                title="Edit/Filter Image"
                                            >
                                                <Wand2 size={14} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => removePreview(index)}
                                            className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Poll Creator */}
                    <AnimatePresence>
                        {showPollCreator && !poll && (
                            <PollCreator
                                onCreatePoll={(p) => { setPoll(p); setShowPollCreator(false); }}
                                onCancel={() => setShowPollCreator(false)}
                            />
                        )}
                    </AnimatePresence>

                    {/* Poll Preview */}
                    {poll && (
                        <div className="mt-3 bg-slate-900/40 border border-blue-500/20 rounded-xl p-3 relative">
                            <button
                                onClick={() => setPoll(undefined)}
                                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white"
                            >
                                <X size={14} />
                            </button>
                            <div className="flex items-center gap-2 text-sm text-blue-400 font-medium mb-2">
                                <BarChart size={14} />
                                <span>Poll: {poll.question}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {poll.options.map(opt => (
                                    <span key={opt.id} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full">
                                        {opt.text}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Location Check-in Input */}
                    <AnimatePresence>
                        {showLocationInput && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3"
                            >
                                <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700/50 rounded-xl px-3 py-2">
                                    <MapPin size={16} className="text-rose-400 shrink-0" />
                                    <input
                                        type="text"
                                        autoFocus
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Where are you? (e.g. Bhubaneswar, Odisha)"
                                        className="bg-transparent border-none outline-none text-white text-sm w-full"
                                    />
                                    <button onClick={() => { setShowLocationInput(false); setLocation(''); }} className="text-slate-400 hover:text-white">
                                        <X size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Current Location Badge */}
                    {!showLocationInput && location && (
                        <div className="mt-3 flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-full text-sm w-max">
                            <MapPin size={14} /> {location}
                            <button onClick={() => setLocation('')} className="ml-1 hover:text-white"><X size={14} /></button>
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700/50">
                        <div className="flex gap-1">
                            <button
                                onClick={() => imageInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-blue-500/10 rounded-lg text-blue-400 transition-colors text-sm"
                                title="Add Photos"
                            >
                                <Image size={18} />
                                <span className="hidden sm:inline">Photo</span>
                            </button>
                            <button
                                onClick={() => videoInputRef.current?.click()}
                                className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-green-500/10 rounded-lg text-green-400 transition-colors text-sm"
                                title="Add Video"
                            >
                                <Video size={18} />
                                <span className="hidden sm:inline">Video</span>
                            </button>
                            <button
                                onClick={() => setShowLocationInput(!showLocationInput)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${location || showLocationInput ? 'bg-rose-500/10 text-rose-400' : 'hover:bg-rose-500/10 text-rose-400'}`}
                                title="Add Location"
                            >
                                <MapPin size={18} />
                                <span className="hidden sm:inline">Check In</span>
                            </button>
                            <button
                                onClick={() => setShowPollCreator(!showPollCreator)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm ${showPollCreator || poll ? 'bg-amber-500/10 text-amber-400' : 'hover:bg-amber-500/10 text-amber-400'}`}
                                title="Add Poll"
                            >
                                <BarChart size={18} />
                                <span className="hidden sm:inline">Poll</span>
                            </button>

                            <input
                                type="file"
                                ref={imageInputRef}
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleFileSelect(e, 'image')}
                            />
                            <input
                                type="file"
                                ref={videoInputRef}
                                className="hidden"
                                accept="video/mp4,video/webm,video/quicktime"
                                onChange={(e) => handleFileSelect(e, 'video')}
                            />
                        </div>
                        <button
                            onClick={handlePost}
                            disabled={!content.trim() && previews.length === 0 && !poll}
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-full shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                        >
                            <span>{t('createPost', 'post')}</span>
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Filter Modal */}
            <AnimatePresence>
                {editingImageIndex !== null && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-800 rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full"
                        >
                            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                                    <Wand2 size={18} className="text-blue-400" /> Apply Filter
                                </h3>
                                <button onClick={() => setEditingImageIndex(null)} className="p-2 -mr-2 text-slate-400 hover:text-white rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 bg-black/50 flex justify-center items-center min-h-[300px]">
                                <img
                                    src={previews[editingImageIndex]?.url}
                                    className="max-w-full max-h-[400px] object-contain rounded-lg shadow-black/50 shadow-2xl transition-all duration-300"
                                    style={{ filter: activeFilter }}
                                    alt="Filter Preview"
                                />
                            </div>

                            <div className="p-4 border-t border-slate-700">
                                <p className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Choose a filter</p>
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                                    {[
                                        { name: 'Normal', filter: 'none' },
                                        { name: 'Grayscale', filter: 'grayscale(100%)' },
                                        { name: 'Sepia', filter: 'sepia(100%)' },
                                        { name: 'Invert', filter: 'invert(100%)' },
                                        { name: 'High Contrast', filter: 'contrast(150%) brightness(110%)' },
                                        { name: 'Vintage', filter: 'sepia(50%) hue-rotate(-30deg) saturate(140%) contrast(110%)' },
                                        { name: 'Cool', filter: 'hue-rotate(180deg)' }
                                    ].map(f => (
                                        <button
                                            key={f.name}
                                            onClick={() => setActiveFilter(f.filter)}
                                            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeFilter === f.filter ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                                        >
                                            {f.name}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => applyFilter(activeFilter)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30 w-full"
                                    >
                                        Apply & Save
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
