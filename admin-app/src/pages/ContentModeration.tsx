import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Trash2, Globe, Clock } from 'lucide-react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export default function ContentModeration() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'reported' | 'all' | 'banned'>('reported');
    const [reports, setReports] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);
    const [bannedWords, setBannedWords] = useState<any[]>([]);
    const [newWord, setNewWord] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (activeTab === 'reported') {
            fetchReports();
        } else if (activeTab === 'all') {
            fetchPosts();
        } else {
            fetchBannedWords();
        }
    }, [activeTab]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/posts/reported');
            if (res.data.success) {
                setReports(res.data.reports);
            }
        } catch (error) {
            toast.error('Failed to load reported posts');
        } finally {
            setLoading(false);
        }
    };

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/posts');
            if (res.data.success) {
                setPosts(res.data.posts);
            }
        } catch (error) {
            toast.error('Failed to load feed posts');
        } finally {
            setLoading(false);
        }
    };

    const fetchBannedWords = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/banned-words');
            if (res.data.success) {
                setBannedWords(res.data.words);
            }
        } catch (error) {
            toast.error('Failed to load banned words');
        } finally {
            setLoading(false);
        }
    };

    const handleAddBannedWord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWord.trim()) return;
        try {
            const res = await api.post('/admin/banned-words', { word: newWord });
            if (res.data.success) {
                toast.success('Word added to banned list');
                setNewWord('');
                fetchBannedWords();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to add word');
        }
    };

    const handleDeleteBannedWord = async (id: number) => {
        try {
            await api.delete(`/admin/banned-words/${id}`);
            toast.success('Word removed from banned list');
            setBannedWords(bannedWords.filter(w => w.id !== id));
        } catch (error) {
            toast.error('Failed to remove word');
        }
    };

    const handleDismissReport = async (reportId: number) => {
        try {
            await api.delete(`/admin/reports/${reportId}/dismiss`);
            toast.success('Report dismissed');
            setReports(reports.filter(r => r.report_id !== reportId));
        } catch (error) {
            toast.error('Failed to dismiss report');
        }
    };

    const handleDeletePost = async (postId: number) => {
        if (!window.confirm('Are you sure you want to permanently delete this post?')) return;
        try {
            await api.delete(`/admin/posts/${postId}`);
            toast.success('Post permanently deleted');
            if (activeTab === 'reported') {
                setReports(reports.filter(r => r.post_id !== postId));
            } else {
                setPosts(posts.filter(p => p.id !== postId));
            }
        } catch (error) {
            toast.error('Failed to delete post');
        }
    };

    return (
        <div className="p-8 pb-32 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Shield className="text-red-500" size={32} />
                        {t('content_moderation')}
                    </h1>
                    <p className="text-slate-500 mt-1">Review reported posts, comments, stories, and polls.</p>
                </div>
            </div>

            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mb-6">
                <button
                    onClick={() => setActiveTab('reported')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'reported' ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    {t('reports_queue')} {activeTab === 'reported' && reports.length > 0 ? `(${reports.length})` : ''}
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'all' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    {t('all_feed_content')}
                </button>
                <button
                    onClick={() => setActiveTab('banned')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'banned' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    {t('banned_words_filter')}
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading moderations...</p>
                </div>
            ) : activeTab === 'reported' && reports.length === 0 ? (
                <div className="bg-white border text-center border-slate-200 py-20 rounded-2xl border-dashed">
                    <AlertTriangle className="text-slate-300 mx-auto mb-4" size={48} />
                    <h3 className="text-lg font-medium text-slate-900">Moderation Queue is Clear</h3>
                    <p className="text-slate-500 mt-1">There are no reported items needing your attention right now.</p>
                </div>
            ) : activeTab === 'all' && posts.length === 0 ? (
                <div className="bg-white border text-center border-slate-200 py-20 rounded-2xl border-dashed">
                    <Globe className="text-slate-300 mx-auto mb-4" size={48} />
                    <h3 className="text-lg font-medium text-slate-900">No Posts Content</h3>
                    <p className="text-slate-500 mt-1">The community feed is currently empty.</p>
                </div>
            ) : activeTab === 'banned' ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Banned Words Filter</h3>
                    <p className="text-sm text-slate-500 mb-6">Any post or comment containing these words will be automatically blocked from being published.</p>

                    <form onSubmit={handleAddBannedWord} className="flex gap-4 mb-8">
                        <input
                            type="text"
                            value={newWord}
                            onChange={(e) => setNewWord(e.target.value)}
                            placeholder="Enter a word to block..."
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <button type="submit" className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                            Add Word
                        </button>
                    </form>

                    {bannedWords.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            No banned words defined yet.
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {bannedWords.map(word => (
                                <div key={word.id} className="flex items-center gap-2 pl-4 pr-2 py-2 bg-red-50 text-red-700 border border-red-100 rounded-lg">
                                    <span className="font-medium">{word.word}</span>
                                    <button
                                        onClick={() => handleDeleteBannedWord(word.id)}
                                        className="p-1 hover:bg-red-100 rounded-md transition-colors"
                                    >
                                        <Trash2 size={14} className="text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {(activeTab === 'reported' ? reports : posts).map((item) => (
                        <div key={activeTab === 'reported' ? item.report_id : item.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">

                            {/* Report Header (if applicable) */}
                            {activeTab === 'reported' && (
                                <div className="bg-red-50 border-b border-red-100 p-4 flex flex-col sm:flex-row justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-red-700 font-semibold mb-1">
                                            <AlertTriangle size={18} />
                                            Reported by {item.reporter_name || item.reporter_membership_no}
                                        </div>
                                        <div className="text-red-600 text-sm">
                                            <span className="font-medium mr-2">Reason:</span>"{item.reason}"
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <button
                                            onClick={() => handleDismissReport(item.report_id)}
                                            className="px-4 py-2 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
                                        >
                                            <CheckCircle size={16} className="text-green-500" /> Dismiss
                                        </button>
                                        <button
                                            onClick={() => handleDeletePost(item.post_id)}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm shadow-red-500/20 flex items-center gap-2"
                                        >
                                            <Trash2 size={16} /> Delete Post
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Default Header (All Posts Tab) */}
                            {activeTab === 'all' && (
                                <div className="bg-slate-50 border-b border-slate-100 p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <Clock size={16} />
                                        {new Date(item.created_at).toLocaleString()}
                                    </div>
                                    <button
                                        onClick={() => handleDeletePost(item.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                        title="Delete Post"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}

                            <div className="p-6">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                        {item.author_photo ? (
                                            <img src={item.author_photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                                                {item.author_name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{item.author_name}</div>
                                        <div className="text-sm text-slate-500">ID: {item.author_membership_no || item.author_id}</div>
                                    </div>
                                </div>
                                <div className="text-slate-700 whitespace-pre-wrap leading-relaxed mb-4">
                                    {item.text_content}
                                </div>
                                {(item.images && item.images.length > 0) && (
                                    <div className={`grid gap-2 mt-4 ${item.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        {item.images.map((img: string, i: number) => (
                                            <img key={i} src={img} alt="" className="rounded-xl border border-slate-200 max-h-64 object-cover w-full" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
