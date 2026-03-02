import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Member, FamilyMember } from '../types';
import {
    Loader2, Search, UserCheck, UserPlus, MapPin, Users,
    MessageSquare, BadgeCheck, Phone, LayoutGrid, List,
    ChevronDown, ChevronUp, Filter, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { PORTAL_API_URL } from '../config/apiConfig';

// ─── helpers ────────────────────────────────────────────────────────────────
const getInitial = (name: string) => (name ? name.charAt(0).toUpperCase() : '?');

const cleanImageUrl = (url?: string | null) => {
    if (!url) return undefined;
    if (url.includes('drive.google.com/uc?id='))
        return url.replace('drive.google.com/uc?id=', 'lh3.googleusercontent.com/d/');
    return url;
};

const isFemale = (gender?: string) =>
    ['female', 'f'].includes((gender || '').toLowerCase());

const genderGradient = (gender?: string) =>
    isFemale(gender)
        ? 'from-rose-500 via-pink-600 to-purple-700'
        : 'from-blue-600 via-indigo-600 to-purple-700';

const genderRing = (gender?: string) =>
    isFemale(gender) ? 'ring-pink-500' : 'ring-blue-500';

const genderBg = (gender?: string) =>
    isFemale(gender) ? 'bg-pink-500/20 text-pink-300' : 'bg-blue-500/20 text-blue-300';

const wasRecentlyActive = (lastLogin?: string) => {
    if (!lastLogin) return false;
    return Date.now() - new Date(lastLogin).getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
};

// ─── Avatar component ────────────────────────────────────────────────────────
function Avatar({
    name, photoUrl, gender, size = 'md', showDot = false
}: { name: string; photoUrl?: string | null; gender?: string; size?: 'sm' | 'md' | 'lg'; showDot?: boolean }) {
    const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-base', lg: 'w-16 h-16 text-xl' };
    return (
        <div className={`relative ${sizeMap[size]}`}>
            <div className={`w-full h-full rounded-full ring-2 ${genderRing(gender)} overflow-hidden flex items-center justify-center font-bold text-white shadow-lg ${genderBg(gender)}`}>
                {photoUrl ? (
                    <img src={cleanImageUrl(photoUrl)} referrerPolicy="no-referrer" alt={name} className="w-full h-full object-cover" />
                ) : (
                    <span>{getInitial(name)}</span>
                )}
            </div>
            {showDot && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-slate-900 block" />
            )}
        </div>
    );
}

