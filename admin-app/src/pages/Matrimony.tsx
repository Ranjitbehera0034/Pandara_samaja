import { useState, useEffect } from 'react';
import { Heart, Search, CheckCircle, XCircle, Trash2, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export default function Matrimony() {
    const { t } = useTranslation();
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/candidates');
            if (res.data.success) {
                setCandidates(res.data.candidates);
            }
        } catch (error) {
            toast.error('Failed to load candidate profiles');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected' | 'pending') => {
        try {
            await api.put(`/admin/candidates/${id}/status`, { status });
            setCandidates(candidates.map(c => c.id === id ? { ...c, status } : c));
            toast.success(`Candidate marked as ${status}`);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to completely delete this profile?')) return;
        try {
            await api.delete(`/admin/candidates/${id}`);
            setCandidates(candidates.filter(c => c.id !== id));
            toast.success('Candidate profile deleted');
        } catch (error) {
            toast.error('Failed to delete candidate');
        }
    };

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.phone && c.phone.includes(searchQuery));
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getImageUrl = (raw: string | null) => {
        if (!raw) return '';
        const m = raw.match(/id=([^&]+)/);
        return m ? `https://lh3.googleusercontent.com/d/${m[1]}=w1000` : raw;
    };

    return (
        <div className="p-8 pb-32 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Heart className="text-pink-500" size={32} />
                        {t('matrimony_approval')}
                    </h1>
                    <p className="text-slate-500 mt-1">{t('review_approve_manage')}</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder={t('search_candidates')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-all shadow-sm"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'approved', 'rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status as any)}
                            className={`px-4 py-2 font-medium text-sm rounded-xl transition-colors capitalize ${statusFilter === status
                                ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md'
                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            {t(status)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading candidates...</p>
                </div>
            ) : filteredCandidates.length === 0 ? (
                <div className="bg-white border text-center border-slate-200 py-20 rounded-2xl border-dashed">
                    <Heart className="text-slate-300 mx-auto mb-4" size={48} />
                    <h3 className="text-lg font-medium text-slate-900">{t('no_candidates_found')}</h3>
                    <p className="text-slate-500 mt-1">{t('adjust_filters')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCandidates.map(candidate => (
                        <div key={candidate.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                            {/* Profile Image & Status Badge */}
                            <div className="relative h-48 bg-slate-100 flex items-center justify-center border-b border-slate-200 shrink-0">
                                {candidate.photo ? (
                                    <img src={getImageUrl(candidate.photo)} alt={candidate.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Heart size={48} className="text-slate-300" />
                                )}

                                {/* Status badge */}
                                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm ${candidate.status === 'approved' ? 'bg-green-500/90 text-white' :
                                    candidate.status === 'rejected' ? 'bg-red-500/90 text-white' :
                                        'bg-amber-500/90 text-white'
                                    }`}>
                                    {candidate.status || 'pending'}
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <h2 className="text-xl font-bold text-slate-900 mb-1">{candidate.name}</h2>
                                <div className="text-sm font-medium text-slate-500 mb-4">{candidate.age} yrs • {candidate.height} • {candidate.gender}</div>

                                <div className="space-y-2 mb-6 text-sm text-slate-600">
                                    <div className="flex gap-2 items-start">
                                        <Briefcase size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                        <span className="line-clamp-1">{candidate.occupation || 'N/A'}</span>
                                    </div>
                                    <div className="flex gap-2 items-start">
                                        <GraduationCap size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                        <span className="line-clamp-1">{candidate.education || 'N/A'}</span>
                                    </div>
                                    <div className="flex gap-2 items-start">
                                        <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{candidate.address || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                                    {/* Action buttons based on current status */}
                                    <div className="flex gap-2 flex-1">
                                        {candidate.status !== 'approved' && (
                                            <button
                                                onClick={() => handleUpdateStatus(candidate.id, 'approved')}
                                                className="flex-1 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <CheckCircle size={16} /> Approve
                                            </button>
                                        )}
                                        {candidate.status !== 'rejected' && (
                                            <button
                                                onClick={() => handleUpdateStatus(candidate.id, 'rejected')}
                                                className="flex-1 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1.5"
                                            >
                                                <XCircle size={16} /> Reject
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleDelete(candidate.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                        title="Permanently Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
