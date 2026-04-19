import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
    Heart, MessageCircle, UserPlus, AtSign, Star, Bell,
    Check, CheckCheck, Trash2, Loader2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface Notification {
    id: string;
    type: 'like' | 'comment' | 'follow' | 'mention' | 'system';
    actorName: string;
    actorAvatar?: string;
    message: string;
    timestamp: string;
    read: boolean;
    postId?: string;
}

const iconMap: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    like: { icon: <Heart size={18} />, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    comment: { icon: <MessageCircle size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    follow: { icon: <UserPlus size={18} />, color: 'text-green-400', bg: 'bg-green-500/10' },
    mention: { icon: <AtSign size={18} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    system: { icon: <Star size={18} />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

import { PORTAL_API_URL } from '../config/apiConfig';

export default function Notifications() {
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('portalToken');
            const res = await fetch(`${PORTAL_API_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setNotifications(data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = async () => {
        try {
            const token = localStorage.getItem('portalToken');
            await fetch(`${PORTAL_API_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            toast.success("Marked all as read");
        } catch (_e) {
            toast.error("Error marking all read");
        }
    };

    const markRead = async (id: string, currentlyRead: boolean) => {
        if (currentlyRead) return;
        try {
            const token = localStorage.getItem('portalToken');
            await fetch(`${PORTAL_API_URL}/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (_e) {
            console.error(_e);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const token = localStorage.getItem('portalToken');
            await fetch(`${PORTAL_API_URL}/notifications/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
            toast.success("Notification deleted");
        } catch (_e) {
            toast.error("Failed to delete notification");
        }
    };

    const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

    const formatTime = (timestamp: string) => {
        const diff = Date.now() - new Date(timestamp).getTime();
        if (diff < 60000) return t('notifications', 'justNow');
        if (diff < 3600000) return `${Math.floor(diff / 60000)}${t('postCard', 'mAgo')}`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}${t('postCard', 'hAgo')}`;
        return `${Math.floor(diff / 86400000)}${t('postCard', 'dAgo')}`;
    };

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 flex items-center gap-3">
                            <Bell size={28} className="text-blue-400" />
                            Notifications
                        </h1>
                        <p className="text-slate-400 mt-1">
                            {unreadCount > 0 ? `${unreadCount} ${t('notifications', 'unreadNotifications')}` : t('notifications', 'allCaughtUp')}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-sm font-medium transition-colors"
                        >
                            <CheckCheck size={16} />
                            {t('notifications', 'markAllRead')}
                        </button>
                    )}
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mt-5">
                    {(['all', 'unread'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === tab
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {tab === 'all' ? t('notifications', 'all') : `${t('notifications', 'unread')} (${unreadCount})`}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Notification List */}
            <div className="space-y-2">
                {loading ? (
                    <div className="flex items-center justify-center py-20 text-blue-500">
                        <Loader2 className="animate-spin" size={40} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <Bell size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-lg">{filter === 'unread' ? t('notifications', 'noUnread') : t('notifications', 'noNotifications')}</p>
                    </div>
                ) : (
                    filtered.map((notif, i) => {
                        const { icon, color, bg } = iconMap[notif.type] || iconMap.system;
                        return (
                            <motion.div
                                key={notif.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                onClick={() => markRead(notif.id, notif.read)}
                                className={`group flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all ${notif.read
                                    ? 'bg-slate-800/30 hover:bg-slate-800/50'
                                    : 'bg-slate-800/70 border border-blue-500/20 hover:border-blue-500/40 shadow-md'
                                    }`}
                            >
                                <div className={`mt-1 p-2.5 rounded-full ${bg} ${color} shrink-0`}>
                                    {icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white">
                                        <span className="font-semibold">{notif.actorName}</span>
                                        {' '}
                                        <span className="text-slate-300">{notif.message}</span>
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">{formatTime(notif.timestamp)}</p>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    {!notif.read && (
                                        <button className="p-1.5 hover:bg-slate-700 rounded-full text-blue-400" title={t('notifications', 'markRead')}>
                                            <Check size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                                        className="p-1.5 hover:bg-red-500/10 rounded-full text-slate-500 hover:text-red-400"
                                        title={t('common', 'delete')}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                {!notif.read && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-2 shadow-lg shadow-blue-500/50" />
                                )}
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
