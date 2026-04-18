import { useState, useEffect } from 'react';
import { 
    Film, Search, Trash2, Eye, 
    Share2, Plus, ArrowUpRight, User
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';
import { VideoPlayer } from '../components/common/VideoPlayer';

interface Reel {
    id: string;
    author_id: string;
    author_name: string;
    author_photo?: string;
    video_url: string;
    caption: string;
    views_count: number;
    shares_count: number;
    likes_count: number;
    created_at: string;
}

export default function Reels() {
    const [reels, setReels] = useState<Reel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReel, setSelectedReel] = useState<Reel | null>(null);

    useEffect(() => {
        fetchReels();
    }, []);

    const fetchReels = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/reels');
            setReels(data.reels);
        } catch (error) {
            toast.error('Failed to fetch reels');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this reel? This action cannot be undone.')) return;
        try {
            await api.delete(`/reels/${id}`);
            setReels(prev => prev.filter(r => r.id !== id));
            if (selectedReel?.id === id) setSelectedReel(null);
            toast.success('Reel deleted successfully');
        } catch (error) {
            toast.error('Failed to delete reel');
        }
    };

    const filteredReels = reels.filter(r => 
        r.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.author_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Film className="text-blue-500" />
                        Reels Management
                    </h1>
                    <p className="text-slate-500 text-sm">Moderate community short videos and post official highlights.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Search by caption or author..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
                {/* Reels Grid */}
                <div className="flex-1 overflow-auto pr-2">
                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {[1,2,3,4,5,6].map(i => (
                                <div key={i} className="aspect-[9/16] bg-white dark:bg-slate-800 animate-pulse rounded-2xl" />
                            ))}
                        </div>
                    ) : filteredReels.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                            <Film size={48} className="mb-4 opacity-20" />
                            <p>No reels found matching your search.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filteredReels.map(reel => (
                                <div 
                                    key={reel.id}
                                    onClick={() => setSelectedReel(reel)}
                                    className={`group relative aspect-[9/16] bg-slate-900 rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${selectedReel?.id === reel.id ? 'border-blue-500 shadow-xl scale-[0.98]' : 'border-transparent'}`}
                                >
                                    <video src={reel.video_url} className="w-full h-full object-cover" />
                                    
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 transition-opacity">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden shrink-0 border border-white/20">
                                                {reel.author_photo && <img src={reel.author_photo} className="w-full h-full object-cover" />}
                                            </div>
                                            <span className="text-white text-[10px] font-bold truncate">{reel.author_name}</span>
                                        </div>
                                        <p className="text-white/80 text-[10px] line-clamp-2 leading-tight">{reel.caption}</p>
                                        
                                        <div className="flex items-center gap-3 mt-2 text-[10px] text-white/60">
                                            <span className="flex items-center gap-1"><Eye size={10} /> {reel.views_count}</span>
                                            <span className="flex items-center gap-1"><Share2 size={10} /> {reel.shares_count}</span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(reel.id); }}
                                        className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Inspector Panel */}
                <div className="w-full md:w-80 shrink-0">
                    {selectedReel ? (
                        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col h-full overflow-auto">
                            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Plus className="text-blue-500" size={18} />
                                Reel Review
                            </h2>

                            <div className="aspect-[9/16] bg-black rounded-2xl overflow-hidden mb-6 ring-1 ring-slate-200 dark:ring-slate-700">
                                <VideoPlayer src={selectedReel.video_url} />
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Metrics</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <p className="text-slate-400 text-[10px] mb-1">Views</p>
                                            <p className="font-bold text-lg">{selectedReel.views_count}</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <p className="text-slate-400 text-[10px] mb-1">Shares</p>
                                            <p className="font-bold text-lg">{selectedReel.shares_count}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Author Info</label>
                                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl">
                                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                                            {selectedReel.author_photo ? (
                                                <img src={selectedReel.author_photo} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <User size={20} />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm truncate">{selectedReel.author_name}</p>
                                            <p className="text-[10px] text-slate-500">Member ID: {selectedReel.author_id}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Caption</label>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                                        {selectedReel.caption || <span className="italic opacity-50">No caption provided</span>}
                                    </p>
                                </div>

                                <div className="pt-4 mt-auto">
                                    <button 
                                        onClick={() => handleDelete(selectedReel.id)}
                                        className="w-full py-4 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 font-bold rounded-2xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={18} />
                                        Delete Reel
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-500 p-8 text-center">
                            <ArrowUpRight size={32} className="mb-4 opacity-10" />
                            <p className="text-sm">Select a reel from the grid to review its details and performance metrics.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
