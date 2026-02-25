import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
    ArrowLeft, Plus, Calendar, MapPin, Clock, Users,
    Check, X, Gift, PartyPopper, Heart, Star, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────
interface FamilyEvent {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    type: 'birthday' | 'anniversary' | 'festival' | 'gathering' | 'other';
    attendees: string[];
    createdBy: string;
}

// ─── Event type config ───────────────────────────────
const EVENT_TYPES = {
    birthday: { icon: <Gift size={18} />, color: 'bg-pink-500/15 text-pink-400 border-pink-500/30', label: 'Birthday' },
    anniversary: { icon: <Heart size={18} />, color: 'bg-rose-500/15 text-rose-400 border-rose-500/30', label: 'Anniversary' },
    festival: { icon: <Star size={18} />, color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', label: 'Festival' },
    gathering: { icon: <Users size={18} />, color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', label: 'Gathering' },
    other: { icon: <Calendar size={18} />, color: 'bg-slate-500/15 text-slate-400 border-slate-500/30', label: 'Other' },
};

export default function FamilyEvents() {
    const { member } = useAuth();
    const [events, setEvents] = useState<FamilyEvent[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    // Form state
    const [form, setForm] = useState({
        title: '', description: '', date: '', time: '', location: '', type: 'gathering' as FamilyEvent['type']
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch(((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api/portal' : 'https://pandara-samaja-backend.onrender.com/api/portal') + '/family/events', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('portalToken')}` }
            });
            const data = await res.json();
            if (data.success) {
                setEvents(data.events.map((e: any) => ({
                    ...e,
                    id: e.id.toString(),
                    date: new Date(e.event_date).toISOString().split('T')[0],
                    attendees: e.rsvps ? e.rsvps.map((r: any) => r.member_id.toString()) : []
                })));
            }
        } catch (error) {
            toast.error('Failed to load events');
        }
    };

    const now = new Date();
    const upcoming = events.filter(e => new Date(e.date) >= now).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const past = events.filter(e => new Date(e.date) < now).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const displayEvents = activeTab === 'upcoming' ? upcoming : past;

    const handleCreate = async () => {
        if (!form.title.trim() || !form.date) { toast.error('Title and date are required'); return; }
        try {
            const res = await fetch(((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api/portal' : 'https://pandara-samaja-backend.onrender.com/api/portal') + '/family/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('portalToken')}`
                },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (data.success) {
                fetchEvents();
                setForm({ title: '', description: '', date: '', time: '', location: '', type: 'gathering' });
                setShowCreateModal(false);
                toast.success('Family event created!');
            }
        } catch (e) {
            toast.error('Failed to create event');
        }
    };

    const handleRSVP = async (eventId: string) => {
        try {
            const res = await fetch(`${(typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api/portal' : 'https://pandara-samaja-backend.onrender.com/api/portal'}//family/events/${eventId}/rsvp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('portalToken')}`
                },
                body: JSON.stringify({ status: 'going' }) /* simplified status logic */
            });
            if (res.ok) {
                toast.success('RSVP confirmed');
                fetchEvents();
            }
        } catch (e) {
            toast.error('Failed to update RSVP');
        }
    };

    const handleDelete = async (eventId: string) => {
        if (!confirm('Delete this event?')) return;
        try {
            const res = await fetch(`${(typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api/portal' : 'https://pandara-samaja-backend.onrender.com/api/portal'}//family/events/${eventId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('portalToken')}` }
            });
            if (res.ok) {
                toast.success('Event deleted');
                fetchEvents();
            }
        } catch (e) {
            toast.error('Failed to delete event');
        }
    };

    const daysUntil = (dateStr: string) => {
        const diff = Math.ceil((new Date(dateStr).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Tomorrow';
        if (diff < 0) return `${Math.abs(diff)} days ago`;
        return `in ${diff} days`;
    };

    return (
        <div className="max-w-4xl mx-auto pb-20 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link to="/profile" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-2">
                        <ArrowLeft size={16} /> Back to Profile
                    </Link>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">
                        Family Events
                    </h1>
                    <p className="text-slate-400 mt-1">
                        Private celebrations & milestones
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus size={18} /> New Event
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 w-max">
                {(['upcoming', 'past'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        {tab} ({tab === 'upcoming' ? upcoming.length : past.length})
                    </button>
                ))}
            </div>

            {/* Events List */}
            {displayEvents.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                    <PartyPopper size={48} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 mb-4">
                        {activeTab === 'upcoming' ? 'No upcoming family events.' : 'No past events to show.'}
                    </p>
                    {activeTab === 'upcoming' && (
                        <button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium inline-flex items-center gap-2">
                            <Plus size={16} /> Create Event
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {displayEvents.map(event => {
                        const typeConfig = EVENT_TYPES[event.type];
                        const isAttending = event.attendees.includes(member?.name || '');
                        return (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800/80 transition-colors group"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Date badge */}
                                    <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex flex-col items-center justify-center shadow-lg shadow-blue-500/20">
                                        <span className="text-blue-200 text-[10px] font-bold uppercase">
                                            {new Date(event.date).toLocaleDateString('en', { month: 'short' })}
                                        </span>
                                        <span className="text-white text-xl font-black leading-none">
                                            {new Date(event.date).getDate()}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-semibold text-white text-lg">{event.title}</h3>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${typeConfig.color}`}>
                                                        {typeConfig.icon} {typeConfig.label}
                                                    </span>
                                                    <span className="text-xs text-slate-500">{daysUntil(event.date)}</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(event.id)}
                                                className="p-1.5 text-slate-500 hover:text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {event.description && (
                                            <p className="text-slate-400 text-sm mt-2 line-clamp-2">{event.description}</p>
                                        )}

                                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-400 flex-wrap">
                                            <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-500" /> {event.time}</span>
                                            <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-500" /> {event.location}</span>
                                            <span className="flex items-center gap-1.5"><Users size={14} className="text-slate-500" /> {event.attendees.length} attending</span>
                                        </div>

                                        {/* RSVP */}
                                        {activeTab === 'upcoming' && (
                                            <div className="mt-4">
                                                <button
                                                    onClick={() => handleRSVP(event.id)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isAttending
                                                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-red-500/15 hover:text-red-400 hover:border-red-500/30'
                                                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                                                        }`}
                                                >
                                                    {isAttending ? (
                                                        <span className="flex items-center gap-1.5"><Check size={14} /> Attending</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5"><Plus size={14} /> RSVP</span>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Event Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowCreateModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-700/50 max-h-[85vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <PartyPopper size={20} className="text-amber-400" /> New Family Event
                                </h2>
                                <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-white rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">Event Title *</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                                        placeholder="e.g. Birthday Party"
                                        className="w-full bg-slate-900/50 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                                        placeholder="What's this event about?"
                                        rows={3}
                                        className="w-full bg-slate-900/50 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1.5">Date *</label>
                                        <input
                                            type="date"
                                            value={form.date}
                                            onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                                            className="w-full bg-slate-900/50 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1.5">Time</label>
                                        <input
                                            type="time"
                                            value={form.time}
                                            onChange={(e) => setForm(f => ({ ...f, time: e.target.value }))}
                                            className="w-full bg-slate-900/50 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">Location</label>
                                    <input
                                        type="text"
                                        value={form.location}
                                        onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                                        placeholder="e.g. Home, Restaurant, etc."
                                        className="w-full bg-slate-900/50 text-white px-4 py-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1.5">Event Type</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(Object.entries(EVENT_TYPES) as [FamilyEvent['type'], typeof EVENT_TYPES[keyof typeof EVENT_TYPES]][]).map(([key, config]) => (
                                            <button
                                                key={key}
                                                onClick={() => setForm(f => ({ ...f, type: key }))}
                                                className={`p-2.5 rounded-xl text-xs font-medium border transition-all flex flex-col items-center gap-1.5 ${form.type === key
                                                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                                                    : 'bg-slate-900/50 border-slate-700 text-slate-400 hover:border-slate-600'
                                                    }`}
                                            >
                                                {config.icon}
                                                {config.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleCreate}
                                className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
                            >
                                Create Event
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
