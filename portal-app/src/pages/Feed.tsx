import { useState, useEffect } from 'react';
import { CreatePost } from '../components/feed/CreatePost';
import { PostCard } from '../components/feed/PostCard';
import { Stories } from '../components/feed/Stories';
import { StatusBar } from '../components/feed/StatusBar';
import { ReelsViewer } from '../components/feed/Reels';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { Post, Story, Comment, ReactionType, MediaItem, StatusUpdate, Poll } from '../types';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { Film } from 'lucide-react';

const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api/v1/portal' : 'https://pandara-samaja-backend.onrender.com/api/v1/portal';
const SOCKET_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000' : 'https://pandara-samaja-backend.onrender.com';

const MOCK_STORIES: Story[] = [
    {
        id: 's1',
        authorId: '103',
        authorName: 'Sasmita Das',
        authorAvatar: undefined,
        mediaUrl: 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366',
        mediaType: 'image',
        timestamp: new Date().toISOString(),
        viewed: false
    },
    {
        id: 's2',
        authorId: '105',
        authorName: 'Rajesh Patel',
        authorAvatar: undefined,
        mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        mediaType: 'image',
        timestamp: new Date().toISOString(),
        viewed: false
    },
    {
        id: 's3',
        authorId: '107',
        authorName: 'Amit Kumar',
        authorAvatar: undefined,
        mediaUrl: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739',
        mediaType: 'image',
        timestamp: new Date().toISOString(),
        viewed: true
    }
];

