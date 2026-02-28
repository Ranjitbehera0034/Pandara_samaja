import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, Globe } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { toast } from "sonner";

export default function Login() {
    const { login, requestOtp, loginOtpless, sendFirebaseOtp, verifyFirebaseOtp, member } = useAuth();
    const { t, lang, setLang } = useLanguage();
    const navigate = useNavigate();
    const [membershipNo, setMembershipNo] = useState("");
    const [mobile, setMobile] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [loginMethod, setLoginMethod] = useState<'whatsapp' | 'firebase'>('whatsapp');

    // Redirect if already logged in
    useEffect(() => {
        if (member) {
            navigate("/", { replace: true });
        }
    }, [member, navigate]);

    // Handle OTPless callback
    useEffect(() => {
        // @ts-ignore
        window.otpless = async (otplessUser: any) => {
            console.log("OTPless User:", otplessUser);
            if (otplessUser && otplessUser.token) {
                if (!membershipNo.trim() || !mobile.trim()) {
                    toast.error("Please enter Membership No and Mobile before using One-Tap");
                    return;
                }
                setLoading(true);
                try {
                    await loginOtpless(otplessUser.token, membershipNo, mobile);
                } catch (err) {
                    console.error("OTPless Login failed", err);
                } finally {
                    setLoading(false);
                }
            }
        };
    }, [loginOtpless, membershipNo, mobile]);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!membershipNo.trim() || !mobile.trim()) {
            toast.error(t('login', 'bothRequired'));
            return;
        }

        setLoading(true);
        try {
            if (loginMethod === 'whatsapp') {
                await requestOtp(membershipNo, mobile);
            } else {
                await sendFirebaseOtp(mobile, 'recaptcha-container');
            }
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
            if (loginMethod === 'whatsapp') {
                await login(membershipNo, mobile, otp);
            } else {
                await verifyFirebaseOtp(otp, membershipNo, mobile);
            }
            // navigate will be handled by useEffect redirect
        } catch (err) {
            // Handled by context
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-[#0f172a] relative overflow-hidden font-sans">
            {/* Background Blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px]" />

            {/* Language toggle - top right */}
            <button
                onClick={() => setLang(lang === 'en' ? 'od' : 'en')}
                className="absolute top-6 right-6 z-20 flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-full text-slate-300 hover:text-white hover:border-blue-500/50 transition-all text-sm"
            >
                <Globe size={16} />
                <span className="font-medium">{lang === 'en' ? 'ଓଡ଼ିଆ' : 'English'}</span>
            </button>

            <div className="relative z-10 w-full max-w-md p-8">
                <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 transform transition-all hover:scale-[1.01] duration-500">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2 tracking-tight">
                            {t('login', 'title')}
                        </h1>
                        <p className="text-slate-400 text-sm">{t('login', 'subtitle')}</p>
                    </div>

                    {step === 1 ? (
                        <>
                            <form onSubmit={handleRequestOtp} className="space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="membership" className="text-sm font-medium text-slate-300 ml-1">
                                        {t('login', 'membershipNo')}
                                    </label>
                                    <input
                                        id="membership"
                                        type="text"
                                        value={membershipNo}
                                        onChange={(e) => setMembershipNo(e.target.value)}
                                        placeholder={t('login', 'membershipPlaceholder')}
                                        className="w-full px-5 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-white placeholder-slate-500 transition-all shadow-inner"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="mobile" className="text-sm font-medium text-slate-300 ml-1">
                                        {t('login', 'mobileNo')}
                                    </label>
                                    <input
                                        id="mobile"
                                        type="tel"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        placeholder={t('login', 'mobilePlaceholder')}
                                        className="w-full px-5 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-white placeholder-slate-500 transition-all shadow-inner"
                                    />
                                </div>

                                <div className="flex gap-4 mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setLoginMethod('whatsapp')}
                                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${loginMethod === 'whatsapp' ? 'bg-green-600/20 text-green-400 border border-green-500/30' : 'bg-slate-800/40 text-slate-500 border border-slate-700/50'}`}
                                    >
                                        WhatsApp OTP
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLoginMethod('firebase')}
                                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${loginMethod === 'firebase' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800/40 text-slate-500 border border-slate-700/50'}`}
                                    >
                                        SMS OTP
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-4 bg-gradient-to-r ${loginMethod === 'firebase' ? 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25' : 'from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-500/25'} text-white font-semibold rounded-xl transition-all transform active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 group mt-6`}
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={20} />
                                    ) : (
                                        <>
                                            {loginMethod === 'whatsapp' ? 'Get WhatsApp OTP' : 'Get SMS OTP'}
                                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                        </>
                                    )}
                                </button>
                                <div id="recaptcha-container"></div>
                            </form>

                            <div className="my-6 flex items-center gap-4">
                                <div className="flex-1 h-px bg-slate-700/50" />
                                <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">OR</span>
                                <div className="flex-1 h-px bg-slate-700/50" />
                            </div>

                            <div id="otpless-login-container" className="flex justify-center">
                                <button
                                    id="otpless-btn"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-white text-slate-900 font-bold rounded-xl flex items-center justify-center gap-3 active:scale-[0.97] transition-all hover:bg-slate-100 border border-slate-200"
                                >
                                    <img src="https://otpless.com/favicon.ico" width="20" height="20" alt="OTPless" />
                                    <span>Verify via WhatsApp One-Tap</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="otp" className="text-sm font-medium text-slate-300 ml-1">
                                    Enter 6-Digit OTP
                                </label>
                                <input
                                    id="otp"
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="••••••"
                                    className="w-full px-5 py-3.5 bg-slate-800/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none text-white tracking-[0.8em] text-center text-2xl placeholder-slate-500 transition-all shadow-inner font-bold"
                                />
                                <p className="text-xs text-slate-400 mt-2 text-center">
                                    Check your <strong className={loginMethod === 'whatsapp' ? "text-green-400" : "text-blue-400"}>
                                        {loginMethod === 'whatsapp' ? "WhatsApp" : "Messages"}
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
                                className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                ← Back to Login
                            </button>
                        </form>
                    )}

                    <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
                        <p className="text-slate-500 text-sm">
                            {t('login', 'notMember')}{" "}
                            <a href="#" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                {t('login', 'applyMembership')}
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
