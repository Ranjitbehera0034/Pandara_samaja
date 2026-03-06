import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Search, Shield, Clock, AlertTriangle, UserCheck, XCircle, Trash2, Edit, Users, Heart, MessageSquare, LogIn, Send } from 'lucide-react';
import { toast } from 'sonner';

// ─── Helpers ────────────────────────────────────────────────────────────────
const parseDevice = (ua: string | null): string => {
    if (!ua) return 'Unknown';
    if (/iPhone|iPad/i.test(ua)) return '📱 iOS';
    if (/Android/i.test(ua)) return '📱 Android';
    if (/Windows/i.test(ua)) return '🖥️ Windows';
    if (/Macintosh|Mac OS/i.test(ua)) return '🖥️ Mac';
    if (/Linux/i.test(ua)) return '🐧 Linux';
    return '🌐 Browser';
};

const getUserActionBadge = (action: string) => {
    const map: Record<string, { label: string; classes: string; icon: React.ReactElement }> = {
        LOGIN: { label: 'Login', classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300', icon: <LogIn size={12} /> },
        CREATE_POST: { label: 'Post', classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300', icon: <Edit size={12} /> },
        LIKE_POST: { label: 'Like', classes: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300', icon: <Heart size={12} /> },
        UNLIKE_POST: { label: 'Unlike', classes: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: <Heart size={12} /> },
        COMMENT_POST: { label: 'Comment', classes: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300', icon: <MessageSquare size={12} /> },
        SEND_MESSAGE: { label: 'Message', classes: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', icon: <Send size={12} /> },
    };
    const m = map[action];
    if (!m) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">{action}</span>;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${m.classes}`}>{m.icon}{m.label}</span>;
};

const AdminActionIcon = ({ action }: { action: string }) => {
    if (action.includes('DELETE')) return <Trash2 size={16} className="text-red-500" />;
    if (action.includes('UPDATE')) return <Edit size={16} className="text-blue-500" />;
    if (action.includes('BAN')) return <XCircle size={16} className="text-red-600" />;
    if (action.includes('UNBAN')) return <UserCheck size={16} className="text-green-500" />;
    return <AlertTriangle size={16} className="text-amber-500" />;
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function AuditLog() {
    const [activeTab, setActiveTab] = useState<'admin' | 'user'>('user');
    const [adminLogs, setAdminLogs] = useState<any[]>([]);
    const [userLogs, setUserLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchAdminLogs = useCallback(async () => {
        try {
            const res = await api.get('/admin/audit-logs?limit=200');
            if (res.data.success) setAdminLogs(res.data.logs);
        } catch { toast.error('Failed to load admin logs'); }
    }, []);

    const fetchUserLogs = useCallback(async () => {
        try {
            const res = await api.get('/admin/user-audit-logs?limit=200');
            if (res.data.success) setUserLogs(res.data.logs);
        } catch { toast.error('Failed to load user activity logs'); }
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchAdminLogs(), fetchUserLogs()]);
            setLoading(false);
        };
        load();
    }, [fetchAdminLogs, fetchUserLogs]);

    const q = searchQuery.toLowerCase();
    const filteredAdmin = adminLogs.filter(l =>
        l.admin_username?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q) ||
        l.target_id?.toLowerCase().includes(q)
    );
    const filteredUser = userLogs.filter(l =>
        l.member_name?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q) ||
        l.ip_address?.toLowerCase().includes(q)
    );

    return (
        <div className="p-4 sm:p-8 pb-32 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Shield className="text-indigo-600" size={32} />
                        Audit Log
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Track all platform and user activity.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit mb-6">
                <button
                    onClick={() => { setActiveTab('user'); setSearchQuery(''); }}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'user'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    <Users size={16} /> User Activity
                </button>
                <button
                    onClick={() => { setActiveTab('admin'); setSearchQuery(''); }}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'admin'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    <Shield size={16} /> Admin Actions
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Search bar */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={activeTab === 'user' ? 'Search by member name, action, or IP...' : 'Search by admin, action, or target ID...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {activeTab === 'user' ? (
                        <table className="w-full min-w-[800px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-5 py-4">Timestamp</th>
                                    <th className="px-5 py-4">Member</th>
                                    <th className="px-5 py-4">Action</th>
                                    <th className="px-5 py-4">Target</th>
                                    <th className="px-5 py-4">Device</th>
                                    <th className="px-5 py-4">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {loading ? (
                                    <tr><td colSpan={6} className="py-12 text-center text-slate-500">
                                        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2" />
                                        Loading activity logs...
                                    </td></tr>
                                ) : filteredUser.length === 0 ? (
                                    <tr><td colSpan={6} className="py-12 text-center text-slate-500">No activity logs found.</td></tr>
                                ) : filteredUser.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors text-sm">
                                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <Clock size={13} />{new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-white whitespace-nowrap">{log.member_name || '–'}</td>
                                        <td className="px-5 py-3.5 whitespace-nowrap">{getUserActionBadge(log.action)}</td>
                                        <td className="px-5 py-3.5 text-xs">
                                            {log.target_type && <div className="font-medium text-slate-700 dark:text-slate-300">{log.target_type}</div>}
                                            {log.target_id && <div className="font-mono text-slate-400">#{log.target_id}</div>}
                                            {log.details?.preview && <div className="text-slate-400 italic truncate max-w-[220px]">"{log.details.preview}"</div>}
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300">{parseDevice(log.user_agent)}</td>
                                        <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-400 text-xs">{log.ip_address || '–'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full min-w-[700px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-5 py-4">Timestamp</th>
                                    <th className="px-5 py-4">Admin</th>
                                    <th className="px-5 py-4">Action</th>
                                    <th className="px-5 py-4">Target Resource</th>
                                    <th className="px-5 py-4">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {loading ? (
                                    <tr><td colSpan={5} className="py-12 text-center text-slate-500">
                                        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2" />
                                        Decrypting secure logs...
                                    </td></tr>
                                ) : filteredAdmin.length === 0 ? (
                                    <tr><td colSpan={5} className="py-12 text-center text-slate-500">No admin logs found.</td></tr>
                                ) : filteredAdmin.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors text-sm">
                                        <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <Clock size={13} />{new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white">{log.admin_username}</span>
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap font-medium flex items-center gap-2">
                                            <AdminActionIcon action={log.action} />
                                            {log.action.replace(/_/g, ' ')}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm">
                                            <div className="font-medium text-slate-900 dark:text-white">{log.target_type}</div>
                                            <div className="text-slate-400 text-xs font-mono mt-0.5">ID: {log.target_id}</div>
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap font-mono text-slate-500 dark:text-slate-400 text-xs">{log.ip_address}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
