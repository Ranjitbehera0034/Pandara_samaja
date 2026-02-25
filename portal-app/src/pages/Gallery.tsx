import { useState, useEffect, useRef } from 'react';
import type { Photo } from '../types';
import { Loader2, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';

const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api/portal' : 'https://pandara-samaja-backend.onrender.com/api/portal') + '' : 'https://pandara-samaja-backend.onrender.com/api/portal';

export default function Gallery() {
    const { t } = useLanguage();
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        fetchPhotos();
    }, []);

    const getToken = () => localStorage.getItem('portalToken');

    const fetchPhotos = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/photos`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch photos');

            const data = await response.json();
            if (data.success) {
                setPhotos(data.photos);
            }
        } catch (error) {
            console.error(error);
            toast.error(t('gallery', 'failedLoad'));
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await handleUpload(e.target.files);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleUpload(e.dataTransfer.files);
        }
    };

    const handleUpload = async (files: FileList) => {
        const token = getToken();
        if (!token) return;

        setUploading(true);
        const formData = new FormData();

        // Append all files
        Array.from(files).forEach((file) => {
            formData.append('photos', file);
        });

        try {
            const response = await fetch(`${API_BASE_URL}/photos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Upload failed');

            setPhotos(prev => [...data.photos, ...prev]);
            toast.success(`${t('gallery', 'successUpload')} ${data.photos.length} ${t('gallery', 'photos')}`);

            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || t('gallery', 'failedUpload'));
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (photoId: string) => {
        if (!confirm(t('gallery', 'deleteConfirm'))) return;

        const token = getToken();
        if (!token) return;

        setDeleteLoading(photoId);

        try {
            const response = await fetch(`${API_BASE_URL}/photos/${photoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete photo');

            setPhotos(prev => prev.filter(p => p.id !== photoId));
            toast.success(t('gallery', 'photoDeleted'));
        } catch (error) {
            toast.error(t('gallery', 'failedDelete'));
        } finally {
            setDeleteLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t('gallery', 'title')}</h1>
                    <p className="text-slate-400">{t('gallery', 'subtitle')}</p>
                </div>

                <div className="relative">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
                        <span>{t('gallery', 'uploadPhotos')}</span>
                    </button>
                </div>
            </div>

            {/* Drag & Drop Zone */}
            <div
                className={`border-2 border-dashed rounded-2xl mb-8 p-12 text-center transition-colors ${dragActive
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700 hover:border-slate-500"
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="flex flex-col items-center gap-4 cursor-pointer">
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                        {uploading ? <Loader2 className="animate-spin" size={32} /> : <Image size={32} />}
                    </div>
                    <div>
                        <p className="text-lg font-medium text-white">
                            {uploading ? t('gallery', 'uploading') : t('gallery', 'dragDrop')}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            {t('gallery', 'supportsFormats')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Gallery Grid */}
            {photos.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50 border-dashed">
                    <ImageIcon className="mx-auto h-12 w-12 text-slate-600 mb-4" />
                    <h3 className="text-lg font-medium text-white">{t('gallery', 'noPhotos')}</h3>
                    <p className="text-slate-400">{t('gallery', 'uploadToShare')}</p>
                </div>
            ) : (
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                    {photos.map((photo) => (
                        <div key={photo.id} className="relative group break-inside-avoid rounded-xl overflow-hidden bg-slate-800">
                            <img
                                src={photo.url}
                                alt={photo.caption || "Gallery photo"}
                                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <p className="text-xs text-slate-300 mb-2">
                                    {new Date(photo.created_at).toLocaleDateString()}
                                </p>
                                <div className="flex justify-end">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(photo.id);
                                        }}
                                        disabled={deleteLoading === photo.id}
                                        className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors backdrop-blur-sm"
                                        title={t('gallery', 'deletePhoto')}
                                    >
                                        {deleteLoading === photo.id ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Helper component for Icon
function Image({ size, className }: { size?: number, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    )
}
