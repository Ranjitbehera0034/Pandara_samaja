import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Member, FamilyMember } from '../types';
import {
    Loader2, Search, UserCheck, UserPlus, MapPin, Users,
    MessageSquare, BadgeCheck, Phone, LayoutGrid, List,
    ChevronDown, ChevronUp, Filter, X, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';
import { PORTAL_API_URL } from '../config/apiConfig';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getInitial = (name: string) => (name ? name.charAt(0).toUpperCase() : '?');

const cleanImageUrl = (url?: string | null) => {
    if (!url) return undefined;
    if (url.includes('drive.google.com/uc?id='))
        return url.replace('drive.google.com/uc?id=', 'lh3.googleusercontent.com/d/');
    return url;
};

const isFemale = (gender?: string) => ['female', 'f'].includes((gender || '').toLowerCase());

const wasRecentlyActive = (lastLogin?: string) => {
    if (!lastLogin) return false;
    return Date.now() - new Date(lastLogin).getTime() < 7 * 24 * 60 * 60 * 1000;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, photoUrl, gender, size = 'md', showDot = false }:
    { name: string; photoUrl?: string | null; gender?: string; size?: 'sm' | 'md' | 'lg'; showDot?: boolean }) {
    const sizeMap = { sm: 'w-9 h-9 text-sm', md: 'w-12 h-12 text-base', lg: 'w-16 h-16 text-xl' };
    const female = isFemale(gender);
    const ringColor = female ? 'ring-pink-500/60' : 'ring-blue-500/60';
    const bgColor = female ? 'bg-gradient-to-br from-pink-500 to-rose-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600';

    return (
        <div className={`relative shrink-0 ${sizeMap[size]}`}>
            <div className={`w-full h-full rounded-full ring-2 ${ringColor} overflow-hidden flex items-center justify-center font-bold text-white shadow-lg ${!photoUrl ? bgColor : 'bg-slate-700'}`}>
                {photoUrl ? (
                    <img src={cleanImageUrl(photoUrl)} referrerPolicy="no-referrer" alt={name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                    <span className="select-none">{getInitial(name)}</span>
                )}
            </div>
            {showDot && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-slate-900 block" title="Active recently" />
            )}
        </div>
    );
}

