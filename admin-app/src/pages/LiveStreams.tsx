import { useState, useEffect, useCallback } from 'react';
import { Video, Plus, Trash2, Power, PowerOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '../context/AdminAuthContext';
import { API_BASE_URL } from '../config/apiConfig';

const ADMIN_API_URL = `${API_BASE_URL}/admin`;

interface LiveStream {
    id: string;
    title: string;
    description: string;
    stream_url: string;
    is_active: boolean;
    created_at: string;
    creator_name?: string;
}

export default function LiveStreams() {
    const { token } = useAdminAuth();
    const [streams, setStreams] = useState<LiveStream[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    
    // form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [streamUrl, setStreamUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchStreams = useCallback(async () => {
        try {
            const res = await fetch(`${ADMIN_API_URL}/live-streams`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setStreams(data.streams || []);
            }
        } catch (_e) {
            toast.error("Failed to fetch live streams");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchStreams();
    }, [fetchStreams]);

    const handleCreateStream = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !streamUrl) {
            toast.error("Title and Stream URL are required");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch(`${ADMIN_API_URL}/live-streams`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, description, stream_url: streamUrl })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Live stream created successfully! By default it is LIVE. You can pause it anytime.");
                setShowAddModal(false);
                setTitle('');
                setDescription('');
                setStreamUrl('');
                fetchStreams();
            } else {
                toast.error(data.message || "Failed to create stream");
            }
        } catch (_e) {
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`${ADMIN_API_URL}/live-streams/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_active: !currentStatus })
            });
            const data = await res.json();
            if (data.success) {
                toast.success(!currentStatus ? "Stream is now LIVE!" : "Stream ended.");
                fetchStreams();
            }
        } catch (_e) {
            toast.error("Failed to update status");
        }
    };

    const deleteStream = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this stream?")) return;
        try {
            const res = await fetch(`${ADMIN_API_URL}/live-streams/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Stream deleted");
                fetchStreams();
            }
        } catch (_e) {
            toast.error("Failed to delete");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Video className="text-blue-500" /> Live Streams
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1 text-sm bg-blue-50/50 dark:bg-blue-900/10 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        Securely broadcast Unlisted YouTube/Facebook streams strictly internal to portal members.
                    </p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                    <Plus size={20} /> Add Stream
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Title & Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Platform Link</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Created At</th>
                                <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {streams.map(stream => (
                                <tr key={stream.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                            {stream.title}
                                            {stream.is_active && (
                                                <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_4px_#dc2626]"></span> LIVE
                                                </span>
                                            )}
                                            {!stream.is_active && (
                                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                    Ended/Paused
                                                </span>
                                            )}
                                        </div>
                                        {stream.description && <p className="text-xs text-slate-500 mt-1 truncate max-w-xs">{stream.description}</p>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <a href={stream.stream_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline text-sm font-mono truncate max-w-[200px] block">
                                            {stream.stream_url}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                        {new Date(stream.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => toggleStatus(stream.id, stream.is_active)}
                                                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium border ${stream.is_active ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-900/30' : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/30'}`}
                                                title={stream.is_active ? "End Stream" : "Go Live"}
                                            >
                                                {stream.is_active ? <><PowerOff size={14} /> End Stream</> : <><Power size={14} /> Go Live</>}
                                            </button>
                                            <button 
                                                onClick={() => deleteStream(stream.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {streams.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        No live streams found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-slate-200 dark:border-slate-800">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                <Video size={18} className="text-blue-500" /> Start Live Stream
                            </h2>
                        </div>
                        <form onSubmit={handleCreateStream} className="p-6 space-y-4 text-left">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded-xl flex gap-3 leading-relaxed">
                                <span className="text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</span>
                                <span>
                                    <strong>Content Moderation:</strong> To ensure community safety, always host streams using Unlisted YouTube/Facebook links. Their built-in AI will automatically block explicit content, maintaining portal security.
                                </span>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Stream Title</label>
                                <input type="text" required value={title} onChange={e=>setTitle(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400" placeholder="e.g. Monthly Community QA" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Stream URL</label>
                                <input type="url" required value={streamUrl} onChange={e=>setStreamUrl(e.target.value)} className="w-full border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 font-mono text-sm" placeholder="https://youtu.be/..." />
                            </div>
                            <div className="pt-4 flex gap-3 justify-end">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center gap-2 active:scale-95">
                                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Video size={18} />} Go Live Now
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