export default function Feed() {
    const { member } = useAuth();
    const { t } = useLanguage();
    const [posts, setPosts] = useState<Post[]>([]);
    const [stories, setStories] = useState<Story[]>(MOCK_STORIES);
    const [loading, setLoading] = useState(true);
    const [statuses, setStatuses] = useState<StatusUpdate[]>([]);
    const [showReels, setShowReels] = useState(false);

    const getToken = () => localStorage.getItem("portalToken");

    useEffect(() => {
        fetchPosts();

        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        socket.on('new_post', (newPost: any) => {
            const mappedPost: Post = {
                id: newPost.id.toString(),
                authorId: newPost.author_id,
                authorName: newPost.author_name,
                authorAvatar: newPost.author_photo,
                location: newPost.location,
                content: newPost.text_content || "",
                images: newPost.images || [],
                media: (newPost.media || []).map((m: any) => ({ url: m.url, type: m.type || 'image' })),
                likes: Number(newPost.likes_count) || 0,
                reactions: { like: Number(newPost.likes_count) || 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
                comments: (newPost.comments || []).map((c: any) => ({
                    id: c.id.toString(),
                    authorId: c.member_id,
                    authorName: c.author_name,
                    content: c.text,
                    timestamp: c.created_at
                } as Comment)),
                timestamp: newPost.created_at,
                isLiked: false
            };
            setPosts(prev => [mappedPost, ...prev]);
            toast.info(t('feed', 'newPostAvailable'));
        });

        socket.on('like_updated', (data: { postId: string, likes: number }) => {
            setPosts(prev => prev.map(p =>
                p.id === data.postId ? { ...p, likes: Number(data.likes) } : p
            ));
        });

        socket.on('new_comment', (data: { postId: string, comment: any }) => {
            const mappedComment: Comment = {
                id: data.comment.id.toString(),
                authorId: data.comment.member_id,
                authorName: data.comment.author_name,
                content: data.comment.text,
                timestamp: data.comment.created_at
            };
            setPosts(prev => prev.map(p =>
                p.id === data.postId
                    ? { ...p, comments: [...p.comments, mappedComment] }
                    : p
            ));
        });

        return () => { socket.disconnect(); };
    }, []);

    const fetchPosts = async () => {
        try {
            const token = getToken();
            if (!token) { setLoading(false); return; }

            const response = await fetch(`${API_BASE_URL}/posts`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch posts');

            const data = await response.json();
            if (data.success) {
                const mappedPosts: Post[] = data.posts.map((p: any) => ({
                    id: p.id.toString(),
                    authorId: p.author_id,
                    authorName: p.author_name,
                    authorAvatar: p.author_photo,
                    location: p.location,
                    content: p.text_content || "",
                    images: p.images || [],
                    media: (p.media || []).map((m: any) => ({ url: m.url, type: m.type || 'image' })),
                    likes: Number(p.likes_count) || 0,
                    reactions: { like: Number(p.likes_count) || 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
                    comments: (p.comments || []).map((c: any) => ({
                        id: c.id.toString(),
                        authorId: c.member_id,
                        authorName: c.author_name,
                        authorAvatar: c.author_photo,
                        content: c.text,
                        timestamp: c.created_at,
                        replies: [],
                        likes: 0,
                        isLiked: false,
                    } as Comment)),
                    timestamp: p.created_at,
                    isLiked: p.liked_by_me || false,
                    isBookmarked: false,
                    shareCount: 0
                }));
                setPosts(mappedPosts);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStory = (file: File, textOverlay?: string, textPosition?: 'top' | 'center' | 'bottom', textColor?: string) => {
        if (!member) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const newStory: Story = {
                id: Date.now().toString(),
                authorId: member.id || member.membership_no,
                authorName: member.name,
                authorAvatar: member.profile_photo_url,
                mediaUrl: reader.result as string,
                mediaType: file.type.startsWith('video') ? 'video' : 'image',
                timestamp: new Date().toISOString(),
                viewed: false,
                textOverlay,
                textPosition,
                textColor,
            };
            setStories([newStory, ...stories]);
            toast.success(t('feed', 'storyAdded'));
        };
        reader.readAsDataURL(file);
    };

    // ─── Create Post (now supports mixed media + polls) ──
    const handleCreatePost = async (content: string, media?: MediaItem[], files?: File[], poll?: Poll, location?: string) => {
        if (!member) return;

        const toastId = toast.loading(t('feed', 'posting'));

        try {
            const token = getToken();
            const formData = new FormData();
            formData.append('text', content);

            if (files && files.length > 0) {
                files.forEach(file => {
                    formData.append('images', file);
                });
            }
            if (location) {
                formData.append('location', location);
            }

            const response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to create post');

            if (data.success && data.post) {
                const p = data.post;
                const newPost: Post = {
                    id: p.id.toString(),
                    authorId: p.author_id,
                    authorName: p.author_name,
                    authorAvatar: p.author_photo,
                    location: p.location,
                    content: p.text_content || "",
                    images: p.images || [],
                    media: media || [],
                    likes: 0,
                    reactions: { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
                    comments: [],
                    timestamp: p.created_at,
                    isLiked: false,
                    isBookmarked: false,
                    shareCount: 0,
                    poll,
                };
                setPosts([newPost, ...posts]);
                toast.success(t('feed', 'postCreated'), { id: toastId });
            } else {
                createLocalPost(content, media, poll, location, toastId);
            }
        } catch {
            createLocalPost(content, media, poll, location, toastId);
        }
    };

    const createLocalPost = (content: string, media?: MediaItem[], poll?: Poll, location?: string, toastId?: string | number) => {
        if (!member) return;
        const newPost: Post = {
            id: Date.now().toString(),
            authorId: member.id || member.membership_no,
            authorName: member.name,
            authorAvatar: member.profile_photo_url,
            location,
            content,
            media: media || [],
            images: media?.filter(m => m.type === 'image').map(m => m.url) || [],
            likes: 0,
            reactions: { like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
            comments: [],
            timestamp: new Date().toISOString(),
            isLiked: false,
            isBookmarked: false,
            shareCount: 0,
            // Extract hashtags and mentions
            hashtags: content.match(/#\w+/g) || [],
            mentions: content.match(/@\w+/g) || [],
            poll,
        };
        setPosts([newPost, ...posts]);
        toast.success(t('feed', 'postCreatedOffline'), { id: toastId });
    };

    // ─── Reactions ───────────────────────────────────
    const handleLike = async (id: string) => {
        setPosts(posts.map(p =>
            p.id === id ? { ...p, likes: p.isLiked ? Math.max(0, p.likes - 1) : p.likes + 1, isLiked: !p.isLiked } : p
        ));
        try {
            const token = getToken();
            const response = await fetch(`${API_BASE_URL}/posts/${id}/like`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) fetchPosts();
        } catch { /* offline mode */ }
    };

    const handleReact = (id: string, _reaction: ReactionType) => {
        // For now, map to like API. Full reaction API can be added later.
        handleLike(id);
    };

    // ─── Comments ────────────────────────────────────
    const handleComment = async (id: string, text: string) => {
        const newComment: Comment = {
            id: Date.now().toString(),
            authorId: member?.id || 'me',
            authorName: member?.name || 'Me',
            authorAvatar: member?.profile_photo_url,
            content: text,
            timestamp: new Date().toISOString(),
            replies: [],
            likes: 0,
            isLiked: false,
        };

        setPosts(posts.map(p =>
            p.id === id ? { ...p, comments: [...p.comments, newComment] } : p
        ));

        try {
            const token = getToken();
            await fetch(`${API_BASE_URL}/posts/${id}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });
        } catch {
            toast.success(t('feed', 'commentAddedOffline'));
        }
    };

    // ─── Nested Replies ──────────────────────────────
    const handleReply = (postId: string, parentCommentId: string, text: string) => {
        const reply: Comment = {
            id: Date.now().toString(),
            authorId: member?.id || 'me',
            authorName: member?.name || 'Me',
            authorAvatar: member?.profile_photo_url,
            content: text,
            timestamp: new Date().toISOString(),
            parentId: parentCommentId,
            replies: [],
            likes: 0,
            isLiked: false,
        };

        setPosts(posts.map(post => {
            if (post.id !== postId) return post;

            const addReply = (comments: Comment[]): Comment[] => {
                return comments.map(c => {
                    if (c.id === parentCommentId) {
                        return { ...c, replies: [...(c.replies || []), reply] };
                    }
                    if (c.replies && c.replies.length > 0) {
                        return { ...c, replies: addReply(c.replies) };
                    }
                    return c;
                });
            };

            return { ...post, comments: addReply(post.comments) };
        }));
    };

    // ─── Delete / Edit / Report ──────────────────────
    const handleDelete = async (id: string) => {
        setPosts(posts.filter(p => p.id !== id));
        try {
            const token = getToken();
            await fetch(`${API_BASE_URL}/posts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch { /* silent */ }
    };

    const handleEdit = async (id: string, newContent: string) => {
        setPosts(posts.map(p => p.id === id ? {
            ...p,
            content: newContent,
            hashtags: newContent.match(/#\w+/g) || [],
            mentions: newContent.match(/@\w+/g) || [],
        } : p));
        try {
            const token = getToken();
            await fetch(`${API_BASE_URL}/posts/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: newContent })
            });
        } catch { /* silent */ }
    };

    const handleReport = async (id: string, reason: string) => {
        try {
            const token = getToken();
            await fetch(`${API_BASE_URL}/posts/${id}/report`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
        } catch { /* silent */ }
    };

    // ─── Bookmark / Share ────────────────────────────
    const handleBookmark = (id: string) => {
        setPosts(posts.map(p =>
            p.id === id ? { ...p, isBookmarked: !p.isBookmarked } : p
        ));
    };

    const handleSharePost = (id: string) => {
        setPosts(posts.map(p =>
            p.id === id ? { ...p, shareCount: (p.shareCount || 0) + 1 } : p
        ));
    };

    // ─── Status Updates ─────────────────────────
    const handleAddStatus = (text: string, emoji: string, bgColor: string) => {
        if (!member) return;
        const newStatus: StatusUpdate = {
            id: Date.now().toString(),
            authorId: member.id || member.membership_no,
            authorName: member.name,
            authorAvatar: member.profile_photo_url,
            text,
            emoji,
            bgColor,
            timestamp: new Date().toISOString(),
        };
        setStatuses([newStatus, ...statuses]);
        toast.success('Status shared!');
    };

    // ─── Poll Vote ──────────────────────────────
    const handlePollVote = (postId: string, optionId: string) => {
        setPosts(posts.map(p => {
            if (p.id !== postId || !p.poll) return p;
            return {
                ...p,
                poll: {
                    ...p.poll,
                    myVote: optionId,
                    totalVotes: p.poll.totalVotes + 1,
                    options: p.poll.options.map(opt =>
                        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
                    ),
                },
            };
        }));
    };

    // ─── Render ──────────────────────────────────────
    if (loading) {
        return <div className="flex justify-center p-10 text-slate-400">{t('feed', 'loadingFeed')}</div>;
    }

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">{t('feed', 'title')}</h1>
                <p className="text-slate-400">{t('feed', 'subtitle')}</p>
            </motion.div>

            {/* Status Bar (Phase 2) */}
            <StatusBar statuses={statuses} onAddStatus={handleAddStatus} />

            <Stories stories={stories} onAddStory={handleAddStory} />

            <CreatePost onPostCreate={handleCreatePost} />

            <div className="space-y-6">
                {posts.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        {t('feed', 'noPosts')}
                    </div>
                ) : (
                    posts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onLike={handleLike}
                            onReact={handleReact}
                            onComment={handleComment}
                            onReply={handleReply}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onReport={handleReport}
                            onBookmark={handleBookmark}
                            onShare={handleSharePost}
                            onPollVote={handlePollVote}
                        />
                    ))
                )}
            </div>

            {/* Floating Reels Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowReels(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-rose-500 to-pink-600 rounded-full shadow-2xl shadow-rose-500/30 flex items-center justify-center z-40 hover:shadow-rose-500/50 transition-shadow"
                title="Watch Reels"
            >
                <Film size={24} className="text-white" />
            </motion.button>

            {/* Reels Viewer */}
            <ReelsViewer isOpen={showReels} onClose={() => setShowReels(false)} />
        </div>
    );
}
