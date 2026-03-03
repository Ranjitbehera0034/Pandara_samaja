import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Eye, Maximize2, User, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { BACKEND_URL } from '../config/apiConfig';

type VerificationApp = {
    id: number;
    member_id: string;
    membership_no: string;
    member_name: string;
    relation_to_hof: string;
    uploaded_file_url: string;
    file_type: string;
    status: string;
    submitted_at: string;
    admin_remarks?: string;
    version: number;

    // Joined from members table
    hof_name: string;
    village: string;
    district: string;
    hof_mobile: string;
    profile_photo_url?: string;
};

export default function MatrimonyVerificationQueue() {
    const { } = useTranslation();
    const [queue, setQueue] = useState<VerificationApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('pending');

    // Review Split-Screen State
    const [reviewApp, setReviewApp] = useState<VerificationApp | null>(null);
    const [remarks, setRemarks] = useState('');
    const [actioning, setActioning] = useState(false);

    useEffect(() => {
        fetchQueue();
    }, [statusFilter]);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const statusParam = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
            const res = await api.get(`/admin/matrimony-forms${statusParam}`);
            if (res.data.success) {
                setQueue(res.data.applications);
            }
        } catch {
            toast.error('Failed to load verification queue');
        } finally {
            setLoading(false);
        }
    };

    const getImageUrl = (url: string | null) => {
        if (!url) return '';
        if (url.includes('drive.google.com') || url.includes('lh3.googleusercontent.com')) {
            const driveIdMatch = url.match(/([a-zA-Z0-9_-]{25,})/);
            if (driveIdMatch && driveIdMatch[1]) {
                return `${BACKEND_URL}/api/v1/image-proxy/${driveIdMatch[1]}`;
            }
        }
        return url;
    };

    const handleReviewAction = async (action: 'approve' | 'reject' | 'correction_needed') => {
        if (!reviewApp) return;
        if (['reject', 'correction_needed'].includes(action) && !remarks.trim()) {
            toast.error('Please provide reasons/remarks for this action.');
            return;
        }

        setActioning(true);
        try {
            const res = await api.put(`/admin/matrimony-forms/${reviewApp.id}/review`, {
                action,
                remarks: remarks.trim()
            });
            if (res.data.success) {
                toast.success(res.data.message);
                setReviewApp(null);
                setRemarks('');
                fetchQueue();
            }
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to process action');
        } finally {
            setActioning(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Queue Filters */}
            <div className="flex gap-4">
                {['pending', 'correction_needed', 'approved', 'rejected', 'all'].map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${statusFilter === s
                            ? 'bg-pink-600 text-white border-pink-500 shadow-lg shadow-pink-500/20'
                            : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        {s.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Queue Grid */}
            {loading ? (
                <div className="flex justify-center p-10"><div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>
            ) : queue.length === 0 ? (
                <div className="text-center p-20 bg-white/50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl">
                    <CheckCircle className="mx-auto w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">All caught up!</h3>
                    <p className="text-slate-500">No new applications to review in this category.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {queue.map(app => (
                        <div key={app.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                            <div className="h-48 bg-slate-100 dark:bg-slate-900 relative">
                                {app.file_type === 'pdf' ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                        <FileText size={48} className="mb-2 text-pink-300" />
                                        <span>PDF Document</span>
                                    </div>
                                ) : (
                                    <img src={getImageUrl(app.uploaded_file_url)} className="w-full h-full object-cover opacity-80" alt="Form" />
                                )}
                                <div className="absolute top-4 left-4">
                                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg shadow-sm ${app.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                        app.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            app.status === 'correction_needed' ? 'bg-purple-100 text-purple-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {app.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="absolute top-4 right-4">
                                    <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-black/60 text-white rounded-lg shadow-sm backdrop-blur">
                                        v{app.version}
                                    </span>
                                </div>
                            </div>

                            <div className="p-5 flex-1">
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">{app.member_name}</h4>
                                <p className="text-xs text-slate-500 uppercase tracking-widest mt-1 mb-4">{app.relation_to_hof} • {app.membership_no}</p>

                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                        <User size={14} className="text-slate-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Head of Family</p>
                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{app.hof_name}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 pt-0">
                                <button
                                    onClick={() => setReviewApp(app)}
                                    className="w-full py-3 bg-pink-50 dark:bg-pink-500/10 hover:bg-pink-100 dark:hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                >
                                    <Eye size={16} /> Review Data & Form
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Split Screen Review Modal */}
            <AnimatePresence>
                {reviewApp && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 md:p-6 bg-slate-900/90 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 w-full h-full md:rounded-[40px] flex flex-col md:flex-row overflow-hidden shadow-2xl border border-white/10"
                        >
                            {/* Left Panel: Form Image */}
                            <div className="w-full md:w-1/2 h-1/2 md:h-full bg-slate-200 dark:bg-black relative border-b md:border-b-0 md:border-r border-slate-300 dark:border-slate-800">
                                {reviewApp.file_type === 'pdf' ? (
                                    <iframe src={getImageUrl(reviewApp.uploaded_file_url)} className="w-full h-full" />
                                ) : (
                                    <div className="w-full h-full overflow-auto relative flex items-center justify-center p-4">
                                        <img src={getImageUrl(reviewApp.uploaded_file_url)} className="max-w-full object-contain" alt="Uploaded Form" />
                                    </div>
                                )}
                                <button
                                    onClick={() => window.open(getImageUrl(reviewApp.uploaded_file_url), '_blank')}
                                    className="absolute top-4 right-4 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 backdrop-blur"
                                >
                                    <Maximize2 size={18} />
                                </button>
                            </div>

                            {/* Right Panel: Verification DB Data & Action Input */}
                            <div className="w-full md:w-1/2 h-1/2 md:h-full flex flex-col bg-slate-50 dark:bg-slate-900">
                                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-950 shrink-0">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-widest uppercase">Verification Panel</h2>
                                        <p className="text-xs text-slate-500 font-bold mt-1">Cross-check form data with DB</p>
                                    </div>
                                    <button onClick={() => setReviewApp(null)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800">
                                        <XCircle size={24} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {/* DB Data Comparison Box */}
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User size={14} /> DB Records (HoF)</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Membership No</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{reviewApp.membership_no}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Head of Family</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{reviewApp.hof_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Mobile</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{reviewApp.hof_mobile}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Address</p>
                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-200">{reviewApp.village}, {reviewApp.district}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submission Context */}
                                    <div className="bg-pink-50 dark:bg-pink-500/10 border border-pink-100 dark:border-pink-500/20 rounded-2xl p-5">
                                        <h3 className="text-xs font-black text-pink-500 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText size={14} /> Application Claim</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[10px] text-pink-400 uppercase font-bold tracking-wider">Candidate Name</p>
                                                <p className="text-lg font-black text-slate-900 dark:text-white uppercase">{reviewApp.member_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-pink-400 uppercase font-bold tracking-wider">Relation to HoF</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{reviewApp.relation_to_hof}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-pink-400 uppercase font-bold tracking-wider">Submitted On</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{new Date(reviewApp.submitted_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Input Area */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Admin Remarks / Reason</label>
                                        <textarea
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            placeholder="E.g. Approved. / Photo is blurry, please re-upload clear photo."
                                            className="w-full p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-pink-500 outline-none text-sm transition-colors text-slate-900 dark:text-slate-200 resize-none h-32"
                                        />
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">Required for Reject or Ask Correction</p>
                                    </div>
                                </div>

                                <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex gap-3 shrink-0">
                                    <button
                                        onClick={() => handleReviewAction('reject')}
                                        disabled={actioning}
                                        className="flex-1 py-4 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 rounded-xl text-xs font-black uppercase tracking-widest transition-colors border border-red-200 dark:border-red-500/20"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleReviewAction('correction_needed')}
                                        disabled={actioning}
                                        className="flex-1 py-4 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 hover:bg-amber-100 rounded-xl text-xs font-black uppercase tracking-widest transition-colors border border-amber-200 dark:border-amber-500/20"
                                    >
                                        Ask Correction
                                    </button>
                                    <button
                                        onClick={() => handleReviewAction('approve')}
                                        disabled={actioning}
                                        className="flex-1 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-green-500/20"
                                    >
                                        Approve
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
