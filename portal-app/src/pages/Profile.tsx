import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
    Camera, Edit3, Save, X, Plus, Trash2,
    MapPin, Phone, Users, Heart,
    Calendar, Shield, ChevronDown, ChevronUp,
    GitBranch, Image as ImageIcon, PartyPopper, Key,
    UserCircle2, Home, Eye
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

    // Determine if this person is the Head of Family
    const isHoF =
        user?.relation?.toLowerCase() === 'self' ||
        user?.relation?.toLowerCase() === 'head' ||
        user?.relation?.toLowerCase() === 'self/head';

    const allFamilyMembers: FamilyMember[] = member?.family_members || [];

    // For a family member: find their own sub-profile from the family array
    const myFmProfile = !isHoF
        ? allFamilyMembers.find(f =>
            (f.mobile || '').replace(/\D/g, '').slice(-10) ===
            (user?.mobile || '').replace(/\D/g, '').slice(-10)
        )
        : null;

    // The displayed name / mobile / relation for the top card
    const myDisplayName = isHoF ? (member?.name || '') : (myFmProfile?.name || user?.name || '');
    const myDisplayMobile = isHoF ? (member?.mobile || '') : (myFmProfile?.mobile || user?.mobile || '');
    const myDisplayRelation = isHoF ? 'Head of Family' : (user?.relation || 'Family Member');
    const myDisplayGender = isHoF ? (member?.head_gender || '') : (myFmProfile?.gender || '');
    const myDisplayPhoto = isHoF
        ? member?.profile_photo_url
        : myFmProfile?.profile_photo_url || member?.profile_photo_url;

    // HoF: edit their entire profile; Family member: only their own name/gender
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(allFamilyMembers);
    const [form, setForm] = useState({
        name: myDisplayName,
        mobile: isHoF ? (member?.mobile || '') : (myFmProfile?.mobile || ''),
        district: member?.district || '',
        taluka: member?.taluka || '',
        panchayat: member?.panchayat || '',
        address: member?.address || '',
        aadhar_no: member?.aadhar_no || '',
        head_gender: isHoF ? (member?.head_gender || '') : (myFmProfile?.gender || ''),
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
        setFamilyMembers(prev => prev.map((fm, i) => i === index ? { ...fm, [field]: value } : fm));
    };

    const calculateStats = () => {
        const hasSelf = familyMembers.some(f =>
            f.relation?.toLowerCase() === 'self' ||
            f.relation?.toLowerCase() === 'head'
        );
        const female = familyMembers.filter(f => f.gender?.toLowerCase() === 'female' || f.gender?.toLowerCase() === 'f').length +
            (!hasSelf && (form.head_gender?.toLowerCase() === 'female' || form.head_gender?.toLowerCase() === 'f') ? 1 : 0);
        const male = familyMembers.filter(f => !(f.gender?.toLowerCase() === 'female' || f.gender?.toLowerCase() === 'f')).length +
            (!hasSelf && !(form.head_gender?.toLowerCase() === 'female' || form.head_gender?.toLowerCase() === 'f') ? 1 : 0);
        return { male, female, total: male + female };
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('portalToken');
            const statsToSave = calculateStats();
            const payload = isHoF
                ? { ...form, family_members: familyMembers, male: statsToSave.male, female: statsToSave.female }
                : { name: form.name, head_gender: form.head_gender }; // family member: only personal fields

            const response = await fetch(`${PORTAL_API_URL}/profile`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to save');
            const data = await response.json();
            if (data.success) {
                const updated = { ...member, ...payload };
                localStorage.setItem('portalMember', JSON.stringify(updated));
                toast.success(t('profile', 'profileUpdated'));
                setIsEditing(false);
            }
        } catch (_err) {
            console.error(_err);
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
            const { uploadProfilePhoto } = await import('../services/firebaseStorage');
            const memberId = member?.membership_no || 'unknown';
            const photoUrl = await uploadProfilePhoto(file, memberId);

            // Save the URL to backend
            const token = localStorage.getItem('portalToken');
            const response = await fetch(`${PORTAL_API_URL}/profile/photo`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoUrl })
            });
            if (!response.ok) throw new Error('Failed to save photo URL');
            const data = await response.json();
            if (data.success) {
                const updated = { ...member, profile_photo_url: photoUrl };
                localStorage.setItem('portalMember', JSON.stringify(updated));
                toast.success(t('profile', 'photoUploaded'), { id: toastId });
                window.location.reload();
            }
        } catch (_err) {
            console.error(_err);
            toast.error('Failed to upload photo', { id: toastId });
        }
    };

    const handleDeletePhoto = async () => {
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
                window.location.reload();
            }
        } catch (_e) {
            console.error('Failed to delete photo', _e);
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

    const hofName = member?.name || '';
    const hofMobile = member?.mobile || '';
    const hofGender = member?.head_gender || '';
    const hofAge = allFamilyMembers.find(f =>
        f.relation?.toLowerCase() === 'self' || f.relation?.toLowerCase() === 'head'
    )?.age;

    return (
        <div className="max-w-2xl mx-auto pb-24 px-4 space-y-5">

            {/* ═══════════════════════════════════
                SECTION 1 — My Personal Profile Card
            ═══════════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-700/60 shadow-2xl"
            >
                {/* Decorative glow */}
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

                {/* Top strip */}
                <div className="h-24 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 relative">
                    <div className="absolute inset-0 opacity-30"
                        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='20' cy='20' r='1.5' fill='white'/%3E%3C/svg%3E\")" }} />
                    <div className="absolute bottom-3 left-4 flex items-center gap-1.5 text-white/70 text-xs">
                        <Shield size={11} />
                        <span>Member #{member?.membership_no}</span>
                    </div>
                </div>

                <div className="px-5 pb-5">
                    {/* Avatar row */}
                    <div className="flex items-end justify-between -mt-12 mb-4">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-2xl ring-4 ring-slate-800 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl">
                                {myDisplayPhoto ? (
                                    <img src={getCleanImageUrl(myDisplayPhoto)} referrerPolicy="no-referrer" alt={myDisplayName} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-white">{getInitial(myDisplayName)}</span>
                                )}
                            </div>
                            {/* Photo action overlay — always visible on hover */}
                            <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => photoInputRef.current?.click()}
                                    className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-white shadow"
                                    title="Change photo">
                                    <Camera size={14} />
                                </button>
                                {myDisplayPhoto && (
                                    <button onClick={handleDeletePhoto}
                                        className="p-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-white shadow"
                                        title="Remove photo">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                            <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                        </div>

                        <button
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            disabled={saving}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg ${isEditing
                                ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/20'
                                : 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-500/10'
                                }`}
                        >
                            {isEditing ? (
                                <><Save size={15} /><span>{saving ? 'Saving…' : 'Save'}</span></>
                            ) : (
                                <><Edit3 size={15} /><span>Edit My Profile</span></>
                            )}
                        </button>
                    </div>

                    {/* Name + meta */}
                    {!isEditing ? (
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl font-bold text-white">{myDisplayName}</h1>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${isHoF ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {myDisplayRelation}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-slate-400">
                                {myDisplayMobile && (
                                    <span className="flex items-center gap-1.5"><Phone size={13} />{myDisplayMobile}</span>
                                )}
                                {member?.panchayat && (
                                    <span className="flex items-center gap-1.5"><MapPin size={13} />{[member.panchayat, member.taluka, member.district].filter(Boolean).join(', ')}</span>
                                )}
                                {myDisplayGender && (
                                    <span className="flex items-center gap-1.5">
                                        {myDisplayGender.toLowerCase() === 'female' ? '♀' : '♂'}
                                        {myDisplayGender.charAt(0).toUpperCase() + myDisplayGender.slice(1).toLowerCase()}
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* ── Edit Form ── */
                        <AnimatePresence>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4 mt-2"
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <h2 className="text-base font-bold text-white">
                                        {isHoF ? 'Edit Family Profile' : 'Edit My Details'}
                                    </h2>
                                    <button onClick={() => setIsEditing(false)} className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Name</label>
                                        <input type="text" value={form.name}
                                            onChange={e => handleFormChange('name', e.target.value)}
                                            className="w-full bg-slate-900/60 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 mb-1">Gender</label>
                                        <select value={form.head_gender} onChange={e => handleFormChange('head_gender', e.target.value)}
                                            className="w-full bg-slate-900/60 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm">
                                            <option value="">— Select —</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </div>

                                    {isHoF && (
                                        <>
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">Mobile</label>
                                                <input type="text" value={form.mobile} onChange={e => handleFormChange('mobile', e.target.value)}
                                                    className="w-full bg-slate-900/60 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">District</label>
                                                <input type="text" value={form.district} onChange={e => handleFormChange('district', e.target.value)}
                                                    className="w-full bg-slate-900/60 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">Taluka</label>
                                                <input type="text" value={form.taluka} onChange={e => handleFormChange('taluka', e.target.value)}
                                                    className="w-full bg-slate-900/60 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">Panchayat</label>
                                                <input type="text" value={form.panchayat} onChange={e => handleFormChange('panchayat', e.target.value)}
                                                    className="w-full bg-slate-900/60 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs text-slate-400 mb-1">Address</label>
                                                <textarea value={form.address} onChange={e => handleFormChange('address', e.target.value)}
                                                    rows={2} className="w-full bg-slate-900/60 text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm" />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </motion.div>

            {/* ═══════════════════════════════════
                SECTION 2 — My Family Card
                Shown to all users. HoF can edit, Family Members see read-only.
            ═══════════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="rounded-3xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-xl shadow-xl overflow-hidden"
            >
                {/* Header */}
                <button
                    onClick={() => setShowFamily(!showFamily)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-700/20 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
                            <Users size={18} className="text-purple-400" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-base font-bold text-white">My Family</h2>
                            <p className="text-xs text-slate-400">Membership #{member?.membership_no}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isHoF && (
                            <span className="flex items-center gap-1 text-[10px] bg-slate-700 text-slate-400 px-2 py-1 rounded-full font-medium">
                                <Eye size={10} /> View only
                            </span>
                        )}
                        {showFamily ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </div>
                </button>

                <AnimatePresence>
                    {showFamily && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="px-5 pb-5 space-y-4">
                                {/* Head of Family info */}
                                <div className="flex items-center gap-3 p-3 bg-slate-900/40 rounded-2xl border border-slate-700/30">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
                                        {member?.profile_photo_url ? (
                                            <img src={getCleanImageUrl(member.profile_photo_url)} alt={hofName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xl font-bold text-white">{getInitial(hofName)}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-white truncate">{hofName}</p>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/15 text-amber-400 rounded font-bold uppercase tracking-wider">Head</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {hofGender && `${hofGender.charAt(0).toUpperCase() + hofGender.slice(1).toLowerCase()}`}
                                            {hofAge ? `, ${hofAge} yrs` : ''}
                                            {hofMobile && ` · ${hofMobile}`}
                                        </p>
                                    </div>
                                </div>

                                {/* Location + counts */}
                                <div className="grid grid-cols-2 gap-2.5">
                                    {member?.address && (
                                        <div className="col-span-2 flex items-start gap-2 text-sm text-slate-400 bg-slate-900/30 rounded-xl p-3">
                                            <Home size={14} className="mt-0.5 shrink-0 text-slate-500" />
                                            <span>{member.address}</span>
                                        </div>
                                    )}
                                    {(member?.panchayat || member?.taluka) && (
                                        <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-900/30 rounded-xl p-3">
                                            <MapPin size={14} className="shrink-0 text-slate-500" />
                                            <span className="truncate">{[member.panchayat, member.taluka, member.district].filter(Boolean).join(', ')}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-900/30 rounded-xl p-3">
                                        <Users size={14} className="shrink-0 text-slate-500" />
                                        <span>{member?.male || 0}M · {member?.female || 0}F</span>
                                    </div>
                                </div>

                                {/* Family members list */}
                                {isHoF ? (
                                    /* HoF: editable list */
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Family Members</p>
                                        {familyMembers.length === 0
                                            ? <p className="text-center py-6 text-slate-500 text-sm">No family members added yet.</p>
                                            : familyMembers.map((fm, index) => (
                                                <motion.div key={index} layout initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}
                                                    className="bg-slate-900/40 border border-slate-700/30 rounded-xl p-3"
                                                >
                                                    {isEditing ? (
                                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                                                            <div>
                                                                <label className="block text-[10px] text-slate-500 mb-1">Name</label>
                                                                <input value={fm.name} onChange={e => updateFamilyMember(index, 'name', e.target.value)}
                                                                    className="w-full bg-slate-800 text-white px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] text-slate-500 mb-1">Relation</label>
                                                                <input value={fm.relation} onChange={e => updateFamilyMember(index, 'relation', e.target.value)}
                                                                    className="w-full bg-slate-800 text-white px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] text-slate-500 mb-1">Gender</label>
                                                                <select value={fm.gender?.toLowerCase() === 'female' ? 'female' : 'male'}
                                                                    onChange={e => updateFamilyMember(index, 'gender', e.target.value)}
                                                                    className="w-full bg-slate-800 text-white px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                                                                    <option value="male">Male</option>
                                                                    <option value="female">Female</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] text-slate-500 mb-1">Age</label>
                                                                <input type="number" value={fm.age || ''} onChange={e => updateFamilyMember(index, 'age', parseInt(e.target.value) || 0)}
                                                                    className="w-full bg-slate-800 text-white px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                                            </div>
                                                            <button onClick={() => removeFamilyMember(index)}
                                                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors self-end">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden ${fm.gender?.toLowerCase() === 'female' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                                {fm.profile_photo_url
                                                                    ? <img src={getCleanImageUrl(fm.profile_photo_url)} alt={fm.name} className="w-full h-full object-cover" />
                                                                    : fm.name?.[0]?.toUpperCase() || <UserCircle2 size={18} />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-white text-sm">{fm.name || 'Unnamed'}</p>
                                                                <p className="text-xs text-slate-400 flex items-center gap-2">
                                                                    <span className="flex items-center gap-1"><Heart size={10} />{fm.relation || '—'}</span>
                                                                    {fm.age && <span className="flex items-center gap-1"><Calendar size={10} />{fm.age} yrs</span>}
                                                                    {fm.mobile && <span className="flex items-center gap-1"><Phone size={10} />{fm.mobile}</span>}
                                                                </p>
                                                            </div>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${fm.gender?.toLowerCase() === 'female' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                                {fm.gender?.toLowerCase() === 'female' ? '♀ F' : '♂ M'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        {isEditing && (
                                            <button onClick={addFamilyMember}
                                                className="w-full py-2.5 border-2 border-dashed border-slate-700 hover:border-blue-500 text-slate-400 hover:text-blue-400 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                                                <Plus size={16} /> Add Family Member
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    /* Family Member: read-only list */
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">All Members</p>
                                        {allFamilyMembers.map((fm, index) => (
                                            <div key={index}
                                                className={`flex items-center gap-3 p-3 bg-slate-900/30 rounded-xl border transition-colors ${(fm.mobile || '').replace(/\D/g, '').slice(-10) === (myDisplayMobile || '').replace(/\D/g, '').slice(-10)
                                                    ? 'border-blue-500/40 bg-blue-500/5'
                                                    : 'border-slate-700/20'}`}>
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden ${fm.gender?.toLowerCase() === 'female' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {fm.profile_photo_url
                                                        ? <img src={getCleanImageUrl(fm.profile_photo_url)} alt={fm.name} className="w-full h-full object-cover" />
                                                        : fm.name?.[0]?.toUpperCase() || <UserCircle2 size={18} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-medium text-white text-sm">{fm.name}</p>
                                                        {(fm.mobile || '').replace(/\D/g, '').slice(-10) === (myDisplayMobile || '').replace(/\D/g, '').slice(-10) && (
                                                            <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase">You</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400">{fm.relation}{fm.age ? `, ${fm.age} yrs` : ''}</p>
                                                </div>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${fm.gender?.toLowerCase() === 'female' ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                    {fm.gender?.toLowerCase() === 'female' ? '♀' : '♂'}
                                                </span>
                                            </div>
                                        ))}

                                        <div className="flex gap-2 pt-1">
                                            <Link to="/members" className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition-colors">
                                                <Eye size={14} /> View All
                                            </Link>
                                            <Link to="/family/tree" className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-medium transition-colors">
                                                <GitBranch size={14} /> Family Tree
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* ═══════════════════════════════════
                SECTION 3 — Family Hub Quick Links
            ═══════════════════════════════════ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                className="rounded-3xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xl p-5 shadow-xl"
            >
                <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
                    <Heart size={18} className="text-rose-400" />
                    Family Hub
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { to: '/family/tree', icon: <GitBranch size={20} className="text-blue-400" />, label: 'Family Tree', sub: 'View relationships', hover: 'hover:border-blue-500/30 hover:bg-blue-500/10', icon_bg: 'bg-blue-500/15' },
                        { to: '/family/albums', icon: <ImageIcon size={20} className="text-pink-400" />, label: 'Photo Albums', sub: 'Shared memories', hover: 'hover:border-pink-500/30 hover:bg-pink-500/10', icon_bg: 'bg-pink-500/15' },
                        { to: '/family/events', icon: <PartyPopper size={20} className="text-amber-400" />, label: 'Family Events', sub: 'Celebrations', hover: 'hover:border-amber-500/30 hover:bg-amber-500/10', icon_bg: 'bg-amber-500/15' },
                        { to: '/family/logins', icon: <Key size={20} className="text-emerald-400" />, label: 'Family Logins', sub: 'Manage access', hover: 'hover:border-emerald-500/30 hover:bg-emerald-500/10', icon_bg: 'bg-emerald-500/15' },
                    ].map(({ to, icon, label, sub, hover, icon_bg }) => (
                        <Link key={to} to={to}
                            className={`bg-slate-900/50 border border-slate-700/30 rounded-2xl p-4 ${hover} transition-all group text-center`}>
                            <div className={`w-10 h-10 rounded-xl ${icon_bg} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
                                {icon}
                            </div>
                            <p className="text-sm font-medium text-white">{label}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
                        </Link>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
