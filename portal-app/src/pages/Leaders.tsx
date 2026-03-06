import { useState, useEffect } from 'react';
import { Crown, MapPin, Loader2, Users, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config/apiConfig';
import { getImageUrl } from '../utils/imageUtils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Leader {
    id: number;
    name: string;
    name_or: string | null;
    role: string;
    role_or: string | null;
    level: string;
    location: string | null;
    image_url: string | null;
    display_order: number;
}

type LevelKey = 'State' | 'District' | 'Taluka' | 'Panchayat';

const LEVELS: { key: LevelKey; label: string; labelOr: string; color: string; bg: string; ring: string }[] = [
    { key: 'State', label: 'State', labelOr: 'ରାଜ୍ୟ', color: 'text-amber-400', bg: 'bg-amber-500/10', ring: 'ring-amber-400/30' },
    { key: 'District', label: 'District', labelOr: 'ଜିଲ୍ଲା', color: 'text-blue-400', bg: 'bg-blue-500/10', ring: 'ring-blue-400/30' },
    { key: 'Taluka', label: 'Taluka', labelOr: 'ତାଲୁକ', color: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-400/30' },
    { key: 'Panchayat', label: 'Panchayat', labelOr: 'ପଞ୍ଚାୟତ', color: 'text-purple-400', bg: 'bg-purple-500/10', ring: 'ring-purple-400/30' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitial(name: string) {
    return name ? name.charAt(0).toUpperCase() : '?';
}



// ─── Leader Card ──────────────────────────────────────────────────────────────
function LeaderCard({ leader, levelMeta }: { leader: Leader; levelMeta: typeof LEVELS[0] }) {
    const [imgError, setImgError] = useState(false);
    const photoUrl = getImageUrl(leader.image_url);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center bg-slate-800/70 border border-slate-700/60 rounded-2xl p-5 shadow-lg hover:border-slate-600 hover:shadow-xl transition-all duration-200 group"
        >
            {/* Avatar */}
            <div className={`relative w-20 h-20 rounded-full overflow-hidden ring-2 ${levelMeta.ring} shadow-lg mb-3 flex items-center justify-center shrink-0`}>
                {photoUrl && !imgError ? (
                    <img
                        src={photoUrl}
                        alt={leader.name}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className={`w-full h-full flex items-center justify-center font-bold text-2xl text-white ${levelMeta.bg} ${levelMeta.color}`}>
                        {getInitial(leader.name)}
                    </div>
                )}
            </div>

            {/* Name */}
            <div className="text-center">
                <p className="font-bold text-white text-sm leading-snug group-hover:text-blue-300 transition-colors">
                    {leader.name}
                </p>
                {leader.name_or && (
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        {leader.name_or}
                    </p>
                )}
            </div>

            {/* Role */}
            <div className={`mt-2.5 px-3 py-1 rounded-full text-[11px] font-semibold ${levelMeta.bg} ${levelMeta.color} ring-1 ${levelMeta.ring} text-center`}>
                {leader.role_or || leader.role}
            </div>

            {/* Location */}
            {leader.location && (
                <div className="flex items-center gap-1 mt-2.5 text-[11px] text-slate-500">
                    <MapPin size={10} className="shrink-0" />
                    <span className="uppercase tracking-wide">{leader.location}</span>
                </div>
            )}
        </motion.div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Leaders() {
    const [activeLevel, setActiveLevel] = useState<LevelKey>('State');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [leaders, setLeaders] = useState<Leader[]>([]);
    const [locations, setLocations] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [locationsLoading, setLocationsLoading] = useState(false);

    const levelMeta = LEVELS.find(l => l.key === activeLevel)!;
    const needsLocation = activeLevel !== 'State';

    // Fetch distinct locations whenever level changes (for District/Taluka/Panchayat)
    useEffect(() => {
        if (!needsLocation) {
            setLocations([]);
            setSelectedLocation('');
            return;
        }
        setLocationsLoading(true);
        setSelectedLocation('');
        fetch(`${API_BASE_URL}/leaders/locations?level=${activeLevel}`)
            .then(r => r.json())
            .then(d => { if (d.success) setLocations(d.data); })
            .catch(() => setLocations([]))
            .finally(() => setLocationsLoading(false));
    }, [activeLevel, needsLocation]);

    // Fetch leaders
    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams({ level: activeLevel });
        if (selectedLocation) params.set('location', selectedLocation);
        fetch(`${API_BASE_URL}/leaders?${params}`)
            .then(r => r.json())
            .then(d => { if (d.success) setLeaders(d.data); })
            .catch(() => setLeaders([]))
            .finally(() => setLoading(false));
    }, [activeLevel, selectedLocation]);

    const handleLevelChange = (level: LevelKey) => {
        setActiveLevel(level);
        setLeaders([]);
    };

    // Group by location for non-State levels when no location is selected
    const groupedByLocation = needsLocation && !selectedLocation
        ? leaders.reduce<Record<string, Leader[]>>((acc, l) => {
            const key = l.location || 'Other';
            (acc[key] = acc[key] || []).push(l);
            return acc;
        }, {})
        : null;

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-24 px-2 md:px-0">

            {/* ── Page Header ── */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                    <Crown size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Community Leaders</h1>
                    <p className="text-sm text-slate-400">ସମାଜ ନେତୃତ୍ୱ — Pandara Samaja Leadership</p>
                </div>
            </div>

            {/* ── Level Tabs ── */}
            <div className="flex bg-slate-800/60 border border-slate-700/50 rounded-2xl p-1.5 gap-1 w-full overflow-x-auto">
                {LEVELS.map(lv => (
                    <button
                        key={lv.key}
                        onClick={() => handleLevelChange(lv.key)}
                        className={`flex-1 flex flex-col items-center py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap min-w-[72px]
                            ${activeLevel === lv.key
                                ? `bg-slate-700 ${lv.color} shadow-sm`
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-700/40'
                            }`}
                    >
                        <span className="text-base leading-none mb-0.5">
                            {lv.key === 'State' ? '🏛️' : lv.key === 'District' ? '🗺️' : lv.key === 'Taluka' ? '🏘️' : '🌿'}
                        </span>
                        <span>{lv.label}</span>
                        <span className={`text-[9px] font-medium opacity-70 ${activeLevel === lv.key ? '' : 'hidden sm:block'}`}>
                            {lv.labelOr}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Location Filter (for District/Taluka/Panchayat) ── */}
            <AnimatePresence>
                {needsLocation && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="relative">
                                <select
                                    value={selectedLocation}
                                    onChange={e => setSelectedLocation(e.target.value)}
                                    disabled={locationsLoading || locations.length === 0}
                                    className="appearance-none bg-slate-800 border border-slate-700 text-white pl-4 pr-8 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-48 disabled:opacity-50 transition-colors"
                                >
                                    <option value="">
                                        {locationsLoading
                                            ? 'Loading...'
                                            : locations.length === 0
                                                ? `No ${activeLevel} locations found`
                                                : `All ${activeLevel}s`}
                                    </option>
                                    {locations.map(loc => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>

                            {selectedLocation && (
                                <button
                                    onClick={() => setSelectedLocation('')}
                                    className="text-xs text-slate-400 hover:text-rose-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-rose-500/10"
                                >
                                    ✕ Clear filter
                                </button>
                            )}

                            <p className="text-xs text-slate-500 ml-auto">
                                {!loading && `${leaders.length} leader${leaders.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Content ── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Loader2 className="animate-spin text-blue-500" size={36} />
                    <p className="text-slate-400 text-sm">Loading leaders…</p>
                </div>
            ) : leaders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500">
                    <Users size={44} className="opacity-30" />
                    <p className="text-lg font-medium text-slate-400">No leaders found</p>
                    <p className="text-sm">
                        {needsLocation && !selectedLocation
                            ? `No ${activeLevel} level leaders have been added yet.`
                            : `No leaders found for the selected filter.`}
                    </p>
                </div>
            ) : groupedByLocation ? (
                // ── Grouped view (non-State, no location filter selected) ──
                <div className="space-y-8">
                    {Object.keys(groupedByLocation).sort().map(loc => (
                        <div key={loc}>
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin size={14} className={levelMeta.color} />
                                <h2 className={`text-sm font-bold uppercase tracking-widest ${levelMeta.color}`}>
                                    {loc}
                                </h2>
                                <span className="text-xs text-slate-600 font-mono">
                                    ({groupedByLocation[loc].length})
                                </span>
                                <div className="flex-1 h-px bg-slate-700/60 ml-1" />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                <AnimatePresence>
                                    {groupedByLocation[loc].map(leader => (
                                        <LeaderCard key={leader.id} leader={leader} levelMeta={levelMeta} />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // ── Flat grid view (State level or location filter applied) ──
                <div>
                    {selectedLocation && (
                        <div className="flex items-center gap-2 mb-4">
                            <MapPin size={14} className={levelMeta.color} />
                            <h2 className={`text-sm font-bold uppercase tracking-widest ${levelMeta.color}`}>
                                {selectedLocation}
                            </h2>
                            <div className="flex-1 h-px bg-slate-700/60 ml-1" />
                        </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        <AnimatePresence>
                            {leaders.map(leader => (
                                <LeaderCard key={leader.id} leader={leader} levelMeta={levelMeta} />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
}
