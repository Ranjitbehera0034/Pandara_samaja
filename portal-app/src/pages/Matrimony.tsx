import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Briefcase, GraduationCap, X, Heart, User, Download, Eye, Phone, Info, Filter, ArrowUpDown, Bookmark, Star, FileText, CheckCircle2, AlertCircle, Clock, Upload, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';

import { API_BASE_URL, PORTAL_API_URL } from '../config/apiConfig';
import { getImageUrl } from '../utils/imageUtils';

type MyApplication = {
    id: number;
    status: string;
    admin_remarks?: string;
    file_type?: string;
    submitted_at: string;
};

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
};

export default function Matrimony() {
    const { t, lang } = useLanguage();
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [genderFilter, setGenderFilter] = useState('All');
    const [sortBy, setSortBy] = useState<'Default' | 'Age' | 'Name'>('Default');

    // UI State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [shortlisted, setShortlisted] = useState<number[]>([]);
    const [myApplication, setMyApplication] = useState<MyApplication | null>(null);

    // Determine if current member is Head of Family
    const memberStr = localStorage.getItem('portalMember');
    const memberObj = memberStr ? JSON.parse(memberStr) : null;
    const relation = (memberObj?.relation || '').toLowerCase();
    const isHoF = relation === 'self/head' || relation === 'self' || relation === 'head' || relation === '';

    useEffect(() => {
        const saved = localStorage.getItem('shortlisted_candidates');
        if (saved) setShortlisted(JSON.parse(saved));
        fetchCandidates();
        fetchMyApplication();
    }, [genderFilter]);

    const fetchMyApplication = async () => {
        try {
            const token = localStorage.getItem("portalToken");
            const res = await fetch(`${PORTAL_API_URL}/matrimony/my-application`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.application) {
                setMyApplication(data.application);
            }
        } catch (error) {
            console.error('Failed to fetch my matrimony application:', error);
        }
    };

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("portalToken");
            const genderParam = genderFilter !== 'All' ? `?gender=${genderFilter}` : '';
            const res = await fetch(`${API_BASE_URL}/candidates${genderParam}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            // Handle both array response and wrapped { success, candidates } response
            if (Array.isArray(data)) {
                setCandidates(data);
            } else if (data && Array.isArray(data.candidates)) {
                setCandidates(data.candidates);
            } else if (data && Array.isArray(data.data)) {
                setCandidates(data.data);
            } else {
                setCandidates([]);
            }
        } catch {
            toast.error(t('matrimony', 'failedLoad') || 'Could not load matrimony profiles');
            setCandidates([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const formData = new FormData(e.currentTarget);
            const token = localStorage.getItem("portalToken");

            const res = await fetch(`${PORTAL_API_URL}/matrimony/submit`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Submission failed');

            toast.success(data.message || 'Your form has been submitted for verification!');
            setIsAddModalOpen(false);
            fetchMyApplication(); // Refresh to show tracking card
        } catch (error: any) {
            toast.error(error.message || 'Failed to submit form');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleShortlist = (id: number) => {
        const newList = shortlisted.includes(id)
            ? shortlisted.filter(sid => sid !== id)
            : [...shortlisted, id];
        setShortlisted(newList);
        localStorage.setItem('shortlisted_candidates', JSON.stringify(newList));
        toast.success(shortlisted.includes(id) ? 'Removed from shortlist' : 'Added to shortlist');
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


    const sortedCandidates = (Array.isArray(candidates) ? [...candidates] : []).sort((a, b) => {
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
            c.name.toLowerCase().includes(query) ||
            (c.education && c.education.toLowerCase().includes(query)) ||
            (c.occupation && c.occupation.toLowerCase().includes(query)) ||
            (c.address && c.address.toLowerCase().includes(query))
        );
    });

    return (
        <div className="relative min-h-screen pb-20">
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-pink-500/30 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-red-500/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
                {/* Header Section */}
                <header className="py-10 md:py-16">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/10 text-pink-500 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-pink-500/20">
                                <Heart size={14} fill="currentColor" />
                                {t('matrimony', 'subtitle')}
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
                                {lang === 'en' ? 'Community' : 'ସମାଜ'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-500">{t('matrimony', 'title').replace('Community ', '').replace('ସମାଜ ', '')}</span>
                            </h1>
                            <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
                                {t('matrimony', 'tagline')}
                            </p>
                        </motion.div>

                        {/* HoF Action Buttons */}
                        {isHoF ? (
                            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 w-full md:w-auto">
                                <motion.a
                                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                    href="/assets/forms/matrimony_form.jpg"
                                    download
                                    className="group flex items-center gap-2 px-5 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 rounded-2xl text-sm font-bold border border-white/5 transition-all backdrop-blur-md w-full sm:w-auto justify-center sm:justify-start"
                                >
                                    <div className="p-1.5 bg-slate-900 rounded-lg group-hover:bg-slate-800 transition-colors">
                                        <Download size={16} />
                                    </div>
                                    Step 1: Download Form
                                </motion.a>

                                {(!myApplication || myApplication.status === 'correction_needed' || myApplication.status === 'rejected') && (
                                    <motion.button
                                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                        onClick={() => setIsAddModalOpen(true)}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-2xl font-bold shadow-2xl shadow-pink-500/20 hover:shadow-pink-500/40 transition-all border border-pink-400/20 w-full sm:w-auto justify-center sm:justify-start"
                                    >
                                        <Upload size={18} />
                                        {myApplication?.status === 'correction_needed' ? 'Re-upload Form' : 'Step 2: Upload Filled Form'}
                                    </motion.button>
                                )}

                                {myApplication && myApplication.status !== 'correction_needed' && myApplication.status !== 'rejected' && (
                                    <div className="px-5 py-3 bg-slate-800/50 text-slate-400 rounded-2xl text-sm font-bold border border-white/5 backdrop-blur-md flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
                                        <Clock size={16} />
                                        Form Submitted
                                    </div>
                                )}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="flex items-start gap-3 px-5 py-4 bg-slate-800/40 border border-white/5 rounded-2xl backdrop-blur-md text-sm text-slate-400 w-full md:max-w-xs"
                            >
                                <ShieldAlert size={20} className="text-amber-500 shrink-0 mt-0.5" />
                                <span>Only the <strong className="text-white">Head of Family</strong> can submit the matrimony form for family members.</span>
                            </motion.div>
                        )}
                    </div>
                </header>

                {/* Application Tracking Card */}
                {myApplication && (
                    <div className={`mb-8 p-6 rounded-[32px] border backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${myApplication.status === 'approved' ? 'bg-green-500/10 border-green-500/20' :
                        myApplication.status === 'rejected' ? 'bg-red-500/10 border-red-500/20' :
                            myApplication.status === 'correction_needed' ? 'bg-amber-500/10 border-amber-500/20' :
                                'bg-blue-500/10 border-blue-500/20'
                        }`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${myApplication.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                myApplication.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                    myApplication.status === 'correction_needed' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-blue-500/20 text-blue-400'
                                }`}>
                                {myApplication.status === 'approved' ? <CheckCircle2 size={24} /> :
                                    myApplication.status === 'rejected' ? <AlertCircle size={24} /> :
                                        myApplication.status === 'correction_needed' ? <AlertCircle size={24} /> :
                                            <Clock size={24} />}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1 tracking-tight">
                                    {myApplication.status === 'approved' ? 'Profile Approved' :
                                        myApplication.status === 'rejected' ? 'Application Rejected' :
                                            myApplication.status === 'correction_needed' ? 'Correction Requested' :
                                                'Verification Pending'}
                                </h3>
                                <p className="text-sm text-slate-300">
                                    {myApplication.status === 'approved' ? 'Your profile is now live in the directory.' :
                                        myApplication.status === 'rejected' ? 'Your application could not be approved.' :
                                            myApplication.status === 'correction_needed' ? 'We need some changes to your form data.' :
                                                'Your application is currently being reviewed by admins.'}
                                </p>
                            </div>
                        </div>

                        {myApplication.admin_remarks && (
                            <div className="bg-slate-900/50 flex-1 p-4 rounded-2xl border border-white/5 mx-0 md:mx-6 max-w-lg">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Admin Feedback</p>
                                <p className="text-sm text-slate-200">{myApplication.admin_remarks}</p>
                            </div>
                        )}

                        {myApplication.status === 'correction_needed' && (
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="px-6 py-3 bg-white text-slate-900 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                            >
                                Re-upload Form
                            </button>
                        )}
                    </div>
                )}

                {/* Filters & Tools */}
                <div className="sticky top-4 z-40 mb-12">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-3 flex flex-col lg:flex-row gap-4 shadow-2xl">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pink-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder={t('matrimony', 'searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-pink-500/50 text-white placeholder-slate-500 transition-all text-sm font-medium"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 h-14">
                                {['All', 'Male', 'Female'].map(g => (
                                    <button
                                        key={g}
                                        onClick={() => setGenderFilter(g)}
                                        className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${genderFilter === g
                                            ? 'bg-gradient-to-r from-pink-600 to-red-600 text-white shadow-lg'
                                            : 'text-slate-400 hover:text-slate-200'
                                            }`}
                                    >
                                        {g === 'All' ? <Filter size={14} /> : g === 'Male' ? <User size={14} /> : <Heart size={14} />}
                                        {g}
                                    </button>
                                ))}
                            </div>
                            <div className="relative h-14 bg-white/5 rounded-2xl border border-white/5 px-4 flex items-center gap-3">
                                <ArrowUpDown size={16} className="text-slate-500" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="bg-transparent text-xs font-bold text-slate-300 focus:outline-none uppercase tracking-widest cursor-pointer pr-4"
                                >
                                    <option className="bg-slate-900" value="Default">Sort By</option>
                                    <option className="bg-slate-900" value="Age">Age (Youngest)</option>
                                    <option className="bg-slate-900" value="Name">Name (A-Z)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-[500px] rounded-[32px] bg-slate-800/40 animate-pulse border border-white/5 shadow-inner" />
                        ))}
                    </div>
                ) : filteredCandidates.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-32 rounded-[40px] border-2 border-dashed border-white/10 bg-white/2"
                    >
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search size={32} className="text-slate-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{t('matrimony', 'noProfiles')}</h3>
                        <p className="text-slate-500 max-w-md mx-auto">Try adjusting your filters or search terms to find more community members.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setGenderFilter('All'); }}
                            className="mt-6 text-pink-500 font-bold hover:underline"
                        >
                            {t('matrimony', 'resetFilters')}
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCandidates.map((c, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={c.id}
                                className="group relative flex flex-col bg-slate-800/40 border border-white/5 rounded-[32px] overflow-hidden hover:border-pink-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-pink-500/10 hover:-translate-y-2 backdrop-blur-sm shadow-inner"
                            >
                                {/* Card Media Header */}
                                <div className="h-[340px] relative overflow-hidden bg-slate-950">
                                    {c.photo ? (
                                        <img
                                            src={getImageUrl(c.photo)}
                                            alt={c.name}
                                            className="w-full h-full object-cover object-top transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center border border-white/5">
                                                <User size={40} className="text-slate-700" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Glass Overlays */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                                    <div className="absolute top-4 inset-x-4 flex justify-between items-start">
                                        <div className="flex gap-2">
                                            <span className={`px-3 py-1.5 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-1 ${c.gender === 'Female' ? 'bg-pink-500/30 text-pink-200' : 'bg-blue-500/30 text-blue-200'}`}>
                                                {c.gender}
                                            </span>
                                            {calculateAge(c.date_of_birth || c.dob) && (
                                                <span className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest text-white border border-white/10">
                                                    {calculateAge(c.date_of_birth || c.dob)} {t('matrimony', 'years')}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleShortlist(c.id); }}
                                            className={`p-2 rounded-xl backdrop-blur-md border border-white/10 transition-all ${shortlisted.includes(c.id) ? 'bg-pink-600 text-white border-pink-500 shadow-lg shadow-pink-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                        >
                                            <Heart size={18} fill={shortlisted.includes(c.id) ? "currentColor" : "none"} />
                                        </button>
                                    </div>

                                    <div className="absolute bottom-6 left-6 right-6">
                                        <h3 className="text-2xl font-bold text-white mb-2 line-clamp-1 drop-shadow-lg">
                                            {c.name}
                                        </h3>
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <span className="flex items-center gap-1.5 text-slate-300 text-xs font-bold drop-shadow">
                                                <Star size={14} className="text-yellow-500" />
                                                {t('matrimony', 'verifiedMember')}
                                            </span>
                                            {c.height && (
                                                <span className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded text-[10px] text-white font-bold border border-white/5">
                                                    {c.height}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quick Actions Hover */}
                                    <div className="absolute inset-0 bg-pink-600/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 group-hover:backdrop-blur-[2px]">
                                        <div className="flex gap-4 scale-90 group-hover:scale-100 transition-transform duration-300">
                                            <button
                                                onClick={() => setSelectedCandidate(c)}
                                                className="w-14 h-14 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-xl hover:bg-pink-50 transition-colors"
                                            >
                                                <Info size={24} />
                                            </button>
                                            <button
                                                onClick={() => setSelectedPhoto(getImageUrl(c.photo))}
                                                className="w-14 h-14 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-xl hover:bg-pink-50 transition-colors"
                                            >
                                                <Eye size={24} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="p-7 space-y-6 flex-1">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Education</p>
                                            <p className="text-xs font-bold text-slate-200 line-clamp-1">{c.education || '---'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Profession</p>
                                            <p className="text-xs font-bold text-slate-200 line-clamp-1">{c.occupation || '---'}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 group/item">
                                        <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0 border border-pink-500/10 group-hover/item:bg-pink-500/20 transition-colors">
                                            <MapPin size={18} className="text-pink-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[1.5px]">Location</p>
                                            <p className="text-xs font-bold text-slate-300 truncate">{c.address || 'Location Unknown'}</p>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex items-center justify-between gap-4">
                                        <button
                                            onClick={() => setSelectedCandidate(c)}
                                            className="px-6 py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white border border-white/10 transition-all flex-1"
                                        >
                                            {t('matrimony', 'fullDetails')}
                                        </button>
                                        <a
                                            href={`tel:${c.mobile || c.phone}`}
                                            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 flex items-center justify-center text-green-400 border border-green-500/20 transition-all"
                                        >
                                            <Phone size={20} />
                                        </a>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Candidate Info Modal */}
            <AnimatePresence>
                {selectedCandidate && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-slate-900 rounded-[40px] w-full max-w-4xl border border-white/10 overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
                        >
                            <div className="md:w-5/12 relative h-64 md:h-auto bg-slate-800">
                                {selectedCandidate.photo ? (
                                    <img
                                        src={getImageUrl(selectedCandidate.photo)}
                                        className="w-full h-full object-cover"
                                        alt={selectedCandidate.name}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center"><User size={64} className="text-slate-700" /></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 md:bg-gradient-to-r md:from-transparent md:to-slate-900" />
                                <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
                                    <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-2 uppercase tracking-tighter shadow-sm">{selectedCandidate.name}</h2>
                                    <div className="flex gap-2">
                                        <span className="px-4 py-1.5 bg-pink-500 rounded-lg text-[10px] font-black text-white uppercase tracking-widest">{selectedCandidate.gender === 'Male' ? t('matrimony', 'male') : t('matrimony', 'female')}</span>
                                        <span className="px-4 py-1.5 bg-slate-800 rounded-lg text-[10px] font-black text-white uppercase tracking-widest">{calculateAge(selectedCandidate.date_of_birth || selectedCandidate.dob)} {t('matrimony', 'years')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="md:w-7/12 flex flex-col overflow-y-auto custom-scrollbar">
                                <div className="p-6 md:p-10 space-y-8">
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs font-black text-pink-500 uppercase tracking-[4px]">{t('matrimony', 'candidatePortfolio')}</p>
                                        <button
                                            onClick={() => setSelectedCandidate(null)}
                                            className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400"
                                        >
                                            <X size={24} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <DetailItem icon={<GraduationCap size={18} />} label={t('matrimony', 'education')} value={selectedCandidate.education} />
                                        <DetailItem icon={<Briefcase size={18} />} label={t('matrimony', 'occupation')} value={selectedCandidate.occupation} />
                                        <DetailItem icon={<MapPin size={18} />} label={t('matrimony', 'address')} value={selectedCandidate.address} />
                                        <DetailItem icon={<User size={18} />} label={t('matrimony', 'fatherName')} value={selectedCandidate.father_name || selectedCandidate.father} />
                                        <DetailItem icon={<Star size={18} />} label="Gotra" value={selectedCandidate.gotra || 'Not Specified'} />
                                        <DetailItem icon={<ArrowUpDown size={18} />} label={t('matrimony', 'income').split(' / ')[1] || 'Height'} value={selectedCandidate.height || 'Not Specified'} />
                                        <DetailItem icon={<Star size={18} />} label={t('matrimony', 'income').split(' / ')[0] || 'Income'} value={selectedCandidate.income || 'Not Specified'} />
                                        <DetailItem icon={<Phone size={18} />} label={t('matrimony', 'mobileNumber')} value={selectedCandidate.mobile || selectedCandidate.phone} />
                                    </div>

                                    {selectedCandidate.expectations && (
                                        <div className="bg-white/5 p-8 rounded-[32px] border border-white/5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-500">
                                                    <Star size={16} fill="currentColor" />
                                                </div>
                                                <p className="text-xs font-black text-slate-200 uppercase tracking-widest">{t('matrimony', 'partnerExpectations')}</p>
                                            </div>
                                            <p className="text-slate-400 text-sm italic leading-relaxed">
                                                "{selectedCandidate.expectations}"
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-auto p-8 border-t border-white/5 bg-white/2 flex gap-4">
                                    <button
                                        onClick={() => toggleShortlist(selectedCandidate.id)}
                                        className={`flex-1 h-16 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${shortlisted.includes(selectedCandidate.id) ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                                    >
                                        <Bookmark size={20} fill={shortlisted.includes(selectedCandidate.id) ? "currentColor" : "none"} />
                                        {shortlisted.includes(selectedCandidate.id) ? t('matrimony', 'shortlisted') : t('matrimony', 'shortlist')}
                                    </button>
                                    <a
                                        href={`tel:${selectedCandidate.mobile || selectedCandidate.phone}`}
                                        className="h-16 px-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:opacity-90 rounded-2xl text-white text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                                    >
                                        <Phone size={20} /> {t('matrimony', 'connectNow')}
                                    </a>
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
                        className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl cursor-zoom-out"
                    >
                        <motion.button
                            className="absolute top-8 right-8 w-14 h-14 bg-white/10 hover:bg-white/20 rounded-2xl text-white border border-white/20 transition-all flex items-center justify-center"
                            onClick={() => setSelectedPhoto(null)}
                        >
                            <X size={32} />
                        </motion.button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={selectedPhoto}
                            className="max-w-[95%] max-h-[90vh] object-contain rounded-3xl shadow-[0_0_100px_rgba(236,72,153,0.3)] border border-white/5"
                            alt="Candidate Profile"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add/Upload Modal - HoF only */}
            <AnimatePresence>
                {isAddModalOpen && isHoF && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/90 backdrop-blur-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 60 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 60 }}
                            className="bg-slate-900 rounded-t-[40px] sm:rounded-[40px] w-full sm:max-w-xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[85vh]"
                        >
                            <div className="px-6 sm:px-10 py-6 sm:py-8 border-b border-white/5 flex justify-between items-center bg-white/2 shrink-0">
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight uppercase tracking-widest">
                                        {myApplication?.status === 'correction_needed' ? 'Re-upload Corrected Form' : 'Upload Matrimony Form'}
                                    </h2>
                                    <p className="text-xs text-pink-500 font-bold mt-1 tracking-widest uppercase">Step 2 of 2 — Submit for Admin Verification</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-white p-3 rounded-2xl hover:bg-white/5 transition-all">
                                    <X size={28} />
                                </button>
                            </div>

                            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-6 sm:p-10 text-sm flex flex-col gap-6">
                                {myApplication?.status === 'correction_needed' && myApplication.admin_remarks && (
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Admin Feedback</p>
                                        <p className="text-sm text-amber-200">{myApplication.admin_remarks}</p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[3px]">{t('matrimony', 'uploadForm')} *</label>
                                    <label className="flex flex-col items-center justify-center w-full h-48 bg-white/5 border-2 border-dashed border-white/10 hover:border-pink-500/50 rounded-[32px] cursor-pointer transition-all hover:bg-white/10 active:scale-[0.98]">
                                        <div className="flex flex-col items-center justify-center p-4 text-slate-400 hover:text-pink-400">
                                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-pink-500">
                                                <FileText size={32} />
                                            </div>
                                            <p className="text-sm font-black uppercase tracking-widest">{t('matrimony', 'selectFile')}</p>
                                            <p className="text-[10px] mt-2 opacity-50 tracking-wider font-bold">PDF, PNG, JPG (Max 5MB)</p>
                                        </div>
                                        <input type="file" name="form_file" className="hidden" accept=".pdf,image/*" required />
                                    </label>
                                </div>

                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                    ⓘ Download the matrimony form (Step 1), fill it manually, and then upload the scanned/photographed copy here. Admin will review and verify before publishing.
                                </p>
                            </form>

                            <div className="p-6 sm:p-10 border-t border-white/5 bg-white/2 shrink-0 flex flex-col sm:flex-row justify-end gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-8 py-3.5 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">
                                    {t('common', 'cancel')}
                                </button>
                                <button onClick={(e) => {
                                    e.preventDefault();
                                    const form = e.currentTarget.parentElement?.previousElementSibling as HTMLFormElement;
                                    if (form.reportValidity()) {
                                        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                                    }
                                }} disabled={submitting} className="px-10 py-4 bg-gradient-to-r from-pink-600 to-red-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-2xl shadow-pink-500/20 flex items-center gap-3">
                                    {submitting ? t('common', 'loading') : 'Submit for Verification'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 20px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(236,72,153,0.3); }
            `}</style>
        </div>
    );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | null | undefined }) {
    return (
        <div className="flex gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-pink-500 border border-white/5 group-hover:bg-pink-500/10 transition-colors shrink-0">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[2px] mb-1">{label}</p>
                <p className="text-sm font-bold text-slate-200 line-clamp-1 group-hover:text-pink-200 transition-colors">{value || 'Not Specified'}</p>
            </div>
        </div>
    );
}

