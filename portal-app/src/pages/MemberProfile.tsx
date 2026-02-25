import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, MessageSquare, Loader2, BadgeCheck } from 'lucide-react';

export default function MemberProfile() {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);

    // Mock data for another user
    const member = {
        name: 'Sasmita Das',
        membership_no: id,
        village: 'Khandagiri',
        gender: 'Female',
        marital_status: 'Married',
        posts: 12,
        followers: 45,
        joined: 'Jan 2025',
        is_verified: true
    };

    useEffect(() => {
        // Simulate fetch
        const timer = setTimeout(() => {
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Link to="/members" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={16} /> Back to Members
            </Link>

            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden relative shadow-xl">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="px-6 pb-6 relative">
                    <div className="flex justify-between items-end">
                        <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-slate-800 -mt-12 flex items-center justify-center text-4xl font-bold text-white shadow-xl relative z-10">
                            {member.name.charAt(0)}
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 font-medium transition-colors">
                                Follow
                            </button>
                            <Link to="/chat" className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium flex items-center gap-2 transition-colors">
                                <MessageSquare size={16} /> Message
                            </Link>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-white">{member.name}</h1>
                            {member.is_verified && <BadgeCheck size={24} className="text-blue-500" />}
                        </div>
                        <p className="text-slate-400 font-medium text-sm">#{member.membership_no}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                            <div className="flex items-center gap-1.5"><MapPin size={16} className="text-slate-500" /> {member.village}</div>
                            <div className="flex items-center gap-1.5"><Calendar size={16} className="text-slate-500" /> Joined {member.joined}</div>
                            <div className="flex items-center gap-1.5 text-blue-400 font-medium">{member.followers} Followers</div>
                            <div className="flex items-center gap-1.5 text-blue-400 font-medium">{member.posts} Posts</div>
                        </div>
                    </div>
                </div>
            </div>

            <h3 className="text-xl font-bold text-white">Recent Posts</h3>
            <div className="bg-slate-800/50 rounded-2xl p-8 text-center border border-slate-700/50 text-slate-400">
                <p>No recent posts from {member.name}</p>
            </div>
        </div>
    );
}
