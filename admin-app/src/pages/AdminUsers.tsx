import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { toast } from 'sonner';
import { Shield, Trash2, UserPlus, RefreshCcw, ShieldCheck, Search, User, MapPin, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { API_BASE_URL } from '../config/apiConfig';

interface AdminUser {
    id: number;
    username: string;
    role: 'admin' | 'super_admin';
    membership_no: string | null;
    real_name: string | null;
    created_at: string;
    last_login: string | null;
    is_mfa_active: boolean;
}

interface MemberSearchResult {
    membership_no: string;
    name: string;
    village: string;
    district: string;
    mobile: string;
}

const AdminUsers: React.FC = () => {
    const { token, user: currentUser } = useAdminAuth();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Member search states
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MemberSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedMember, setSelectedMember] = useState<MemberSearchResult | null>(null);
    const [step, setStep] = useState(1); // 1: Search, 2: Credentials

    const [newAdmin, setNewAdmin] = useState({ username: '', password: '', role: 'admin' });


    const fetchAdmins = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/admins`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setAdmins(data.users);
            } else {
                toast.error(data.message || 'Failed to fetch admins');
            }
        } catch (_error) {
            toast.error('Network error while fetching admins');
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const handleSearchMembers = async (query: string) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/search-members?query=${encodeURIComponent(query)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setSearchResults(data.members);
            }
        } catch (_error) {
            console.error('Search error:', _error);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) handleSearchMembers(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    const resetModal = () => {
        setShowAddModal(false);
        setStep(1);
        setSearchQuery('');
        setSearchResults([]);
        setSelectedMember(null);
        setNewAdmin({ username: '', password: '', role: 'admin' });
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMember) return;

        try {
            const payload = {
                ...newAdmin,
                membership_no: selectedMember.membership_no,
                real_name: selectedMember.name
            };

            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (data.success) {
                toast.success(`Admin access granted to ${selectedMember.name}`);
                resetModal();
                fetchAdmins();
            } else {
                toast.error(data.message || 'Failed to register admin');
            }
        } catch (_error) {
            toast.error('Network error while registering admin');
        }
    };

    const handleDeleteAdmin = async (id: number) => {
        if (!window.confirm('Are you sure you want to revoke access for this admin?')) return;

        try {
            const response = await fetch(`${API_BASE_URL}/auth/admins/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Admin access revoked');
                fetchAdmins();
            } else {
                toast.error(data.message || 'Failed to revoke access');
            }
        } catch (_error) {
            toast.error('Network error');
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Shield className="text-blue-600" size={32} />
                        Admin Management
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Link membership records to administrative accounts.
                    </p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <UserPlus size={20} />
                    Assign New Admin
                </button>
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <RefreshCcw className="animate-spin text-blue-600 mb-4" size={40} />
                    <p className="text-slate-500 font-medium">Loading administrators...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {admins.map((admin) => (
                        <div key={admin.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
                                    <Shield size={24} />
                                </div>
                                <div className="flex gap-2">
                                    {admin.is_mfa_active && (
                                        <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-1.5 rounded-lg" title="MFA Secured">
                                            <ShieldCheck size={16} />
                                        </div>
                                    )}
                                    {admin.role === 'super_admin' && (
                                        <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 text-[10px] uppercase font-bold px-2 py-1 rounded-md tracking-wider">
                                            Super Admin
                                        </span>
                                    )}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">@{admin.username}</h3>
                            <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3">
                                {admin.real_name || 'System Account'}
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Membership No:</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-bold">
                                        {admin.membership_no || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400">Last Login:</span>
                                    <span className="text-slate-700 dark:text-slate-300 font-medium italic">
                                        {admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    disabled={admin.id === currentUser?.id}
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                    className={`p-2.5 rounded-xl transition-all ${admin.id === currentUser?.id
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white shadow-sm'
                                        }`}
                                    title={admin.id === currentUser?.id ? "You cannot delete yourself" : "Revoke Access"}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Step-based Assign Admin Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden border border-white/20">
                        <div className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                        {step === 1 ? 'Search Member' : 'Account Details'}
                                    </h2>
                                    <div className="flex gap-2 mt-2">
                                        <div className={`h-1.5 w-8 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                                        <div className={`h-1.5 w-8 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                                    </div>
                                </div>
                                <button onClick={resetModal} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            {step === 1 ? (
                                <div className="space-y-6">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                                        Search for a family head by name or membership number to link them to an administrative account.
                                    </p>

                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            autoFocus
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search by name or MEM..."
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 dark:focus:border-blue-500 rounded-2xl pl-12 pr-5 py-4 outline-none transition-all dark:text-white"
                                        />
                                        {isSearching && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <RefreshCcw className="animate-spin text-blue-600" size={20} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {searchResults.map((m) => (
                                            <button
                                                key={m.membership_no}
                                                onClick={() => setSelectedMember(m)}
                                                className={`w-full flex items-center justify-between p-4 rounded-2xl text-left border-2 transition-all ${selectedMember?.membership_no === m.membership_no
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-600'
                                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">{m.name}</div>
                                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                                            <span className="flex items-center gap-1 font-mono text-blue-600 dark:text-blue-400">{m.membership_no}</span>
                                                            <span className="flex items-center gap-1"><MapPin size={10} /> {m.village}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {selectedMember?.membership_no === m.membership_no ? (
                                                    <CheckCircle2 className="text-blue-600" size={24} />
                                                ) : (
                                                    <ChevronRight className="text-slate-300" size={20} />
                                                )}
                                            </button>
                                        ))}

                                        {searchQuery && !isSearching && searchResults.length === 0 && (
                                            <div className="text-center py-10">
                                                <div className="text-slate-300 dark:text-slate-700 mb-2 flex justify-center"><Search size={40} /></div>
                                                <p className="text-slate-500 text-sm">No members found matching "{searchQuery}"</p>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        disabled={!selectedMember}
                                        onClick={() => setStep(2)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        Next: Account Details
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleAddAdmin} className="space-y-5">
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                                            {selectedMember?.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-blue-900 dark:text-blue-200 font-bold">{selectedMember?.name}</div>
                                            <div className="text-blue-600 dark:text-blue-400 text-xs font-mono">{selectedMember?.membership_no}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Username</label>
                                        <input
                                            required
                                            type="text"
                                            value={newAdmin.username}
                                            onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 dark:focus:border-blue-500 rounded-2xl px-5 py-3.5 outline-none transition-all dark:text-white"
                                            placeholder="e.g. jdoe_admin"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Password</label>
                                        <input
                                            required
                                            type="password"
                                            value={newAdmin.password}
                                            onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 dark:focus:border-blue-500 rounded-2xl px-5 py-3.5 outline-none transition-all dark:text-white"
                                            placeholder="Min 8 characters"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Assign Access Level</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setNewAdmin({ ...newAdmin, role: 'admin' })}
                                                className={`py-3.5 px-4 rounded-2xl border-2 font-bold text-sm transition-all ${newAdmin.role === 'admin'
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                                    }`}
                                            >
                                                Standard Admin
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setNewAdmin({ ...newAdmin, role: 'super_admin' })}
                                                className={`py-3.5 px-4 rounded-2xl border-2 font-bold text-sm transition-all ${newAdmin.role === 'super_admin'
                                                    ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-500/20'
                                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                                    }`}
                                            >
                                                Super Admin
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold py-4 rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all"
                                        >
                                            Finalize & Assign
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
