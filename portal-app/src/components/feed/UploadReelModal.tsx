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
    const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'saving' | 'done'>('idle');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const xhrRef = useRef<XMLHttpRequest | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('video/')) {
                toast.error('Please select a valid video file');
                return;
            }
            setVideo(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!video) return;

        setIsUploading(true);
        setUploadProgress(0);
        setUploadStage('uploading');

        try {
            // Step 1: Get a signed upload URL from the backend
            const { data } = await api.get('/reels/upload-url', {
                params: {
                    filename: video.name,
                    contentType: video.type,
                }
            });

            const { uploadUrl, storagePath } = data;

            // Step 2: Upload video directly to Firebase Storage via XHR
            // (XHR gives us upload progress; fetch does not)
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhrRef.current = xhr;

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const pct = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(pct);
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed: ${xhr.statusText}`));
                    }
                };

                xhr.onerror = () => reject(new Error('Network error during upload'));
                xhr.onabort = () => reject(new Error('Upload cancelled'));

                xhr.open('PUT', uploadUrl);
                xhr.setRequestHeader('Content-Type', video.type);
                xhr.send(video);
            });

            // Step 3: Tell the backend to save the reel record
            setUploadStage('saving');
            await api.post('/reels', {
                storagePath,
                caption,
                music_name: musicName,
            });

            setUploadStage('done');
            setTimeout(() => {
                onSuccess();
                resetForm();
            }, 1500);

        } catch (error: any) {
            if (error.message === 'Upload cancelled') return; // user cancelled
            toast.error(error.response?.data?.message || error.message || 'Failed to upload reel');
            setIsUploading(false);
            setUploadStage('idle');
        }
    };

    const handleCancel = () => {
        xhrRef.current?.abort();
        setIsUploading(false);
        setUploadStage('idle');
        setUploadProgress(0);
    };

    const resetForm = () => {
        setVideo(null);
        setPreviewUrl(null);
        setCaption('');
        setMusicName('Original Audio');
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStage('idle');
    };

    const stageLabel = {
        idle: '',
        uploading: `Uploading to Firebase... ${uploadProgress}%`,
        saving: 'Saving reel...',
        done: 'Success! 🎉',
    }[uploadStage];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={isUploading ? undefined : onClose}
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
                                        <p className="text-[10px] text-white/40 mt-1">Any size • Short vertical videos work best</p>
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
                                <button onClick={isUploading ? undefined : onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
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
                                                animate={{ width: uploadStage === 'saving' ? '100%' : `${uploadProgress}%` }}
                                                className={`h-full rounded-full ${uploadStage === 'done' ? 'bg-green-500' : 'bg-blue-500'}`}
                                            />
                                        </div>
                                        <p className="text-center text-xs font-bold text-white/60">{stageLabel}</p>
                                        {uploadStage === 'uploading' && (
                                            <button
                                                onClick={handleCancel}
                                                className="w-full py-2 text-xs text-white/40 hover:text-red-400 transition-colors"
                                            >
                                                Cancel Upload
                                            </button>
                                        )}
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
                            {uploadStage === 'done' && (
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
