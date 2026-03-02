import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Search, Plus, Upload, Edit2, Trash2, X, Ban, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface FamilyMember {
    id: string;
    name: string;
    relation: string;
    gender: string;
    age: string;
}

export default function Members() {
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
    const [members, setMembers] = useState<any[]>([]);
    const [pendingMembers, setPendingMembers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [memberId, setMemberId] = useState('');
    const [membershipNo, setMembershipNo] = useState('');
    const [name, setName] = useState('');
    const [headGender, setHeadGender] = useState('');
    const [mobile, setMobile] = useState('');
    const [aadharNo, setAadharNo] = useState('');
    const [district, setDistrict] = useState('');
    const [taluka, setTaluka] = useState('');
    const [panchayat, setPanchayat] = useState('');
    const [village, setVillage] = useState('');
    const [address, setAddress] = useState('');
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [headAge, setHeadAge] = useState('');

    const maleCount = (headGender === 'Male' ? 1 : 0) + familyMembers.filter(fm => fm.gender === 'Male').length;
    const femaleCount = (headGender === 'Female' ? 1 : 0) + familyMembers.filter(fm => fm.gender === 'Female').length;

    useEffect(() => {
        if (activeTab === 'all') {
            fetchMembers();
        } else {
            fetchPendingMembers();
        }
    }, [activeTab]);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/members');
            if (res.data.success) {
                setMembers(res.data.members || []);
            } else if (Array.isArray(res.data)) {
                setMembers(res.data);
            } else {
                setMembers([]);
            }
        } catch (e) {
            toast.error('Failed to load members');
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingMembers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/members/pending');
            if (res.data.success) {
                setPendingMembers(res.data.members || []);
            }
        } catch (e) {
            toast.error('Failed to load pending members');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (membershipNo: string) => {
        try {
            await api.put(`/admin/members/${membershipNo}/status`, { status: 'approved' });
            toast.success('Member approved successfully');
            setPendingMembers(pendingMembers.filter(m => m.membership_no !== membershipNo));
        } catch (e) {
            toast.error('Failed to approve member');
        }
    };

    const handleReject = async (membershipNo: string) => {
        try {
            await api.put(`/admin/members/${membershipNo}/status`, { status: 'rejected' });
            toast.success('Member rejected');
            setPendingMembers(pendingMembers.filter(m => m.membership_no !== membershipNo));
        } catch (e) {
            toast.error('Failed to reject member');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const loadingToast = toast.loading('Uploading members...');
            await api.post('/members/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.dismiss(loadingToast);
            toast.success('Members imported successfully!');
            fetchMembers();
        } catch (error) {
            toast.error('Failed to import members');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setMemberId('');
        setMembershipNo('');
        setName('');
        setHeadGender('');
        setMobile('');
        setAadharNo('');
        setDistrict('');
        setTaluka('');
        setPanchayat('');
        setVillage('');
        setAddress('');
        setFamilyMembers([]);
        setHeadAge('');
        setIsModalOpen(true);
    };

    const openEditModal = (m: any) => {
        setIsEditing(true);
        setMemberId(m.membership_no);
        setMembershipNo(m.membership_no);
        setName(m.name);
        setHeadGender(m.head_gender || '');
        setMobile(m.mobile || '');
        setAadharNo(m.aadhar_no || '');
        setDistrict(m.district || '');
        setTaluka(m.taluka || '');
        setPanchayat(m.panchayat || '');
        setVillage(m.village || '');
        setAddress(m.address || '');

        const parsedMembers = Array.isArray(m.family_members) ? m.family_members : [];
        const isHead = (rel: any) => !rel ? false : ['head', 'self'].includes(String(rel).toLowerCase());
        const headMember = parsedMembers.find((fm: any) => isHead(fm.relation));
        const otherMembers = parsedMembers.filter((fm: any) => !isHead(fm.relation));

        setHeadAge(headMember?.age || '');
        setFamilyMembers(otherMembers.map((fm: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: fm.name || '',
            relation: fm.relation || '',
            gender: fm.gender || '',
            age: fm.age || ''
        })));
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const allFamilyMembers = [
                { name: String(name || '').trim(), relation: 'Self', gender: headGender, age: String(headAge || '').trim() },
                ...familyMembers.map(({ name, relation, gender, age }) => ({
                    name: String(name || '').trim(),
                    relation: String(relation || '').trim(),
                    gender,
                    age: String(age || '').trim()
                }))
            ].filter(fm => fm.name); // only include if they have a name

            const payload = {
                membership_no: membershipNo,
                name,
                head_gender: headGender,
                mobile,
                aadhar_no: aadharNo,
                district,
                taluka,
                panchayat,
                village,
                address,
                male: maleCount,
                female: femaleCount,
                family_members: allFamilyMembers
            };

            if (isEditing) {
                await api.put(`/members/${memberId}`, payload);
                toast.success('Member updated!');
            } else {
                await api.post('/members/import-rows', { rows: [payload] });
                toast.success('Member created!');
            }
            closeModal();
            fetchMembers();
        } catch (error) {
            toast.error('Failed to save member. Please check if the Membership number is unique.');
        }
    };

    const handleDelete = async (id: string | number) => {
        if (!confirm('Are you sure you want to delete this member?')) return;
        try {
            await api.delete(`/members/${id}`);
            toast.success('Member deleted');
            fetchMembers();
        } catch (error) {
            toast.error('Failed to delete member');
        }
    };

    const addFamilyMember = () => {
        setFamilyMembers([
            ...familyMembers,
            { id: Math.random().toString(36).substr(2, 9), name: '', relation: '', gender: '', age: '' }
        ]);
    };

    const updateFamilyMember = (id: string, field: keyof FamilyMember, value: string) => {
        setFamilyMembers(familyMembers.map(fm => fm.id === id ? { ...fm, [field]: value } : fm));
    };

    const removeFamilyMember = (id: string) => {
        setFamilyMembers(familyMembers.filter(fm => fm.id !== id));
    };

    const membersToFilter = activeTab === 'all' ? members : pendingMembers;
    const displayMembers = (Array.isArray(membersToFilter) ? membersToFilter : []).filter(m =>
        (m.name?.toLowerCase().includes(search.toLowerCase())) ||
        (m.membership_no?.toLowerCase().includes(search.toLowerCase())) ||
        (m.mobile?.includes(search))
    );

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto h-full flex flex-col relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">{t('member_management')}</h1>
                    <p className="text-slate-500 mt-1 text-sm sm:text-base">View, add, and manage community members and their families.</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 text-sm sm:text-base"
                    >
                        <Upload size={18} />
                        <span className="hidden sm:inline">{uploading ? 'Uploading...' : t('bulk_upload')}</span>
                        <span className="sm:hidden">{uploading ? '...' : 'Upload'}</span>
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 text-sm sm:text-base"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">{t('add_member')}</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>
            </div>

            <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-800 mb-6 scrollbar-hide shrink-0">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'all' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    {t('member_directory')}
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'pending' ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                    {t('pending_approvals')} {activeTab === 'pending' && pendingMembers.length > 0 && <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 py-0.5 px-2 rounded-full text-xs">{pendingMembers.length}</span>}
                </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden flex-1 flex flex-col">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, membership no, or mobile..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full min-w-[800px] text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200 sticky top-0 z-10">
                                <th className="px-6 py-4">Membership No.</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Mobile</th>
                                <th className="px-6 py-4">Address</th>
                                {activeTab === 'all' && <th className="px-6 py-4 text-center">{t('status')}</th>}
                                <th className="px-6 py-4 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">Loading members...</td>
                                </tr>
                            ) : displayMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">No members found.</td>
                                </tr>
                            ) : (
                                displayMembers.map((m, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{m.membership_no}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{m.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{m.mobile}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 line-clamp-1">{[m.village, m.panchayat, m.taluka, m.district].filter(Boolean).join(', ')}</td>
                                        {activeTab === 'all' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {m.is_banned ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                        <Ban size={12} /> {t('banned')}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                        <CheckCircle size={12} /> {t('active')}
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {activeTab === 'pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(m.membership_no)}
                                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm mr-2"
                                                    >
                                                        {t('approve')}
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(m.membership_no)}
                                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm mr-2"
                                                    >
                                                        {t('reject')}
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('Enter a reason to ban this member:', m.ban_reason || '');
                                                        if (reason !== null) {
                                                            m.is_banned
                                                                ? api.put(`/admin/members/${m.membership_no}/unban`).then(() => { toast.success('Member unbanned'); fetchMembers(); }).catch(() => toast.error('Failed to unban'))
                                                                : api.put(`/admin/members/${m.membership_no}/ban`, { reason }).then(() => { toast.success('Member banned'); fetchMembers(); }).catch(() => toast.error('Failed to ban'));
                                                        }
                                                    }}
                                                    className={`p-2 rounded-lg transition-colors inline-block mr-1 ${m.is_banned ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                                                    title={m.is_banned ? 'Unban Member' : 'Ban Member'}
                                                >
                                                    {m.is_banned ? <CheckCircle size={16} /> : <Ban size={16} />}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEditModal(m)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(m.membership_no)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block ml-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/40 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] border border-white/20 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                        <div className="px-6 sm:px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{isEditing ? 'Edit Member' : 'Add New Member'}</h2>
                                <p className="text-slate-500 text-sm mt-0.5">Fill in the details below to {isEditing ? 'update' : 'register'} a member.</p>
                            </div>
                            <button onClick={closeModal} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all text-slate-500 dark:text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 custom-scrollbar">
                            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                                <h4 className="font-bold text-blue-900 dark:text-blue-400 mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs">01</span>
                                    Head of Family Details
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Membership No. *</label>
                                        <input
                                            type="text"
                                            value={membershipNo}
                                            onChange={(e) => setMembershipNo(e.target.value)}
                                            required
                                            disabled={isEditing}
                                            className="w-full disabled:bg-slate-50 dark:disabled:bg-slate-950 disabled:text-slate-400"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Full Name *</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Gender</label>
                                        <select
                                            value={headGender}
                                            onChange={(e) => setHeadGender(e.target.value)}
                                            className="w-full"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Mobile Number</label>
                                        <input
                                            type="text"
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="space-y-1.5 lg:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Aadhaar No.</label>
                                        <input
                                            type="text"
                                            value={aadharNo}
                                            onChange={(e) => setAadharNo(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/20">
                                <h4 className="font-bold text-emerald-900 dark:text-emerald-400 mb-6 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">02</span>
                                    Address Details
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">District</label>
                                        <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Taluka</label>
                                        <input type="text" value={taluka} onChange={(e) => setTaluka(e.target.value)} className="w-full" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Panchayat</label>
                                        <input type="text" value={panchayat} onChange={(e) => setPanchayat(e.target.value)} className="w-full" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Village</label>
                                        <input type="text" value={village} onChange={(e) => setVillage(e.target.value)} className="w-full" />
                                    </div>
                                    <div className="col-span-2 md:col-span-4 space-y-1.5">
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-1">Full Address</label>
                                        <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full h-24" placeholder="House/Street details (optional)"></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50/50 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/20">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs">03</span>
                                        Family Members
                                    </h4>
                                    <div className="flex items-center gap-4 text-xs font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest">
                                        <span>M: {maleCount}</span>
                                        <span className="opacity-30">|</span>
                                        <span>F: {femaleCount}</span>
                                        <span className="opacity-30">|</span>
                                        <span className="bg-amber-200 dark:bg-amber-900/40 px-3 py-1 rounded-full text-amber-900 dark:text-amber-200">Total: {maleCount + femaleCount}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    {/* Head of Family Implicit Row */}
                                    <div className="grid grid-cols-12 gap-4 items-center bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                                        <div className="col-span-12 md:col-span-3">
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Head Name"
                                                className="w-full px-4 py-2 text-sm bg-transparent"
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-3">
                                            <div className="px-4 py-2 text-sm bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 font-bold text-center border border-slate-200 dark:border-slate-800">
                                                Self (Head)
                                            </div>
                                        </div>
                                        <div className="col-span-4 md:col-span-3">
                                            <select
                                                value={headGender}
                                                onChange={(e) => setHeadGender(e.target.value)}
                                                className="w-full px-4 py-2 text-sm bg-transparent"
                                            >
                                                <option value="">Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <input
                                                type="number"
                                                placeholder="Age"
                                                value={headAge}
                                                onChange={(e) => setHeadAge(e.target.value)}
                                                className="w-full px-4 py-2 text-sm bg-transparent"
                                            />
                                        </div>
                                    </div>

                                    {familyMembers.map((fm) => (
                                        <div key={fm.id} className="grid grid-cols-12 gap-4 items-center bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:border-amber-300 dark:hover:border-amber-500/30 transition-all">
                                            <div className="col-span-12 md:col-span-3">
                                                <input
                                                    type="text"
                                                    placeholder="Name"
                                                    value={fm.name}
                                                    onChange={(e) => updateFamilyMember(fm.id, 'name', e.target.value)}
                                                    className="w-full px-4 py-2 text-sm bg-transparent"
                                                />
                                            </div>
                                            <div className="col-span-4 md:col-span-3">
                                                <input
                                                    type="text"
                                                    placeholder="Relation"
                                                    value={fm.relation}
                                                    onChange={(e) => updateFamilyMember(fm.id, 'relation', e.target.value)}
                                                    className="w-full px-4 py-2 text-sm bg-transparent"
                                                />
                                            </div>
                                            <div className="col-span-4 md:col-span-3">
                                                <select
                                                    value={fm.gender}
                                                    onChange={(e) => updateFamilyMember(fm.id, 'gender', e.target.value)}
                                                    className="w-full px-4 py-2 text-sm bg-transparent"
                                                >
                                                    <option value="">Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                            </div>
                                            <div className="col-span-4 md:col-span-2">
                                                <input
                                                    type="number"
                                                    placeholder="Age"
                                                    value={fm.age}
                                                    onChange={(e) => updateFamilyMember(fm.id, 'age', e.target.value)}
                                                    className="w-full px-4 py-2 text-sm bg-transparent"
                                                />
                                            </div>
                                            <div className="col-span-12 md:col-span-1 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => removeFamilyMember(fm.id)}
                                                    className="p-2 text-red-400 hover:text-red-500 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-all"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {familyMembers.length === 0 && (
                                        <div className="text-center py-8 text-sm text-slate-400 font-medium bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                            No additional family members added yet.
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={addFamilyMember}
                                    className="flex items-center justify-center gap-2 w-full py-4 bg-white dark:bg-slate-900 border-2 border-dashed border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-500 font-bold rounded-2xl hover:bg-amber-50 dark:hover:bg-amber-900/10 hover:border-amber-400 dark:hover:border-amber-500 transition-all text-sm uppercase tracking-widest"
                                >
                                    <Plus size={18} />
                                    Add Family Member
                                </button>
                            </div>
                        </form>
                        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex justify-end gap-3 backdrop-blur-sm">
                            <button onClick={closeModal} className="px-6 py-3 rounded-2xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} className="px-8 py-3 rounded-2xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                {isEditing ? 'Update Member' : 'Register Member'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
