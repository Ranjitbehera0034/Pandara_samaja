import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, Globe, Search, X, MapPin, Users, Phone, Info } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { toast } from "sonner";
import { API_BASE_URL } from "../config/apiConfig";

export default function Login() {
    const { sendFirebaseOtp, verifyFirebaseOtp, member } = useAuth();
    const { t, lang, setLang } = useLanguage();
    const navigate = useNavigate();
    const [membershipNo, setMembershipNo] = useState("");
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Lookup Modal State
    const [showLookup, setShowLookup] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupQuery, setLookupQuery] = useState("");
    const [selDistrict, setSelDistrict] = useState("");
    const [selTaluka, setSelTaluka] = useState("");
    const [selPanchayat, setSelPanchayat] = useState("");
    const [filterOptions, setFilterOptions] = useState<{ districts: string[], talukas: Record<string, string[]>, panchayats: Record<string, string[]> }>({
        districts: [], talukas: {}, panchayats: {}
    });
    const [lookupResults, setLookupResults] = useState<any[]>([]);

    // Redirect if already logged in
    useEffect(() => {
        if (member) {
            navigate("/", { replace: true });
        }
    }, [member, navigate]);

    // Fetch filter options for lookup
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/members/filters`);
                const data = await res.json();
                if (data.success) setFilterOptions(data.filters);
            } catch (err) {
                console.error("Failed to fetch filters", err);
            }
        };
        fetchFilters();
    }, []);

    const handleLookup = async () => {
        if (!selDistrict && !lookupQuery) {
            toast.error("Please select a district or enter a name");
            return;
        }
        setLookupLoading(true);
        try {
            const params = new URLSearchParams({
                district: selDistrict,
                taluka: selTaluka,
                panchayat: selPanchayat,
                search: lookupQuery,
                limit: '50'
            });
            const res = await fetch(`${API_BASE_URL}/members?${params}`);
            const data = await res.json();
            if (data.success) {
                setLookupResults(data.rows);
                if (data.rows.length === 0) toast.info("No members found matching your search");
            }
        } catch (err) {
            toast.error("Failed to search members");
        } finally {
            setLookupLoading(false);
        }
    };

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!membershipNo.trim() || !mobile.trim()) {
            toast.error(t('login', 'bothRequired'));
            return;
        }

        setLoading(true);
        try {
            await sendFirebaseOtp(mobile, 'recaptcha-container');
            setStep(2);
        } catch (err) {
            // Handled by context
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp.trim()) {
            toast.error("Please enter the OTP");
            return;
        }

        setLoading(true);
        try {
            await verifyFirebaseOtp(otp, membershipNo, mobile);
            // navigate will be handled by useEffect redirect
        } catch (err) {
            // Handled by context
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-[#0f172a] relative overflow-hidden font-sans transition-colors duration-500">
            {/* Background Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px]" />

            {/* Language toggle - top right */}
            <button
                onClick={() => setLang(lang === 'en' ? 'od' : 'en')}
                className="absolute top-6 right-6 z-20 flex items-center gap-2 px-3 py-1.5 bg-white/10 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 rounded-full text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:border-blue-500/50 transition-all text-sm shadow-sm"
            >
                <Globe size={16} />
                <span className="font-medium">{lang === 'en' ? 'ଓଡ଼ିଆ' : 'English'}</span>
            </button>

            <div className="relative z-10 w-full max-w-md p-8">
                <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-8 transform transition-all hover:scale-[1.01] duration-500">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg transform -rotate-3">
                            <Users className="text-white" size={32} />
                        </div>
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-purple-400 mb-2 tracking-tight">
                            {t('login', 'title')}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t('login', 'subtitle')}</p>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleRequestOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="membership" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                                    {t('login', 'membershipNo')}
                                </label>
                                <input
                                    id="membership"
                                    type="text"
                                    value={membershipNo}
                                    onChange={(e) => setMembershipNo(e.target.value)}
                                    placeholder={t('login', 'membershipPlaceholder')}
                                    className="w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="mobile" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                                    {t('login', 'mobileNo')}
                                </label>
                                <input
                                    id="mobile"
                                    type="tel"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    placeholder={t('login', 'mobilePlaceholder')}
                                    className="w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 group mt-6"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        Get SMS OTP
                                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                    </>
                                )}
                            </button>
                            <div id="recaptcha-container"></div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="otp" className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                                    Enter 6-Digit OTP
                                </label>
                                <input
                                    id="otp"
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="••••••"
                                    className="w-full px-5 py-3.5 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-slate-900 dark:text-white tracking-[0.8em] text-center text-2xl placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm font-bold"
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                                    Check your <strong className="text-blue-600 dark:text-blue-400">
                                        Messages
                                    </strong> for the 6-digit verification code.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-green-500/25 flex items-center justify-center gap-2 group mt-6"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        {t('login', 'accessPortal')}
                                        <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                            >
                                ← Back to Login
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50 text-center">
                        <p className="text-slate-500 dark:text-slate-500 text-sm">
                            {t('login', 'notMember')}{" "}
                            <button
                                onClick={() => setShowLookup(true)}
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-semibold transition-colors decoration-2 hover:underline underline-offset-4"
                            >
                                {t('login', 'applyMembership')}
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            {/* Lookup Modal */}
            {showLookup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl scale-in-center">
                        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Search className="text-blue-500" size={24} />
                                    {t('login', 'findTitle')}
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('login', 'findSubtitle')}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowLookup(false);
                                    setLookupResults([]);
                                    setLookupQuery("");
                                }}
                                className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
                            {/* Filter Section */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">District</label>
                                    <select
                                        value={selDistrict}
                                        onChange={(e) => { setSelDistrict(e.target.value); setSelTaluka(""); setSelPanchayat(""); }}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 dark:text-white"
                                    >
                                        <option value="">Select District</option>
                                        {filterOptions.districts.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">Taluka</label>
                                    <select
                                        value={selTaluka}
                                        onChange={(e) => { setSelTaluka(e.target.value); setSelPanchayat(""); }}
                                        disabled={!selDistrict}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 dark:text-white disabled:opacity-50"
                                    >
                                        <option value="">Select Taluka</option>
                                        {selDistrict && filterOptions.talukas[selDistrict]?.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">Panchayat</label>
                                    <select
                                        value={selPanchayat}
                                        onChange={(e) => setSelPanchayat(e.target.value)}
                                        disabled={!selTaluka}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 dark:text-white disabled:opacity-50"
                                    >
                                        <option value="">Select Panchayat</option>
                                        {selTaluka && filterOptions.panchayats[selTaluka]?.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Name Search */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by name..."
                                        value={lookupQuery}
                                        onChange={(e) => setLookupQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 dark:text-white"
                                    />
                                </div>
                                <button
                                    onClick={handleLookup}
                                    disabled={lookupLoading}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/25 disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
                                >
                                    {lookupLoading ? <Loader2 className="animate-spin" size={18} /> : "Search"}
                                </button>
                            </div>

                            {/* Results */}
                            <div className="space-y-3">
                                {lookupResults.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {lookupResults.map((res: any) => (
                                            <div key={res.membership_no} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:border-blue-500/30 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                                        {res.name?.[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{res.name}</h4>
                                                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                            <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                                                <Info size={12} className="text-slate-400" />
                                                                ID: {res.membership_no}
                                                            </span>
                                                            {res.village && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin size={12} /> {res.village}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end sm:block text-right">
                                                    {res.mobile ? (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Registered Mobile</span>
                                                            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-mono font-bold mt-0.5">
                                                                <Phone size={14} />
                                                                {res.mobile}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded-lg font-bold border border-amber-500/20">
                                                            MOBILE NOT REGISTRED
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : !lookupLoading && (
                                    <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800/50">
                                        <Users size={48} className="opacity-20" />
                                        <p>Results will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-500">
                                <Info className="shrink-0 mt-0.5" size={18} />
                                <div className="text-xs leading-relaxed">
                                    <p className="font-bold mb-1">{t('login', 'mobileNotRegistered')}</p>
                                    <p>{t('login', 'howToUpdate')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
