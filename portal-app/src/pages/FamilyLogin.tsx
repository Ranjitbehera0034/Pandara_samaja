import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
    ArrowLeft, Key, Shield, Users, LogIn, Plus,
    X, Trash2, CheckCircle2, XCircle, Eye, EyeOff, Lock, Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────
interface FamilyAccount {
    id: string;
    name: string;
    relation: string;
    username: string;
    isActive: boolean;
    lastLogin?: string;
    avatar?: string;
}



import { PORTAL_API_URL } from '../config/apiConfig';

export default function FamilyLogin() {
    const { member } = useAuth();
    const [accounts, setAccounts] = useState<FamilyAccount[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: '',
        relation: '',
        username: '',
        password: '',
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await fetch(`${PORTAL_API_URL}/family/accounts`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('portalToken')}` }
            });
            const data = await res.json();
            if (data.success) {
                setAccounts(data.accounts.map((a: any) => ({
                    id: a.id.toString(),
                    name: a.name,
                    username: a.username,
                    relation: 'Family Member',
                    isActive: a.is_active,
                    lastLogin: a.created_at
                })));
            }
        } catch (error) {
            toast.error('Failed to load accounts');
        }
    };

    const handleCreate = async () => {
        if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
            toast.error('All fields are required');
            return;
        }
        if (form.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            const res = await fetch(`${PORTAL_API_URL}/family/accounts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('portalToken')}`
                },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (data.success) {
                fetchAccounts();
                setForm({ name: '', relation: '', username: '', password: '' });
                setShowCreateModal(false);
                toast.success('Account created!');
            } else {
                toast.error(data.message || 'Failed to create account');
            }
        } catch (e) {
            toast.error('Failed to create account');
        }
    };

    const toggleActive = async (accountId: string) => {
        const acc = accounts.find(a => a.id === accountId);
        try {
            const res = await fetch(`${PORTAL_API_URL}/family/accounts/${accountId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('portalToken')}`
                },
                body: JSON.stringify({ status: !acc?.isActive })
            });
            if (res.ok) {
                fetchAccounts();
                toast.success('Account status updated');
            }
        } catch (e) {
            toast.error('Failed to update status');
        }
    };

    const deleteAccount = async (accountId: string) => {
        if (!confirm('Are you sure you want to delete this account?')) return;
        try {
            const res = await fetch(`${PORTAL_API_URL}/family/accounts/${accountId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('portalToken')}` }
            });
            if (res.ok) {
                fetchAccounts();
                toast.success('Account deleted');
            }
        } catch (e) {
            toast.error('Failed to delete account');
        }
    };

    const formatLastLogin = (dateStr?: string) => {
        if (!dateStr) return 'Never logged in';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link to="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-2">
                        <ArrowLeft size={16} /> Back to Profile
                    </Link>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
                        Family Logins
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Manage sub-accounts for family members
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} /> Add Member
                </button>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
                <Shield size={20} className="text-blue-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-blue-300 font-medium text-sm">Family Account Management</p>
                    <p className="text-slate-400 text-sm mt-1">
                        As the head of family ({member?.name}), you can create login credentials for your family members.
                        Each member gets their own portal access tied to your family account.
                    </p>
                </div>
            </div>

            {/* Accounts List */}
            {accounts.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                    <Users size={48} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 mb-4">No family accounts created yet.</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium inline-flex items-center gap-2"
                    >
                        <Plus size={16} /> Create First Account
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {accounts.map(account => (
                        <motion.div
                            key={account.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`bg-slate-800/60 border rounded-2xl p-5 transition-colors group ${account.isActive ? 'border-slate-700/50 hover:bg-slate-800/80' : 'border-red-500/20 bg-red-500/5'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg ${account.isActive
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                                    : 'bg-slate-700 text-slate-400'
                                    }`}>
                                    {(account.name || '?')[0]?.toUpperCase()}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-white">{account.name}</h3>
                                        {account.isActive ? (
                                            <span className="flex items-center gap-1 text-[11px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                                                <CheckCircle2 size={10} /> Active
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[11px] bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full font-medium">
                                                <XCircle size={10} /> Disabled
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                                        <span className="flex items-center gap-1"><Users size={12} /> {account.relation}</span>
                                        <span className="text-slate-600">•</span>
                                        <span className="flex items-center gap-1"><Key size={12} /> @{account.username}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                                        <LogIn size={10} /> Last login: {formatLastLogin(account.lastLogin)}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => toggleActive(account.id)}
                                        className={`p-2 rounded-xl border transition-colors ${account.isActive
                                            ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                            : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                            }`}
                                        title={account.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        {account.isActive ? <Lock size={16} /> : <Unlock size={16} />}
                                    </button>
                                    <button
                                        onClick={() => deleteAccount(account.id)}
                                        className="p-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                                        title="Delete Account"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-white">{accounts.length}</div>
                    <div className="text-xs text-slate-400 mt-1">Total Accounts</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-400">{accounts.filter(a => a.isActive).length}</div>
                    <div className="text-xs text-slate-400 mt-1">Active</div>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{accounts.filter(a => !a.isActive).length}</div>
                    <div className="text-xs text-slate-400 mt-1">Disabled</div>
                </div>
            </div>

            {/* Create Account Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-700/50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Key size={20} className="text-emerald-400" /> Create Family Account
                                </h2>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-white rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">Full Name *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder="e.g. Priya Das"
                                        className="w-full bg-slate-900/50 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">Relation</label>
                                    <input
                                        type="text"
                                        value={form.relation}
                                        onChange={(e) => setForm(f => ({ ...f, relation: e.target.value }))}
                                        placeholder="e.g. Daughter, Son, Wife"
                                        className="w-full bg-slate-900/50 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">Username *</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">@</span>
                                        <input
                                            type="text"
                                            value={form.username}
                                            onChange={(e) => setForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '') }))}
                                            placeholder="username"
                                            className="w-full bg-slate-900/50 text-white pl-8 pr-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">Password *</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={form.password}
                                            onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                                            placeholder="Min 6 characters"
                                            className="w-full bg-slate-900/50 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleCreate}
                                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
                            >
                                Create Account
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
