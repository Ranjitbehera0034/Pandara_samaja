import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, MapPin, Clock, Users, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { PORTAL_API_URL, API_BASE_URL } from '../config/apiConfig';

export default function Events() {
    const { t } = useLanguage();

    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await fetch(`${PORTAL_API_URL}/events`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('portalToken')}` }
            });
            const data = await res.json();
            if (data.success) {
                setEvents(data.events.map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    date: new Date(e.event_date).toLocaleDateString(),
                    displayMonth: new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(e.event_date)),
                    displayDate: new Date(e.event_date).getDate(),
                    time: 'TBA',
                    location: e.location,
                    attendees: parseInt(e.attendees_count) || 0,
                    image: e.image_url ? `${API_BASE_URL}/${e.image_url}` : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'
                })));
            }
        } catch (e) {
            toast.error('Failed to load events');
        }
    };

    const handleRSVP = async (eventId: number) => {
        try {
            const res = await fetch(`${PORTAL_API_URL}/events/${eventId}/register`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('portalToken')}` }
            });
            if (res.ok) {
                toast.success('Successfully registered for event');
                fetchEvents(); // Update attendees count
            }
        } catch (e) {
            toast.error('Failed to register');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <CalendarIcon className="text-pink-500" size={28} />
                    <h1 className="text-2xl font-bold">{t('nav', 'events')}</h1>
                </div>
                <button className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-pink-500/20">
                    <Plus size={18} /> Create Event
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-slate-700/50 pb-px">
                <button className="px-4 py-3 border-b-2 border-pink-500 text-pink-500 font-semibold text-sm">Upcoming</button>
                <button className="px-4 py-3 border-b-2 border-transparent text-slate-400 hover:text-white font-semibold text-sm">Past Events</button>
                <button className="px-4 py-3 border-b-2 border-transparent text-slate-400 hover:text-white font-semibold text-sm">My RSVPs</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {events.map(event => (
                    <motion.div
                        key={event.id}
                        whileHover={{ y: -4 }}
                        className="bg-slate-800/80 rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl"
                    >
                        <div className="h-40 w-full overflow-hidden relative">
                            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-center">
                                <div className="text-xs font-bold text-pink-400 uppercase tracking-widest leading-none mb-1">{event.displayMonth}</div>
                                <div className="text-xl font-bold text-white leading-none">{event.displayDate}</div>
                            </div>
                        </div>
                        <div className="p-5">
                            <h3 className="text-xl font-bold text-white mb-3 leading-tight">{event.title}</h3>

                            <div className="space-y-2 text-sm text-slate-400 mb-6">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-slate-500" />
                                    {event.time}
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-slate-500" />
                                    {event.location}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-slate-500" />
                                    {event.attendees} attending
                                </div>
                            </div>

                            <button onClick={() => handleRSVP(event.id)} className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-semibold transition-colors shadow-lg shadow-pink-500/20">
                                RSVP Now
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
