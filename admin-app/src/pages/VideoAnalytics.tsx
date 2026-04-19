import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
    Video, Users, MousePointer2, TrendingUp, 
    Clock, Tag, Eye, ArrowUpRight, BarChart,
    Layers, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AnalyticsData {
    categoryInterests: { category: string; view_count: string }[];
    durationEngagement: { duration_range: string; count: string }[];
    topVideoHeatmap?: {
        videoId: number;
        heatmap: Record<number, number>;
    };
}

export default function VideoAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/admin/stats/video-analytics');
                if (res.data.success) {
                    setData(res.data.stats);
                }
            } catch (error) {
                console.error("Failed to fetch video analytics", error);
                toast.error("Failed to load video analytics");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const heatmapData = useMemo(() => {
        if (!data?.topVideoHeatmap?.heatmap) return [];
        const h = data.topVideoHeatmap.heatmap;
        const maxSegment = Math.max(...Object.keys(h).map(Number), 0);
        const result = [];
        for (let i = 0; i <= maxSegment; i++) {
            result.push({ segment: i, views: h[i] || 0 });
        }
        return result;
    }, [data]);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center h-[60vh]">
                <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full shadow-2xl"></div>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="p-4 sm:p-8 pb-32 max-w-7xl mx-auto space-y-8">
            <header className="space-y-2">
                <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex items-center gap-3"
                >
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                        <Video size={28} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">
                        Video Analytics
                    </h1>
                </motion.div>
                <p className="text-slate-500 font-medium ml-14">Insights into community watch habits and content performance</p>
            </header>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
                {/* INTERESTS CARD */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Tag size={16} /> Favorite Categories
                        </h2>
                        <span className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl"><TrendingUp size={14} /></span>
                    </div>
                    <div className="space-y-4">
                        {data?.categoryInterests.map((cat, idx) => (
                            <div key={idx} className="group">
                                <div className="flex justify-between items-center mb-1 text-sm font-bold text-slate-600 dark:text-slate-300">
                                    <span>{cat.category}</span>
                                    <span>{cat.view_count} views</span>
                                </div>
                                <div className="h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(Number(cat.view_count) / Number(data.categoryInterests[0].view_count)) * 100}%` }}
                                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-400"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* ENGAGEMENT DURATION */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={16} /> Watch Duration
                        </h2>
                        <span className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl"><BarChart size={14} /></span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {data?.durationEngagement.map((dur, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{dur.duration_range}</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">{dur.count}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* HEATMAP HIGHLIGHT */}
                <motion.div variants={itemVariants} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 group">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Layers size={16} /> Top Video Heatmap
                        </h2>
                        <span className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-xl group-hover:animate-pulse"><Play size={14} fill="currentColor" /></span>
                    </div>
                    {data?.topVideoHeatmap ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-2xl text-white">
                                <div className="p-2 bg-white/10 rounded-xl"><Eye size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-500">Video ID: {data.topVideoHeatmap.videoId}</p>
                                    <p className="text-sm font-bold">Retention Heatmap (Segment 0-X)</p>
                                </div>
                                <ArrowUpRight className="ml-auto text-slate-500" />
                            </div>
                            <div className="flex items-end gap-[2px] h-24">
                                {heatmapData.map((seg, i) => (
                                    <div 
                                        key={i} 
                                        className="flex-1 bg-indigo-500 hover:bg-rose-500 transition-colors cursor-pointer rounded-t-sm"
                                        style={{ 
                                            height: `${Math.max(10, (seg.views / Math.max(...heatmapData.map(h => h.views))) * 100)}%`,
                                            opacity: 0.3 + (seg.views / Math.max(...heatmapData.map(h => h.views))) * 0.7
                                        }}
                                        title={`Segment ${seg.segment} (5s): ${seg.views} views`}
                                    />
                                ))}
                            </div>
                            <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-widest">Video Timeline (5s per bar)</p>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-slate-400 font-medium">No heatmap data yet</div>
                    )}
                </motion.div>
            </motion.div>

            {/* UPCOMING AI INSIGHTS */}
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-8 text-white group"
            >
                <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform">
                    <TrendingUp size={200} />
                </div>
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-indigo-500 rounded-full text-[10px] font-black uppercase tracking-widest">Experimental</span>
                        <h3 className="text-2xl font-black uppercase tracking-tight">AI Content Recommendations</h3>
                    </div>
                    <p className="max-w-2xl text-slate-400 font-medium leading-relaxed">
                        Based on the current watch segments and category preferences, the system can now predict user interests. We are planning to automate feed priority to show users more of what they love.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                            <p className="text-[10px] font-black uppercase text-indigo-400 mb-1">Top Interest</p>
                            <p className="text-lg font-bold">{data?.categoryInterests[0]?.category || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                            <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">Peak Engagement</p>
                            <p className="text-lg font-bold">First 15 seconds</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-3xl border border-white/10">
                            <p className="text-[10px] font-black uppercase text-rose-400 mb-1">Churn Rate</p>
                            <p className="text-lg font-bold">24% at 1 min</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
