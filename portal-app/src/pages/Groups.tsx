import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import { UsersRound, Plus, Search, MapPin, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Groups() {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [groups, setGroups] = useState<any[]>([]);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await fetch(((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api/portal' : 'https://pandara-samaja-backend.onrender.com/api/portal') + '/groups', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('portalToken')}` }
            });
            const data = await res.json();
            if (data.success) {
                setGroups(data.groups.map((g: any) => ({
                    id: g.id,
                    name: g.name,
                    icon: '👥',
                    members: parseInt(g.members_count) || 1,
                    visibility: g.privacy_level === 'private' ? 'Private' : 'Public',
                    location: 'Global'
                })));
            }
        } catch (e) {
            toast.error('Failed to load groups');
        }
    };

    const handleJoin = async (groupId: number) => {
        try {
            const res = await fetch(`${(typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api/portal' : 'https://pandara-samaja-backend.onrender.com/api/portal'}//groups/${groupId}/join`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('portalToken')}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message || 'Updated membership');
                fetchGroups();
            } else {
                toast.error(data.message || 'Failed to update membership');
            }
        } catch (e) {
            toast.error('Failed to join/leave group');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <UsersRound className="text-indigo-500" size={28} />
                    <h1 className="text-2xl font-bold">{t('nav', 'groups')}</h1>
                </div>
                <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20">
                    <Plus size={18} /> Create Group
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    placeholder="Search groups..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase())).map(group => (
                    <motion.div
                        key={group.id}
                        whileHover={{ y: -2 }}
                        className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 flex items-start gap-4 cursor-pointer hover:border-indigo-500/30 transition-all shadow-lg"
                    >
                        <div className="w-14 h-14 rounded-2xl bg-slate-700/50 flex items-center justify-center text-2xl shadow-inner shrink-0">
                            {group.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-lg truncate mr-2">{group.name}</h3>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                    <UsersRound size={12} /> {group.members} members
                                </span>
                                <span className="flex items-center gap-1">
                                    {group.location === 'Global' ? <Globe size={12} /> : <MapPin size={12} />}
                                    {group.location}
                                </span>
                            </div>
                            <div className="mt-3">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${group.visibility === 'Public' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    {group.visibility}
                                </span>
                            </div>
                        </div>
                        <button onClick={() => handleJoin(group.id)} className="px-4 py-1.5 rounded-lg border border-indigo-500/50 text-indigo-400 text-sm font-semibold hover:bg-indigo-500 hover:text-white transition-colors">
                            Join / Leave
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
