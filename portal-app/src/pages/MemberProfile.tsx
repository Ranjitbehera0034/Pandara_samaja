import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, MessageSquare, Loader2, BadgeCheck, Users, Image as ImageIcon, LayoutGrid } from 'lucide-react';
import { PORTAL_API_URL } from '../config/apiConfig';
import { PostCard } from '../components/feed/PostCard';
import type { Post } from '../types';

// Assuming we get this from backend
interface PublicProfile {
    id: string; // membership_no
    name: string;
    avatar: string | null;
    gender: string | null;
    relation: string;
    isHoF: boolean;
    village: string | null;
    district: string | null;
    hofName?: string;
    stats: {
        posts: number;
        followers: number;
        following: number;
        familyMembers: number;
    };
    family: {
        id: string;
        name: string;
        relation: string;
        gender: string | null;
        avatar: string | null;
        isHoF: boolean;
    }[];
    posts: Post[];
    isFollowing: boolean;
    joined: string;
}

export default function MemberProfile() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const nameParam = searchParams.get('name');

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<PublicProfile | null>(null);
    const [activeTab, setActiveTab] = useState<'posts' | 'family' | 'gallery'>('posts');
    const [following, setFollowing] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('portalToken');
                const nameQuery = nameParam ? `?name=${encodeURIComponent(nameParam)}` : '';
                const url = `${PORTAL_API_URL}/members/public/${id}${nameQuery}`;

                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setProfile(data.profile);
                    setFollowing(data.profile.isFollowing);
                }
            } catch (err) {
                console.error("Error fetching public profile:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProfile();
        }
    }, [id, nameParam]);

    const handleFollow = async () => {
        if (!profile) return;
        try {
            const token = localStorage.getItem('portalToken');
            // Optimistic update
            setFollowing(!following);
            setProfile(prev => prev ? ({
                ...prev,
                stats: {
                    ...prev.stats,
                    followers: prev.stats.followers + (following ? -1 : 1)
                }
            }) : prev);

            await fetch(`${PORTAL_API_URL}/subscribe/${profile.id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (err) {
            console.error("Follow error:", err);
            setFollowing(!following); // revert
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center p-12 text-slate-400">
                <p>Profile not found or restricted.</p>
                <Link to="/members" className="text-blue-500 hover:underline mt-4 inline-block">Return to Members Directory</Link>
            </div>
        );
    }

    const isFemaleUser = ['female', 'f'].includes((profile.gender || '').toLowerCase());
    const initial = (profile.name || '?')[0].toUpperCase();

    // Clean avatar URL
    const cleanedAvatar = profile.avatar?.includes('drive.google.com/uc?id=')
        ? profile.avatar.replace('drive.google.com/uc?id=', 'lh3.googleusercontent.com/d/')
        : profile.avatar;

    // Collect all media for gallery
    const galleryItems = profile.posts.flatMap(p => p.media || []).filter(m => m.type === 'image');

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={16} /> Back
            </Link>

            {/* Header Section */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden relative shadow-xl">
                <div className={`h-32 ${isFemaleUser ? 'bg-gradient-to-r from-pink-600 to-rose-600' : 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}></div>
                <div className="px-6 pb-6 relative">
                    <div className="flex justify-between items-end flex-wrap gap-4">
                        <div className={`w-24 h-24 rounded-full border-4 border-slate-800 -mt-12 flex items-center justify-center text-4xl font-bold text-white shadow-xl relative z-10 overflow-hidden ${isFemaleUser ? 'bg-gradient-to-br from-rose-500 to-pink-600 ring-4 ring-pink-500/20' : 'bg-gradient-to-br from-blue-500 to-indigo-600 ring-4 ring-blue-500/20'}`}>
                            {cleanedAvatar ? (
                                <img src={cleanedAvatar} referrerPolicy="no-referrer" alt={profile.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                                initial
                            )}
                        </div>
                        <div className="flex gap-3 mt-4 w-full sm:w-auto">
                            <button
                                onClick={handleFollow}
                                className={`flex-1 sm:flex-none px-6 py-2 rounded-xl shadow-lg font-medium transition-colors ${following ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'}`}
                            >
                                {following ? 'Following' : 'Follow'}
                            </button>
                            <Link to={`/chat?user=${profile.id}`} className="flex-1 sm:flex-none justify-center px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium flex items-center gap-2 transition-colors">
                                <MessageSquare size={16} /> Message
                            </Link>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            {profile.isHoF ? (
                                <span className="text-xs font-semibold bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">Head of Family</span>
                            ) : (
                                <span className="text-xs font-medium text-slate-400">{profile.relation} • Family of <Link to={`/profile/${profile.id}`} className="hover:text-blue-400 hover:underline">{profile.hofName || 'HoF'}</Link></span>
                            )}
                            <span className="text-slate-500 text-sm">#{profile.id}</span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300">
                            {profile.village && (
                                <div className="flex items-center gap-1.5"><MapPin size={16} className="text-slate-500" /> {profile.village}{profile.district ? `, ${profile.district}` : ''}</div>
                            )}
                            <div className="flex items-center gap-1.5"><Users size={16} className="text-slate-500" /> Joined {profile.joined}</div>
                        </div>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-4 border-t border-slate-700/50 bg-slate-900/30">
                    <div className="p-3 text-center border-r border-slate-700/50">
                        <div className="text-lg font-bold text-white">{profile.stats.posts}</div>
                        <div className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">Posts</div>
                    </div>
                    <div className="p-3 text-center border-r border-slate-700/50 cursor-pointer hover:bg-slate-700/30 transition-colors">
                        <div className="text-lg font-bold text-white">{profile.stats.followers}</div>
                        <div className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">Followers</div>
                    </div>
                    <div className="p-3 text-center border-r border-slate-700/50 cursor-pointer hover:bg-slate-700/30 transition-colors">
                        <div className="text-lg font-bold text-white">{profile.stats.following}</div>
                        <div className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">Following</div>
                    </div>
                    <div className="p-3 text-center">
                        <div className="text-lg font-bold text-white">{profile.stats.familyMembers}</div>
                        <div className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">Family</div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-700">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'posts' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}
                >
                    <LayoutGrid size={18} /> Posts
                </button>
                <button
                    onClick={() => setActiveTab('family')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'family' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}
                >
                    <Users size={18} /> Family ({profile.stats.familyMembers})
                </button>
                <button
                    onClick={() => setActiveTab('gallery')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'gallery' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'}`}
                >
                    <ImageIcon size={18} /> Gallery
                </button>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'posts' && (
                    <div className="space-y-4">
                        {profile.posts.length > 0 ? (
                            profile.posts.map(post => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    onLike={() => { }}
                                    onComment={() => { }}
                                />
                            ))
                        ) : (
                            <div className="bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-700/50">
                                <p className="text-slate-400">No posts yet from {profile.name}.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'family' && (
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
                        <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                            <h3 className="font-semibold text-white">Family Members</h3>
                            <span className="text-xs text-slate-500">#{profile.id}</span>
                        </div>
                        <div className="divide-y divide-slate-700/50">
                            {profile.family.map((fam, idx) => {
                                const fmFem = ['female', 'f'].includes((fam.gender || '').toLowerCase());
                                const rawP = fam.avatar;
                                const cleanedP = rawP?.includes('drive.google.com/uc?id=') ? rawP.replace('drive.google.com/uc?id=', 'lh3.googleusercontent.com/d/') : rawP;

                                return (
                                    <div key={idx} className={`p-4 flex items-center gap-4 ${fam.name === profile.name ? 'bg-blue-500/5' : 'hover:bg-slate-700/20'}`}>
                                        <div className={`w-12 h-12 rounded-full overflow-hidden shrink-0 ring-2 ${fmFem ? 'ring-pink-500/40' : 'ring-blue-500/40'} flex items-center justify-center font-bold text-lg text-white`}>
                                            {cleanedP ? (
                                                <img src={cleanedP} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center ${fmFem ? 'bg-gradient-to-br from-rose-500 to-pink-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                                                    {(fam.name || '?')[0].toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <Link to={`/profile/${profile.id}?name=${encodeURIComponent(fam.name)}`} className="font-semibold text-white hover:text-blue-400 transition-colors">
                                                    {fam.name}
                                                </Link>
                                                {fam.isHoF && <span title="Head of Family"><BadgeCheck size={16} className="text-blue-500" /></span>}
                                            </div>
                                            <div className="text-sm text-slate-400 capitalize">{fam.relation}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'gallery' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {galleryItems.length > 0 ? (
                            galleryItems.map((item, idx) => (
                                <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700 relative group">
                                    <img src={item.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <ImageIcon size={24} className="text-white" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-700/50">
                                <p className="text-slate-400">No photos in {profile.name}'s gallery.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
