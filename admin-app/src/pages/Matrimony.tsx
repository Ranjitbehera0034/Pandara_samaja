import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, X, Heart, User, Eye, Info, Filter, ArrowUpDown, Pencil, Trash2, ShieldCheck, Users, Plus, Upload, FileText, Download, GraduationCap, Briefcase, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUtils';
import MatrimonyVerificationQueue from '../components/MatrimonyVerificationQueue';

type Candidate = {
    id: number;
    name: string;
    gender: string;
    date_of_birth: string;
    dob?: string;
    education: string;
    occupation: string;
    income: string | null;
    height: string | null;
    complexion: string | null;
    gotra: string | null;
    address: string;
    father_name: string;
    father?: string;
    mobile: string;
    phone?: string;
    expectations: string | null;
    photo: string | null;
    status: string;
    admin_comments?: string;
    is_matched?: boolean;
    matched_status?: string;
    matched_partner_name?: string;
};

export default function Matrimony() {
    const { i18n } = useTranslation();
    const lang = i18n.language;
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [genderFilter, setGenderFilter] = useState('All');
    const [sortBy, setSortBy] = useState<'Default' | 'Age' | 'Name'>('Default');
    const [statusFilter, setStatusFilter] = useState<'All' | 'pending' | 'verified' | 'approved' | 'rejected' | 'evidence_requested'>('All');

    // View Mode State
    const [viewMode, setViewMode] = useState<'directory' | 'queue'>('queue');

    // UI State
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Admin Specific Overlays
    const [adminActionCandidate, setAdminActionCandidate] = useState<Candidate | null>(null);
    const [actionType, setActionType] = useState<'status' | 'match' | null>(null);
    const [adminComments, setAdminComments] = useState('');
    const [newStatus, setNewStatus] = useState<string>('');
    const [matchData, setMatchData] = useState({ status: 'Matched', partnerName: '', partnerGender: '' });

    // Direct Admin Add Candidate State
    const [showDirectModal, setShowDirectModal] = useState(false);
    const [directForm, setDirectForm] = useState({
        name: '', gender: '', date_of_birth: '', education: '',
        occupation: '', income: '', height: '', gotra: '',
        address: '', mobile: '', expectations: '', father_name: '',
    });
    const [directPhoto, setDirectPhoto] = useState<File | null>(null);
    const [directFormFile, setDirectFormFile] = useState<File | null>(null);
    const [directSubmitting, setDirectSubmitting] = useState(false);
    const [downloadingForm, setDownloadingForm] = useState(false);

    useEffect(() => {
        fetchCandidates();
    }, [genderFilter, statusFilter]);

    const handleDownloadForm = async () => {
        setDownloadingForm(true);
        toast.loading('Preparing download...', { id: 'form-download' });
        try {
            const token = localStorage.getItem('adminToken');
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
            const res = await fetch(`${baseUrl}/portal/documents/matrimony-form`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const data = await res.json();
            if (data.success && data.url) {
                toast.success('Download starting!', { id: 'form-download' });
                const a = document.createElement('a');
                a.href = data.url;
                a.download = 'CASTE_MATRIMONY.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                throw new Error('No URL returned');
            }
        } catch {
            toast.error('Download failed. Trying local copy...', { id: 'form-download' });
            const a = document.createElement('a');
            a.href = '/assets/forms/CASTE_MATRIMONY.pdf';
            a.download = 'CASTE_MATRIMONY.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } finally {
            setDownloadingForm(false);
        }
    };

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/candidates');
            if (res.data.success) {
                setCandidates(res.data.candidates);
            }
        } catch {
            toast.error(lang === 'or' ? 'ବିବାହ ପ୍ରୋଫାଇଲ୍ ଲୋଡ୍ କରିପାରିଲା ନାହିଁ' : 'Could not load matrimony profiles');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: string, comments: string) => {
        setSubmitting(true);
        try {
            await api.put(`/admin/candidates/${id}/status`, { status, admin_comments: comments });
            toast.success(lang === 'or' ? 'ସ୍ଥିତି ଅଦ୍ୟତନ ହେଲା' : `Candidate marked as ${status.replace('_', ' ')}`);
            setAdminActionCandidate(null);
            setActionType(null);
            fetchCandidates();
        } catch {
            toast.error(lang === 'or' ? 'ବିଫଳ ହେଲା' : 'Failed to update status');
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkMatched = async (id: number) => {
        setSubmitting(true);
        try {
            await api.put(`/admin/candidates/${id}/match`, {
                matched_status: matchData.status,
                matched_partner_name: matchData.partnerName,
                matched_partner_gender: matchData.partnerGender
            });
            toast.success(lang === 'or' ? 'ସଫଳତାର ସହ ମ୍ୟାଚ୍ କରାଗଲା' : `Candidate marked as ${matchData.status}`);
            setAdminActionCandidate(null);
            setActionType(null);
            fetchCandidates();
        } catch {
            toast.error('Failed to mark as matched');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDirectAddCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!directForm.name.trim()) { toast.error('Candidate name is required'); return; }
        setDirectSubmitting(true);
        try {
            const formData = new FormData();
            Object.entries(directForm).forEach(([k, v]) => { if (v) formData.append(k, v); });
            if (directPhoto) formData.append('photo', directPhoto);
            if (directFormFile) formData.append('manual_form', directFormFile);
            await api.post('/candidates', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success(`✅ "${directForm.name}" published to the matrimony directory!`);
            setShowDirectModal(false);
            setDirectForm({ name: '', gender: '', date_of_birth: '', education: '', occupation: '', income: '', height: '', gotra: '', address: '', mobile: '', expectations: '', father_name: '' });
            setDirectPhoto(null);
            setDirectFormFile(null);
            fetchCandidates();
        } catch (e: any) {
            toast.error(e.response?.data?.message || e.response?.data?.error || 'Failed to add candidate');
        } finally {
            setDirectSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm(lang === 'or' ? 'ଆପଣ ନିଶ୍ଚିତ କି ଆପଣ ଏହାକୁ ଡିଲିଟ୍ କରିବାକୁ ଚାହୁଁଛନ୍ତି?' : 'Are you sure you want to permanently delete this candidate?')) return;
        try {
            await api.delete(`/admin/candidates/${id}`);
            toast.success(lang === 'or' ? 'ଡିଲିଟ୍ ହେଲା' : 'Candidate profile deleted');
            if (selectedCandidate?.id === id) setSelectedCandidate(null);
            if (adminActionCandidate?.id === id) setAdminActionCandidate(null);
            fetchCandidates();
        } catch {
            toast.error('Failed to delete candidate');
        }
    };

    const calculateAge = (dob: string | undefined) => {
        if (!dob) return null;
        const birthDate = new Date(dob);
        if (isNaN(birthDate.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };


    const sortedCandidates = [...candidates]
        .filter(c => genderFilter === 'All' || c.gender?.toLowerCase() === genderFilter.toLowerCase())
        .filter(c => statusFilter === 'All' || c.status === statusFilter)
        .sort((a, b) => {
            if (sortBy === 'Age') {
                const ageA = calculateAge(a.date_of_birth || a.dob) || 0;
                const ageB = calculateAge(b.date_of_birth || b.dob) || 0;
                return ageA - ageB;
            }
            if (sortBy === 'Name') return a.name.localeCompare(b.name);
            return 0;
        });

    const filteredCandidates = sortedCandidates.filter(c => {
        const query = searchQuery.toLowerCase();
        return (
            (c.name || '').toLowerCase().includes(query) ||
            (c.education || '').toLowerCase().includes(query) ||
            (c.occupation || '').toLowerCase().includes(query) ||
            (c.address || '').toLowerCase().includes(query)
        );
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'approved': return { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-700 dark:text-green-400', border: 'border-green-200 dark:border-green-500/30' };
            case 'verified': return { bg: 'bg-teal-100 dark:bg-teal-500/20', text: 'text-teal-700 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-500/30' };
            case 'pending': return { bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/30' };
            case 'rejected': return { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-500/30' };
            case 'evidence_requested': return { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-500/30' };
            default: return { bg: 'bg-slate-100 dark:bg-slate-500/20', text: 'text-slate-700 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-500/30' };
        }
    };

    return (
        <div className="relative min-h-screen pb-20 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-pink-500/30 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-red-500/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
                {/* Header Section */}
                <header className="py-8 md:py-14">
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 min-w-0">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-500 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-pink-200 dark:border-pink-500/20">
                                    <Heart size={14} fill="currentColor" />
                                    {lang === 'or' ? 'ଆଡମିନ୍ ବିବାହ ପରିଚାଳନା' : 'Admin Matrimony Management'}
                                </div>
                                <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">
                                    {lang === 'en' ? 'Manage' : 'ପରିଚାଳନା'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-500">{lang === 'or' ? 'ପ୍ରୋଫାଇଲ୍‍' : 'Profiles'}</span>
                                </h1>
                                <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                                    {lang === 'or' ? 'ବିବାହ ପ୍ରାର୍ଥୀମାନଙ୍କୁ ସମୀକ୍ଷା, ଅନୁମୋଦନ କିମ୍ବା ମ୍ୟାଚ୍ ହୋଇଥିବା ଚିହ୍ନଟ କରନ୍ତୁ।' : 'Review, approve, reject, or mark matrimony candidates as matched.'}
                                </p>
                            </motion.div>

                            {/* Actions Group */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    onClick={handleDownloadForm}
                                    disabled={downloadingForm}
                                    className="group flex items-center justify-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-pink-600 dark:text-pink-400 rounded-2xl font-bold border border-pink-200 dark:border-pink-500/30 transition-all text-sm w-full sm:w-auto shrink-0 shadow-sm disabled:opacity-60"
                                >
                                    <Download size={18} /> {downloadingForm ? 'Preparing...' : 'Step 1: Download Form'}
                                </motion.button>

                                <motion.button
                                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    onClick={() => setShowDirectModal(true)}
                                    className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-2xl font-bold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all border border-pink-400/20 text-sm w-full sm:w-auto shrink-0"
                                >
                                    <Plus size={18} /> Add Candidate Directly
                                </motion.button>
                            </div>
                        </div>

                        {/* View Mode Tabs */}
                        <div className="flex bg-slate-200 dark:bg-slate-800/50 p-1 rounded-2xl w-full sm:w-fit overflow-x-auto">
                            <button
                                onClick={() => setViewMode('queue')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${viewMode === 'queue' ? 'bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            >
                                <ShieldCheck size={16} />
                                Verification Queue
                            </button>
                            <button
                                onClick={() => setViewMode('directory')}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${viewMode === 'directory' ? 'bg-white dark:bg-slate-700 text-pink-600 dark:text-pink-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            >
                                <Users size={16} />
                                Live Directory
                            </button>
                        </div>
                    </div>
                </header>

                {viewMode === 'queue' ? (
                    <MatrimonyVerificationQueue />
                ) : (
                    <>
                        {/* Filters & Tools */}
                        <div className="sticky top-4 z-40 mb-12">
                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl p-3 flex flex-col lg:flex-row gap-4 shadow-xl dark:shadow-2xl transition-colors">
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors" size={20} />
                                    <input
                                        type="text"
                                        placeholder={lang === 'or' ? 'ନାମ, ଶିକ୍ଷା, ସ୍ଥାନ ଖୋଜନ୍ତୁ...' : "Search name, education, location..."}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-pink-500 text-slate-900 dark:text-white placeholder-slate-500 transition-all text-sm font-medium"
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-4">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as any)}
                                        className="h-14 px-4 bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none uppercase tracking-widest cursor-pointer rounded-2xl border border-slate-200 dark:border-white/10 focus:border-pink-500 transition-all"
                                    >
                                        <option className="bg-white dark:bg-slate-900" value="All">{lang === 'or' ? 'ସମସ୍ତ ସ୍ଥିତି' : 'All Status'}</option>
                                        <option className="bg-white dark:bg-slate-900" value="verified">{lang === 'or' ? 'ଯାଞ୍ଚ ହୋଇଛି' : 'Verified'}</option>
                                        <option className="bg-white dark:bg-slate-900" value="approved">{lang === 'or' ? 'ଅନୁମୋଦିତ' : 'Approved'}</option>
                                        <option className="bg-white dark:bg-slate-900" value="pending">{lang === 'or' ? 'ବିଚାରାଧୀନ' : 'Pending'}</option>
                                        <option className="bg-white dark:bg-slate-900" value="evidence_requested">{lang === 'or' ? 'ପ୍ରମାଣ ଆବଶ୍ୟକ' : 'Evidence Req.'}</option>
                                        <option className="bg-white dark:bg-slate-900" value="rejected">{lang === 'or' ? 'ନାକଚ' : 'Rejected'}</option>
                                    </select>
                                    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 h-14">
                                        {['All', 'Male', 'Female'].map(g => (
                                            <button
                                                key={g}
                                                onClick={() => setGenderFilter(g)}
                                                className={`px-4 xl:px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${genderFilter === g
                                                    ? 'bg-gradient-to-r from-pink-600 to-red-600 text-white shadow-lg shadow-pink-500/30'
                                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                                    }`}
                                            >
                                                {g === 'All' ? <Filter size={14} /> : g === 'Male' ? <User size={14} /> : <Heart size={14} />}
                                                <span className="hidden sm:inline">
                                                    {g === 'All' ? (lang === 'or' ? 'ସମସ୍ତ' : 'All') :
                                                        g === 'Male' ? (lang === 'or' ? 'ପୁରୁଷ' : 'Male') :
                                                            (lang === 'or' ? 'ମହିଳା' : 'Female')}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative h-14 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 px-4 flex items-center gap-3 w-full sm:w-auto">
                                        <ArrowUpDown size={16} className="text-slate-400 shrink-0" />
                                        <select
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value as any)}
                                            className="w-full bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none uppercase tracking-widest cursor-pointer pr-4"
                                        >
                                            <option className="bg-white dark:bg-slate-900" value="Default">{lang === 'or' ? 'ସଜାଡନ୍ତୁ' : 'Sort By'}</option>
                                            <option className="bg-white dark:bg-slate-900" value="Age">{lang === 'or' ? 'ବୟସ' : 'Age'}</option>
                                            <option className="bg-white dark:bg-slate-900" value="Name">{lang === 'or' ? 'ନାମ' : 'Name (A-Z)'}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content Grid */}
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-[500px] rounded-[32px] bg-white dark:bg-white/5 animate-pulse border border-slate-200 dark:border-white/10 shadow-sm" />
                                ))}
                            </div>
                        ) : filteredCandidates.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-center py-32 rounded-[40px] border-2 border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-white/5"
                            >
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Search size={32} className="text-slate-400 dark:text-slate-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{lang === 'or' ? 'କୌଣସି ପ୍ରୋଫାଇଲ୍ ମିଳିଲା ନାହିଁ' : 'No Profiles Found'}</h3>
                                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">Try adjusting your filters or search terms.</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setGenderFilter('All'); setStatusFilter('All'); }}
                                    className="mt-6 text-pink-500 font-bold hover:underline"
                                >
                                    {lang === 'or' ? 'ଫିଲ୍ଟର୍ ରିସେଟ୍ କରନ୍ତୁ' : 'Reset Filters'}
                                </button>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredCandidates.map((c, index) => {
                                    const statusStyle = getStatusStyle(c.status);
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: Math.min(index * 0.05, 0.5) }}
                                            key={c.id}
                                            className={`group relative flex flex-col bg-white dark:bg-slate-800 border ${c.is_matched ? 'border-amber-400 dark:border-amber-500/50 opacity-80' : 'border-slate-200 dark:border-white/10'} rounded-[32px] overflow-hidden hover:border-pink-500/50 dark:hover:border-pink-500/40 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-pink-500/10 hover:-translate-y-2`}
                                        >
                                            {/* Card Media Header */}
                                            <div className="h-[280px] relative overflow-hidden bg-slate-100 dark:bg-slate-950">
                                                {c.photo ? (
                                                    <img
                                                        src={getImageUrl(c.photo)}
                                                        alt={c.name}
                                                        className="w-full h-full object-cover object-top transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/5 shadow-sm">
                                                            <User size={40} className="text-slate-300 dark:text-slate-700" />
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80" />

                                                <div className="absolute top-4 inset-x-4 flex justify-between items-start">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex gap-2">
                                                            <span className={`px-3 py-1.5 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest border flex items-center gap-1 ${c.gender === 'Female' ? 'bg-pink-100/80 dark:bg-pink-500/30 text-pink-700 dark:text-pink-200 border-pink-200 dark:border-pink-500/30' : 'bg-blue-100/80 dark:bg-blue-500/30 text-blue-700 dark:text-blue-200 border-blue-200 dark:border-blue-500/30'}`}>
                                                                {c.gender === 'Female' ? (lang === 'or' ? 'ମହିଳା' : 'Female') : (lang === 'or' ? 'ପୁରୁଷ' : 'Male')}
                                                            </span>
                                                            {calculateAge(c.date_of_birth || c.dob) && (
                                                                <span className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/20">
                                                                    {calculateAge(c.date_of_birth || c.dob)} {lang === 'or' ? 'ବର୍ଷ' : 'YRS'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className={`self-start px-3 py-1.5 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                                            {lang === 'or' ? (c.status === 'approved' ? 'ଅନୁମୋଦିତ' : c.status === 'pending' ? 'ବିଚାରାଧୀନ' : c.status === 'evidence_requested' ? 'ପ୍ରମାଣ ଆବଶ୍ୟକ' : c.status === 'rejected' ? 'ନାକଚ' : c.status === 'verified' ? 'ଯାଞ୍ଚ ହୋଇଛି' : c.status) : c.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    {c.is_matched && (
                                                        <span className="px-3 py-1.5 bg-amber-500/90 dark:bg-amber-500/70 text-amber-950 dark:text-amber-100 rounded-xl backdrop-blur-md text-[10px] font-black uppercase tracking-widest border border-amber-400 dark:border-amber-500 flex items-center gap-1">
                                                            <Heart size={12} fill="currentColor" /> {c.matched_status}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="absolute bottom-4 left-6 right-6">
                                                    <h3 className="text-2xl font-bold text-white line-clamp-1 drop-shadow-md">
                                                        {c.name}
                                                    </h3>
                                                </div>

                                                {/* Image Preview Hover */}
                                                <div className="absolute inset-0 bg-pink-600/10 dark:bg-pink-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 pointer-events-none">
                                                    <button
                                                        onClick={() => setSelectedPhoto(getImageUrl(c.photo))}
                                                        className="w-14 h-14 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-xl hover:bg-pink-50 hover:text-pink-600 transition-colors pointer-events-auto"
                                                    >
                                                        <Eye size={24} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Content Details */}
                                            <div className="p-6 space-y-5 flex-1 flex flex-col">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">{lang === 'or' ? 'ଶିକ୍ଷା' : 'Education'}</p>
                                                        <p className="text-xs font-bold text-slate-900 dark:text-slate-200 line-clamp-1">{c.education || '---'}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">{lang === 'or' ? 'ବୃତ୍ତି / ପେଷା' : 'Profession'}</p>
                                                        <p className="text-xs font-bold text-slate-900 dark:text-slate-200 line-clamp-1">{c.occupation || '---'}</p>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 flex items-center gap-4 group/item mt-auto border border-slate-100 dark:border-transparent">
                                                    <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-500/10 flex items-center justify-center shrink-0 border border-pink-200 dark:border-pink-500/10 group-hover/item:bg-pink-200 dark:group-hover/item:bg-pink-500/20 transition-colors">
                                                        <MapPin size={18} className="text-pink-600 dark:text-pink-500" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[1.5px]">{lang === 'or' ? 'ସ୍ଥାନ' : 'Location'}</p>
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{c.address || 'Unknown'}</p>
                                                    </div>
                                                </div>

                                                {/* Admin Action Buttons */}
                                                <div className="grid grid-cols-2 gap-2 mt-4">
                                                    <button
                                                        onClick={() => { setAdminActionCandidate(c); setActionType('status'); setNewStatus(c.status); setAdminComments(c.admin_comments || ''); }}
                                                        className="px-4 py-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Pencil size={14} /> Update
                                                    </button>
                                                    {!c.is_matched && (
                                                        <button
                                                            onClick={() => { setAdminActionCandidate(c); setActionType('match'); setMatchData({ status: 'Matched', partnerName: '', partnerGender: '' }); }}
                                                            className="px-4 py-3 bg-pink-50 dark:bg-pink-600/20 hover:bg-pink-100 dark:hover:bg-pink-600/40 rounded-xl text-[10px] font-black uppercase tracking-widest text-pink-600 dark:text-pink-300 border border-pink-200 dark:border-pink-500/30 transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Heart size={14} /> Match
                                                        </button>
                                                    )}
                                                    {c.is_matched && (
                                                        <button
                                                            onClick={() => setSelectedCandidate(c)}
                                                            className="px-4 py-3 bg-pink-600 hover:bg-pink-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2"
                                                        >
                                                            <Info size={14} /> Details
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Admin Action Modal (Status & Comments) */}
            <AnimatePresence>
                {adminActionCandidate && actionType === 'status' && (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl p-8"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{lang === 'or' ? 'ସ୍ଥିତି ଅଦ୍ୟତନ' : 'Update Status'}</h3>
                                <button onClick={() => setAdminActionCandidate(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={24} /></button>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-transparent rounded-2xl mb-6">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                                    {adminActionCandidate.photo ? (
                                        <img src={getImageUrl(adminActionCandidate.photo)} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><User size={20} className="text-slate-400" /></div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{adminActionCandidate.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{lang === 'or' ? 'ବର୍ତ୍ତମାନର ସ୍ଥିତି: ' : 'Current Status: '}{adminActionCandidate.status.replace('_', ' ')}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[2.5px]">{lang === 'or' ? 'ନୂତନ ସ୍ଥିତି' : 'New Status'}</label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:border-pink-500 outline-none text-slate-900 dark:text-white text-sm font-bold transition-colors"
                                    >
                                        <option value="pending" className="bg-white dark:bg-slate-900">{lang === 'or' ? 'ବିଚାରାଧୀନ' : 'Pending'}</option>
                                        <option value="verified" className="bg-white dark:bg-slate-900">{lang === 'or' ? 'ଯାଞ୍ଚ ହୋଇଛି' : 'Verified'}</option>
                                        <option value="approved" className="bg-white dark:bg-slate-900">{lang === 'or' ? 'ଅନୁମୋଦିତ' : 'Approved'}</option>
                                        <option value="evidence_requested" className="bg-white dark:bg-slate-900">{lang === 'or' ? 'ପ୍ରମାଣ ଆବଶ୍ୟକ' : 'Request Evidence'}</option>
                                        <option value="rejected" className="bg-white dark:bg-slate-900">{lang === 'or' ? 'ନାକଚ' : 'Rejected'}</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[2.5px]">{lang === 'or' ? 'ଆଡମିନ୍ ମନ୍ତବ୍ୟ (ୟୁଜର୍ କୁ ପଠାଯିବ)' : 'Admin Comments (Sent to User)'}</label>
                                    <textarea
                                        value={adminComments}
                                        onChange={(e) => setAdminComments(e.target.value)}
                                        placeholder="E.g. Please upload a clearer photo, or submit Aadhar copy."
                                        rows={4}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:border-pink-500 outline-none text-slate-900 dark:text-white text-sm font-bold resize-none transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <button
                                    onClick={() => handleDelete(adminActionCandidate.id)}
                                    className="px-6 py-4 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 rounded-2xl transition-colors flex items-center justify-center border border-red-200 dark:border-red-500/20"
                                    title="Delete Candidate"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(adminActionCandidate.id, newStatus, adminComments)}
                                    disabled={submitting}
                                    className="flex-1 px-8 py-4 bg-gradient-to-r from-pink-600 to-red-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-pink-500/20"
                                >
                                    {submitting ? (lang === 'or' ? 'ଅପେକ୍ଷା କରନ୍ତୁ...' : 'Saving...') : (lang === 'or' ? 'ସେଭ୍ କରନ୍ତୁ' : 'Save Changes')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Admin Action Modal ({lang === 'or' ? 'ମ୍ୟାଚ୍ ହୋଇଛି ବୋଲି ଚିହ୍ନଟ କରନ୍ତୁ' : 'Mark Matched'}) */}
            <AnimatePresence>
                {adminActionCandidate && actionType === 'match' && (
                    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-lg border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl p-8"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500 uppercase tracking-tighter">{lang === 'or' ? 'ମ୍ୟାଚ୍ ହୋଇଛି ବୋଲି ଚିହ୍ନଟ କରନ୍ତୁ' : 'Mark Matched'}</h3>
                                <button onClick={() => setAdminActionCandidate(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={24} /></button>
                            </div>

                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{lang === 'or' ? 'ଏକ ସଫଳ ମ୍ୟାଚ୍ ରେକର୍ଡ କରନ୍ତୁ:' : 'Record a successful match for'} <strong className="text-slate-900 dark:text-white">{adminActionCandidate.name}</strong>. {lang === 'or' ? 'ସେମାନଙ୍କ ପ୍ରୋଫାଇଲ୍ ଲୁଚାଯିବ' : 'Their profile will be hidden'} {lang === 'or' ? 'ଏବଂ କେବଳ ଆଡମିନ୍ ଦେଖିପାରିବେ ।' : 'from the public feed but kept in the administrative record.'}</p>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[2.5px]">{lang === 'or' ? 'ମ୍ୟାଚ୍ ଘଟଣା' : 'Match Event'}</label>
                                    <select
                                        value={matchData.status}
                                        onChange={(e) => setMatchData({ ...matchData, status: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:border-amber-500 outline-none text-slate-900 dark:text-white text-sm font-bold"
                                    >
                                        <option value="Matched" className="bg-white dark:bg-slate-900">{lang === 'or' ? 'ମ୍ୟାଚ୍ ହୋଇଛି' : 'Matched'}</option>
                                        <option value="Engaged" className="bg-white dark:bg-slate-900">{lang === 'or' ? 'ନିର୍ବନ୍ଧ' : 'Engaged'}</option>
                                        <option value="Married" className="bg-white dark:bg-slate-900">{lang === 'or' ? 'ବିବାହ' : 'Married'}</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[2.5px]">{lang === 'or' ? 'ସାଥୀଙ୍କ ନାମ' : 'Partner Name'} (Optional)</label>
                                    <input
                                        type="text"
                                        value={matchData.partnerName}
                                        onChange={(e) => setMatchData({ ...matchData, partnerName: e.target.value })}
                                        placeholder="Who did they match with?"
                                        className="w-full px-5 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl focus:border-amber-500 outline-none text-slate-900 dark:text-white text-sm font-bold"
                                    />
                                </div>
                            </div>

                            <div className="mt-8">
                                <button
                                    onClick={() => handleMarkMatched(adminActionCandidate.id)}
                                    disabled={submitting}
                                    className="w-full px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-amber-500/20"
                                >
                                    {submitting ? (lang === 'or' ? 'ଅପେକ୍ଷା କରନ୍ତୁ...' : 'Saving...') : (lang === 'or' ? 'ମ୍ୟାଚ୍ ନିଶ୍ଚିତ କରନ୍ତୁ ✨' : 'Confirm Match ✨')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Candidate Details Modal */}
            <AnimatePresence>
                {selectedCandidate && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-[40px] w-full max-w-4xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
                        >
                            {/* Detailed view similar to user side */}
                            <div className="md:w-5/12 relative h-64 md:h-auto bg-slate-100 dark:bg-slate-800">
                                {selectedCandidate.photo ? (
                                    <img
                                        src={getImageUrl(selectedCandidate.photo)}
                                        className="w-full h-full object-cover"
                                        alt={selectedCandidate.name}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><User size={64} className="text-slate-300 dark:text-slate-700" /></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 md:bg-gradient-to-r md:from-transparent md:to-slate-900/80" />
                                <div className="absolute top-6 left-6 flex flex-col gap-2">
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur border border-white/30 rounded-lg text-[10px] font-black text-white uppercase tracking-widest shadow-sm">{selectedCandidate.status}</span>
                                    {selectedCandidate.is_matched && (
                                        <span className="px-3 py-1 bg-amber-500 border border-amber-400 rounded-lg text-[10px] font-black text-amber-950 uppercase tracking-widest shadow-sm">{selectedCandidate.matched_status || 'Matched'}</span>
                                    )}
                                </div>
                                <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
                                    <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-2 uppercase tracking-tighter drop-shadow-md">{selectedCandidate.name}</h2>
                                    <div className="flex gap-2">
                                        <span className="px-4 py-1.5 bg-pink-500 rounded-lg text-[10px] font-black text-white uppercase tracking-widest shadow-sm">{selectedCandidate.gender}</span>
                                        <span className="px-4 py-1.5 bg-slate-800/80 backdrop-blur-sm rounded-lg text-[10px] font-black text-white uppercase tracking-widest shadow-sm">{calculateAge(selectedCandidate.date_of_birth || selectedCandidate.dob)} {lang === 'or' ? 'ବର୍ଷ' : 'YRS'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="md:w-7/12 flex flex-col overflow-y-auto">
                                <div className="p-6 md:p-10 space-y-8">
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs font-black text-pink-500 uppercase tracking-[4px]">{lang === 'or' ? 'ପ୍ରାର୍ଥୀ ବିବରଣୀ' : 'Candidate Dossier'}</p>
                                        <button onClick={() => setSelectedCandidate(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400">
                                            <X size={24} />
                                        </button>
                                    </div>

                                    {selectedCandidate.is_matched && (
                                        <div className="p-6 bg-gradient-to-r from-amber-50 dark:from-amber-500/10 to-orange-50 dark:to-orange-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-start gap-4 shadow-sm">
                                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-500 shrink-0"><Heart size={20} fill="currentColor" /></div>
                                            <div>
                                                <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">{selectedCandidate.matched_status || 'Matched'}</h4>
                                                <p className="text-amber-600 dark:text-amber-200/70 text-sm">
                                                    {selectedCandidate.matched_partner_name
                                                        ? `Matched/Married/Engaged to ${selectedCandidate.matched_partner_name}`
                                                        : 'Candidate has successfully found a match.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {selectedCandidate.admin_comments && (
                                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] mb-2">{lang === 'or' ? 'ଆଡମିନ୍ ମନ୍ତବ୍ୟ' : 'Admin Comments'}</p>
                                            <p className="text-slate-700 dark:text-slate-300 text-sm italic">"{selectedCandidate.admin_comments}"</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">{lang === 'or' ? 'ଶିକ୍ଷା' : 'Education'}</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{selectedCandidate.education || '---'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">{lang === 'or' ? 'ବୃତ୍ତି / ପେଷା' : 'Occupation'}</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{selectedCandidate.occupation || '---'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">{lang === 'or' ? 'ଠିକଣା' : 'Address'}</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{selectedCandidate.address || '---'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">{lang === 'or' ? 'ପିତାଙ୍କ ନାମ' : 'Father'}</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{selectedCandidate.father_name || selectedCandidate.father || '---'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">{lang === 'or' ? 'ଆୟ' : 'Income'}</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{selectedCandidate.income || '---'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px]">{lang === 'or' ? 'ମୋବାଇଲ୍' : 'Mobile'}</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{selectedCandidate.mobile || selectedCandidate.phone || '---'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-auto p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/2 flex gap-4">
                                    <button
                                        onClick={() => { setSelectedCandidate(null); setAdminActionCandidate(selectedCandidate); setActionType('status'); setNewStatus(selectedCandidate.status); setAdminComments(selectedCandidate.admin_comments || ''); }}
                                        className="flex-1 py-4 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/20 border border-slate-200 dark:border-transparent rounded-xl text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <Pencil size={18} /> {lang === 'or' ? 'ଅପଡେଟ୍ / ଏଡିଟ୍' : 'Update / Edit'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Photo Preview Modal */}
            <AnimatePresence>
                {selectedPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setSelectedPhoto(null)}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 dark:bg-black/95 backdrop-blur-2xl cursor-zoom-out"
                    >
                        <motion.button className="absolute top-8 right-8 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl text-white border border-white/20 transition-all flex items-center justify-center">
                            <X size={32} />
                        </motion.button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            src={selectedPhoto}
                            alt="Full Preview"
                            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Direct Admin Add Candidate Modal (bottom-sheet on mobile) */}
            <AnimatePresence>
                {showDirectModal && (
                    <div className="fixed inset-0 z-[170] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, y: 80 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 80 }}
                            className="bg-slate-900 rounded-t-[40px] sm:rounded-[40px] w-full sm:max-w-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]"
                        >
                            <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-white/5 flex justify-between items-center shrink-0">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/10 text-pink-400 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-pink-500/20">
                                        <Heart size={12} fill="currentColor" /> Admin Direct Entry
                                    </div>
                                    <h2 className="text-xl font-black text-white tracking-tight">Add Candidate Directly</h2>
                                    <p className="text-xs text-slate-400 mt-1">Admin-created candidates are auto-approved and immediately visible in the directory.</p>
                                </div>
                                <button onClick={() => setShowDirectModal(false)} className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800">
                                    <X size={22} />
                                </button>
                            </div>

                            <form onSubmit={handleDirectAddCandidate} className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5">
                                {/* Candidate Name — required */}
                                <div>
                                    <label className="block text-[10px] font-black text-pink-400 uppercase tracking-widest mb-1">Candidate Name <span className="text-red-400">*</span></label>
                                    <input
                                        type="text" required
                                        value={directForm.name}
                                        onChange={e => setDirectForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="Full legal name of the candidate"
                                        className="w-full px-4 py-3 bg-slate-950 border border-pink-500/40 rounded-xl text-sm text-white focus:border-pink-500 outline-none font-bold"
                                    />
                                </div>

                                {/* Optional Profile Fields */}
                                <div className="border-t border-white/5 pt-4">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Profile Details (Optional)</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender</label>
                                            <select value={directForm.gender} onChange={e => setDirectForm(f => ({ ...f, gender: e.target.value }))} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-pink-500 outline-none">
                                                <option value="">Select gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Date of Birth</label>
                                            <input type="date" value={directForm.date_of_birth} onChange={e => setDirectForm(f => ({ ...f, date_of_birth: e.target.value }))} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-pink-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"><GraduationCap size={12} className="inline mr-1" />Education</label>
                                            <input type="text" value={directForm.education} onChange={e => setDirectForm(f => ({ ...f, education: e.target.value }))} placeholder="e.g. B.Tech, MBA" className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-pink-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"><Briefcase size={12} className="inline mr-1" />Occupation</label>
                                            <input type="text" value={directForm.occupation} onChange={e => setDirectForm(f => ({ ...f, occupation: e.target.value }))} placeholder="e.g. Software Engineer" className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-pink-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Income (Annual)</label>
                                            <input type="text" value={directForm.income} onChange={e => setDirectForm(f => ({ ...f, income: e.target.value }))} placeholder="e.g. ₹5 LPA" className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-pink-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Height</label>
                                            <input type="text" value={directForm.height} onChange={e => setDirectForm(f => ({ ...f, height: e.target.value }))} placeholder={`e.g. 5'6"`} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-pink-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gotra</label>
                                            <input type="text" value={directForm.gotra} onChange={e => setDirectForm(f => ({ ...f, gotra: e.target.value }))} placeholder="e.g. Kashyap" className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-pink-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"><Phone size={12} className="inline mr-1" />Mobile</label>
                                            <input type="tel" value={directForm.mobile} onChange={e => setDirectForm(f => ({ ...f, mobile: e.target.value }))} placeholder="10-digit mobile" className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-pink-500 outline-none" />
                                        </div>
                                    </div>
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"><MapPin size={12} className="inline mr-1" />Address / Village</label>
                                            <input type="text" value={directForm.address} onChange={e => setDirectForm(f => ({ ...f, address: e.target.value }))} placeholder="Village, District, State" className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-pink-500 outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Partner Expectations</label>
                                            <textarea value={directForm.expectations} onChange={e => setDirectForm(f => ({ ...f, expectations: e.target.value }))} placeholder="Optional notes about partner expectations" rows={2} className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:border-pink-500 outline-none resize-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* File Uploads */}
                                <div className="border-t border-white/5 pt-4 space-y-4">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Uploads (Optional)</p>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"><Upload size={12} className="inline mr-1" />Candidate Photo</label>
                                        <label className="flex items-center gap-3 px-4 py-3 bg-slate-950 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-pink-500/50 transition-colors">
                                            <User size={16} className="text-pink-400 shrink-0" />
                                            <span className="text-sm text-slate-400 truncate">{directPhoto ? directPhoto.name : 'Click to upload candidate photo (JPG, PNG)'}</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={e => setDirectPhoto(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1"><FileText size={12} className="inline mr-1" />Filled Matrimony Form (Scan/Photo)</label>
                                        <label className="flex items-center gap-3 px-4 py-3 bg-slate-950 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-pink-500/50 transition-colors">
                                            <FileText size={16} className="text-pink-400 shrink-0" />
                                            <span className="text-sm text-slate-400 truncate">{directFormFile ? directFormFile.name : 'Upload scanned form (PDF, JPG, PNG)'}</span>
                                            <input type="file" className="hidden" accept=".pdf,image/*" onChange={e => setDirectFormFile(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                    <div>
                                        <button
                                            onClick={handleDownloadForm}
                                            disabled={downloadingForm}
                                            className="inline-flex items-center gap-2 text-xs text-pink-400 hover:text-pink-300 font-bold transition-colors disabled:opacity-60"
                                        >
                                            <Download size={14} /> {downloadingForm ? 'Preparing...' : 'Download blank matrimony form'}
                                        </button>
                                    </div>
                                </div>
                            </form>

                            <div className="px-5 sm:px-8 py-4 sm:py-6 border-t border-white/5 flex flex-col sm:flex-row gap-3 shrink-0">
                                <button type="button" onClick={() => setShowDirectModal(false)} className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDirectAddCandidate as any}
                                    disabled={directSubmitting || !directForm.name.trim()}
                                    className="flex-1 py-4 bg-gradient-to-r from-pink-600 to-red-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-2xl shadow-pink-500/20 flex items-center justify-center gap-2"
                                >
                                    {directSubmitting ? (
                                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Publishing...</>
                                    ) : (
                                        <><Plus size={16} /> Publish to Directory</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}
