import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
    ArrowLeft, Plus, Image, X, Upload, Lock,
    Calendar, Trash2, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { PORTAL_API_URL, API_BASE_URL } from '../config/apiConfig';

// ─── Types ───────────────────────────────────────────
interface AlbumPhoto {
    id: string;
    url: string;
    caption?: string;
    uploadedBy: string;
    uploadedAt: string;
}

interface FamilyAlbum {
    id: string;
    title: string;
    description: string;
    coverUrl: string;
    photos: AlbumPhoto[];
    createdAt: string;
    isPrivate: boolean;
}



export default function FamilyAlbums() {
    const { member } = useAuth();
    const [albums, setAlbums] = useState<FamilyAlbum[]>([]);
    const [selectedAlbum, setSelectedAlbum] = useState<FamilyAlbum | null>(null);
    const [viewingPhoto, setViewingPhoto] = useState<AlbumPhoto | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newAlbumTitle, setNewAlbumTitle] = useState('');
    const [newAlbumDesc, setNewAlbumDesc] = useState('');

    useEffect(() => {
        fetchAlbums();
    }, []);

    const fetchAlbums = async () => {
        try {
            const res = await fetch(`${PORTAL_API_URL}/family/albums`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('portalToken')}` }
            });
            const data = await res.json();
            if (data.success) {
                const fetchedAlbums = data.albums.map((a: any) => ({
                    id: a.id.toString(),
                    title: a.title,
                    description: a.description,
                    coverUrl: a.cover_url ? `${API_BASE_URL}/${a.cover_url}` : '',
                    photos: a.photos.map((p: any) => ({
                        ...p,
                        id: p.id.toString(),
                        url: `${API_BASE_URL}/${p.url}`,
                        uploadedBy: 'Family Member',
                        uploadedAt: new Date(p.uploadedAt).toISOString().split('T')[0]
                    })),
                    createdAt: new Date(a.created_at).toISOString().split('T')[0],
                    isPrivate: true
                }));
                setAlbums(fetchedAlbums);

                if (selectedAlbum) {
                    const updated = fetchedAlbums.find((fa: any) => fa.id === selectedAlbum.id);
                    if (updated) setSelectedAlbum(updated);
                }
            }
        } catch (e) {
            console.error('Error fetching albums:', e);
            toast.error('Failed to load family albums');
        }
    };

    const [newAlbumCover, setNewAlbumCover] = useState<File | null>(null);

    const handleCreateAlbum = async () => {
        if (!newAlbumTitle.trim()) { toast.error('Please enter an album title'); return; }
        try {
            const formData = new FormData();
            formData.append('title', newAlbumTitle);
            formData.append('description', newAlbumDesc);
            if (newAlbumCover) {
                formData.append('cover', newAlbumCover);
            }

            const res = await fetch(`${PORTAL_API_URL}/family/albums`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('portalToken')}`
                },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                fetchAlbums();
                setNewAlbumTitle('');
                setNewAlbumDesc('');
                setNewAlbumCover(null);
                setShowCreateModal(false);
                toast.success('Album created!');
            }
        } catch (e) {
            toast.error('Failed to create album');
        }
    };

    const handleAddPhoto = async (albumId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const formData = new FormData();
        files.forEach(file => formData.append('photos', file));

        try {
            const res = await fetch(`${PORTAL_API_URL}/family/albums/${albumId}/photos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('portalToken')}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                fetchAlbums();
                toast.success(`${files.length} photo(s) added!`);
            }
        } catch (e) {
            toast.error('Failed to upload photos');
        }
        e.target.value = '';
    };

    const handleDeleteAlbum = async (albumId: string) => {
        if (!confirm('Are you sure you want to delete this album?')) return;
        try {
            const res = await fetch(`${PORTAL_API_URL}/family/albums/${albumId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('portalToken')}` }
            });
            const data = await res.json();
            if (data.success) {
                setAlbums(prev => prev.filter(a => a.id !== albumId));
                if (selectedAlbum?.id === albumId) setSelectedAlbum(null);
                toast.success('Album deleted');
            }
        } catch (e) {
            toast.error('Failed to delete album');
        }
    };

    // ─── Album Detail View ───────────────────────────
    if (selectedAlbum) {
        return (
            <div className="max-w-4xl mx-auto pb-20 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <button onClick={() => setSelectedAlbum(null)} className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-2">
                            <ArrowLeft size={16} /> Back to Albums
                        </button>
                        <h1 className="text-2xl font-bold text-white">{selectedAlbum.title}</h1>
                        <p className="text-slate-400 text-sm mt-1">{selectedAlbum.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedAlbum.isPrivate && (
                            <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full font-medium">
                                <Lock size={12} /> Family Only
                            </span>
                        )}
                        <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors">
                            <Upload size={16} /> Add Photos
                            <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleAddPhoto(selectedAlbum.id, e)} />
                        </label>
                    </div>
                </div>

                {/* Photo Grid */}
                {selectedAlbum.photos.length === 0 ? (
                    <div className="text-center py-16 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                        <Image size={48} className="text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 mb-4">This album is empty. Add your first photo!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedAlbum.photos.map(photo => (
                            <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative aspect-square rounded-xl overflow-hidden cursor-pointer group border border-slate-700/30"
                                onClick={() => setViewingPhoto(photo)}
                            >
                                <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                    <div>
                                        {photo.caption && <p className="text-white text-sm font-medium">{photo.caption}</p>}
                                        <p className="text-white/60 text-xs mt-0.5">by {photo.uploadedBy}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Photo Lightbox */}
                <AnimatePresence>
                    {viewingPhoto && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                            onClick={() => setViewingPhoto(null)}
                        >
                            <button className="absolute top-4 right-4 p-2 text-white/60 hover:text-white rounded-full bg-white/10" onClick={() => setViewingPhoto(null)}>
                                <X size={24} />
                            </button>
                            <motion.img
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                src={viewingPhoto.url}
                                alt={viewingPhoto.caption}
                                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            />
                            <div className="absolute bottom-6 left-0 right-0 text-center">
                                {viewingPhoto.caption && <p className="text-white font-medium">{viewingPhoto.caption}</p>}
                                <p className="text-white/50 text-sm mt-1">Uploaded by {viewingPhoto.uploadedBy} on {viewingPhoto.uploadedAt}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // ─── Album Grid View ─────────────────────────────
    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link to="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-2">
                        <ArrowLeft size={16} /> Back to Profile
                    </Link>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-rose-400">
                        Family Photo Albums
                    </h1>
                    <p className="text-slate-400 mt-1">
                        {member?.name}&apos;s family • {albums.length} albums
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} /> New Album
                </button>
            </div>

            {/* Albums Grid */}
            {albums.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                    <Image size={48} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 mb-4">No family albums yet.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium inline-flex items-center gap-2 transition-colors"
                    >
                        <Plus size={16} /> Create First Album
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {albums.map(album => (
                        <motion.div
                            key={album.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden hover:bg-slate-800 transition-colors group cursor-pointer"
                            onClick={() => setSelectedAlbum(album)}
                        >
                            {/* Cover Image */}
                            <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                                {album.coverUrl ? (
                                    <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Image size={48} className="text-slate-700" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                {/* Photo count badge */}
                                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1.5 rounded-lg">
                                    <Eye size={12} /> {album.photos.length}
                                </div>

                                {album.isPrivate && (
                                    <div className="absolute top-3 right-3 p-1.5 bg-amber-500/80 backdrop-blur-md rounded-full">
                                        <Lock size={12} className="text-white" />
                                    </div>
                                )}

                                {/* Delete button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album.id); }}
                                    className="absolute top-3 left-3 p-1.5 bg-red-500/60 hover:bg-red-500 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>

                            {/* Info */}
                            <div className="p-4">
                                <h3 className="font-semibold text-white text-lg group-hover:text-blue-400 transition-colors">{album.title}</h3>
                                <p className="text-sm text-slate-400 mt-1 line-clamp-1">{album.description}</p>
                                <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                                    <Calendar size={12} /> {album.createdAt}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Create Album Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-700/50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white">Create New Album</h2>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-white rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">Album Title</label>
                                    <input
                                        type="text"
                                        value={newAlbumTitle}
                                        onChange={(e) => setNewAlbumTitle(e.target.value)}
                                        placeholder="e.g. Family Trip 2026"
                                        className="w-full bg-slate-900/50 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">Description</label>
                                    <textarea
                                        value={newAlbumDesc}
                                        onChange={(e) => setNewAlbumDesc(e.target.value)}
                                        placeholder="Brief description of this album..."
                                        rows={3}
                                        className="w-full bg-slate-900/50 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">Cover Photo (Optional)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setNewAlbumCover(e.target.files?.[0] || null)}
                                        className="w-full text-slate-400 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-500 hover:file:bg-blue-500/20 transition-colors"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleCreateAlbum}
                                className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                            >
                                Create Album
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
