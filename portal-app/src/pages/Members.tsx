import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { Member } from '../types';
import { Loader2, Search, UserCheck, UserPlus, MapPin, Users, MessageSquare, BadgeCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';

const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api/portal' : 'https://pandara-samaja-backend.onrender.com/api/portal') + '' : 'https://pandara-samaja-backend.onrender.com/api/portal';

export default function Members() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    // Note: Token is retrieved from localStorage directly in fetch functions
    // Actually, Feed.tsx used getToken() which was internal to it or AuthContext?
    // Let's check AuthContext again.

    // AuthContext doesn't expose getToken. It exposes user/member.
    // I should probably get the token from localStorage directly as done in Feed.tsx previously
    // or better, if AuthContext exposes it.

    // Let's re-read AuthContext to be sure.
    // Ah, previous summary said "Implemented storage of the JWT token received from the backend in localStorage under the key 'portalToken'".

    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [subscribing, setSubscribing] = useState<string | null>(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const getToken = () => localStorage.getItem('portalToken');

    const fetchMembers = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/members`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch members');

            const data = await response.json();
            if (data.success) {
                setMembers(data.members);
            }
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

            const response = await fetch(`${API_BASE_URL}/subscribe/${memberId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to update subscription');

            // Update local state
            setMembers(prev => prev.map(m =>
                m.membership_no === memberId
                    ? { ...m, is_subscribed: data.subscribed }
                    : m
            ));

            toast.success(data.message);
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Something went wrong");
        } finally {
            setSubscribing(null);
        }
    };

    const filteredMembers = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.membership_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.village?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{t('members', 'title')}</h1>
                    <p className="text-slate-400">{t('members', 'subtitle')}</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder={t('members', 'searchMembers')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.map(member => (
                    <div key={member.membership_no} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 hover:bg-slate-800 transition-colors group">
                        <div className="flex items-start justify-between mb-4">
                            <Link to={`/profile/${member.membership_no}`} className="flex items-center gap-4 cursor-pointer">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px]">
                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
                                        {member.profile_photo_url ? (
                                            <img src={member.profile_photo_url} alt={member.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-white text-lg">{member.name.charAt(0)}</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <h3 className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors hover:underline">{member.name}</h3>
                                        {member.is_verified && <BadgeCheck size={18} className="text-blue-500" />}
                                    </div>
                                    <span className="text-xs font-mono text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded">#{member.membership_no}</span>
                                </div>
                            </Link>

                            <button
                                onClick={() => handleSubscribe(member.membership_no)}
                                disabled={subscribing === member.membership_no}
                                className={`p-2 rounded-full transition-colors ${member.is_subscribed
                                    ? 'bg-blue-500/10 text-blue-400 hover:bg-red-500/10 hover:text-red-400'
                                    : 'bg-slate-700/50 text-slate-400 hover:bg-blue-500 hover:text-white'
                                    }`}
                                title={member.is_subscribed ? t('members', 'unsubscribe') : t('members', 'subscribe')}
                            >
                                {subscribing === member.membership_no ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : member.is_subscribed ? (
                                    <UserCheck size={20} />
                                ) : (
                                    <UserPlus size={20} />
                                )}
                            </button>
                            <button
                                onClick={() => navigate(`/chat?with=${member.membership_no}&name=${encodeURIComponent(member.name)}`)}
                                className="p-2 rounded-full bg-slate-700/50 text-slate-400 hover:bg-blue-500 hover:text-white transition-colors"
                                title={t('members', 'sendMessage')}
                            >
                                <MessageSquare size={18} />
                            </button>
                        </div>

                        <div className="space-y-2 text-sm text-slate-400">
                            {(member.village || member.district) && (
                                <div className="flex items-center gap-2">
                                    <MapPin size={16} className="text-slate-500" />
                                    <span>{member.village}{member.village && member.district ? ', ' : ''}{member.district}</span>
                                </div>
                            )}
                            {member.family_members && member.family_members.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-slate-500" />
                                    <span>{member.family_members.length} {t('members', 'familyMembers')}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {filteredMembers.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    <p>{t('members', 'noMembers')}</p>
                </div>
            )}
        </div>
    );
}