// ─── Family Member Row ───────────────────────────────────────────────────────
function FamilyMemberRow({ fm }: { fm: FamilyMember }) {
    return (
        <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-800/60 transition-colors">
            <Avatar name={fm.name} photoUrl={fm.profile_photo_url} gender={fm.gender} size="sm" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{fm.name}</p>
                <p className="text-xs text-slate-400 truncate">
                    {fm.relation && <span className="mr-2">{fm.relation}</span>}
                    {fm.age && <span>{fm.age} yrs</span>}
                </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isFemale(fm.gender) ? 'bg-pink-500/15 text-pink-400' : 'bg-blue-500/15 text-blue-400'}`}>
                    {isFemale(fm.gender) ? '♀' : '♂'}
                </span>
                {fm.mobile && (
                    <a href={`tel:${fm.mobile}`} className="text-slate-500 hover:text-blue-400 transition-colors">
                        <Phone size={11} />
                    </a>
                )}
            </div>
        </div>
    );
}

// ─── Card Component ──────────────────────────────────────────────────────────
function MemberCard({
    member, expanded, onToggle, subscribing, onSubscribe, onMessage
}: {
    member: Member;
    expanded: boolean;
    onToggle: () => void;
    subscribing: boolean;
    onSubscribe: () => void;
    onMessage: () => void;
}) {
    const fmList: FamilyMember[] = member.family_members || [];
    const maleCount = member.male ?? fmList.filter(f => !isFemale(f.gender)).length;
    const femaleCount = member.female ?? fmList.filter(f => isFemale(f.gender)).length;
    const totalCount = (member.male ?? 0) + (member.female ?? 0) || fmList.length;
    const isActive = wasRecentlyActive((member as any).last_portal_login);

    return (
        <motion.div layout className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
            {/* Header strip with gradient */}
            <div className={`h-16 bg-gradient-to-r ${genderGradient(member.head_gender)} relative`}>
                {/* Action buttons top-right */}
                <div className="absolute top-2 right-2 flex gap-1.5">
                    <button onClick={onSubscribe} disabled={subscribing}
                        className={`p-1.5 rounded-lg backdrop-blur-sm transition-colors ${member.is_subscribed ? 'bg-blue-500/30 text-blue-200 hover:bg-red-500/30 hover:text-red-200' : 'bg-white/20 text-white/80 hover:bg-white/30'}`}
                        title={member.is_subscribed ? 'Unfollow' : 'Follow'}>
                        {subscribing ? <Loader2 size={14} className="animate-spin" /> : member.is_subscribed ? <UserCheck size={14} /> : <UserPlus size={14} />}
                    </button>
                    <button onClick={onMessage}
                        className="p-1.5 rounded-lg bg-white/20 text-white/80 hover:bg-white/30 backdrop-blur-sm transition-colors"
                        title="Send Message">
                        <MessageSquare size={14} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="px-4 pb-3 -mt-7">
                {/* Avatar + name */}
                <div className="flex items-end gap-3 mb-3">
                    <Avatar name={member.name} photoUrl={member.profile_photo_url} gender={member.head_gender} size="lg" showDot={isActive} />
                    <div className="flex-1 min-w-0 pb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Link to={`/profile/${member.membership_no}`}
                                className="font-bold text-white text-base hover:text-blue-400 transition-colors truncate">
                                {member.name}
                            </Link>
                            {member.is_verified && <BadgeCheck size={16} className="text-blue-400 shrink-0" />}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded">
                            #{member.membership_no}
                        </span>
                    </div>
                </div>

                {/* Location */}
                {(member.village || member.district) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                        <MapPin size={12} className="text-slate-500 shrink-0" />
                        <span className="truncate">{[member.village, member.district].filter(Boolean).join(', ')}</span>
                    </div>
                )}

                {/* Family stats pills */}
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                    <span className="flex items-center gap-1 text-[11px] bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full">
                        <Users size={10} /> {totalCount}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
                        ♂ {maleCount}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded-full">
                        ♀ {femaleCount}
                    </span>
                    {member.mobile && (
                        <a href={`tel:${member.mobile}`} className="flex items-center gap-1 text-[11px] bg-slate-700/40 text-slate-400 hover:text-blue-400 px-2 py-0.5 rounded-full transition-colors">
                            <Phone size={10} /> {member.mobile}
                        </a>
                    )}
                </div>

                {/* Expand toggle */}
                {fmList.length > 0 && (
                    <button onClick={onToggle}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 hover:text-blue-400 py-1.5 border-t border-slate-700/50 transition-colors">
                        {expanded ? <><ChevronUp size={13} /> Hide Family</> : <><ChevronDown size={13} /> View Family ({fmList.length})</>}
                    </button>
                )}
            </div>

            {/* Expandable family section */}
            <AnimatePresence>
                {expanded && fmList.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-slate-700/50 px-3 py-2 bg-slate-900/40 space-y-0.5 max-h-64 overflow-y-auto">
                            {fmList.map((fm, i) => <FamilyMemberRow key={i} fm={fm} />)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─── Table Component ─────────────────────────────────────────────────────────
function MemberTable({
    members, expandedRows, onToggleRow, subscribing, onSubscribe, onMessage
}: {
    members: Member[];
    expandedRows: Set<string>;
    onToggleRow: (id: string) => void;
    subscribing: string | null;
    onSubscribe: (id: string) => void;
    onMessage: (m: Member) => void;
}) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50 shadow-xl">
            <table className="w-full min-w-[700px] text-sm">
                <thead>
                    <tr className="bg-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                        <th className="px-4 py-3 text-left w-8"></th>
                        <th className="px-4 py-3 text-left">Profile</th>
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Location</th>
                        <th className="px-4 py-3 text-center">♂</th>
                        <th className="px-4 py-3 text-center">♀</th>
                        <th className="px-4 py-3 text-center">Total</th>
                        <th className="px-4 py-3 text-left">Mobile</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                    {members.map(m => {
                        const fmList: FamilyMember[] = m.family_members || [];
                        const isExpanded = expandedRows.has(m.membership_no);
                        const maleCount = m.male ?? fmList.filter(f => !isFemale(f.gender)).length;
                        const femaleCount = m.female ?? fmList.filter(f => isFemale(f.gender)).length;
                        const totalCount = (m.male ?? 0) + (m.female ?? 0) || fmList.length;
                        const isActive = wasRecentlyActive((m as any).last_portal_login);
                        return (
                            <>
                                <tr key={m.membership_no} className="bg-slate-800/40 hover:bg-slate-800/70 transition-colors">
                                    <td className="px-3 py-3 text-center">
                                        {fmList.length > 0 && (
                                            <button onClick={() => onToggleRow(m.membership_no)}
                                                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Avatar name={m.name} photoUrl={m.profile_photo_url} gender={m.head_gender} size="sm" showDot={isActive} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link to={`/profile/${m.membership_no}`} className="font-semibold text-white hover:text-blue-400 transition-colors">
                                            {m.name}
                                        </Link>
                                        <p className="text-[10px] text-slate-500 font-mono">#{m.membership_no}</p>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400 text-xs">
                                        {[m.village, m.district].filter(Boolean).join(', ') || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center text-blue-400 font-semibold">{maleCount}</td>
                                    <td className="px-4 py-3 text-center text-pink-400 font-semibold">{femaleCount}</td>
                                    <td className="px-4 py-3 text-center text-slate-300 font-semibold">{totalCount}</td>
                                    <td className="px-4 py-3">
                                        {m.mobile ? (
                                            <a href={`tel:${m.mobile}`} className="text-slate-400 hover:text-blue-400 transition-colors text-xs">
                                                {m.mobile}
                                            </a>
                                        ) : <span className="text-slate-600">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => onSubscribe(m.membership_no)} disabled={subscribing === m.membership_no}
                                                className={`p-1.5 rounded-lg transition-colors ${m.is_subscribed ? 'text-blue-400 hover:text-red-400' : 'text-slate-500 hover:text-blue-400'}`}>
                                                {subscribing === m.membership_no ? <Loader2 size={14} className="animate-spin" /> : m.is_subscribed ? <UserCheck size={14} /> : <UserPlus size={14} />}
                                            </button>
                                            <button onClick={() => onMessage(m)} className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 transition-colors">
                                                <MessageSquare size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                {/* Expanded family sub-table */}
                                {isExpanded && fmList.length > 0 && (
                                    <tr key={`${m.membership_no}-family`}>
                                        <td colSpan={9} className="p-0">
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="bg-slate-900/60 border-t border-slate-700/30"
                                            >
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="text-slate-500 uppercase tracking-wider">
                                                            <th className="pl-16 pr-4 py-2 text-left">Photo</th>
                                                            <th className="px-4 py-2 text-left">Name</th>
                                                            <th className="px-4 py-2 text-left">Relation</th>
                                                            <th className="px-4 py-2 text-center">Gender</th>
                                                            <th className="px-4 py-2 text-center">Age</th>
                                                            <th className="px-4 py-2 text-left">Mobile</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-800">
                                                        {fmList.map((fm, i) => (
                                                            <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                                                                <td className="pl-16 pr-4 py-2">
                                                                    <Avatar name={fm.name} photoUrl={fm.profile_photo_url} gender={fm.gender} size="sm" />
                                                                </td>
                                                                <td className="px-4 py-2 font-medium text-white">{fm.name}</td>
                                                                <td className="px-4 py-2 text-slate-400">{fm.relation || '—'}</td>
                                                                <td className="px-4 py-2 text-center">
                                                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isFemale(fm.gender) ? 'bg-pink-500/15 text-pink-400' : 'bg-blue-500/15 text-blue-400'}`}>
                                                                        {isFemale(fm.gender) ? '♀ F' : '♂ M'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2 text-center text-slate-400">{fm.age || '—'}</td>
                                                                <td className="px-4 py-2">
                                                                    {fm.mobile ? (
                                                                        <a href={`tel:${fm.mobile}`} className="text-slate-400 hover:text-blue-400 transition-colors">{fm.mobile}</a>
                                                                    ) : <span className="text-slate-600">—</span>}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </motion.div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function Members() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [subscribing, setSubscribing] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [filterDistrict, setFilterDistrict] = useState('');
    const [filterVillage, setFilterVillage] = useState('');
    const [filterGender, setFilterGender] = useState('');

    useEffect(() => { fetchMembers(); }, []);

    const getToken = () => localStorage.getItem('portalToken');

    const fetchMembers = async () => {
        try {
            const token = getToken();
            if (!token) return;
            const response = await fetch(`${PORTAL_API_URL}/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch members');
            const data = await response.json();
            if (data.success) setMembers(data.members);
        } catch (error) {
            console.error(error);
            toast.error(t('members', 'failedLoad'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (memberId: string) => {
        try {
            const token = getToken();
            if (!token) return;
            setSubscribing(memberId);
            const response = await fetch(`${PORTAL_API_URL}/subscribe/${memberId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update subscription');
            setMembers(prev => prev.map(m => m.membership_no === memberId ? { ...m, is_subscribed: data.subscribed } : m));
            toast.success(data.message);
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setSubscribing(null);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    // Derived filter options
    const districts = useMemo(() => [...new Set(members.map(m => m.district).filter(Boolean))].sort() as string[], [members]);
    const villages = useMemo(() => {
        const src = filterDistrict ? members.filter(m => m.district === filterDistrict) : members;
        return [...new Set(src.map(m => m.village).filter(Boolean))].sort() as string[];
    }, [members, filterDistrict]);

    const activeFilterCount = [filterDistrict, filterVillage, filterGender].filter(Boolean).length;

    const filtered = useMemo(() => members.filter(m => {
        const q = searchTerm.toLowerCase();
        const matchSearch =
            m.name.toLowerCase().includes(q) ||
            m.membership_no.toLowerCase().includes(q) ||
            (m.village || '').toLowerCase().includes(q) ||
            (m.mobile || '').includes(q);
        const matchDistrict = !filterDistrict || m.district === filterDistrict;
        const matchVillage = !filterVillage || m.village === filterVillage;
        const matchGender = !filterGender ||
            (filterGender === 'female' && isFemale(m.head_gender)) ||
            (filterGender === 'male' && !isFemale(m.head_gender));
        return matchSearch && matchDistrict && matchVillage && matchGender;
    }), [members, searchTerm, filterDistrict, filterVillage, filterGender]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-4 pb-20">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">{t('members', 'title')}</h1>
                    <p className="text-sm text-slate-400">{t('members', 'subtitle')}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search name, #no, village…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 text-sm"
                        />
                    </div>

                    {/* Filter toggle */}
                    <button onClick={() => setShowFilters(s => !s)}
                        className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-blue-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
                        <Filter size={15} /> Filters
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {/* View toggle */}
                    <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1 gap-1">
                        <button onClick={() => setViewMode('card')}
                            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="Card View">
                            <LayoutGrid size={16} />
                        </button>
                        <button onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="Table View">
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 flex flex-wrap items-center gap-3">
                            <select value={filterDistrict} onChange={e => { setFilterDistrict(e.target.value); setFilterVillage(''); }}
                                className="bg-slate-900 border border-slate-700 text-sm text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Districts</option>
                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select value={filterVillage} onChange={e => setFilterVillage(e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-sm text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Villages</option>
                                {villages.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                            <select value={filterGender} onChange={e => setFilterGender(e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-sm text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Genders</option>
                                <option value="male">♂ Male HoF</option>
                                <option value="female">♀ Female HoF</option>
                            </select>
                            {activeFilterCount > 0 && (
                                <button onClick={() => { setFilterDistrict(''); setFilterVillage(''); setFilterGender(''); }}
                                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-rose-400 transition-colors">
                                    <X size={14} /> Clear All
                                </button>
                            )}
                            <span className="ml-auto text-xs text-slate-500">{filtered.length} results</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Content ── */}
            {filtered.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                    <Users size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No members found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
            ) : viewMode === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map(m => (
                        <MemberCard
                            key={m.membership_no}
                            member={m}
                            expanded={expandedCards.has(m.membership_no)}
                            onToggle={() => toggleExpand(m.membership_no)}
                            subscribing={subscribing === m.membership_no}
                            onSubscribe={() => handleSubscribe(m.membership_no)}
                            onMessage={() => navigate(`/chat?with=${m.membership_no}&name=${encodeURIComponent(m.name)}`)}
                        />
                    ))}
                </div>
            ) : (
                <MemberTable
                    members={filtered}
                    expandedRows={expandedCards}
                    onToggleRow={toggleExpand}
                    subscribing={subscribing}
                    onSubscribe={handleSubscribe}
                    onMessage={m => navigate(`/chat?with=${m.membership_no}&name=${encodeURIComponent(m.name)}`)}
                />
            )}
        </div>
    );
}
