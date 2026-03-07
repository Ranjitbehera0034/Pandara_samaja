import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Search, Plus, Upload, Edit2, Trash2, X, Ban, CheckCircle, LayoutGrid, List, ChevronDown, ChevronUp, Camera, UserCircle2, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface FamilyMember {
    id: string;
    name: string;
    relation: string;
    gender: string;
    age: string;
    mobile?: string;
    profile_pic?: string;
}

export default function Members() {
    const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [members, setMembers] = useState<any[]>([]);
    const [pendingMembers, setPendingMembers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const toggleCard = (id: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

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
    const [stateLocation, setStateLocation] = useState('');
    const [headProfilePic, setHeadProfilePic] = useState<string | null>(null);
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
            const res = await api.get('/members?limit=10000&page=1');
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
        setStateLocation('');
        setHeadProfilePic(null);
        setFamilyMembers([]);
        setHeadAge('');
        setIsModalOpen(true);
    };

    const openEditModal = (m: any) => {
        setIsEditing(true);
        setMemberId(m.membership_no);
        setMembershipNo(m.membership_no);
        setName(m.name);
        const capitalize = (s: any) => (typeof s === 'string' && s.length > 0) ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '';
        setHeadGender(capitalize(m.head_gender || ''));
        setMobile(m.mobile || '');
        setAadharNo(m.aadhar_no || '');
        setDistrict(m.district || '');
        setTaluka(m.taluka || '');
        setPanchayat(m.panchayat || '');
        setAddress(m.address || '');
        setStateLocation(m.state || m.stateLocation || '');
        setHeadProfilePic(m.profile_photo_url || null);

        const parsedMembers = Array.isArray(m.family_members) ? m.family_members : [];
        const isHead = (rel: any) => !rel ? false : ['head', 'self'].includes(String(rel).toLowerCase());
        const headMember = parsedMembers.find((fm: any) => isHead(fm.relation));
        const otherMembers = parsedMembers.filter((fm: any) => !isHead(fm.relation));

        setHeadAge(headMember?.age || '');
        setFamilyMembers(otherMembers.map((fm: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            name: fm.name || '',
            relation: fm.relation || '',
            gender: capitalize(fm.gender || ''),
            age: fm.age || '',
            mobile: fm.mobile || '',
            profile_pic: fm.profile_pic || ''
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
                { name: String(name || '').trim(), relation: 'Self', gender: headGender, age: String(headAge || '').trim(), profile_pic: headProfilePic },
                ...familyMembers.map(({ name, relation, gender, age, mobile, profile_pic }) => ({
                    name: String(name || '').trim(),
                    relation: String(relation || '').trim(),
                    gender,
                    age: String(age || '').trim(),
                    mobile: String(mobile || '').trim(),
                    profile_pic
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
                state: stateLocation,
                profile_photo_url: headProfilePic,
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


    const handleHeadPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setHeadProfilePic(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFamilyPhotoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateFamilyMember(id, 'profile_pic', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const addFamilyMember = () => {
        setFamilyMembers([
            ...familyMembers,
            { id: Math.random().toString(36).substr(2, 9), name: '', relation: '', gender: '', age: '', mobile: '', profile_pic: '' }
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

            <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex overflow-x-auto gap-2 scrollbar-hide shrink-0">
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

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-2 shrink-0">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        title="Table View"
                    >
                        <List size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('card')}
                        className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${viewMode === 'card' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        title="Card View"
                    >
                        <LayoutGrid size={18} />
                    </button>
                </div>
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
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Loading members...</div>
                    ) : displayMembers.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">No members found.</div>
                    ) : viewMode === 'table' ? (
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
                                {displayMembers.map((m, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{m.membership_no}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{m.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{m.mobile}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 line-clamp-1">{[m.panchayat, m.taluka, m.district].filter(Boolean).join(', ')}</td>
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
                                                    <button onClick={() => handleApprove(m.membership_no)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm mr-2">{t('approve')}</button>
                                                    <button onClick={() => handleReject(m.membership_no)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm mr-2">{t('reject')}</button>
                                                </>
                                            ) : (
                                                <button onClick={() => {
                                                    const reason = prompt('Enter a reason to ban this member:', m.ban_reason || '');
                                                    if (reason !== null) {
                                                        m.is_banned ? api.put(`/admin/members/${m.membership_no}/unban`).then(() => { toast.success('Member unbanned'); fetchMembers(); }).catch(() => toast.error('Failed to unban')) : api.put(`/admin/members/${m.membership_no}/ban`, { reason }).then(() => { toast.success('Member banned'); fetchMembers(); }).catch(() => toast.error('Failed to ban'));
                                                    }
                                                }} className={`p-2 rounded-lg transition-colors inline-block mr-1 ${m.is_banned ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`} title={m.is_banned ? 'Unban Member' : 'Ban Member'}>{m.is_banned ? <CheckCircle size={16} /> : <Ban size={16} />}</button>
                                            )}
                                            <button onClick={() => openEditModal(m)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-block"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(m.membership_no)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-block ml-1"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4 lg:p-6 bg-slate-50/50 dark:bg-slate-900/50">
                            {displayMembers.map((m, i) => {
                                const isExpanded = expandedCards.has(m.membership_no);
                                return (
                                    <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                                        <div className="p-5 flex justify-between items-start gap-4">
                                            <div>
                                                <span className="text-xs font-mono font-bold text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-900 rounded inline-block mb-2">#{m.membership_no}</span>
                                                <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{m.name}</h3>
                                                <div className="text-sm text-slate-500 mt-1 space-y-0.5">
                                                    <p>{m.mobile || 'No Mobile'}</p>
                                                    <p className="line-clamp-1" title={[m.panchayat, m.taluka, m.district].filter(Boolean).join(', ')}>
                                                        {[m.panchayat, m.taluka, m.district].filter(Boolean).join(', ') || 'No Address'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {activeTab === 'all' && (
                                                    m.is_banned ? (
                                                        <span className="inline-flex items-center px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase"><Ban size={10} className="mr-1" /> {t('banned')}</span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-700 text-[10px] font-bold uppercase"><CheckCircle size={10} className="mr-1" /> {t('active')}</span>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-700/50 mt-auto bg-slate-50/50 dark:bg-slate-900/20 text-sm">
                                                <div className="grid grid-cols-2 gap-4 mt-3">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aadhar No</p>
                                                        <p className="font-medium text-slate-700 dark:text-slate-200">{m.aadhar_no || '---'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Family Head Gender</p>
                                                        <p className="font-medium text-slate-700 dark:text-slate-200">{m.head_gender || '---'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Male Members</p>
                                                        <p className="font-medium text-slate-700 dark:text-slate-200">{m.male || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Female Members</p>
                                                        <p className="font-medium text-slate-700 dark:text-slate-200">{m.female || 0}</p>
                                                    </div>
                                                </div>

                                                {Array.isArray(m.family_members) && m.family_members.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Family Members List</p>
                                                        <ul className="space-y-1.5">
                                                            {m.family_members.map((fm: any, idx: number) => (
                                                                <li key={idx} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
                                                                    <span className="font-medium">{fm.name}</span>
                                                                    <div className="text-slate-500 flex items-center gap-2">
                                                                        <span className="bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">{fm.relation}</span>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
                                            <button
                                                onClick={() => toggleCard(m.membership_no)}
                                                className="text-xs font-medium text-slate-500 hover:text-blue-600 flex items-center gap-1 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                                            >
                                                {isExpanded ? <><ChevronUp size={14} /> Shrink</> : <><ChevronDown size={14} /> Expand</>}
                                            </button>

                                            <div className="flex items-center">
                                                {activeTab === 'pending' ? (
                                                    <>
                                                        <button onClick={() => handleApprove(m.membership_no)} className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium mr-1">Approve</button>
                                                        <button onClick={() => handleReject(m.membership_no)} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium">Reject</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => {
                                                            const reason = prompt('Ban reason:', m.ban_reason || '');
                                                            if (reason !== null) {
                                                                m.is_banned ? api.put(`/admin/members/${m.membership_no}/unban`).then(() => { fetchMembers(); }) : api.put(`/admin/members/${m.membership_no}/ban`, { reason }).then(() => { fetchMembers(); });
                                                            }
                                                        }} className={`p-1.5 rounded transition-colors mr-1 ${m.is_banned ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`} title={m.is_banned ? 'Unban' : 'Ban'}>
                                                            {m.is_banned ? <CheckCircle size={14} /> : <Ban size={14} />}
                                                        </button>
                                                    </>
                                                )}
                                                <button onClick={() => openEditModal(m)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors mr-1"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDelete(m.membership_no)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/40 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 rounded-[32px] w-[98vw] sm:w-[95vw] lg:w-[90vw] max-w-7xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[90vh] border border-white/20 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                        <div className="px-6 sm:px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">{isEditing ? 'Edit Member' : 'Add New Member'}</h2>
                                <p className="text-slate-500 text-sm mt-0.5">Fill in the details below to {isEditing ? 'update' : 'register'} a member.</p>
                            </div>
                            <button onClick={closeModal} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all text-slate-500 dark:text-slate-400">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} autoComplete="off" className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 custom-scrollbar relative">
                            {/* Section 1: Head Details */}
                            <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 sm:p-8 rounded-3xl border border-blue-100 dark:border-blue-800/50 shadow-sm relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 p-8 opacity-20 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen pointer-events-none transition-transform group-hover:scale-110 duration-700">
                                    <div className="w-40 h-40 rounded-full bg-blue-300 dark:bg-blue-600 blur-[50px]"></div>
                                </div>
                                <h4 className="font-black text-blue-900 dark:text-blue-400 mb-6 flex items-center gap-3 relative z-10 text-lg">
                                    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-xs shadow-lg shadow-blue-500/20">01</span>
                                    Head of Family Details
                                </h4>
                                <div className="flex flex-col sm:flex-row gap-8 relative z-10 mb-6">
                                    <div className="flex-shrink-0 flex flex-col items-center gap-3">
                                        <div className="relative group cursor-pointer">
                                            <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900/50 transition-transform group-hover:scale-105">
                                                {headProfilePic ? (
                                                    <img src={headProfilePic} alt="Head" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                                                        <UserCircle2 size={40} className="mb-2" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-center px-2">No Photo</span>
                                                    </div>
                                                )}
                                            </div>
                                            <label className="absolute -bottom-3 -right-3 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
                                                <Camera size={18} />
                                                <input type="file" accept="image/*" className="hidden" onChange={handleHeadPhotoUpload} />
                                            </label>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-12 flex-grow gap-6">
                                        <div className="flex flex-col justify-end md:col-span-4 lg:col-span-3">
                                            <label className="block text-[11px] font-black text-blue-800/70 dark:text-blue-200/50 uppercase tracking-widest pl-1 mb-2">Membership No. *</label>
                                            <input type="text" value={membershipNo} onChange={(e) => setMembershipNo(e.target.value)} required disabled={isEditing} className="w-full px-4 py-3 rounded-xl border border-blue-200/50 dark:border-blue-700/50 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 outline-none backdrop-blur-xl transition-all disabled:opacity-50" />
                                        </div>
                                        <div className="flex flex-col justify-end md:col-span-8 lg:col-span-6">
                                            <label className="block text-[11px] font-black text-blue-800/70 dark:text-blue-200/50 uppercase tracking-widest pl-1 mb-2">Full Name *</label>
                                            <input type="text" name="member_name" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-3 rounded-xl border border-blue-200/50 dark:border-blue-700/50 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 outline-none backdrop-blur-xl transition-all shadow-inner" />
                                        </div>
                                        <div className="flex flex-col justify-end md:col-span-6 lg:col-span-3">
                                            <label className="block text-[11px] font-black text-blue-800/70 dark:text-blue-200/50 uppercase tracking-widest pl-1 mb-2">Gender</label>
                                            <select value={headGender} onChange={(e) => setHeadGender(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-blue-200/50 dark:border-blue-700/50 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none backdrop-blur-xl transition-all shadow-inner">
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>
                                        <div className="flex flex-col justify-end md:col-span-6 lg:col-span-6">
                                            <label className="flex items-center justify-between min-h-[16px] text-[11px] font-black text-blue-800/70 dark:text-blue-200/50 uppercase tracking-widest pl-1 mb-2">
                                                <span>Mobile Number</span>
                                                <span className="text-[9px] lowercase bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded leading-none">tel</span>
                                            </label>
                                            <input type="tel" name="member_mobile_new" autoComplete="new-password" placeholder="Enter Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-blue-200/50 dark:border-blue-700/50 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 outline-none backdrop-blur-xl transition-all shadow-inner" />
                                        </div>
                                        <div className="flex flex-col justify-end md:col-span-12 lg:col-span-6">
                                            <label className="flex items-center justify-between min-h-[16px] text-[11px] font-black text-blue-800/70 dark:text-blue-200/50 uppercase tracking-widest pl-1 mb-2">
                                                <span>Aadhaar No.</span>
                                                <span className="text-[9px] lowercase opacity-50 px-1.5 rounded bg-slate-200/50 dark:bg-slate-800 leading-none py-0.5">optional</span>
                                            </label>
                                            <input type="text" name="member_aadhar" autoComplete="off" placeholder="Enter Aadhaar Number" value={aadharNo} onChange={(e) => setAadharNo(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-blue-200/50 dark:border-blue-700/50 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 outline-none backdrop-blur-xl transition-all shadow-inner" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Address */}
                            <div className="bg-gradient-to-br from-emerald-50/90 to-teal-50/90 dark:from-emerald-900/10 dark:to-teal-900/10 p-6 sm:p-8 rounded-3xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm relative overflow-hidden group">
                                <div className="absolute -top-10 -right-10 p-8 opacity-20 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen pointer-events-none transition-transform group-hover:scale-110 duration-700">
                                    <div className="w-40 h-40 rounded-full bg-emerald-300 dark:bg-emerald-600 blur-[50px]"></div>
                                </div>
                                <h4 className="font-black text-emerald-900 dark:text-emerald-400 mb-6 flex items-center gap-3 relative z-10 text-lg">
                                    <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xs shadow-lg shadow-emerald-500/20">02</span>
                                    Address Details
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 relative z-10">
                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-black text-emerald-800/70 dark:text-emerald-200/50 uppercase tracking-widest pl-1">District</label>
                                        <input type="text" name="member_district" autoComplete="off" placeholder="District" value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 outline-none backdrop-blur-xl transition-all shadow-inner" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-black text-emerald-800/70 dark:text-emerald-200/50 uppercase tracking-widest pl-1">Taluka</label>
                                        <input type="text" name="member_taluka" autoComplete="off" placeholder="Taluka" value={taluka} onChange={(e) => setTaluka(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 outline-none backdrop-blur-xl transition-all shadow-inner" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[11px] font-black text-emerald-800/70 dark:text-emerald-200/50 uppercase tracking-widest pl-1">Panchayat</label>
                                        <input type="text" name="member_panchayat" autoComplete="off" placeholder="Panchayat" value={panchayat} onChange={(e) => setPanchayat(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 outline-none backdrop-blur-xl transition-all shadow-inner" />
                                    </div>
                                    <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-6 space-y-2">
                                        <label className="block text-[11px] font-black text-emerald-800/70 dark:text-emerald-200/50 uppercase tracking-widest pl-1">Full Address</label>
                                        <textarea name="member_address" autoComplete="off" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 h-24 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500/50 outline-none backdrop-blur-xl transition-all shadow-inner resize-none" placeholder="House/Street details (optional)"></textarea>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Family */}
                            <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/60 dark:from-amber-900/10 dark:to-orange-900/10 p-6 sm:p-8 rounded-3xl border border-amber-200/50 dark:border-amber-800/40 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8 opacity-10 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen pointer-events-none transition-all group-hover:scale-125 duration-1000">
                                    <div className="w-96 h-96 rounded-full bg-amber-300 dark:bg-amber-600 blur-[100px]"></div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 relative z-10 gap-4">
                                    <h4 className="font-black text-amber-900 dark:text-amber-400 flex items-center gap-3 text-lg">
                                        <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center text-xs shadow-lg shadow-amber-500/20">03</span>
                                        Family Members
                                    </h4>
                                    <div className="flex items-center gap-3 text-xs font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest bg-white/40 dark:bg-slate-950/60 pl-4 pr-1 py-1 rounded-full backdrop-blur-md border border-amber-200/50 dark:border-amber-700/50 shadow-sm w-full sm:w-auto overflow-x-auto shrink-0 hide-scrollbar">
                                        <span>M: {maleCount}</span>
                                        <span className="opacity-30">|</span>
                                        <span>F: {femaleCount}</span>
                                        <span className="opacity-30">|</span>
                                        <span className="bg-amber-200/80 dark:bg-amber-600/30 px-3 py-1.5 rounded-full text-amber-900 dark:text-amber-200 shadow-inner">Tot: {maleCount + femaleCount}</span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8 relative z-10">
                                    {/* Head of Family Implicit Row */}
                                    <div className="flex flex-wrap lg:flex-nowrap gap-3 items-center bg-white/70 dark:bg-slate-900/80 backdrop-blur-xl p-3 rounded-2xl border border-blue-200/60 dark:border-blue-800/60 shadow-sm relative overflow-hidden ring-1 ring-blue-500/5">
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-400 to-blue-600"></div>
                                        <div className="w-full lg:w-4/12 pl-3">
                                            <input type="text" readOnly disabled value={name} placeholder="Head Name" className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 outline-none" />
                                        </div>
                                        <div className="w-full sm:w-[48%] lg:w-3/12">
                                            <div className="px-4 py-2.5 text-sm bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-700 dark:text-blue-400 font-bold text-center border border-blue-100 dark:border-blue-800/40 shadow-inner flex items-center justify-center gap-2">
                                                Self (Head) <CheckCircle size={14} className="opacity-60" />
                                            </div>
                                        </div>
                                        <div className="w-full sm:w-[48%] lg:w-3/12">
                                            <select disabled value={headGender} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white outline-none">
                                                <option value="">Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                        </div>
                                        <div className="w-full lg:w-2/12 flex gap-2 items-center pr-2">
                                            <input type="number" placeholder="Age" value={headAge} onChange={(e) => setHeadAge(e.target.value)} className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 border-l-[3px] border-l-blue-400 dark:border-slate-700 dark:border-l-blue-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner" />
                                        </div>
                                    </div>

                                    {familyMembers.map((fm) => (
                                        <div key={fm.id} className="flex flex-col lg:flex-row gap-4 items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg p-4 rounded-[2rem] border border-amber-200/50 dark:border-amber-800/40 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-600/50 transition-all relative">
                                            <div className="relative group cursor-pointer shrink-0">
                                                <div className="w-16 h-16 rounded-[1.2rem] overflow-hidden border-2 border-white dark:border-slate-700 shadow-md bg-slate-100 dark:bg-slate-800 transition-transform group-hover:scale-105">
                                                    {fm.profile_pic ? (
                                                        <img src={fm.profile_pic} alt="FM" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-500">
                                                            <UserCircle2 size={28} />
                                                        </div>
                                                    )}
                                                </div>
                                                <label className="absolute -bottom-2 -right-2 w-7 h-7 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
                                                    <Camera size={12} />
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFamilyPhotoUpload(fm.id, e)} />
                                                </label>
                                            </div>
                                            <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                                                <input type="text" placeholder="Full Name" value={fm.name} onChange={(e) => updateFamilyMember(fm.id, 'name', e.target.value)} className="col-span-1 sm:col-span-2 md:col-span-1 px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all shadow-inner" />
                                                <input type="text" placeholder="Relation" value={fm.relation} onChange={(e) => updateFamilyMember(fm.id, 'relation', e.target.value)} className="px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all shadow-inner" />
                                                <select value={fm.gender} onChange={(e) => updateFamilyMember(fm.id, 'gender', e.target.value)} className="px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all shadow-inner">
                                                    <option value="">Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                </select>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                    <input type="tel" placeholder="Mobile" value={fm.mobile} onChange={(e) => updateFamilyMember(fm.id, 'mobile', e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all shadow-inner" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <input type="number" placeholder="Age" value={fm.age} onChange={(e) => updateFamilyMember(fm.id, 'age', e.target.value)} className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 border-l-[3px] border-l-amber-400 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all shadow-inner" />
                                                    <button type="button" onClick={() => removeFamilyMember(fm.id)} className="w-11 flex items-center justify-center shrink-0 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white dark:bg-red-900/30 dark:hover:bg-red-600/80 rounded-xl border border-red-100 dark:border-red-800/40 hover:border-transparent transition-all shadow-sm" title="Remove Member">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {familyMembers.length === 0 && (
                                        <div className="text-center py-10 px-4 text-sm text-amber-700/60 dark:text-amber-400/50 font-medium bg-white/40 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-amber-200/60 dark:border-amber-800/60 backdrop-blur-sm">
                                            No additional family members currently. Click below to add one.
                                        </div>
                                    )}
                                </div>

                                <button type="button" onClick={addFamilyMember} className="relative z-10 flex items-center justify-center gap-2 w-full py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-400 font-black rounded-2xl hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:border-amber-400 dark:hover:border-amber-500 transition-all shadow-sm hover:shadow active:scale-[0.99] text-sm uppercase tracking-widest group">
                                    <div className="bg-amber-100 dark:bg-amber-900/50 p-1.5 rounded-lg group-hover:scale-110 transition-transform"><Plus size={16} strokeWidth={3} /></div>
                                    Add Another Family Member
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
