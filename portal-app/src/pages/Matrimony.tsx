import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Briefcase, GraduationCap, X, Plus, Upload, Heart, User, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api' : 'https://pandara-samaja-backend.onrender.com/api';

type Candidate = {
    id: number;
    name: string;
    gender: string;
    date_of_birth: string;
    education: string;
    occupation: string;
    income: string | null;
    height: string | null;
    complexion: string | null;
    gotra: string | null;
    address: string;
    father_name: string;
    mobile: string;
    expectations: string | null;
    photo: string | null;
    status: string;
};

export default function Matrimony() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [genderFilter, setGenderFilter] = useState('All');

    // Add Candidate Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCandidates();
    }, [genderFilter]);

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
            // Filter out matched candidates by default in portal
            setCandidates(data.filter((c: Candidate) => c.status !== 'Married' && c.status !== 'Matched'));
        } catch {
            toast.error('Could not load matrimony profiles');
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

            const res = await fetch(`${API_BASE_URL}/candidates`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) throw new Error('Submission failed');

            toast.success('Matrimony profile submitted successfully!');
            setIsAddModalOpen(false);
            fetchCandidates();
        } catch (error) {
            toast.error('Failed to submit candidate profile');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredCandidates = candidates.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.education.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.occupation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500 mb-2">
                        Community Matrimony
                    </h1>
                    <p className="text-slate-400">Find the perfect life partner within the community.</p>
                </motion.div>
                <motion.button
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-xl font-medium shadow-lg shadow-pink-500/25 flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                    <Plus size={18} /> Add Profile
                </motion.button>
            </div>

            {/* Filters */}
            <div className="bg-slate-800 rounded-2xl p-4 mb-8 border border-slate-700 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, education, origin..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl focus:outline-none focus:border-pink-500 text-white placeholder-slate-500"
                    />
                </div>
                <div className="flex gap-2 p-1 bg-slate-900 rounded-xl border border-slate-700">
                    {['All', 'Male', 'Female'].map(g => (
                        <button
                            key={g}
                            onClick={() => setGenderFilter(g)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${genderFilter === g
                                ? 'bg-slate-700 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            {/* Candidates Grid */}
            {loading ? (
                <div className="text-center py-20 text-slate-400">Loading matrimony profiles...</div>
            ) : filteredCandidates.length === 0 ? (
                <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700 border-dashed">
                    <Heart size={48} className="mx-auto text-slate-600 mb-4" />
                    <h3 className="text-lg font-medium text-slate-300">No Profiles Found</h3>
                    <p className="text-slate-500">Could not find any candidates matching your criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCandidates.map(c => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            key={c.id}
                            className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden hover:border-pink-500/30 transition-all group"
                        >
                            <div className="h-64 sm:h-72 w-full relative bg-slate-900 overflow-hidden object-top">
                                {c.photo ? (
                                    <img
                                        src={(() => {
                                            const raw = c.photo;
                                            if (!raw) return '';
                                            const m = raw.match(/id=([^&]+)/);
                                            return m ? `https://lh3.googleusercontent.com/d/${m[1]}=w1000` : raw;
                                        })()}
                                        alt={c.name}
                                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                        <User size={64} className="text-slate-600" />
                                    </div>
                                )}
                                <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-medium rounded-lg border border-white/10">
                                    {c.gender}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="text-xl font-bold text-white leading-tight flex items-center gap-2">
                                        {c.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-slate-300 text-sm mt-1">
                                        <Calendar size={14} />
                                        <span>{new Date(c.date_of_birth).toLocaleDateString()}</span>
                                        {c.height && <span className="ml-2 pl-2 border-l border-slate-600 text-slate-400">{c.height}</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="flex flex-col gap-2.5 text-sm text-slate-300">
                                    <div className="flex items-start gap-2">
                                        <GraduationCap size={16} className="text-pink-400 mt-0.5 shrink-0" />
                                        <span className="line-clamp-1">{c.education}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <Briefcase size={16} className="text-pink-400 mt-0.5 shrink-0" />
                                        <span className="line-clamp-1">{c.occupation}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin size={16} className="text-pink-400 mt-0.5 shrink-0" />
                                        <span className="line-clamp-1">{c.address}</span>
                                    </div>
                                </div>
                                <div className="pt-4 mt-2 border-t border-slate-700/50 flex justify-between items-center text-sm font-medium">
                                    <span className="text-slate-400">Father: <span className="text-slate-200">{c.father_name}</span></span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-800 rounded-2xl w-full max-w-2xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 shrink-0">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Add Matrimony Profile</h2>
                                    <p className="text-xs text-slate-400">Register a new candidate in the community.</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-6 text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-slate-200">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Candidate Photo *</label>
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl cursor-pointer transition-colors">
                                                <Upload size={16} />
                                                <span>Choose Image</span>
                                                <input type="file" name="photo" className="hidden" accept="image/*" required />
                                            </label>
                                            <span className="text-xs text-slate-500">Required image file for verification.</span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Full Name *</label>
                                        <input type="text" name="name" required className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:border-pink-500 focus:outline-none" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Gender *</label>
                                        <select name="gender" required className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:border-pink-500 focus:outline-none text-slate-200">
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Date of Birth *</label>
                                        <input type="date" name="date_of_birth" required className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:border-pink-500 focus:outline-none text-slate-200" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Education *</label>
                                        <input type="text" name="education" required placeholder="e.g. B.Tech, MBA" className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:border-pink-500 focus:outline-none" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Occupation *</label>
                                        <input type="text" name="occupation" required placeholder="e.g. Software Engineer" className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:border-pink-500 focus:outline-none" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Annual Income</label>
                                        <input type="text" name="income" placeholder="e.g. 10 LPA" className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:border-pink-500 focus:outline-none" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Height</label>
                                        <input type="text" name="height" placeholder="e.g. 5'8&quot;" className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:border-pink-500 focus:outline-none" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Gotra</label>
                                        <input type="text" name="gotra" className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:border-pink-500 focus:outline-none" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Current Address *</label>
                                        <input type="text" name="address" required className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:border-pink-500 focus:outline-none" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Father's Name *</label>
                                        <input type="text" name="father_name" required className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:border-pink-500 focus:outline-none" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Mobile *</label>
                                        <input type="text" name="mobile" required className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:border-pink-500 focus:outline-none" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-400 mb-1">Expectations</label>
                                        <textarea name="expectations" rows={3} placeholder="Partner preferences..." className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl focus:border-pink-500 focus:outline-none resize-none"></textarea>
                                    </div>
                                </div>
                            </form>
                            <div className="p-4 border-t border-slate-700 bg-slate-800 shrink-0 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button onClick={(e) => {
                                    e.preventDefault();
                                    const form = e.currentTarget.parentElement?.previousElementSibling as HTMLFormElement;
                                    if (form.reportValidity()) {
                                        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                                    }
                                }} disabled={submitting} className="px-5 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-pink-500/20 flex items-center gap-2">
                                    {submitting ? 'Submitting...' : 'Submit Profile'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
