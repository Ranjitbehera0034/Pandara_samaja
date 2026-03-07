import { useState, useEffect, useCallback, useRef } from 'react';
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

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, photoUrl, gender, size = 'md', showDot = false }: {
    name: string; photoUrl?: string | null; gender?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg'; showDot?: boolean;
}) {
    const sizeMap = { xs: 'w-7 h-7 text-xs', sm: 'w-9 h-9 text-sm', md: 'w-12 h-12 text-base', lg: 'w-14 h-14 text-lg' };
    const female = isFemale(gender);
    return (
        <div className={`relative shrink-0 ${sizeMap[size]}`}>
            <div className={`w-full h-full rounded-full ring-2 overflow-hidden flex items-center justify-center font-bold text-white shadow-md
                ${female ? 'ring-pink-500/50 bg-gradient-to-br from-rose-500 to-pink-600'
                    : 'ring-blue-500/50 bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                {photoUrl ? (
                    <img src={cleanImageUrl(photoUrl)} referrerPolicy="no-referrer" alt={name}
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : getInitial(name)}
            </div>
            {showDot && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-slate-900" />}
        </div>
    );
}

// ─── Member Card (matches your admin postcard style) ─────────────────────────
function MemberCard({ member, expanded, onToggle, subscribing, onSubscribe, onMessage }: {
    member: Member; expanded: boolean; onToggle: () => void;
    subscribing: boolean; onSubscribe: () => void; onMessage: () => void;
}) {
    const fmList: FamilyMember[] = Array.isArray(member.family_members) ? member.family_members : [];
    const isActive = wasRecentlyActive((member as any).last_portal_login);
    const maleCount = member.male ?? 0;
    const femaleCount = member.female ?? 0;
    const female = isFemale(member.head_gender);

    return (
        <div className="flex flex-col bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-lg hover:border-slate-600 hover:shadow-xl transition-all duration-200">

            {/* ── Card header: #no + ACTIVE + action buttons ── */}
            <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-semibold text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded-lg">
                        #{member.membership_no}
                    </span>
                    {isActive && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-green-400 bg-green-400/10 border border-green-400/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" /> ACTIVE
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={onSubscribe} disabled={subscribing}
                        className={`p-1.5 rounded-xl transition-colors ${member.is_subscribed
                            ? 'bg-blue-500/15 text-blue-400 hover:bg-red-500/15 hover:text-red-400'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'}`}
                        title={member.is_subscribed ? 'Unfollow' : 'Follow'}>
                        {subscribing ? <Loader2 size={13} className="animate-spin" /> : member.is_subscribed ? <UserCheck size={13} /> : <UserPlus size={13} />}
                    </button>
                    <button onClick={onMessage}
                        className="p-1.5 rounded-xl bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white transition-colors"
                        title="Send Message">
                        <MessageSquare size={13} />
                    </button>
                </div>
            </div>

            {/* ── Name + Avatar row ── */}
            <div className="flex items-start gap-3 px-4 py-2">
                <Avatar name={member.name} photoUrl={member.profile_photo_url} gender={member.head_gender} size="lg" showDot={false} />
                <div className="flex-1 min-w-0">
                    <Link to={`/profile/${member.membership_no}`}
                        className="block font-bold text-white text-base leading-tight hover:text-blue-400 transition-colors">
                        {member.name}
                        {member.is_verified && <BadgeCheck size={13} className="inline ml-1 text-blue-400 align-middle" />}
                    </Link>
                    {member.mobile && (
                        <a href={`tel:${member.mobile}`} className="text-xs text-slate-400 hover:text-blue-400 transition-colors block mt-0.5">
                            {member.mobile}
                        </a>
                    )}
                    {(member.panchayat || member.taluka || member.district) && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <MapPin size={10} className="shrink-0" />
                            <span className="uppercase tracking-wide truncate">
                                {[member.panchayat, member.taluka, member.district].filter(Boolean).join(', ')}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Info grid (Aadhar / Gender / Male / Female) ── */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-2 border-t border-slate-700/40 text-xs">
                <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Family Head Gender</p>
                    <p className={`font-semibold ${female ? 'text-pink-400' : 'text-blue-400'}`}>
                        {female ? '♀ Female' : '♂ Male'}
                    </p>
                </div>
                <div className="flex gap-4">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Male</p>
                        <p className="font-bold text-blue-400">{maleCount}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Female</p>
                        <p className="font-bold text-pink-400">{femaleCount}</p>
                    </div>
                </div>
            </div>

            {/* ── Expand toggle ── */}
            {fmList.length > 0 && (
                <button onClick={onToggle}
                    className="flex items-center justify-between px-4 py-2.5 border-t border-slate-700/40 text-[11px] font-semibold text-slate-400 hover:text-blue-400 hover:bg-slate-700/30 transition-colors">
                    <span className="uppercase tracking-wider">Family Members List</span>
                    <span className="flex items-center gap-1">
                        ({fmList.length})
                        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </span>
                </button>
            )}

            {/* ── Expandable family list ── */}
            <AnimatePresence>
                {expanded && fmList.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                    >
                        <div className="max-h-60 overflow-y-auto bg-slate-900/50 divide-y divide-slate-700/30">
                            {fmList.map((fm, i) => (
                                <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-800/40 transition-colors">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Avatar name={fm.name} photoUrl={fm.profile_photo_url} gender={fm.gender} size="xs" />
                                        <span className="text-sm text-white font-medium truncate">{fm.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        {fm.mobile && (
                                            <a href={`tel:${fm.mobile}`} className="text-slate-500 hover:text-blue-400 transition-colors">
                                                <Phone size={11} />
                                            </a>
                                        )}
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isFemale(fm.gender)
                                            ? 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                            {fm.relation || (isFemale(fm.gender) ? 'Female' : 'Male')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Table Row ────────────────────────────────────────────────────────────────
function TableView({ members, expandedRows, onToggleRow, subscribing, onSubscribe, onMessage }: {
    members: Member[]; expandedRows: Set<string>; onToggleRow: (id: string) => void;
    subscribing: string | null; onSubscribe: (id: string) => void; onMessage: (m: Member) => void;
}) {
    return (
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50 shadow-xl">
            <table className="w-full min-w-[780px] text-sm">
                <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                        <th className="w-8 px-3 py-3"></th>
                        <th className="px-4 py-3 text-left">Member</th>
                        <th className="px-4 py-3 text-left">Location</th>
                        <th className="px-3 py-3 text-center">Gender</th>
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
                        const isActive = wasRecentlyActive((m as any).last_portal_login);
                        return (
                            <>
                                <tr key={m.membership_no} className="bg-slate-800/40 hover:bg-slate-800/70 transition-colors">
                                    <td className="px-3 py-3">
                                        {fmList.length > 0 && (
                                            <button onClick={() => onToggleRow(m.membership_no)}
                                                className="p-1 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-blue-400 transition-colors">
                                                {exp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={m.name} photoUrl={m.profile_photo_url} gender={m.head_gender} size="sm" showDot={isActive} />
                                            <div>
                                                <Link to={`/profile/${m.membership_no}`} className="font-semibold text-white hover:text-blue-400 transition-colors">
                                                    {m.name}
                                                </Link>
                                                <p className="text-[10px] font-mono text-slate-500">#{m.membership_no}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-400">{[m.panchayat, m.taluka, m.district].filter(Boolean).join(', ') || '—'}</td>
                                    <td className="px-3 py-3 text-center">
                                        <span className={`text-xs font-semibold ${isFemale(m.head_gender) ? 'text-pink-400' : 'text-blue-400'}`}>
                                            {isFemale(m.head_gender) ? '♀ F' : '♂ M'}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-center text-blue-400 font-bold">{m.male ?? 0}</td>
                                    <td className="px-3 py-3 text-center text-pink-400 font-bold">{m.female ?? 0}</td>
                                    <td className="px-3 py-3 text-center text-slate-300 font-bold">{(m.male ?? 0) + (m.female ?? 0)}</td>
                                    <td className="px-4 py-3">
                                        {m.mobile ? <a href={`tel:${m.mobile}`} className="text-slate-400 hover:text-blue-400 text-xs transition-colors">{m.mobile}</a> : <span className="text-slate-600">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-1">
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
                                        <td colSpan={9} className="p-0 bg-slate-900/60 border-b border-slate-700/30">
                                            <div className="pl-16 pr-4 py-2">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="text-[10px] text-slate-500 uppercase tracking-wider">
                                                            <th className="px-2 py-1 text-left w-9"></th>
                                                            <th className="px-2 py-1 text-left">Name</th>
                                                            <th className="px-2 py-1 text-left">Relation</th>
                                                            <th className="px-2 py-1 text-center">Gender</th>
                                                            <th className="px-2 py-1 text-center">Age</th>
                                                            <th className="px-2 py-1 text-left">Mobile</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-800/60">
                                                        {fmList.map((fm, i) => (
                                                            <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                                                <td className="px-2 py-1.5"><Avatar name={fm.name} photoUrl={fm.profile_photo_url} gender={fm.gender} size="xs" /></td>
                                                                <td className="px-2 py-1.5 font-medium text-slate-200">{fm.name}</td>
                                                                <td className="px-2 py-1.5 text-slate-400">{fm.relation || '—'}</td>
                                                                <td className="px-2 py-1.5 text-center">
                                                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${isFemale(fm.gender) ? 'bg-pink-500/10 text-pink-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                                        {isFemale(fm.gender) ? '♀ F' : '♂ M'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-2 py-1.5 text-center text-slate-400">{fm.age || '—'}</td>
                                                                <td className="px-2 py-1.5">{fm.mobile ? <a href={`tel:${fm.mobile}`} className="text-slate-400 hover:text-blue-400">{fm.mobile}</a> : '—'}</td>
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

// ─── Search Bar ─────────────────────────────────────────────────────────────────
function SearchBar({ initialValue, onSearch }: { initialValue: string, onSearch: (val: string) => void }) {
    const [val, setVal] = useState(initialValue);
    const debouncedVal = useDebounce(val, 400);

    useEffect(() => {
        onSearch(debouncedVal);
    }, [debouncedVal, onSearch]);

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input type="text"
                placeholder="Name · #no · village · mobile…"
                value={val}
                onChange={e => setVal(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-56 text-sm"
            />
            {val && (
                <button onClick={() => setVal('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    <X size={14} />
                </button>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 30;

export default function Members() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const getToken = () => localStorage.getItem('portalToken');

    // Filter state (debounced state from SearchBar)
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');
    const [filterTaluka, setFilterTaluka] = useState('');
    const [filterPanchayat, setFilterPanchayat] = useState('');
    const [filterGender, setFilterGender] = useState('');

    // Pagination + data
    const [members, setMembers] = useState<Member[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    // UI state
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);
    const [subscribing, setSubscribing] = useState<string | null>(null);
    const [filterOptions, setFilterOptions] = useState<{
        districts: string[];
        talukas: Record<string, string[]>;
        panchayats: Record<string, string[]>;
    }>({ districts: [], talukas: {}, panchayats: {} });

    const bottomRef = useRef<HTMLDivElement>(null);

    // Fetch filter options once
    useEffect(() => {
        const token = getToken();
        if (!token) return;
        fetch(`${PORTAL_API_URL}/members/filters`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (d.success) setFilterOptions(d.filters || {}); })
            .catch(() => { });
    }, []);

    // Core fetch function — replaces data on page 1, appends on subsequent pages
    const fetchMembers = useCallback(async (pageNum: number, replace = false) => {
        const token = getToken();
        if (!token) return;

        const params = new URLSearchParams({
            page: String(pageNum),
            limit: String(PAGE_SIZE),
        });
        if (searchQuery) params.set('search', searchQuery);
        if (filterDistrict) params.set('district', filterDistrict);
        if (filterTaluka) params.set('taluka', filterTaluka);
        if (filterPanchayat) params.set('panchayat', filterPanchayat);
        if (filterGender) params.set('gender', filterGender);

        try {
            const res = await fetch(`${PORTAL_API_URL}/members?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            if (data.success) {
                setMembers(prev => replace ? data.members : [...prev, ...data.members]);
                setPage(data.page);
                setTotal(data.total ?? 0);
                setTotalPages(data.totalPages ?? 1);
            }
        } catch {
            toast.error('Failed to load members');
        }
    }, [searchQuery, filterDistrict, filterTaluka, filterPanchayat, filterGender]);

    // Reset + reload whenever filters/search change
    useEffect(() => {
        setLoading(true);
        // We do NOT call setMembers([]) here to prevent flickering and maintain previous results until new ones arrive.
        setPage(1);
        setExpandedCards(new Set());
        fetchMembers(1, true).finally(() => setLoading(false));
    }, [fetchMembers]);

    // Infinite scroll — load next page when bottom sentinel is visible
    useEffect(() => {
        if (!bottomRef.current) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && page < totalPages && !loadingMore) {
                setLoadingMore(true);
                fetchMembers(page + 1).finally(() => setLoadingMore(false));
            }
        }, { rootMargin: '400px' });
        obs.observe(bottomRef.current);
        return () => obs.disconnect();
    }, [page, totalPages, loadingMore, fetchMembers]);

    const handleSubscribe = async (memberId: string) => {
        const token = getToken();
        if (!token) return;
        setSubscribing(memberId);
        try {
            const res = await fetch(`${PORTAL_API_URL}/subscribe/${memberId}`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setMembers(prev => prev.map(m => m.membership_no === memberId ? { ...m, is_subscribed: data.subscribed } : m));
            toast.success(data.message);
        } catch (e: any) { toast.error(e.message || 'Error'); }
        finally { setSubscribing(null); }
    };

    const toggleExpand = (id: string) => {
        setExpandedCards(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };

    const resetFilters = () => {
        setFilterDistrict(''); setFilterTaluka(''); setFilterPanchayat(''); setFilterGender('');
    };
    const activeFilterCount = [filterDistrict, filterTaluka, filterPanchayat, filterGender].filter(Boolean).length;
    const talukas: string[] = filterDistrict ? (filterOptions.talukas?.[filterDistrict] || []) : [];
    const panchayats: string[] = filterTaluka ? (filterOptions.panchayats?.[filterTaluka] || []) : [];

    if (loading && members.length === 0) return (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="animate-spin text-blue-500" size={36} />
            <p className="text-slate-400 text-sm">Loading members…</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-4 pb-24 px-2 md:px-0">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{t('members', 'title')}</h1>
                        <p className="text-sm text-slate-400">
                            {members.length} / {total.toLocaleString()} members
                            {searchQuery && <span className="ml-1 text-blue-400">matching "{searchQuery}"</span>}
                        </p>
                    </div>
                    {loading && members.length > 0 && (
                        <Loader2 className="animate-spin text-blue-500" size={20} />
                    )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Search box */}
                    <SearchBar initialValue={searchQuery} onSearch={setSearchQuery} />

                    {/* Filters toggle */}
                    <button onClick={() => setShowFilters(s => !s)}
                        className={`relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${showFilters ? 'bg-blue-600 text-white' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'}`}>
                        <Filter size={14} /> Filters
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>

                    {/* Refresh */}
                    <button onClick={() => { setLoading(true); setMembers([]); fetchMembers(1, true).finally(() => setLoading(false)); }}
                        className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" title="Refresh">
                        <RefreshCw size={15} />
                    </button>

                    {/* View toggle */}
                    <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1 gap-1">
                        <button onClick={() => setViewMode('card')}
                            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="Card View"><LayoutGrid size={15} /></button>
                        <button onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                            title="Table View"><List size={15} /></button>
                    </div>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 flex flex-wrap items-center gap-3">
                            <select value={filterDistrict} onChange={e => { setFilterDistrict(e.target.value); setFilterTaluka(''); setFilterPanchayat(''); }}
                                className="bg-slate-900 border border-slate-700 text-sm text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-36">
                                <option value="">All Districts</option>
                                {(filterOptions.districts || []).sort().map((d: string) => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select value={filterTaluka} onChange={e => { setFilterTaluka(e.target.value); setFilterPanchayat(''); }}
                                disabled={!filterDistrict || talukas.length === 0}
                                className="bg-slate-900 border border-slate-700 text-sm text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-36 disabled:opacity-40">
                                <option value="">All Talukas</option>
                                {talukas.map((v: string) => <option key={v} value={v}>{v}</option>)}
                            </select>
                            <select value={filterPanchayat} onChange={e => setFilterPanchayat(e.target.value)}
                                disabled={!filterTaluka || panchayats.length === 0}
                                className="bg-slate-900 border border-slate-700 text-sm text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-36 disabled:opacity-40">
                                <option value="">All Panchayats</option>
                                {panchayats.map((v: string) => <option key={v} value={v}>{v}</option>)}
                            </select>
                            <select value={filterGender} onChange={e => setFilterGender(e.target.value)}
                                className="bg-slate-900 border border-slate-700 text-sm text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All Genders</option>
                                <option value="male">♂ Male HoF</option>
                                <option value="female">♀ Female HoF</option>
                            </select>
                            {activeFilterCount > 0 && (
                                <button onClick={resetFilters} className="flex items-center gap-1 text-sm text-slate-400 hover:text-rose-400 transition-colors">
                                    <X size={13} /> Clear
                                </button>
                            )}
                            <span className="ml-auto text-xs text-slate-500">{total.toLocaleString()} total results</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Content ── */}
            {members.length === 0 && !loading ? (
                <div className="text-center py-20 text-slate-500">
                    <Users size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-medium">No members found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
            ) : viewMode === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {members.map(m => (
                        <MemberCard key={m.membership_no} member={m}
                            expanded={expandedCards.has(m.membership_no)}
                            onToggle={() => toggleExpand(m.membership_no)}
                            subscribing={subscribing === m.membership_no}
                            onSubscribe={() => handleSubscribe(m.membership_no)}
                            onMessage={() => navigate(`/chat?with=${m.membership_no}&name=${encodeURIComponent(m.name)}`)}
                        />
                    ))}
                </div>
            ) : (
                <TableView
                    members={members}
                    expandedRows={expandedCards}
                    onToggleRow={toggleExpand}
                    subscribing={subscribing}
                    onSubscribe={handleSubscribe}
                    onMessage={m => navigate(`/chat?with=${m.membership_no}&name=${encodeURIComponent(m.name)}`)}
                />
            )}

            {/* ── Infinite scroll sentinel + loader ── */}
            <div ref={bottomRef} className="flex justify-center py-4">
                {loadingMore && (
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Loader2 size={16} className="animate-spin" /> Loading more…
                    </div>
                )}
                {!loadingMore && page >= totalPages && members.length > 0 && (
                    <p className="text-slate-600 text-xs">All {total.toLocaleString()} members loaded</p>
                )}
            </div>
        </div>
    );
}
