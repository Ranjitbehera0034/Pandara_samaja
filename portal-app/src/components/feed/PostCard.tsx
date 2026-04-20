import { useState, useRef, useEffect } from 'react';
import {
    MessageSquare, Share2, MoreHorizontal, Bookmark,
    Flag, Trash2, Edit3, Copy, EyeOff, X, Send,
    ThumbsUp, BadgeCheck, Eye
} from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { PollDisplay } from './Poll';
import type { Post, Comment, ReactionType, MediaItem } from '../../types';
import { PORTAL_API_URL, resolveMediaUrl } from '../../config/apiConfig';

// ─── Content Moderation ──────────────────────────────
const BANNED_WORDS = ['nude', 'naked', 'xxx', 'porn', 'sex', 'nsfw', 'adult content', 'explicit', 'obscene', 'vulgar'];
const PROFANITY_WORDS = ['damn', 'hell', 'crap', 'stupid', 'idiot'];

export function censorText(text: string): string {
    const settings = JSON.parse(localStorage.getItem('portalSettings') || '{}');
    let result = text;
    if (settings.contentFilter !== false) {
        BANNED_WORDS.forEach(word => {
            result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), '***');
        });
    }
    if (settings.profanityFilter !== false) {
        PROFANITY_WORDS.forEach(word => {
            result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), (m) => m[0] + '*'.repeat(m.length - 1));
        });
    }
    return result;
}

export function containsBannedContent(text: string): boolean {
    return BANNED_WORDS.some(w => text.toLowerCase().includes(w));
}

// ─── Reaction Config ─────────────────────────────────
const REACTIONS: { type: ReactionType; emoji: string; label: string; color: string }[] = [
    { type: 'like', emoji: '👍', label: 'Like', color: 'text-blue-400' },
    { type: 'love', emoji: '❤️', label: 'Love', color: 'text-rose-400' },
    { type: 'haha', emoji: '😂', label: 'Haha', color: 'text-amber-400' },
    { type: 'wow', emoji: '😮', label: 'Wow', color: 'text-amber-400' },
    { type: 'sad', emoji: '😢', label: 'Sad', color: 'text-amber-400' },
    { type: 'angry', emoji: '😡', label: 'Angry', color: 'text-orange-500' },
];

