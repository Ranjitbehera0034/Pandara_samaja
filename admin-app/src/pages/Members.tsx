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
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{t('member_management')}</h1>
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

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, membership no, or mobile..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{m.membership_no}</td>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]">
                        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900">{isEditing ? 'Edit Member' : 'Add New Member'}</h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                                <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">👤 Head of Family Details</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Membership No. *</label>
                                        <input
                                            type="text"
                                            value={membershipNo}
                                            onChange={(e) => setMembershipNo(e.target.value)}
                                            required
                                            disabled={isEditing}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:bg-slate-50 disabled:text-slate-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gender</label>
                                        <select
                                            value={headGender}
                                            onChange={(e) => setHeadGender(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white dark:bg-slate-900"
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile Number</label>
                                        <input
                                            type="text"
                                            value={mobile}
                                            onChange={(e) => setMobile(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Aadhaar No.</label>
                                        <input
                                            type="text"
                                            value={aadharNo}
                                            onChange={(e) => setAadharNo(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50">
                                <h4 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">📍 Address Details</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">District</label>
                                        <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Taluka</label>
                                        <input type="text" value={taluka} onChange={(e) => setTaluka(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Panchayat</label>
                                        <input type="text" value={panchayat} onChange={(e) => setPanchayat(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Village</label>
                                        <input type="text" value={village} onChange={(e) => setVillage(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50" />
                                    </div>
                                    <div className="col-span-2 md:col-span-4">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Address</label>
                                        <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rows-2" placeholder="House/Street details (optional)"></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-amber-900 flex items-center gap-2">👨‍👩‍👧‍👦 Family Members</h4>
                                    <div className="flex items-center gap-4 text-sm font-medium text-amber-800">
                                        <span>Male: {maleCount}</span>
                                        <span>Female: {femaleCount}</span>
                                        <span>Total: {maleCount + femaleCount}</span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    {/* Head of Family Implicit Row */}
                                    <div className="grid grid-cols-12 gap-3 items-center bg-blue-50/50 p-3 rounded-lg border border-blue-200/50">
                                        <div className="col-span-12 md:col-span-3">
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Head Name"
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white dark:bg-slate-900"
                                            />
                                        </div>
                                        <div className="col-span-6 md:col-span-3">
                                            <input
                                                type="text"
                                                value="Self"
                                                disabled
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-100/50 text-slate-500 cursor-not-allowed"
                                            />
                                        </div>
                                        <div className="col-span-6 md:col-span-3">
                                            <select
                                                value={headGender}
                                                onChange={(e) => setHeadGender(e.target.value)}
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white dark:bg-slate-900"
                                            >
                                                <option value="">Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>
                                        <div className="col-span-10 md:col-span-2">
                                            <input
                                                type="number"
                                                placeholder="Age"
                                                value={headAge}
                                                onChange={(e) => setHeadAge(e.target.value)}
                                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white dark:bg-slate-900"
                                            />
                                        </div>
                                        <div className="col-span-2 md:col-span-1 text-right">
                                            <span className="text-xs font-semibold text-blue-500 px-1">Self</span>
                                        </div>
                                    </div>

                                    {familyMembers.map((fm) => (
                                        <div key={fm.id} className="grid grid-cols-12 gap-3 items-center bg-white p-3 rounded-lg border border-amber-200/50">
                                            <div className="col-span-12 md:col-span-3">
                                                <input
                                                    type="text"
                                                    placeholder="Name"
                                                    value={fm.name}
                                                    onChange={(e) => updateFamilyMember(fm.id, 'name', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                />
                                            </div>
                                            <div className="col-span-6 md:col-span-3">
                                                <input
                                                    type="text"
                                                    placeholder="Relation"
                                                    value={fm.relation}
                                                    onChange={(e) => updateFamilyMember(fm.id, 'relation', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                />
                                            </div>
                                            <div className="col-span-6 md:col-span-3">
                                                <select
                                                    value={fm.gender}
                                                    onChange={(e) => updateFamilyMember(fm.id, 'gender', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white dark:bg-slate-900"
                                                >
                                                    <option value="">Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                            </div>
                                            <div className="col-span-10 md:col-span-2">
                                                <input
                                                    type="number"
                                                    placeholder="Age"
                                                    value={fm.age}
                                                    onChange={(e) => updateFamilyMember(fm.id, 'age', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                />
                                            </div>
                                            <div className="col-span-2 md:col-span-1 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => removeFamilyMember(fm.id)}
                                                    className="text-red-400 hover:text-red-600 p-1 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                                                    title="Remove"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {familyMembers.length === 0 && (
                                        <div className="text-center py-4 text-sm text-slate-500 bg-white/50 rounded-lg border border-dashed border-slate-200">
                                            No family members added.
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={addFamilyMember}
                                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-dashed border-amber-300 text-amber-700 font-medium rounded-xl hover:bg-amber-50 transition-colors"
                                >
                                    <Plus size={16} />
                                    Add Family Member
                                </button>
                            </div>
                        </form>
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button onClick={closeModal} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200/50 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleSubmit} className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-colors">
                                {isEditing ? 'Save Changes' : 'Add Member'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
