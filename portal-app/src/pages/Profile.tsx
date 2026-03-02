import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    Camera, Edit3, Save, X, Plus, Trash2,
    MapPin, Phone, CreditCard, Users, Heart,
    Calendar, Shield, ChevronDown, ChevronUp,
    GitBranch, Image as ImageIcon, PartyPopper, Key
} from 'lucide-react';
import type { FamilyMember } from '../types';

import { PORTAL_API_URL } from '../config/apiConfig';

export default function Profile() {
    const { member, user } = useAuth();
    const { t } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [showFamily, setShowFamily] = useState(true);
    const [saving, setSaving] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

    const isHoF = user?.relation?.toLowerCase() === 'self' || user?.relation?.toLowerCase() === 'head' || user?.relation?.toLowerCase() === 'self/head';

    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(
        member?.family_members || []
    );

    // Editable state mirrors member data
    const [form, setForm] = useState({
        name: member?.name || '',
        mobile: member?.mobile || '',
        district: member?.district || '',
        taluka: member?.taluka || '',
        panchayat: member?.panchayat || '',
        village: member?.village || '',
        address: member?.address || '',
        aadhar_no: member?.aadhar_no || '',
        head_gender: isHoF ? (member?.head_gender || '') : (familyMembers.find(f => (f.mobile || '').replace(/\D/g, '').slice(-10) === (member?.mobile || '').replace(/\D/g, '').slice(-10))?.gender || ''),
    });

    const handleFormChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const addFamilyMember = () => {
        setFamilyMembers(prev => [...prev, { name: '', relation: '', gender: 'male', age: undefined }]);
    };

    const removeFamilyMember = (index: number) => {
        setFamilyMembers(prev => prev.filter((_, i) => i !== index));
    };

    const updateFamilyMember = (index: number, field: keyof FamilyMember, value: string | number) => {
        setFamilyMembers(prev => prev.map((fm, i) =>
            i === index ? { ...fm, [field]: value } : fm
        ));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('portalToken');
            const statsToSave = calculateStats();
            const payload = {
                ...form,
                family_members: familyMembers,
                male: statsToSave.male,
                female: statsToSave.female,
            };

            const response = await fetch(`${PORTAL_API_URL}/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to save');

            const data = await response.json();
            if (data.success) {
                // Update localStorage with new data
                const updated = { ...member, ...payload };
                localStorage.setItem('portalMember', JSON.stringify(updated));
                toast.success(t('profile', 'profileUpdated'));
                setIsEditing(false);
            }
        } catch (err) {
            console.error(err);
            toast.error(t('profile', 'failedUpdate'));
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const toastId = toast.loading('Uploading profile photo...');
        try {
            const token = localStorage.getItem('portalToken');
            const formData = new FormData();
            formData.append('photo', file);

            const response = await fetch(`${PORTAL_API_URL}/profile/photo`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            if (data.success && data.photoUrl) {
                const updated = { ...member, profile_photo_url: data.photoUrl };
                localStorage.setItem('portalMember', JSON.stringify(updated));
                toast.success(t('profile', 'photoUploaded'), { id: toastId });
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
            // Fallback: set local preview
            const reader = new FileReader();
            reader.onloadend = () => {
                toast.success('Photo updated (offline)!', { id: toastId });
            };
            reader.readAsDataURL(file);
        }
    };

    const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

    const getCleanImageUrl = (url?: string | null) => {
        if (!url) return undefined;
        if (url.includes('drive.google.com/uc?id=')) {
            return url.replace('drive.google.com/uc?id=', 'lh3.googleusercontent.com/d/');
        }
        return url;
    };

    const calculateStats = () => {
        const hasSelfInList = familyMembers.some(f =>
            f.relation?.toLowerCase() === 'self' ||
            f.relation?.toLowerCase() === 'head' ||
            (f.name && form.name && f.name.toLowerCase() === form.name.toLowerCase())
        );

        const femaleCount = familyMembers.filter(f => f.gender?.toLowerCase() === 'female' || f.gender?.toLowerCase() === 'f').length + (!hasSelfInList && (form.head_gender?.toLowerCase() === 'female' || form.head_gender?.toLowerCase() === 'f') ? 1 : 0);
        // Safely force all unknown/corrupt gender formats to Male to match fallback UI renderer
        const maleCount = familyMembers.filter(f => !(f.gender?.toLowerCase() === 'female' || f.gender?.toLowerCase() === 'f')).length + (!hasSelfInList && !(form.head_gender?.toLowerCase() === 'female' || form.head_gender?.toLowerCase() === 'f') ? 1 : 0);

        return { male: maleCount, female: femaleCount, total: maleCount + femaleCount };
    };

    const stats = calculateStats();

    return (
        <div className="max-w-3xl mx-auto pb-20">
            {/* Cover Photo */}
            <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 shadow-2xl">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-60" />
                <div className="absolute bottom-4 left-4 text-white/70 text-sm flex items-center gap-2">
                    <Shield size={14} />
                    <span>Member since {member?.last_portal_login ? new Date(member.last_portal_login).getFullYear() : '2024'}</span>
                </div>
            </div>

            {/* Profile Card */}
            <div className="relative -mt-16 mx-4 md:mx-8">
                <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        {/* Avatar */}
                        <div className="relative -mt-20 md:-mt-24 group">
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-[3px] shadow-2xl shadow-blue-500/30">
                                <div className="w-full h-full rounded-full bg-slate-900 border-4 border-slate-800 overflow-hidden flex items-center justify-center">
                                    {member?.profile_photo_url ? (
                                        <img src={getCleanImageUrl(member.profile_photo_url)} referrerPolicy="no-referrer" alt={member.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-bold text-white">{getInitial(member?.name || '')}</span>
                                    )}
                                </div>
                            </div>
                            {isEditing && (
                                <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {member?.profile_photo_url && (
                                        <button
                                            onClick={async () => {
                                                const token = localStorage.getItem('portalToken');
                                                try {
                                                    const res = await fetch(`${PORTAL_API_URL}/profile/photo`, {
                                                        method: 'DELETE',
                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                    });
                                                    if (res.ok) {
                                                        const updated = { ...member, profile_photo_url: undefined };
                                                        localStorage.setItem('portalMember', JSON.stringify(updated));
                                                        toast.success('Profile photo removed');
                                                        // Force a page turn or component reload by manipulating state indirectly via member context refresh
                                                        window.location.reload();
                                                    }
                                                } catch (e) { }
                                            }}
                                            className="p-2 bg-red-600 hover:bg-red-500 rounded-full text-white shadow-lg"
                                            title="Remove photo"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => photoInputRef.current?.click()}
                                        className="p-2 bg-blue-600 hover:bg-blue-500 rounded-full text-white shadow-lg"
                                        title="Upload photo"
                                    >
                                        <Camera size={16} />
                                    </button>
                                </div>
                            )}
                            <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                        </div>

                        {/* Name & Meta */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">{member?.name}</h1>
                                    <p className="text-blue-400 font-medium">#{member?.membership_no}</p>
                                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-400">
                                        {member?.village && (
                                            <span className="flex items-center gap-1"><MapPin size={14} />{member.village}, {member.district}</span>
                                        )}
                                        {member?.mobile && (
                                            <span className="flex items-center gap-1"><Phone size={14} />{member.mobile}</span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                    disabled={saving}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg ${isEditing
                                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/20'
                                        : 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-500/10'
                                        }`}
                                >
                                    {isEditing ? (
                                        <><Save size={16} /><span>{saving ? t('profile', 'saving') : t('common', 'save')}</span></>
                                    ) : (
                                        <><Edit3 size={16} /><span>{t('profile', 'editProfile')}</span></>
                                    )}
                                </button>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-4 mt-6">
                                <div className="bg-slate-900/50 rounded-xl p-3 text-center border border-slate-700/30">
                                    <div className="text-xl font-bold text-white">{stats.total}</div>
                                    <div className="text-xs text-slate-400">{t('profile', 'familyMembers')}</div>
                                </div>
                                <div className="bg-slate-900/50 rounded-xl p-3 text-center border border-slate-700/30">
                                    <div className="text-xl font-bold text-white">{stats.male}</div>
                                    <div className="text-xs text-slate-400">{t('profile', 'male')}</div>
                                </div>
                                <div className="bg-slate-900/50 rounded-xl p-3 text-center border border-slate-700/30">
                                    <div className="text-xl font-bold text-white">{stats.female}</div>
                                    <div className="text-xs text-slate-400">{t('profile', 'female')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Personal Details Section */}
            <AnimatePresence>
                {isEditing && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mx-4 md:mx-8 mt-6 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <CreditCard size={20} className="text-blue-400" />
                                {t('profile', 'personalInfo')}
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-700 rounded-full text-slate-400">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {isHoF ? [
                                { label: t('profile', 'name'), field: 'name', value: form.name },
                                { label: t('profile', 'mobileNumber'), field: 'mobile', value: form.mobile },
                                { label: t('profile', 'district'), field: 'district', value: form.district },
                                { label: t('profile', 'taluka'), field: 'taluka', value: form.taluka },
                                { label: t('profile', 'panchayat'), field: 'panchayat', value: form.panchayat },
                                { label: t('profile', 'village'), field: 'village', value: form.village },
                                { label: t('profile', 'aadharNo'), field: 'aadhar_no', value: form.aadhar_no },
                            ].map(({ label, field, value }) => (
                                <div key={field}>
                                    <label className="block text-sm text-slate-400 mb-1.5">{label}</label>
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => handleFormChange(field, e.target.value)}
                                        className="w-full bg-slate-900/50 text-white px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-500"
                                    />
                                </div>
                            )) : [
                                { label: t('profile', 'name'), field: 'name', value: form.name },
                            ].map(({ label, field, value }) => (
                                <div key={field}>
                                    <label className="block text-sm text-slate-400 mb-1.5">{label}</label>
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => handleFormChange(field, e.target.value)}
                                        className="w-full bg-slate-900/50 text-white px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-500"
                                    />
                                </div>
                            ))}
                            {isHoF && (
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-slate-400 mb-1.5">{t('profile', 'address')}</label>
                                    <textarea
                                        value={form.address}
                                        onChange={(e) => handleFormChange('address', e.target.value)}
                                        rows={2}
                                        className="w-full bg-slate-900/50 text-white px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm text-slate-400 mb-1.5">Gender</label>
                                <select
                                    value={form.head_gender}
                                    onChange={(e) => handleFormChange('head_gender', e.target.value)}
                                    className="w-full bg-slate-900/50 text-white px-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="">—</option>
                                    <option value="male">{t('profile', 'male')}</option>
                                    <option value="female">{t('profile', 'female')}</option>
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Family Members Section */}
            <div className="mx-4 md:mx-8 mt-6 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden">
                <button
                    onClick={() => setShowFamily(!showFamily)}
                    className="w-full p-6 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
                >
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Users size={20} className="text-purple-400" />
                        {t('profile', 'familyMembers')} ({familyMembers.length})
                    </h2>
                    {showFamily ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </button>

                <AnimatePresence>
                    {showFamily && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="px-6 pb-6 space-y-3">
                                {familyMembers.length === 0 ? (
                                    <p className="text-center py-8 text-slate-500">No family members added yet.</p>
                                ) : (
                                    familyMembers.map((fm, index) => (
                                        <motion.div
                                            key={index}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="bg-slate-900/50 border border-slate-700/30 rounded-xl p-4"
                                        >
                                            {isEditing && isHoF ? (
                                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
                                                    <div>
                                                        <label className="block text-xs text-slate-500 mb-1">{t('profile', 'name')}</label>
                                                        <input
                                                            value={fm.name}
                                                            onChange={(e) => updateFamilyMember(index, 'name', e.target.value)}
                                                            className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-slate-500 mb-1">{t('profile', 'relation')}</label>
                                                        <input
                                                            value={fm.relation}
                                                            onChange={(e) => updateFamilyMember(index, 'relation', e.target.value)}
                                                            className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-slate-500 mb-1">{t('profile', 'gender')}</label>
                                                        <select
                                                            value={fm.gender?.toLowerCase() === 'female' || fm.gender?.toLowerCase() === 'f' ? 'female' : 'male'}
                                                            onChange={(e) => updateFamilyMember(index, 'gender', e.target.value)}
                                                            className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        >
                                                            <option value="male">{t('profile', 'male')}</option>
                                                            <option value="female">{t('profile', 'female')}</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-slate-500 mb-1">{t('profile', 'age')}</label>
                                                        <input
                                                            type="number"
                                                            value={fm.age || ''}
                                                            onChange={(e) => updateFamilyMember(index, 'age', parseInt(e.target.value) || 0)}
                                                            className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-slate-500 mb-1">Mobile</label>
                                                        <input
                                                            type="tel"
                                                            placeholder="10 digits"
                                                            value={fm.mobile || ''}
                                                            onChange={(e) => updateFamilyMember(index, 'mobile', e.target.value)}
                                                            className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => removeFamilyMember(index)}
                                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors self-end"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden ${fm.gender?.toLowerCase() === 'female' || fm.gender?.toLowerCase() === 'f'
                                                        ? 'bg-pink-500/20 text-pink-400'
                                                        : 'bg-blue-500/20 text-blue-400'
                                                        }`}>
                                                        {fm.profile_photo_url ? (
                                                            <img src={getCleanImageUrl(fm.profile_photo_url)} alt={fm.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            fm.name?.[0]?.toUpperCase() || '?'
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-white">{fm.name || 'Unnamed'}</div>
                                                        <div className="text-sm text-slate-400 flex flex-wrap items-center gap-3">
                                                            <span className="flex items-center gap-1"><Heart size={12} />{fm.relation || 'N/A'}</span>
                                                            {fm.age && <span className="flex items-center gap-1"><Calendar size={12} />{fm.age} yrs</span>}
                                                            {fm.mobile && <span className="flex items-center gap-1"><Phone size={12} />{fm.mobile}</span>}
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${fm.gender?.toLowerCase() === 'female' || fm.gender?.toLowerCase() === 'f'
                                                        ? 'bg-pink-500/10 text-pink-400'
                                                        : 'bg-blue-500/10 text-blue-400'
                                                        }`}>
                                                        {fm.gender?.toLowerCase() === 'female' || fm.gender?.toLowerCase() === 'f' ? `♀ ${t('profile', 'female')}` : `♂ ${t('profile', 'male')}`}
                                                    </span>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))
                                )}

                                {isEditing && isHoF && (
                                    <button
                                        onClick={addFamilyMember}
                                        className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-blue-500 text-slate-400 hover:text-blue-400 rounded-xl flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Plus size={18} />
                                        {t('profile', 'addFamilyMember')}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Family Hub Quick Links */}
            <div className="mx-4 md:mx-8 mt-6 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-5">
                    <Heart size={20} className="text-rose-400" />
                    Family Hub
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Link to="/family/tree" className="bg-slate-900/60 border border-slate-700/30 rounded-xl p-4 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all group text-center">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                            <GitBranch size={20} className="text-blue-400" />
                        </div>
                        <p className="text-sm font-medium text-white">Family Tree</p>
                        <p className="text-xs text-slate-500 mt-0.5">View relationships</p>
                    </Link>
                    <Link to="/family/albums" className="bg-slate-900/60 border border-slate-700/30 rounded-xl p-4 hover:bg-pink-500/10 hover:border-pink-500/30 transition-all group text-center">
                        <div className="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                            <ImageIcon size={20} className="text-pink-400" />
                        </div>
                        <p className="text-sm font-medium text-white">Photo Albums</p>
                        <p className="text-xs text-slate-500 mt-0.5">Shared memories</p>
                    </Link>
                    <Link to="/family/events" className="bg-slate-900/60 border border-slate-700/30 rounded-xl p-4 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all group text-center">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                            <PartyPopper size={20} className="text-amber-400" />
                        </div>
                        <p className="text-sm font-medium text-white">Family Events</p>
                        <p className="text-xs text-slate-500 mt-0.5">Celebrations</p>
                    </Link>
                    <Link to="/family/logins" className="bg-slate-900/60 border border-slate-700/30 rounded-xl p-4 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group text-center">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                            <Key size={20} className="text-emerald-400" />
                        </div>
                        <p className="text-sm font-medium text-white">Family Logins</p>
                        <p className="text-xs text-slate-500 mt-0.5">Manage access</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