// ─── Hashtag/Mention Renderer ────────────────────────
function RichContent({ text }: { text: string }) {
    const censored = censorText(text);
    const parts = censored.split(/(#\w+|@\w+)/g);
    return (
        <p className="text-slate-200 whitespace-pre-wrap leading-relaxed text-sm">
            {parts.map((part, i) => {
                if (part.startsWith('#')) {
                    return <span key={i} className="text-blue-400 font-medium hover:underline cursor-pointer">{part}</span>;
                }
                if (part.startsWith('@')) {
                    return <span key={i} className="text-purple-400 font-medium hover:underline cursor-pointer">{part}</span>;
                }
                return <span key={i}>{part}</span>;
            })}
        </p>
    );
}

// Premium VideoPlayer is now imported from a separate file

// ─── Nested Comment Component ────────────────────────
function CommentItem({
    comment, depth = 0, onReply, onLikeComment
}: {
    comment: Comment;
    depth?: number;
    onReply: (parentId: string, text: string) => void;
    onLikeComment: (commentId: string) => void;
}) {
    const [showReply, setShowReply] = useState(false);
    const [replyText, setReplyText] = useState('');

    const handleReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        onReply(comment.id, replyText);
        setReplyText('');
        setShowReply(false);
    };

    return (
        <div className={`${depth > 0 ? 'ml-8 border-l-2 border-slate-700/30 pl-3' : ''}`}>
            <div className="flex gap-2.5 text-sm group">
                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0 text-xs font-bold text-white">
                    {comment.authorAvatar ? (
                        <img src={resolveMediaUrl(comment.authorAvatar)} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        (comment.authorName || '?')[0].toUpperCase()
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="bg-slate-700/50 rounded-2xl px-3 py-2">
                        <span className="font-semibold text-slate-200 text-xs">{comment.authorName}</span>
                        <p className="text-slate-300 text-sm mt-0.5">{censorText(comment.content)}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-1 ml-2">
                        <button
                            onClick={() => onLikeComment(comment.id)}
                            className={`text-xs font-medium transition-colors ${comment.isLiked ? 'text-blue-400' : 'text-slate-500 hover:text-blue-400'}`}
                        >
                            {comment.isLiked ? 'Liked' : 'Like'} {comment.likes ? `(${comment.likes})` : ''}
                        </button>
                        {depth < 2 && (
                            <button
                                onClick={() => setShowReply(!showReply)}
                                className="text-xs font-medium text-slate-500 hover:text-blue-400 transition-colors"
                            >
                                Reply
                            </button>
                        )}
                        <span className="text-[10px] text-slate-600">
                            {timeAgoShort(comment.timestamp)}
                        </span>
                    </div>

                    {/* Reply input */}
                    <AnimatePresence>
                        {showReply && (
                            <motion.form
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                onSubmit={handleReply}
                                className="flex gap-2 mt-2 overflow-hidden"
                            >
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="flex-1 bg-slate-800/50 rounded-full px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 border border-slate-700/50"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={!replyText.trim()}
                                    className="text-blue-500 disabled:opacity-50"
                                >
                                    <Send size={14} />
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Nested replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2 space-y-2">
                    {comment.replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            depth={depth + 1}
                            onReply={onReply}
                            onLikeComment={onLikeComment}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function timeAgoShort(timestamp: string): string {
    const diff = Date.now() - new Date(timestamp).getTime();
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return new Date(timestamp).toLocaleDateString();
}

// ═══════════════════════════════════════════════════════
// ─── Main PostCard Component ──────────────────────────
// ═══════════════════════════════════════════════════════
interface PostCardProps {
    post: Post;
    onLike: (id: string) => void;
    onReact?: (id: string, reaction: ReactionType) => void;
    onComment: (id: string, text: string) => void;
    onReply?: (postId: string, parentCommentId: string, text: string) => void;
    onLikeComment: (commentId: string) => void;
    onDelete?: (id: string) => void;
    onEdit?: (id: string, newContent: string) => void;
    onReport?: (id: string, reason: string) => void;
    onShare?: (id: string) => void;
    onBookmark?: (id: string) => void;
    onPollVote?: (postId: string, optionId: string) => void;
}

export function PostCard({
    post, onLike, onReact, onComment, onReply, onLikeComment,
    onDelete, onEdit, onReport, onShare, onBookmark, onPollVote
}: PostCardProps) {
    const { member, user } = useAuth();
    const { t } = useLanguage();
    const [showComments, setShowComments] = useState(false);
    const [localComments, setLocalComments] = useState<Comment[]>(post.comments || []);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentsPage, setCommentsPage] = useState(1);
    const [hasMoreComments, setHasMoreComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [bookmarked, setBookmarked] = useState(post.isBookmarked || false);
    const [myReaction, setMyReaction] = useState<ReactionType | null>(post.myReaction || (post.isLiked ? 'like' : null));
    const [localReactions, setLocalReactions] = useState(post.reactions || { like: post.likes, love: 0, haha: 0, wow: 0, sad: 0, angry: 0 });
    const [localViews, setLocalViews] = useState(post.views_count || 0);

    useEffect(() => {
        setLocalReactions(prev => ({ ...prev, like: post.likes }));
        setMyReaction(post.myReaction || (post.isLiked ? 'like' : null));
    }, [post.likes, post.isLiked, post.myReaction]);
    const menuRef = useRef<HTMLDivElement>(null);
    const reactionRef = useRef<HTMLDivElement>(null);
    const reactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const isAuthor = member && (member.id === post.authorId || member.membership_no === post.authorId);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
            if (reactionRef.current && !reactionRef.current.contains(e.target as Node)) setShowReactions(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const totalReactions = Object.values(localReactions).reduce((a, b) => a + b, 0);

    // ─── Handlers ────────────────────────────────────
    const handleReaction = (type: ReactionType) => {
        if (myReaction === type) {
            // Remove reaction
            setLocalReactions(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
            setMyReaction(null);
        } else {
            // Switch reaction
            if (myReaction) {
                setLocalReactions(prev => ({ ...prev, [myReaction!]: Math.max(0, prev[myReaction!] - 1) }));
            }
            setLocalReactions(prev => ({ ...prev, [type]: prev[type] + 1 }));
            setMyReaction(type);
        }
        setShowReactions(false);
        if (onReact) onReact(post.id, type);
        else onLike(post.id);
    };

    const handleQuickLike = () => {
        handleReaction('like');
    };

    const fetchComments = async (page = 1) => {
        try {
            setLoadingComments(true);
            const token = localStorage.getItem("portalToken");
            const response = await fetch(`${PORTAL_API_URL}/posts/${post.id}/comments?page=${page}&limit=5`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                const mappedComments: Comment[] = data.comments.map((c: any) => ({
                    id: c.id.toString(),
                    authorId: c.member_id,
                    authorName: c.author_name,
                    authorAvatar: c.author_photo,
                    content: c.text,
                    timestamp: c.created_at,
                    parentId: c.parent_id?.toString() || undefined,
                    replies: [],
                    likes: Number(c.likes_count) || 0,
                    isLiked: false,
                }));
                if (page === 1) {
                    setLocalComments(mappedComments);
                } else {
                    setLocalComments(prev => [...prev, ...mappedComments]);
                }
                setHasMoreComments(data.total > page * 5);
                setCommentsPage(page);
            }
        } catch (error) {
            console.error("Failed to load comments", error);
        } finally {
            setLoadingComments(false);
        }
    };

    useEffect(() => {
        if (showComments && localComments.length === 0) {
            fetchComments(1);
        }
    }, [showComments]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        if (containsBannedContent(commentText)) {
            toast.error('Your comment contains inappropriate content.');
            return;
        }
        onComment(post.id, commentText);
        setCommentText('');
    };

    const handleReplyComment = (parentId: string, text: string) => {
        if (onReply) {
            onReply(post.id, parentId, text);
        } else {
            // Fallback: just add as regular comment
            onComment(post.id, text);
        }
    };

    const handleDelete = () => {
        if (onDelete) {
            onDelete(post.id);
            toast.success('Post deleted');
        }
        setShowMenu(false);
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditContent(post.content);
        setShowMenu(false);
    };

    const handleEditSave = () => {
        if (containsBannedContent(editContent)) {
            toast.error('Content contains inappropriate material.');
            return;
        }
        if (onEdit && editContent.trim()) {
            onEdit(post.id, editContent);
            toast.success('Post updated');
        }
        setIsEditing(false);
    };

    const handleReport = () => {
        setShowReportModal(true);
        setShowMenu(false);
    };

    const submitReport = () => {
        if (!reportReason.trim()) {
            toast.error('Please select a reason');
            return;
        }
        if (onReport) onReport(post.id, reportReason);
        toast.success('Report submitted. Moderators will review.');
        setShowReportModal(false);
        setReportReason('');
    };

    const handleBookmark = () => {
        setBookmarked(!bookmarked);
        if (onBookmark) onBookmark(post.id);
        toast.success(bookmarked ? 'Removed from saved' : 'Saved to bookmarks');
        setShowMenu(false);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
        toast.success('Link copied');
        setShowMenu(false);
    };

    const handleShare = async () => {
        const shareUrl = `${window.location.origin}${window.location.pathname}#/`;

        let shared = false;

        // Try native share dialog first (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Post by ${post.authorName}`,
                    text: post.content.substring(0, 100),
                    url: shareUrl,
                });
                shared = true;
            } catch (err: any) {
                // AbortError = user cancelled, don't count or fallback
                if (err.name === 'AbortError') return;
                // Any other error (InvalidStateError etc.) — fall through to clipboard
            }
        }

        // Fallback: copy link to clipboard
        if (!shared) {
            try {
                await navigator.clipboard.writeText(shareUrl);
                toast.success('Link copied to clipboard!');
                shared = true;
            } catch {
                toast.error('Failed to copy link');
            }
        }

        // Only record share if user actually completed it
        if (shared && onShare) {
            onShare(post.id);
        }
    };

    // Helper to detect if a URL is a video
    const isVideoUrl = (url: string) => {
        if (!url) return false;
        const lowercaseUrl = url.toLowerCase();
        // Check standard extensions - allow for query parameters in Signed URLs
        if (lowercaseUrl.match(/\.(mp4|webm|mov|ogg|qt)(\?|$)/i)) return true;
        // Check if it's our proxy URL with a video extension in the path parameter
        if (lowercaseUrl.includes('/media?path=')) {
            const pathParam = lowercaseUrl.split('path=')[1];
            return pathParam && pathParam.match(/\.(mp4|webm|mov|ogg|qt)(\?|$)/i);
        }
        return false;
    };
    const [viewRecorded, setViewRecorded] = useState(false);
    const handleVideoPlay = async () => {
        if (viewRecorded) return;
        try {
            const token = localStorage.getItem("portalToken");
            await fetch(`${PORTAL_API_URL}/posts/${post.id}/view`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ durationSeconds: 0, segments: [] })
            });
            setViewRecorded(true);
            setLocalViews(prev => prev + 1);
        } catch (error) {
            console.error("Failed to record view", error);
        }
    };

    const handleVideoWatch = async (data: { durationSeconds: number; segments: number[] }) => {
        try {
            const token = localStorage.getItem("portalToken");
            await fetch(`${PORTAL_API_URL}/posts/${post.id}/view`, {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error("Failed to record watch telemetry", error);
        }
    };

    // Get media items — support both legacy `images` and new `media`
    // Convert string array to MediaItem array with proper type detection
    const mediaItems: MediaItem[] = post.media?.length 
        ? post.media 
        : (post.images?.map(url => ({ 
            url, 
            type: isVideoUrl(url) ? 'video' as const : 'image' as const 
          })) || []);

    // Get top reactions for display
    const topReactions = REACTIONS.filter(r => localReactions[r.type] > 0).sort((a, b) => localReactions[b.type] - localReactions[a.type]).slice(0, 3);
    const currentReaction = REACTIONS.find(r => r.type === myReaction);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-4 mb-4 shadow-lg hover:shadow-xl transition-shadow"
        >
            {/* ─── Header ─── */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 p-[2px]">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                            {post.authorAvatar ? (
                                <img src={resolveMediaUrl(post.authorAvatar)} alt={post.authorName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold text-white text-sm">{(post.authorName || '?')[0].toUpperCase()}</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <a href={`#/profile/${post.authorId}?name=${encodeURIComponent(post.authorName)}`}
                                className="font-semibold text-white hover:text-blue-400 transition-colors leading-tight text-sm hover:underline cursor-pointer">
                                {post.authorName}
                            </a>
                            {post.authorVerified && <BadgeCheck size={16} className="text-blue-500" />}
                        </div>
                        <p className="text-xs text-slate-500">
                            {timeAgoShort(post.timestamp)}
                            {post.location ? ` • ${post.location}` : ''}
                            {post.authorMembershipNo ? ` • #${post.authorMembershipNo}` : ''}
                        </p>
                    </div>
                </div>

                {/* Three-dot menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <MoreHorizontal size={18} />
                    </button>
                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="absolute right-0 top-full mt-1 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                            >
                                {isAuthor && (
                                    <>
                                        <button onClick={handleEdit} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors">
                                            <Edit3 size={16} /> {t('postCard', 'editPost')}
                                        </button>
                                        <button onClick={handleDelete} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                            <Trash2 size={16} /> {t('postCard', 'deletePost')}
                                        </button>
                                        <div className="border-t border-slate-700/50 my-1" />
                                    </>
                                )}
                                <button onClick={handleBookmark} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors">
                                    <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} /> {bookmarked ? 'Unsave' : 'Save Post'}
                                </button>
                                <button onClick={handleCopyLink} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors">
                                    <Copy size={16} /> Copy Link
                                </button>
                                {!isAuthor && (
                                    <>
                                        <div className="border-t border-slate-700/50 my-1" />
                                        <button onClick={() => setShowMenu(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors">
                                            <EyeOff size={16} /> Hide this post
                                        </button>
                                        <button onClick={handleReport} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                            <Flag size={16} /> {t('postCard', 'report')} Post
                                        </button>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ─── Content (edit mode or display with rich text) ─── */}
            <div className="mb-3">
                {isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-3 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm"
                            rows={3}
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors">{t('common', 'cancel')}</button>
                            <button onClick={handleEditSave} className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">{t('common', 'save')}</button>
                        </div>
                    </div>
                ) : (
                    <RichContent text={post.content} />
                )}
            </div>

            {/* ─── Media Grid (images + videos) ─── */}
            {mediaItems.length > 0 && (
                <div className={`mt-3 grid gap-1 overflow-hidden rounded-xl ${mediaItems.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {mediaItems.slice(0, 4).map((item, index) => (
                        <motion.div
                            key={index}
                            className={`relative bg-slate-800 ${mediaItems.length === 3 && index === 0 ? 'col-span-2 row-span-2' : ''}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {item.type === 'video' ? (
                                <VideoPlayer 
                                    src={resolveMediaUrl(item.url)} 
                                    onPlay={handleVideoPlay}
                                    onWatch={handleVideoWatch}
                                />
                            ) : (
                                <img src={resolveMediaUrl(item.url)} alt={`Post image ${index + 1}`} className="w-full h-full object-cover max-h-[500px]" />
                            )}
                            {mediaItems.length > 4 && index === 3 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xl font-bold text-white">
                                    +{mediaItems.length - 4}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ─── Poll ─── */}
            {post.poll && (
                <PollDisplay
                    poll={post.poll}
                    onVote={(optionId) => onPollVote?.(post.id, optionId)}
                />
            )}

            {/* ─── Reaction & Views Summary ─── */}
            {(totalReactions > 0 || (post.views_count !== undefined && post.views_count > 0)) && (
                <div className="flex items-center justify-between px-1 py-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                        {topReactions.map(r => (
                            <span key={r.type} className="text-sm">{r.emoji}</span>
                        ))}
                        <span className="ml-1">{totalReactions}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {(post.commentsCount || 0) > 0 && (
                            <button onClick={() => setShowComments(!showComments)} className="hover:text-white transition-colors">
                                {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
                            </button>
                        )}
                        {localViews !== undefined && (
                            <div className="flex items-center gap-1">
                                <Eye size={12} className="opacity-50" />
                                <span className="opacity-70">{localViews || 0} {t('postCard', 'views') || 'Views'}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── Action Buttons ─── */}
            <div className="flex items-center justify-between text-slate-400 border-t border-slate-700/50 pt-3 mt-1">
                <div className="flex items-center gap-1 flex-1">
                    {/* Reaction button with popup */}
                    <div className="relative" ref={reactionRef}>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleQuickLike}
                            onMouseEnter={() => {
                                reactionTimeoutRef.current = setTimeout(() => setShowReactions(true), 500);
                            }}
                            onMouseLeave={() => {
                                clearTimeout(reactionTimeoutRef.current);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${myReaction
                                ? `${currentReaction?.color || 'text-blue-400'} bg-blue-500/10`
                                : 'hover:text-blue-400 hover:bg-blue-500/5'
                                }`}
                        >
                            {myReaction ? (
                                <span className="text-lg leading-none">{currentReaction?.emoji}</span>
                            ) : (
                                <ThumbsUp size={18} />
                            )}
                            <span className="text-sm font-medium">{myReaction ? currentReaction?.label : 'Like'}</span>
                        </motion.button>

                        {/* Reaction Picker Popup */}
                        <AnimatePresence>
                            {showReactions && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                    className="absolute bottom-full left-0 mb-2 flex gap-1 bg-slate-800 border border-slate-700 rounded-full px-2 py-1.5 shadow-2xl z-50"
                                    onMouseEnter={() => clearTimeout(reactionTimeoutRef.current)}
                                    onMouseLeave={() => setShowReactions(false)}
                                >
                                    {REACTIONS.map((r) => (
                                        <motion.button
                                            key={r.type}
                                            whileHover={{ scale: 1.4, y: -4 }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => handleReaction(r.type)}
                                            className={`text-2xl p-1 rounded-full transition-colors ${myReaction === r.type ? 'bg-slate-700' : 'hover:bg-slate-700/50'}`}
                                            title={r.label}
                                        >
                                            {r.emoji}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        onClick={() => setShowComments(!showComments)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${showComments ? 'text-blue-400 bg-blue-500/10' : 'hover:text-blue-400 hover:bg-blue-500/5'}`}
                    >
                        <MessageSquare size={18} />
                        <span className="text-sm font-medium">{post.commentsCount || ''}</span>
                    </button>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-green-400 hover:bg-green-500/5 transition-colors"
                    >
                        <Share2 size={18} />
                        {(post.shareCount || 0) > 0 && <span className="text-sm font-medium">{post.shareCount}</span>}
                    </button>
                </div>

                <button
                    onClick={handleBookmark}
                    className={`p-1.5 rounded-lg transition-colors ${bookmarked ? 'text-amber-400' : 'hover:text-amber-400 hover:bg-amber-500/5'}`}
                >
                    <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
                </button>
            </div>

            {/* ─── Comments Section with Nesting ─── */}
            <AnimatePresence>
                {showComments && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3 pt-3 border-t border-slate-700/30"
                    >
                        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-2">
                            {localComments.length === 0 && !loadingComments ? (
                                <p className="text-center text-sm text-slate-500 py-2">{t('postCard', 'noComments')}</p>
                            ) : (
                                <>
                                    {(() => {
                                        const buildTree = (parentId?: string): Comment[] => {
                                            return localComments
                                                .filter(c => c.parentId === parentId)
                                                .map(c => ({ ...c, replies: buildTree(c.id) }));
                                        };
                                        const nestedComments = buildTree(undefined);
                                        return nestedComments.map(comment => (
                                            <CommentItem
                                                key={comment.id}
                                                comment={comment}
                                                onReply={handleReplyComment}
                                                onLikeComment={onLikeComment}
                                            />
                                        ));
                                    })()}
                                    {loadingComments && (
                                        <div className="text-center py-2 text-slate-400 text-sm italic">Loading comments...</div>
                                    )}
                                    {hasMoreComments && !loadingComments && (
                                        <button
                                            onClick={() => fetchComments(commentsPage + 1)}
                                            className="w-full text-center py-2 text-sm text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 hover:bg-blue-500/20 rounded-lg font-medium"
                                        >
                                            View More Comments
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        <form onSubmit={handleCommentSubmit} className="flex gap-2 items-center">
                            {/* Show logged-in user's avatar */}
                            {(() => {
                                const rawP = user?.profile_photo_url || null;
                                const cP = rawP?.includes('drive.google.com/uc?id=') ? rawP.replace('drive.google.com/uc?id=', 'lh3.googleusercontent.com/d/') : rawP;
                                const fem = ['female', 'f'].includes((user?.gender || '').toLowerCase());
                                return (
                                    <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ${fem ? 'ring-pink-500/40' : 'ring-blue-500/40'} flex items-center justify-center font-bold text-xs text-white`}>
                                        {cP ? (
                                            <img src={resolveMediaUrl(cP)} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        ) : (
                                            <div className={`w-full h-full flex items-center justify-center ${fem ? 'bg-gradient-to-br from-rose-500 to-pink-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                                                {(user?.name || member?.name || '?')[0].toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder={t('postCard', 'writeComment')}
                                className="flex-1 bg-slate-900/50 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 border border-slate-700/50"
                            />
                            <button
                                type="submit"
                                disabled={!commentText.trim()}
                                className="text-blue-500 font-semibold text-sm px-3 disabled:opacity-50"
                            >
                                {t('createPost', 'post')}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Report Modal ─── */}
            <AnimatePresence>
                {showReportModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowReportModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Flag size={20} className="text-red-400" />
                                    {t('postCard', 'report')} Post
                                </h3>
                                <button onClick={() => setShowReportModal(false)} className="p-1 text-slate-400 hover:text-white">
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="text-sm text-slate-400 mb-4">{t('postCard', 'reportReason')}</p>
                            <div className="space-y-2 mb-5">
                                {[
                                    'Adult / Sexual content', 'Harassment or bullying', 'Hate speech',
                                    'Spam or misleading', 'Violence or dangerous content', 'False information', 'Other'
                                ].map(reason => (
                                    <button
                                        key={reason}
                                        onClick={() => setReportReason(reason)}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${reportReason === reason
                                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                            : 'bg-slate-700/30 text-slate-300 hover:bg-slate-700/50 border border-transparent'
                                            }`}
                                    >
                                        {reason}
                                    </button>
                                ))}
                            </div>
                            {reportReason === 'Other' && (
                                <textarea
                                    placeholder="Describe the issue..."
                                    value={reportReason === 'Other' ? '' : reportReason}
                                    onChange={(e) => setReportReason(`Other: ${e.target.value}`)}
                                    className="w-full bg-slate-900/50 text-white rounded-xl px-4 py-3 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none text-sm mb-4"
                                    rows={2}
                                />
                            )}
                            <div className="flex gap-3">
                                <button onClick={() => setShowReportModal(false)} className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-colors">
                                    {t('common', 'cancel')}
                                </button>
                                <button onClick={submitReport} disabled={!reportReason} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 transition-colors">
                                    {t('postCard', 'submitReport')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
