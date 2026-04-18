import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Film, Music2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

interface UploadReelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function UploadReelModal({ isOpen, onClose, onSuccess }: UploadReelModalProps) {
    const [video, setVideo] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [musicName, setMusicName] = useState('Original Audio');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('video/')) {
                toast.error('Please select a valid video file');
                return;
            }
            if (file.size > 50 * 1024 * 1024) {
                toast.error('Video must be smaller than 50MB');
                return;
            }
            setVideo(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!video) return;

        setIsUploading(true);
        setIsSuccess(false);
        const formData = new FormData();
        formData.append('video', video);
        formData.append('caption', caption);
        formData.append('music_name', musicName);

        try {
            await api.post('/reels', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    setUploadProgress(percentCompleted);
                }
            });
            
            setIsSuccess(true);
            setTimeout(() => {
                onSuccess();
                resetForm();
            }, 1500);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to upload reel');
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setVideo(null);
        setPreviewUrl(null);
        setCaption('');
        setMusicName('Original Audio');
        setIsUploading(false);
        setUploadProgress(0);
        setIsSuccess(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[90vh] md:h-auto max-h-[90vh] md:max-h-[85vh]"
                    >
                        {/* Video Side */}
                        <div className="w-full md:w-64 aspect-[9/16] bg-black relative flex items-center justify-center border-b md:border-b-0 md:border-r border-white/10">
                            {previewUrl ? (
                                <video 
                                    src={previewUrl} 
                                    className="w-full h-full object-cover" 
                                    controls 
                                />
                            ) : (
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center gap-4 cursor-pointer hover:text-blue-400 transition-colors"
                                >
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-dashed border-white/20">
                                        <Upload size={24} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-sm">Select Video</p>
                                        <p className="text-[10px] text-white/40 mt-1">Short vertical videos work best</p>
                                    </div>
                                </div>
                            )}
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="video/*" 
                                onChange={handleFileChange} 
                            />
                        </div>

                        {/* Details Side */}
                        <div className="flex-1 p-6 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white font-bold text-xl flex items-center gap-2">
                                    <Film size={20} className="text-blue-400" />
                                    Create Reel
                                </h3>
                                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Caption</label>
                                    <textarea 
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        placeholder="Add a catchy caption..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-32"
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Music / Audio</label>
                                    <div className="relative">
                                        <Music2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                                        <input 
                                            type="text" 
                                            value={musicName}
                                            onChange={(e) => setMusicName(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            placeholder="Audio name"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-8">
                                {isUploading ? (
                                    <div className="space-y-3">
                                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${uploadProgress}%` }}
                                                className="h-full bg-blue-500"
                                            />
                                        </div>
                                        <p className="text-center text-xs font-bold text-white/40">
                                            {isSuccess ? 'Success!' : `Uploading... ${uploadProgress}%`}
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleUpload}
                                        disabled={!video}
                                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        Share Moment
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Success Overlay */}
                        <AnimatePresence>
                            {isSuccess && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center"
                                >
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', damping: 15 }}
                                    >
                                        <CheckCircle2 size={80} className="text-green-500 mb-4" />
                                    </motion.div>
                                    <h2 className="text-white font-bold text-2xl">Reel Shared!</h2>
                                    <p className="text-white/40 text-sm mt-2">Your moment is live in the community.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
