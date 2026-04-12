import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import api from '../services/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [mfaCode, setMfaCode] = useState('');
    const [mfaToken, setMfaToken] = useState('');
    const [qrCodeData, setQrCodeData] = useState('');
    const [currentStep, setCurrentStep] = useState<'login' | 'mfa_verify' | 'mfa_setup'>('login');
    const { login } = useAdminAuth();
    const navigate = useNavigate();

    const handlePortalSso = (resData: any) => {
        if (resData.portalData) {
            localStorage.setItem('portalMember', JSON.stringify(resData.portalData.member));
            localStorage.setItem('portalUser', JSON.stringify(resData.portalData.loggedInUser));
            localStorage.setItem('portalToken', resData.portalData.token);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/login', { username, password });
            if (res.data.success) {
                if (res.data.mfa_setup_required) {
                    setMfaToken(res.data.token);
                    // Fetch setup QR code
                    const setupRes = await api.post('/auth/mfa/setup', {}, {
                        headers: { Authorization: `Bearer ${res.data.token}` }
                    });
                    if (setupRes.data.success) {
                        setQrCodeData(setupRes.data.qrCode);
                        setCurrentStep('mfa_setup');
                        toast.success('MFA Setup Required');
                    } else {
                        toast.error('Failed to init MFA setup');
                    }
                } else if (res.data.mfa_required) {
                    setMfaToken(res.data.token);
                    setCurrentStep('mfa_verify');
                    toast.success('Please enter MFA code');
                } else if (res.data.token) {
                    handlePortalSso(res.data);
                    login(res.data.token);
                    toast.success('Logged in successfully');
                    navigate('/');
                }
            } else {
                toast.error(res.data.message || 'Login failed');
            }
        } catch (error) {
            toast.error('Invalid credentials or server error');
        }
    };

    const handleMfaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/auth/mfa/verify', { code: mfaCode }, {
                headers: { Authorization: `Bearer ${mfaToken}` }
            });
            if (res.data.success && res.data.token) {
                handlePortalSso(res.data);
                login(res.data.token);
                toast.success(res.data.message || 'Logged in successfully');
                navigate('/');
            } else {
                toast.error(res.data.message || 'Invalid code');
            }
        } catch (error) {
            toast.error('Invalid MFA code');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl text-white flex items-center justify-center text-3xl mx-auto shadow-lg shadow-blue-500/30 mb-4">
                        🔐
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
                    <p className="text-slate-500 mt-2 text-sm">Sign in to access the dashboard</p>
                </div>

                {currentStep === 'login' && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter username"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="Enter password"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-blue-500/30 mt-2"
                        >
                            Sign In →
                        </button>
                    </form>
                )}

                {currentStep === 'mfa_setup' && (
                    <form onSubmit={handleMfaSubmit} className="space-y-5">
                        <div className="text-center">
                            <p className="text-sm text-slate-600 mb-4">Scan this QR code with Google Authenticator or Authy to set up Two-Factor Authentication.</p>
                            {qrCodeData && <img src={qrCodeData} alt="MFA QR Code" className="mx-auto border p-2 rounded-lg shadow-sm" />}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Authenticator Code</label>
                            <input
                                type="text"
                                value={mfaCode}
                                onChange={(e) => setMfaCode(e.target.value)}
                                required
                                maxLength={6}
                                className="w-full px-4 py-3 text-center tracking-widest text-lg rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="000000"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-blue-500/30 mt-2"
                        >
                            Verify & Complete Setup →
                        </button>
                    </form>
                )}

                {currentStep === 'mfa_verify' && (
                    <form onSubmit={handleMfaSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Authenticator Code</label>
                            <input
                                type="text"
                                value={mfaCode}
                                onChange={(e) => setMfaCode(e.target.value)}
                                required
                                maxLength={6}
                                className="w-full px-4 py-3 text-center tracking-widest text-lg font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="000000"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-blue-500/30 mt-2"
                        >
                            Verify Code →
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
