import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api' : 'https://pandara-samaja-backend.onrender.com/api';

export default function Announcements() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const getToken = () => localStorage.getItem("portalToken");

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE_URL}/posts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch announcements');
            const data = await response.json();
            setPosts(data);
        } catch (error) {
            toast.error('Could not load announcements');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-10 text-slate-400">Loading announcements...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold text-white mb-2">Official Announcements</h1>
                <p className="text-slate-400">News, updates, and blogs directly from the community admins.</p>
            </motion.div>

            {posts.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                    <MessageSquare size={48} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-lg font-medium text-slate-300">No Announcements Yet</h3>
                    <p className="text-slate-500 mt-1">Check back later for updates from the admins.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {posts.map((post, i) => (
                        <motion.article
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={post.id}
                            className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden hover:border-blue-500/30 transition-colors shadow-lg shadow-black/20"
                        >
                            {post.image_url && (
                                <div className="w-full h-64 sm:h-80 relative bg-slate-900 border-b border-slate-700">
                                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-3 text-sm text-blue-400 font-medium mb-3">
                                    <Calendar size={16} />
                                    <time>{new Date(post.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}</time>
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-4 leading-snug">{post.title}</h2>
                                <div className="prose prose-invert prose-blue max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {post.content}
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>
            )}
        </div>
    );
}
