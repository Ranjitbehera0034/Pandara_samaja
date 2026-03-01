import { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function Posts() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [postId, setPostId] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/posts');
            if (res.data && res.data.success && Array.isArray(res.data.posts)) {
                setPosts(res.data.posts);
            } else if (Array.isArray(res.data)) {
                setPosts(res.data);
            } else {
                setPosts([]);
            }
        } catch (e) {
            toast.error('Failed to load posts');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setPostId('');
        setTitle('');
        setContent('');
        setImageFile(null);
        setImagePreview('');
        setIsModalOpen(true);
    };

    const openEditModal = (p: any) => {
        setIsEditing(true);
        setPostId(p.id);
        setTitle(p.title);
        setContent(p.content);
        setImageFile(null);
        setImagePreview(p.image_url || '');
        setIsModalOpen(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };



    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);

            if (imageFile) {
                formData.append('image', imageFile);
            }
            if (isEditing && !imagePreview && !imageFile) {
                formData.append('removeImage', 'true');
            }

            if (isEditing) {
                await api.put(`/posts/${postId}`, formData);
                toast.success('Post updated!');
            } else {
                await api.post('/posts', formData);
                toast.success('Post created!');
            }
            closeModal();
            fetchPosts();
        } catch (error) {
            toast.error('Failed to save post');
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        try {
            await api.delete(`/posts/${id}`);
            toast.success('Post deleted');
            fetchPosts();
        } catch (error) {
            toast.error('Failed to delete post');
        }
    };

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto h-full flex flex-col relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Blog Posts</h1>
                    <p className="text-slate-500 mt-1 text-sm sm:text-base">Manage announcements and articles for the community.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex w-full sm:w-auto justify-center items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} />
                    New Post
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
                                <th className="px-8 py-5">Title</th>
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5">Excerpt</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-slate-500">
                                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                        Fetching latest announcements...
                                    </td>
                                </tr>
                            ) : posts.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <div className="mb-4 text-slate-300 dark:text-slate-700 flex justify-center"><Plus size={48} /></div>
                                        <p className="text-slate-500 font-medium">No announcements found. Start by creating one!</p>
                                    </td>
                                </tr>
                            ) : (
                                posts.map((post) => (
                                    <tr key={post.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:underline">
                                            {post.title}
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                            {new Date(post.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-5 text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                                            <div className="line-clamp-1">{post.content.substring(0, 100)}...</div>
                                        </td>
                                        <td className="px-8 py-5 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(post)}
                                                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/40 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] border border-white/20 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                        <div className="px-6 sm:px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{isEditing ? 'Edit Post' : 'Create New Post'}</h2>
                                <p className="text-slate-500 text-sm mt-0.5">Share news or announcements with the community.</p>
                            </div>
                            <button onClick={closeModal} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all text-slate-500 dark:text-slate-400">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Post Title *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    placeholder="Enter a descriptive title..."
                                    className="w-full px-5 py-4 text-lg font-bold"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Cover Image</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 dark:border-slate-800 border-dashed rounded-[24px] hover:border-blue-400 dark:hover:border-blue-500 transition-all bg-slate-50/50 dark:bg-slate-950/20 group">
                                    <div className="space-y-2 text-center w-full">
                                        {imagePreview ? (
                                            <div className="relative inline-block group w-full">
                                                <img src={imagePreview} alt="Preview" className="h-48 w-full object-cover rounded-2xl shadow-lg" />
                                                <button
                                                    type="button"
                                                    onClick={() => { setImageFile(null); setImagePreview(''); }}
                                                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <div className="w-16 h-16 mb-4 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Plus size={32} />
                                                </div>
                                                <div className="flex text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-slate-900 rounded-md font-bold text-blue-600 hover:text-blue-500">
                                                        <span>Upload a file</span>
                                                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                                                    </label>
                                                    <p className="pl-1">or drag and drop</p>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Content *</label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    required
                                    rows={8}
                                    placeholder="Write your announcement here..."
                                    className="w-full px-5 py-4"
                                />
                            </div>
                        </form>

                        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex justify-end gap-3 backdrop-blur-sm">
                            <button onClick={closeModal} className="px-6 py-3 rounded-2xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} className="px-8 py-3 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                {isEditing ? 'Update Post' : 'Publish Announcement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