// ─── Family member row (in expanded panel) ────────────────────────────────────
function FmRow({ fm }: { fm: FamilyMember }) {
    const female = isFemale(fm.gender);
    return (
        <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-slate-800/40 transition-colors">
            <Avatar name={fm.name} photoUrl={fm.profile_photo_url} gender={fm.gender} size="sm" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{fm.name || 'Unnamed'}</p>
                <p className="text-xs text-slate-400 truncate">
                    {fm.relation}{fm.age ? ` · ${fm.age} yrs` : ''}
                </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${female ? 'bg-pink-500/15 text-pink-400' : 'bg-blue-500/15 text-blue-400'}`}>
                    {female ? '♀ F' : '♂ M'}
                </span>
                {fm.mobile && (
                    <a href={`tel:${fm.mobile}`} className="text-slate-500 hover:text-blue-400 transition-colors" title={fm.mobile}>
                        <Phone size={11} />
                    </a>
                )}
            </div>
        </div>
    );
}

// ─── Member Card ──────────────────────────────────────────────────────────────
function MemberCard({ member, expanded, onToggle, subscribing, onSubscribe, onMessage }: {
    member: Member; expanded: boolean; onToggle: () => void;
    subscribing: boolean; onSubscribe: () => void; onMessage: () => void;
}) {
    const fmList: FamilyMember[] = Array.isArray(member.family_members) ? member.family_members : [];
    const female = isFemale(member.head_gender);
    const isActive = wasRecentlyActive((member as any).last_portal_login);
    const maleCount = member.male ?? fmList.filter(f => !isFemale(f.gender)).length;
    const femaleCount = member.female ?? fmList.filter(f => isFemale(f.gender)).length;
    const total = (member.male != null && member.female != null) ? member.male + member.female : fmList.length;

    return (
        <div className="flex flex-col bg-slate-800 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:border-slate-600/60 transition-all duration-200">
            {/* TOP: Avatar left, info right, actions top-right */}
            <div className="flex items-start gap-3 p-4">
                {/* Avatar with gender-ring */}
                <div className="shrink-0 relative">
                    <Avatar name={member.name} photoUrl={member.profile_photo_url} gender={member.head_gender} size="lg" showDot={isActive} />
                    {/* gender strip under avatar */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-full ${female ? 'bg-gradient-to-r from-rose-500 to-pink-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} />
                </div>

                {/* Name block */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                            <Link to={`/profile/${member.membership_no}`}
                                className="block font-bold text-white text-sm leading-snug hover:text-blue-400 transition-colors">
                                {member.name}
                                {member.is_verified && <BadgeCheck size={13} className="inline ml-1 text-blue-400 align-middle" />}
                            </Link>
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-900/60 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                                #{member.membership_no}
                            </span>
                        </div>
                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                            <button onClick={onSubscribe} disabled={subscribing}
                                className={`p-1.5 rounded-lg transition-colors text-xs ${member.is_subscribed ? 'bg-blue-500/15 text-blue-400 hover:bg-red-500/15 hover:text-red-400' : 'bg-slate-700 text-slate-400 hover:bg-blue-500/20 hover:text-blue-300'}`}
                                title={member.is_subscribed ? 'Unfollow' : 'Follow'}>
                                {subscribing ? <Loader2 size={13} className="animate-spin" /> : member.is_subscribed ? <UserCheck size={13} /> : <UserPlus size={13} />}
                            </button>
                            <button onClick={onMessage}
                                className="p-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors"
                                title="Message">
                                <MessageSquare size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Location */}
                    {(member.village || member.district) && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1.5">
                            <MapPin size={11} className="text-slate-500 shrink-0" />
                            <span className="truncate">{[member.village, member.district].filter(Boolean).join(', ')}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats bar */}
            <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
                <span className="flex items-center gap-1 text-[11px] bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-full">
                    <Users size={10} /> {total}
                </span>
                <span className="flex items-center gap-1 text-[11px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full">
                    ♂ {maleCount}
                </span>
                <span className="flex items-center gap-1 text-[11px] bg-pink-500/10 text-pink-400 px-2 py-0.5 rounded-full">
                    ♀ {femaleCount}
                </span>
                {member.mobile && (
                    <a href={`tel:${member.mobile}`}
                        className="flex items-center gap-1 text-[11px] bg-slate-700/40 text-slate-400 hover:text-blue-400 px-2 py-0.5 rounded-full transition-colors ml-auto">
                        <Phone size={10} /> {member.mobile}
                    </a>
                )}
            </div>

            {/* Expand toggle */}
            {fmList.length > 0 && (
                <button onClick={onToggle}
                    className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-blue-400 py-2 border-t border-slate-700/50 transition-colors">
                    {expanded ? <><ChevronUp size={12} /> Hide Family</> : <><ChevronDown size={12} /> View Family ({fmList.length})</>}
                </button>
            )}

            {/* Expandable family panel */}
            <AnimatePresence>
                {expanded && fmList.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden border-t border-slate-700/50">
                        <div className="p-2 bg-slate-900/50 space-y-0.5 max-h-56 overflow-y-auto">
                            {fmList.map((fm, i) => <FmRow key={i} fm={fm} />)}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Table View ───────────────────────────────────────────────────────────────
function MemberTable({ members, expandedRows, onToggleRow, subscribing, onSubscribe, onMessage }: {
    members: Member[]; expandedRows: Set<string>; onToggleRow: (id: string) => void;
    subscribing: string | null; onSubscribe: (id: string) => void; onMessage: (m: Member) => void;
}) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50 shadow-xl">
            <table className="w-full min-w-[760px] text-sm">
                <thead>
                    <tr className="bg-slate-800/90 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 z-10">
                        <th className="w-8 px-3 py-3"></th>
                        <th className="px-4 py-3 text-left">Member</th>
                        <th className="px-4 py-3 text-left">Location</th>
                        <th className="px-3 py-3 text-center">♂</th>
                        <th className="px-3 py-3 text-center">♀</th>
                        <th className="px-3 py-3 text-center">Total</th>
                        <th className="px-4 py-3 text-left">Mobile</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                    {members.map(m => {
                        const fmList: FamilyMember[] = Array.isArray(m.family_members) ? m.family_members : [];
                        const exp = expandedRows.has(m.membership_no);
                        const maleCount = m.male ?? fmList.filter(f => !isFemale(f.gender)).length;
                        const femaleCount = m.female ?? fmList.filter(f => isFemale(f.gender)).length;
                        const total = (m.male != null && m.female != null) ? m.male + m.female : fmList.length;
                        const isActive = wasRecentlyActive((m as any).last_portal_login);
                        return (
                            <>
                                <tr key={m.membership_no} className="bg-slate-800/40 hover:bg-slate-800/70 transition-colors">
                                    <td className="px-3 py-2.5 text-center">
                                        {fmList.length > 0 && (
                                            <button onClick={() => onToggleRow(m.membership_no)}
                                                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                                                {exp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={m.name} photoUrl={m.profile_photo_url} gender={m.head_gender} size="sm" showDot={isActive} />
                                            <div>
                                                <Link to={`/profile/${m.membership_no}`} className="font-semibold text-white hover:text-blue-400 transition-colors block">
                                                    {m.name}
                                                </Link>
                                                <span className="text-[10px] text-slate-500 font-mono">#{m.membership_no}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5 text-xs text-slate-400">{[m.village, m.district].filter(Boolean).join(', ') || '—'}</td>
                                    <td className="px-3 py-2.5 text-center text-blue-400 font-semibold">{maleCount}</td>
                                    <td className="px-3 py-2.5 text-center text-pink-400 font-semibold">{femaleCount}</td>
                                    <td className="px-3 py-2.5 text-center text-slate-300 font-semibold">{total}</td>
                                    <td className="px-4 py-2.5">
                                        {m.mobile ? <a href={`tel:${m.mobile}`} className="text-slate-400 hover:text-blue-400 transition-colors text-xs">{m.mobile}</a> : <span className="text-slate-600">—</span>}
                                    </td>
                                    <td className="px-4 py-2.5">
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
                                {exp && fmList.length > 0 && (
                                    <tr key={`${m.membership_no}-exp`}>
                                        <td colSpan={8} className="p-0 bg-slate-900/50">
                                            <div className="pl-14 pr-4 py-2">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="text-slate-500 text-[10px] uppercase">
                                                            <th className="px-2 py-1.5 text-left w-9"></th>
                                                            <th className="px-2 py-1.5 text-left">Name</th>
                                                            <th className="px-2 py-1.5 text-left">Relation</th>
                                                            <th className="px-2 py-1.5 text-center">Gender</th>
                                                            <th className="px-2 py-1.5 text-center">Age</th>
                                                            <th className="px-2 py-1.5 text-left">Mobile</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-800">
                                                        {fmList.map((fm, i) => (
                                                            <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                                                <td className="px-2 py-1.5"><Avatar name={fm.name} photoUrl={fm.profile_photo_url} gender={fm.gender} size="sm" /></td>
                                                                <td className="px-2 py-1.5 font-medium text-slate-200">{fm.name}</td>
                                                                <td className="px-2 py-1.5 text-slate-400">{fm.relation || '—'}</td>
                                                                <td className="px-2 py-1.5 text-center">
                                                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isFemale(fm.gender) ? 'bg-pink-500/15 text-pink-400' : 'bg-blue-500/15 text-blue-400'}`}>
                                                                        {isFemale(fm.gender) ? '♀ F' : '♂ M'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-2 py-1.5 text-center text-slate-400">{fm.age || '—'}</td>
                                                                <td className="px-2 py-1.5">{fm.mobile ? <a href={`tel:${fm.mobile}`} className="text-slate-400 hover:text-blue-400 transition-colors">{fm.mobile}</a> : <span className="text-slate-600">—</span>}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 200; // load 200 at a time from backend
const CARD_CHUNK = 40; // render 40 card items at a time (virtual-ish)

export default function Members() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [subscribing, setSubscribing] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');
    const [filterVillage, setFilterVillage] = useState('');
    const [filterGender, setFilterGender] = useState('');
    const [visibleCount, setVisibleCount] = useState(CARD_CHUNK);

    const bottomRef = useRef<HTMLDivElement>(null);
    const getToken = () => localStorage.getItem('portalToken');

    // Fetch one page from backend
    const fetchPage = useCallback(async (pageNum: number) => {
        try {
            const token = getToken();
            if (!token) return;
            const res = await fetch(`${PORTAL_API_URL}/members?page=${pageNum}&limit=${PAGE_SIZE}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to load members');
            const data = await res.json();
            if (data.success) {
                setAllMembers(prev => pageNum === 1 ? data.members : [...prev, ...data.members]);
                setHasMore(data.hasMore === true);
                setPage(pageNum);
            }
        } catch {
            toast.error(t('members', 'failedLoad'));
        }
    }, [t]);

    useEffect(() => {
        fetchPage(1).finally(() => setLoading(false));
    }, [fetchPage]);

    // Load next backend page when user scrolls near bottom
    useEffect(() => {
        if (!bottomRef.current) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                // First extend the visible window
                setVisibleCount(c => c + CARD_CHUNK);
                // If we've rendered most of what we have, fetch next backend page
                if (hasMore && !loadingMore) {
                    setLoadingMore(true);
                    fetchPage(page + 1).finally(() => setLoadingMore(false));
                }
            }
        }, { rootMargin: '300px' });
        obs.observe(bottomRef.current);
        return () => obs.disconnect();
    }, [hasMore, loadingMore, page, fetchPage]);

    const handleSubscribe = async (memberId: string) => {
        try {
            const token = getToken();
            if (!token) return;
            setSubscribing(memberId);
            const res = await fetch(`${PORTAL_API_URL}/subscribe/${memberId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed');
            setAllMembers(prev => prev.map(m => m.membership_no === memberId ? { ...m, is_subscribed: data.subscribed } : m));
            toast.success(data.message);
        } catch (error: any) {
            toast.error(error.message || 'Error');
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

    // Derived filters
    const districts = useMemo(() => [...new Set(allMembers.map(m => m.district).filter(Boolean))].sort() as string[], [allMembers]);
    const villages = useMemo(() => {
        const src = filterDistrict ? allMembers.filter(m => m.district === filterDistrict) : allMembers;
        return [...new Set(src.map(m => m.village).filter(Boolean))].sort() as string[];
    }, [allMembers, filterDistrict]);

    const filtered = useMemo(() => {
        const q = searchTerm.toLowerCase();
        return allMembers.filter(m => {
            const matchSearch = !q || m.name.toLowerCase().includes(q) ||
                m.membership_no.toLowerCase().includes(q) ||
                (m.village || '').toLowerCase().includes(q) ||
                (m.mobile || '').includes(q);
            const matchDistrict = !filterDistrict || m.district === filterDistrict;
            const matchVillage = !filterVillage || m.village === filterVillage;
            const matchGender = !filterGender ||
                (filterGender === 'female' && isFemale(m.head_gender)) ||
                (filterGender === 'male' && !isFemale(m.head_gender));
            return matchSearch && matchDistrict && matchVillage && matchGender;
        });
    }, [allMembers, searchTerm, filterDistrict, filterVillage, filterGender]);

    // For card view: only render a window of items (performance)
    const visibleFiltered = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);

    const activeFilterCount = [filterDistrict, filterVillage, filterGender].filter(Boolean).length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="animate-spin text-blue-500" size={36} />
                <p className="text-slate-400 text-sm">Loading members…</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-4 pb-24">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">{t('members', 'title')}</h1>
                    <p className="text-sm text-slate-400">
                        {allMembers.length} members loaded · {filtered.length} shown
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input type="text"
                            placeholder="Name, #no, village, mobile…"
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setVisibleCount(CARD_CHUNK); }}
                            className="bg-slate-800 border border-slate-700 text-white pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 text-sm"
                        />
                    </div>

                    <button onClick={() => setShowFilters(s => !s)}
                        className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-blue-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
                        <Filter size={14} /> Filters
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    <button onClick={() => { setLoading(true); setAllMembers([]); setPage(1); setHasMore(true); fetchPage(1).finally(() => setLoading(false)); }}
                        className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Refresh">
                        <RefreshCw size={15} />
                    </button>

                    <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1 gap-1">
                        <button onClick={() => setViewMode('card')}
                            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="Card View">
                            <LayoutGrid size={15} />
                        </button>
                        <button onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="Table View">
                            <List size={15} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 flex flex-wrap items-center gap-3">
                            <select value={filterDistrict} onChange={e => { setFilterDistrict(e.target.value); setFilterVillage(''); setVisibleCount(CARD_CHUNK); }}
                                className="bg-slate-900 border border-slate-700 text-sm text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Districts</option>
                                {districts.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select value={filterVillage} onChange={e => { setFilterVillage(e.target.value); setVisibleCount(CARD_CHUNK); }}
                                className="bg-slate-900 border border-slate-700 text-sm text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Villages</option>
                                {villages.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                            <select value={filterGender} onChange={e => { setFilterGender(e.target.value); setVisibleCount(CARD_CHUNK); }}
                                className="bg-slate-900 border border-slate-700 text-sm text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Genders</option>
                                <option value="male">♂ Male HoF</option>
                                <option value="female">♀ Female HoF</option>
                            </select>
                            {activeFilterCount > 0 && (
                                <button onClick={() => { setFilterDistrict(''); setFilterVillage(''); setFilterGender(''); setVisibleCount(CARD_CHUNK); }}
                                    className="flex items-center gap-1 text-sm text-slate-400 hover:text-rose-400 transition-colors">
                                    <X size={13} /> Clear
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
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {visibleFiltered.map(m => (
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
                    {/* Infinite scroll trigger */}
                    <div ref={bottomRef} className="flex justify-center py-6">
                        {(loadingMore || visibleCount < filtered.length) && (
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <Loader2 size={16} className="animate-spin" />
                                Loading more…
                            </div>
                        )}
                        {!hasMore && !loadingMore && visibleCount >= filtered.length && filtered.length > CARD_CHUNK && (
                            <p className="text-slate-500 text-sm">All {filtered.length} members loaded</p>
                        )}
                    </div>
                </>
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
