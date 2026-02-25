import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Heart, MessageCircle, UserPlus, AtSign, Star, Bell,
    Check, CheckCheck, Trash2
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

const MOCK_NOTIFICATIONS: Notification[] = [
    { id: '1', type: 'like', actorName: 'Sasmita Das', message: 'liked your post', timestamp: new Date(Date.now() - 600000).toISOString(), read: false },
    { id: '2', type: 'comment', actorName: 'Amit Kumar', message: 'commented: "Great photo!"', timestamp: new Date(Date.now() - 3600000).toISOString(), read: false },
    { id: '3', type: 'follow', actorName: 'Rahul Singh', message: 'started following you', timestamp: new Date(Date.now() - 7200000).toISOString(), read: false },
    { id: '4', type: 'mention', actorName: 'Priya Sharma', message: 'mentioned you in a post', timestamp: new Date(Date.now() - 86400000).toISOString(), read: true },
    { id: '5', type: 'like', actorName: 'Deepak Behera', message: 'liked your story', timestamp: new Date(Date.now() - 172800000).toISOString(), read: true },
    { id: '6', type: 'system', actorName: 'Pandara Samaja', message: 'Community meeting scheduled for Sunday, 3 PM', timestamp: new Date(Date.now() - 259200000).toISOString(), read: true },
    { id: '7', type: 'comment', actorName: 'Sunita Patel', message: 'replied to your comment', timestamp: new Date(Date.now() - 345600000).toISOString(), read: true },
];

const iconMap: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    like: { icon: <Heart size={18} />, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    comment: { icon: <MessageCircle size={18} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    follow: { icon: <UserPlus size={18} />, color: 'text-green-400', bg: 'bg-green-500/10' },
    mention: { icon: <AtSign size={18} />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    system: { icon: <Star size={18} />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

export default function Notifications() {
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const markRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
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
                {filtered.length === 0 ? (
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
                                onClick={() => markRead(notif.id)}
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
