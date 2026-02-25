import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { Users, Heart, Activity, ShieldAlert, Globe } from 'lucide-react';

export default function Dashboard() {
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        totalMembers: 0,
        activeToday: 0,
        postsToday: 0,
        matrimonyPending: 0,
        reportsPending: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                if (res.data.success) {
                    setStats(res.data.stats);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const cards = [
        { title: t('total_members'), value: stats.totalMembers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
        { title: t('active_today'), value: stats.activeToday, icon: Activity, color: 'text-green-500', bg: 'bg-green-50' },
        { title: t('posts_today'), value: stats.postsToday, icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { title: t('matrimony_pending'), value: stats.matrimonyPending, icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
        { title: t('moderation_queue'), value: stats.reportsPending, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50' },
    ];

    if (loading) {
        return (
            <div className="p-8 pb-32 max-w-7xl mx-auto flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-8 pb-32 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">{t('welcome_back')}</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {cards.map((card, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{card.title}</p>
                                <p className="text-4xl font-extrabold text-slate-900 mt-2">{card.value}</p>
                            </div>
                            <div className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center shrink-0`}>
                                <card.icon className={card.color} size={28} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Welcome to the Admin Architecture</h2>
                <p className="text-slate-600 mb-6 leading-relaxed">
                    You have complete command over the Portal App ecosystem. Manage members, moderate feed content, approve matrimony candidates, publish announcements, and broadcast push notifications completely securely from this dashboard.
                </p>
                <div className="flex gap-4">
                    <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm shadow-blue-500/20 transition-colors">
                        Review Pending Matrimony
                    </button>
                    <button className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors">
                        Clear Moderation Queue
                    </button>
                </div>
            </div>
        </div>
    );
}
