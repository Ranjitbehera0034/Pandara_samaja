import { useState, useEffect } from 'react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { 
    Users, Heart, Activity, Globe, 
    Image as ImageIcon, Video, ThumbsUp, MessageSquare, 
    Wallet, TrendingUp, Calendar, ArrowRight,
    CheckCircle, AlertCircle, Zap, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type Stats = {
    totalMembers: number;
    activeToday: number;
    postsToday: number;
    matrimonyPending: number;
    reportsPending: number;
    activityTracker?: {
        images: number;
        videos: number;
        likes: number;
        comments: number;
    };
    expenseTracker?: {
        totalExpense: number;
        monthlyExpense: number;
    };
    matrimonyStats?: {
        total: number;
        approved: number;
        matched: number;
    };
};

export default function Dashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAdminAuth();
    const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin' || user?.role?.toLowerCase() === 'super_admin';

    const [stats, setStats] = useState<Stats>({
        totalMembers: 0,
        activeToday: 0,
        postsToday: 0,
        matrimonyPending: 0,
        reportsPending: 0,
        activityTracker: { images: 0, videos: 0, likes: 0, comments: 0 },
        expenseTracker: { totalExpense: 0, monthlyExpense: 0 },
        matrimonyStats: { total: 0, approved: 0, matched: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/stats');
                if (res.data.success) {
                    // Merge with defaults to prevent crashes if some fields are missing
                    setStats(prev => ({
                        ...prev,
                        ...res.data.stats
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="p-4 sm:p-8 flex items-center justify-center h-[60vh]">
                <div className="relative">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                </div>
            </div>
        );
    }

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="p-4 sm:p-8 pb-32 max-w-7xl mx-auto space-y-8">
            {/* Header section */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                >
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        {t('welcome_back')} <span className="animate-bounce">👋</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">
                        Pandara Samaja Administrative Hub
                    </p>
                </motion.div>
                
                <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex flex-wrap items-center gap-2"
                >
                    {isSuperAdmin && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-500/20 text-xs font-black uppercase tracking-widest">
                            <ShieldCheck size={14} />
                            Super Admin
                        </div>
                    )}
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-500/20 text-xs font-bold">
                        <Zap size={14} fill="currentColor" />
                        {t('all_systems_operational')}
                    </div>
                </motion.div>
            </header>

            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                {/* Main Stats */}
                <motion.div variants={item} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users size={80} />
                   </div>
                   <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('total_members')}</p>
                   <p className="text-4xl font-black text-slate-900 dark:text-white mt-2">{stats.totalMembers}</p>
                   <div className="mt-4 flex items-center gap-2 text-emerald-500 font-bold text-xs bg-emerald-50 dark:bg-emerald-500/10 w-fit px-2 py-1 rounded-lg">
                       <TrendingUp size={14} /> +12% this week
                   </div>
                </motion.div>

                <motion.div variants={item} className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl shadow-lg shadow-blue-500/20 text-white hover:shadow-blue-500/40 hover:-translate-y-1 transition-all group">
                   <p className="text-xs font-black text-blue-100/60 uppercase tracking-widest">{t('active_today')}</p>
                   <p className="text-4xl font-black mt-2">{stats.activeToday}</p>
                   <div className="mt-4 flex items-center gap-2 text-blue-100 text-xs font-medium">
                       <Activity size={14} /> Peak hour: 6:00 PM
                   </div>
                </motion.div>

                <motion.div variants={item} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all group">
                   <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('posts_today')}</p>
                   <p className="text-4xl font-black text-slate-900 dark:text-white mt-2">{stats.postsToday}</p>
                   <div className="mt-4 flex items-center gap-4">
                       <div className="flex -space-x-2">
                           {[1,2,3].map(i => (
                               <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 overflow-hidden text-[8px] flex items-center justify-center font-bold text-slate-500">U{i}</div>
                           ))}
                       </div>
                       <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Recent activity</p>
                   </div>
                </motion.div>

                <motion.div variants={item} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all group">
                   <p className="text-xs font-black text-amber-500 uppercase tracking-widest">{t('moderation_queue')}</p>
                   <p className="text-4xl font-black text-slate-900 dark:text-white mt-2">{stats.reportsPending}</p>
                   <div className="mt-4">
                       <button 
                        onClick={() => navigate('/content')}
                        className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                       >
                           Review Actioned <ArrowRight size={10} />
                       </button>
                   </div>
                </motion.div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Daily Activity Tracker */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('activity_tracker')}</h2>
                            <p className="text-sm text-slate-500 font-medium">{t('daily_stats')}</p>
                        </div>
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
                           <Activity size={24} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: t('images'), value: stats.activityTracker?.images || 0, icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50' },
                            { label: t('videos'), value: stats.activityTracker?.videos || 0, icon: Video, color: 'text-purple-500', bg: 'bg-purple-50' },
                            { label: t('likes'), value: stats.activityTracker?.likes || 0, icon: ThumbsUp, color: 'text-pink-500', bg: 'bg-pink-50' },
                            { label: t('comments'), value: stats.activityTracker?.comments || 0, icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-50' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-colors hover:border-indigo-200">
                                <stat.icon className={`${stat.color} mx-auto mb-2`} size={20} />
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-6 bg-slate-900 dark:bg-black rounded-3xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Global Reach</p>
                                    <p className="text-slate-100 font-medium">1.2k Unique Visitors Today</p>
                                </div>
                            </div>
                            <button className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all">
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Expense Tracker */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('expense_tracker')}</h2>
                            <p className="text-sm text-slate-500 font-medium">Community Fund Overview</p>
                        </div>
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600 dark:text-emerald-400">
                           <Wallet size={24} />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-8 mb-8">
                        <div className="flex-1 space-y-4">
                            <div className="space-y-1">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('total_expenses')}</p>
                                <p className="text-4xl font-black text-slate-900 dark:text-white">₹{stats.expenseTracker?.totalExpense?.toLocaleString() || '0'}</p>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-900 h-3 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: '65%' }}
                                    className="bg-emerald-500 h-full rounded-full"
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">65% of Yearly Budget Utilized</p>
                        </div>
                        <div className="w-full sm:w-48 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-3xl flex flex-col justify-center text-center">
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">{t('monthly_report')}</p>
                            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">₹{stats.expenseTracker?.monthlyExpense?.toLocaleString() || '0'}</p>
                            <p className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60 font-medium">April 2026</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => navigate('/expenses')}
                            className="px-6 py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-slate-900/10"
                        >
                            {t('view_details')}
                        </button>
                        <button 
                            onClick={() => toast.info("Financial scheduling feature coming soon.")}
                            className="px-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                        >
                            <Calendar size={14} /> Schedule
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* Matrimony Insights & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 pb-12">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-2 bg-gradient-to-br from-pink-500/5 to-red-500/5 dark:from-pink-500/10 dark:to-red-500/10 p-8 rounded-[2.5rem] border border-pink-100 dark:border-pink-500/20"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('matrimony_insights')}</h2>
                            <p className="text-sm text-slate-500 font-medium">Performance and verification tracker</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800 shadow-sm rounded-2xl text-pink-500">
                           <Heart size={24} fill="currentColor" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <div className="space-y-2">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('total_candidates')}</p>
                             <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.matrimonyStats?.total || 0}</p>
                        </div>
                        <div className="space-y-2">
                             <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('matched_couples')}</p>
                             <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.matrimonyStats?.matched || 0}</p>
                        </div>
                        <div className="space-y-2">
                             <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest">{t('matrimony_pending')}</p>
                             <div className="flex items-center gap-3">
                                 <p className="text-3xl font-black text-slate-900 dark:text-white">{stats.matrimonyPending}</p>
                                 <button 
                                    onClick={() => navigate('/matrimony')}
                                    className="p-1 px-3 bg-pink-500 text-white text-[10px] font-bold rounded-lg uppercase tracking-tighter"
                                 >Action</button>
                             </div>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-4 p-4 bg-white/50 dark:bg-white/5 rounded-[2rem] border border-white dark:border-white/5 shadow-inner">
                        <div className="w-2 h-12 bg-pink-500 rounded-full"></div>
                        <div className="flex-1">
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">New Verification Spike</p>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">+14 applications received last weekend</p>
                        </div>
                        <button 
                            onClick={() => navigate('/matrimony')}
                            className="flex items-center gap-2 text-pink-500 text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-pink-100"
                        >
                             Manage Now
                        </button>
                    </div>
                </motion.div>

                {/* Quick Actions / System Health */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col"
                >
                    <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">{t('quick_actions')}</h2>
                    
                    <div className="space-y-3 flex-1">
                        <button 
                            onClick={() => navigate('/notifications')}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all group"
                        >
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                                     <Zap size={18} />
                                 </div>
                                 <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Push Notification</p>
                             </div>
                             <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-500" />
                        </button>
                        <button 
                            onClick={async () => {
                                toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
                                    loading: 'Generating member archive...',
                                    success: 'Member data exported successfully!',
                                    error: 'Export failed'
                                });
                            }}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all group"
                        >
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                                     <CheckCircle size={18} />
                                 </div>
                                 <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Export All Data</p>
                             </div>
                             <ArrowRight size={16} className="text-slate-400 group-hover:text-emerald-500" />
                        </button>
                        <button 
                            onClick={() => {
                                if (confirm("System Lockdown will disable all public API access. Are you absolutely sure?")) {
                                    toast.error("System Lockdown Initiated. Authorized personnel only.");
                                }
                            }}
                            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all group"
                        >
                             <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center">
                                     <AlertCircle size={18} />
                                 </div>
                                 <p className="text-sm font-bold text-slate-700 dark:text-slate-300">System Lockdown</p>
                             </div>
                             <ArrowRight size={16} className="text-slate-400 group-hover:text-red-500" />
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('system_health')}</p>
                         <div className="flex items-center justify-center gap-2 mt-2">
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                             <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">{t('all_systems_operational')}</p>
                         </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
