import { useState, useEffect } from 'react';
import {
    Heart, Search, CheckCircle, XCircle, Trash2, MapPin,
    Briefcase, GraduationCap, Download, LayoutGrid, List,
    Calendar, Phone, User, X, ChevronDown, Eye, Pencil, RotateCcw
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

type Status = 'all' | 'pending' | 'verified' | 'approved' | 'rejected';

const STATUS_COLORS: Record<string, string> = {
    approved: 'bg-emerald-500 text-white',
    rejected: 'bg-red-500 text-white',
    verified: 'bg-teal-500 text-white',
    pending: 'bg-amber-400 text-white',
};

const STATUS_BADGE_BG: Record<string, string> = {
    approved: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    rejected: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    verified: 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    pending: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
};

export default function Matrimony() {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<Status>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [detailCandidate, setDetailCandidate] = useState<any | null>(null);
    const [statusMenuId, setStatusMenuId] = useState<number | null>(null);

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/candidates');
            if (res.data.success) {
                setCandidates(res.data.candidates || []);
            }
        } catch {
            toast.error('Failed to load candidate profiles');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected' | 'pending' | 'verified') => {
        try {
            await api.put(`/admin/candidates/${id}/status`, { status });
            setCandidates(candidates.map(c => c.id === id ? { ...c, status } : c));
            if (detailCandidate?.id === id) setDetailCandidate((prev: any) => ({ ...prev, status }));
            setStatusMenuId(null);
            toast.success(`Candidate marked as ${status}`);
        } catch {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Permanently delete this profile?')) return;
        try {
            await api.delete(`/admin/candidates/${id}`);
            setCandidates(candidates.filter(c => c.id !== id));
            if (detailCandidate?.id === id) setDetailCandidate(null);
            toast.success('Candidate profile deleted');
        } catch {
            toast.error('Failed to delete candidate');
        }
    };

    const getImageUrl = (raw: string | null) => {
        if (!raw) return '';
        const m = raw.match(/id=([^&]+)/);
        return m ? `https://lh3.googleusercontent.com/d/${m[1]}=w1000` : raw;
    };

    const counts = {
        all: candidates.length,
        pending: candidates.filter(c => c.status === 'pending').length,
        verified: candidates.filter(c => c.status === 'verified').length,
        approved: candidates.filter(c => c.status === 'approved').length,
        rejected: candidates.filter(c => c.status === 'rejected').length,
    };

    const filteredCandidates = candidates.filter(c => {
        const matchesSearch =
            (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.phone || '').includes(searchQuery) ||
            (c.id?.toString() || '').includes(searchQuery);
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const statusTabs: { key: Status; label: string }[] = [
        { key: 'all', label: 'All' },
        { key: 'pending', label: 'Pending' },
        { key: 'verified', label: 'Verified' },
        { key: 'approved', label: 'Approved' },
        { key: 'rejected', label: 'Rejected' },
    ];

    const AvatarPlaceholder = ({ gender, size = 72 }: { gender?: string; size?: number }) => (
        <div
            className="rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-md"
            style={{ width: size, height: size, minWidth: size }}
        >
            <User size={size * 0.45} className={gender === 'Female' ? 'text-pink-400' : 'text-teal-500'} />
        </div>
    );

    return (
        <div className="p-4 sm:p-6 pb-32 max-w-7xl mx-auto">

            {/* ─── Header ──────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30">
                            <Heart className="text-pink-500" size={22} />
                        </span>
                        Matrimony Approval
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                        Community Matrimony Submission &amp; Verification Portal
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-xl border transition-all ${viewMode === 'list' ? 'bg-teal-600 border-teal-600 text-white shadow-lg' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <List size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-xl border transition-all ${viewMode === 'grid' ? 'bg-teal-600 border-teal-600 text-white shadow-lg' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <LayoutGrid size={18} />
                    </button>
                </div>
            </div>

            {/* ─── Status Filter Tabs ───────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 mb-5 overflow-x-auto pb-1">
                {statusTabs.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setStatusFilter(key)}
                        className={`px-4 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-1.5 border ${statusFilter === key
                            ? 'bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-500/20'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400'
                            }`}
                    >
                        {label}
                        <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md ${statusFilter === key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}>
                            {counts[key]}
                        </span>
                    </button>
                ))}
            </div>

            {/* ─── Search & Count ───────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search candidates by name, phone, ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm focus:border-teal-500"
                    />
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-sm whitespace-nowrap font-medium">
                    Showing <span className="font-black text-slate-800 dark:text-slate-200">{filteredCandidates.length}</span> of <span className="font-black text-slate-800 dark:text-slate-200">{candidates.length}</span> candidates
                </p>
            </div>

            {/* ─── Loading ─────────────────────────────────────────────── */}
            {loading ? (
                <div className="py-32 text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-5"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Profiles...</p>
                </div>

                /* ─── Empty State ─────────────────────────────────────────── */
            ) : filteredCandidates.length === 0 ? (
                <div className="text-center py-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-900/50">
                    <Heart className="text-pink-200 dark:text-pink-900 mx-auto mb-5" size={64} />
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">No Candidates Found</h3>
                    <p className="text-slate-400 mt-2">Try adjusting your search or filter settings.</p>
                </div>

                /* ─── Card Grid ───────────────────────────────────────────── */
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredCandidates.map(candidate => {
                        const status = candidate.status || 'pending';
                        return (
                            <div
                                key={candidate.id}
                                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-slate-950/70 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                            >
                                {/* ── Top: Avatar + Status Badge ── */}
                                <div className="flex flex-col items-center pt-8 pb-4 px-5 border-b border-slate-100 dark:border-slate-800 relative">
                                    <span className={`absolute top-3 right-3 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
                                        {status}
                                    </span>
                                    {candidate.photo ? (
                                        <img
                                            src={getImageUrl(candidate.photo)}
                                            alt={candidate.name}
                                            className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-lg"
                                        />
                                    ) : (
                                        <AvatarPlaceholder gender={candidate.gender} size={80} />
                                    )}
                                    <h3 className="mt-3 text-base font-black text-slate-900 dark:text-white text-center leading-tight">
                                        {candidate.name || 'Unknown'}
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-1 font-medium">
                                        {[candidate.age && `${candidate.age} yrs`, candidate.gender, candidate.address].filter(Boolean).join(' • ')}
                                    </p>
                                </div>

                                {/* ── Details ── */}
                                <div className="px-5 py-4 space-y-2.5 flex-1">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <Calendar size={14} className="text-slate-400 shrink-0" />
                                        <span className="line-clamp-1">{candidate.dob || '--'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <GraduationCap size={14} className="text-slate-400 shrink-0" />
                                        <span className="line-clamp-1">Education: {candidate.education || '--'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <Briefcase size={14} className="text-slate-400 shrink-0" />
                                        <span className="line-clamp-1">Occupation: {candidate.occupation || '--'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <MapPin size={14} className="text-slate-400 shrink-0" />
                                        <span className="line-clamp-1">{candidate.address || '--'}</span>
                                    </div>
                                </div>

                                {/* ── Actions ── */}
                                <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                    <button
                                        onClick={() => setDetailCandidate(candidate)}
                                        className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2"
                                    >
                                        <Eye size={16} />
                                        View Form Details
                                    </button>
                                    <div className="flex gap-2">
                                        {status !== 'approved' ? (
                                            <button
                                                onClick={() => handleUpdateStatus(candidate.id, 'approved')}
                                                className="flex-1 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl font-bold text-xs transition-colors border border-emerald-200 dark:border-emerald-800"
                                            >
                                                Approve
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleUpdateStatus(candidate.id, 'pending')}
                                                className="flex-1 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl font-bold text-xs transition-colors border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-1"
                                            >
                                                <RotateCcw size={12} /> Reset
                                            </button>
                                        )}
                                        {status !== 'rejected' ? (
                                            <button
                                                onClick={() => handleUpdateStatus(candidate.id, 'rejected')}
                                                className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl font-bold text-xs transition-colors border border-red-200 dark:border-red-800"
                                            >
                                                Reject
                                            </button>
                                        ) : (
                                            <div className="flex-1 py-2 flex items-center justify-center text-xs font-black text-red-500 gap-1">
                                                <XCircle size={13} /> Rejected
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setDetailCandidate(candidate)}
                                            className="flex-1 py-2 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Pencil size={12} /> Edit
                                        </button>
                                        {/* Change Status dropdown */}
                                        <div className="relative flex-1">
                                            <button
                                                onClick={() => setStatusMenuId(statusMenuId === candidate.id ? null : candidate.id)}
                                                className="w-full py-2 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                                            >
                                                Status <ChevronDown size={12} />
                                            </button>
                                            {statusMenuId === candidate.id && (
                                                <div className="absolute bottom-full mb-1 left-0 right-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden">
                                                    {(['pending', 'verified', 'approved', 'rejected'] as const).map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => handleUpdateStatus(candidate.id, s)}
                                                            className="w-full text-left px-4 py-2.5 text-xs font-bold capitalize hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(candidate.id)}
                                            className="py-2 px-3 rounded-xl font-bold text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-slate-200 dark:border-slate-700 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                /* ─── List View ───────────────────────────────────────────── */
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    {filteredCandidates.map((candidate, i) => {
                        const status = candidate.status || 'pending';
                        return (
                            <div
                                key={candidate.id}
                                className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 px-6 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${i > 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}
                            >
                                {/* Avatar */}
                                <div className="shrink-0">
                                    {candidate.photo ? (
                                        <img
                                            src={getImageUrl(candidate.photo)}
                                            alt={candidate.name}
                                            className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 dark:border-slate-800 shadow"
                                        />
                                    ) : (
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-slate-100 dark:border-slate-800 ${candidate.gender === 'Female' ? 'bg-pink-50 dark:bg-pink-900/20' : 'bg-teal-50 dark:bg-teal-900/20'}`}>
                                            <User size={26} className={candidate.gender === 'Female' ? 'text-pink-400' : 'text-teal-500'} />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-black text-slate-900 dark:text-white text-base">{candidate.name || 'Unknown'}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>
                                            {status}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        <span className="flex items-center gap-1"><Calendar size={12} />{candidate.age ? `${candidate.age} yrs` : '--'} • {candidate.gender}</span>
                                        <span className="flex items-center gap-1"><GraduationCap size={12} />{candidate.education || '--'}</span>
                                        <span className="flex items-center gap-1"><Briefcase size={12} />{candidate.occupation || '--'}</span>
                                        <span className="flex items-center gap-1"><MapPin size={12} />{candidate.address || '--'}</span>
                                        {candidate.phone && <span className="flex items-center gap-1"><Phone size={12} />{candidate.phone}</span>}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                    <button
                                        onClick={() => setDetailCandidate(candidate)}
                                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow"
                                    >
                                        <Eye size={14} /> View Details
                                    </button>
                                    {status !== 'approved' && (
                                        <button
                                            onClick={() => handleUpdateStatus(candidate.id, 'approved')}
                                            className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors flex items-center gap-1"
                                        >
                                            <CheckCircle size={13} /> Approve
                                        </button>
                                    )}
                                    {status !== 'rejected' && (
                                        <button
                                            onClick={() => handleUpdateStatus(candidate.id, 'rejected')}
                                            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl font-bold text-xs hover:bg-red-100 transition-colors flex items-center gap-1"
                                        >
                                            <XCircle size={13} /> Reject
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(candidate.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── Detail Modal ─────────────────────────────────────────── */}
            {detailCandidate && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xl p-0 sm:p-4">
                    <div className="bg-white dark:bg-slate-900 w-full sm:rounded-3xl max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-white/10 dark:border-slate-800 animate-in slide-in-from-bottom sm:zoom-in duration-300">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">Candidate Profile</h2>
                                <p className="text-slate-400 text-xs mt-0.5 font-medium">Full submission details</p>
                            </div>
                            <button
                                onClick={() => setDetailCandidate(null)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar">

                            {/* Avatar + Name */}
                            <div className="flex items-center gap-6">
                                {detailCandidate.photo ? (
                                    <img src={getImageUrl(detailCandidate.photo)} alt={detailCandidate.name} className="w-24 h-24 rounded-[24px] object-cover border-4 border-slate-100 dark:border-slate-800 shadow-xl" />
                                ) : (
                                    <AvatarPlaceholder gender={detailCandidate.gender} size={96} />
                                )}
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{detailCandidate.name}</h3>
                                    <p className="text-slate-400 text-sm mt-1">{[detailCandidate.age && `${detailCandidate.age} yrs`, detailCandidate.gender].filter(Boolean).join(' • ')}</p>
                                    <span className={`inline-block mt-2 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${STATUS_COLORS[detailCandidate.status] || STATUS_COLORS.pending}`}>
                                        {detailCandidate.status || 'pending'}
                                    </span>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { icon: <Calendar size={16} />, label: 'Date of Birth', value: detailCandidate.dob },
                                    { icon: <User size={16} />, label: 'Gender', value: detailCandidate.gender },
                                    { icon: <GraduationCap size={16} />, label: 'Education', value: detailCandidate.education },
                                    { icon: <Briefcase size={16} />, label: 'Occupation', value: detailCandidate.occupation },
                                    { icon: <Phone size={16} />, label: 'Phone', value: detailCandidate.phone },
                                    { icon: <MapPin size={16} />, label: 'Location', value: detailCandidate.address },
                                ].map(({ icon, label, value }) => (
                                    <div key={label} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-slate-400 mb-1.5">
                                            {icon}
                                            <span className="text-[10px] font-black uppercase tracking-wider">{label}</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">{value || '--'}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Manual Form download */}
                            {detailCandidate.manual_form && (
                                <a
                                    href={getImageUrl(detailCandidate.manual_form)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 px-5 py-4 bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-2xl text-pink-700 dark:text-pink-400 font-bold text-sm hover:bg-pink-100 transition-colors"
                                >
                                    <Download size={18} /> View / Download Manual Form
                                </a>
                            )}

                            {/* Change Status panel */}
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Update Status</p>
                                <div className="flex flex-wrap gap-2">
                                    {(['pending', 'verified', 'approved', 'rejected'] as const).map(s => (
                                        <button
                                            key={s}
                                            onClick={() => handleUpdateStatus(detailCandidate.id, s)}
                                            className={`px-5 py-2.5 rounded-xl font-bold text-sm capitalize transition-all border ${detailCandidate.status === s
                                                ? STATUS_BADGE_BG[s] + ' border-current shadow-sm'
                                                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between gap-3 px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                            <button
                                onClick={() => handleDelete(detailCandidate.id)}
                                className="px-5 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors flex items-center gap-2"
                            >
                                <Trash2 size={16} /> Delete
                            </button>
                            <button
                                onClick={() => setDetailCandidate(null)}
                                className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-teal-500/20 transition-all"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
