import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Compass, TrendingUp, Users, Hash } from 'lucide-react';

export default function Explore() {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'trending' | 'popular' | 'tags'>('trending');
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch(((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api/portal' : 'https://pandara-samaja-backend.onrender.com/api/portal') + '/explore/stats', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('portalToken')}` }
            });
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (e) {
            console.error('Failed to load explore stats');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Compass className="text-blue-500" size={28} />
                <h1 className="text-2xl font-bold">{t('nav', 'explore')}</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-700/50 pb-px overflow-x-auto scrollbar-none">
                <button
                    onClick={() => setActiveTab('trending')}
                    className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'trending' ? 'text-blue-500 border-blue-500' : 'text-slate-400 border-transparent hover:text-white'}`}
                >
                    <TrendingUp size={16} /> Trending Posts
                </button>
                <button
                    onClick={() => setActiveTab('popular')}
                    className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'popular' ? 'text-blue-500 border-blue-500' : 'text-slate-400 border-transparent hover:text-white'}`}
                >
                    <Users size={16} /> Popular Members
                </button>
                <button
                    onClick={() => setActiveTab('tags')}
                    className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'tags' ? 'text-blue-500 border-blue-500' : 'text-slate-400 border-transparent hover:text-white'}`}
                >
                    <Hash size={16} /> Top Hashtags
                </button>
            </div>

            {/* Content Areas */}
            <div className="mt-6">
                {activeTab === 'trending' && (
                    <div className="space-y-4">
                        <div className="bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-700/50 text-slate-400">
                            <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-bold text-white mb-2">Trending Posts (Coming Soon)</h3>
                            <p className="text-sm">Posts with the most engagement across the community.</p>
                        </div>
                    </div>
                )}

                {activeTab === 'popular' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {stats && stats.active_members ? (
                            <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center gap-4 text-center">
                                <Users size={40} className="text-blue-500" />
                                <div>
                                    <div className="text-3xl font-bold text-white">{stats.active_members}</div>
                                    <div className="text-sm text-slate-400">Total Members Active Today</div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-slate-400">Loading popular members...</p>
                        )}
                    </div>
                )}

                {activeTab === 'tags' && (
                    <div className="flex flex-wrap gap-3">
                        {stats && stats.trending_tags ? stats.trending_tags.map((tag: any) => (
                            <button key={tag.name} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors font-medium text-blue-400">
                                {tag.name} <span className="text-slate-500 text-xs ml-1">({tag.count})</span>
                            </button>
                        )) : (
                            <p className="text-slate-400">Loading tags...</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
