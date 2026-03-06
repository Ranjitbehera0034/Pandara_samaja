import { useState } from 'react';
import { Send, Users, Activity, MessageCircle, AlertCircle, Megaphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export default function Broadcasts() {
    const [activeTab, setActiveTab] = useState<'members' | 'channel'>('members');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [stats, setStats] = useState<{ totalTargeted: number } | null>(null);
    const [channelStats, setChannelStats] = useState<{ channelId: string } | null>(null);

    const handleBroadcast = async () => {
        if (!message.trim()) {
            toast.error("Please enter a message to broadcast.");
            return;
        }

        if (!window.confirm("Are you sure you want to broadcast this message to ALL members? This action cannot be undone.")) {
            return;
        }

        setIsSending(true);
        try {
            const token = localStorage.getItem('adminToken');

            // Switch endpoint based on the active tab
            const endpoint = activeTab === 'members'
                ? '/admin/broadcast/whatsapp'
                : '/admin/channel/post';

            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            if (response.ok && data.success) {
                toast.success(data.message);

                if (activeTab === 'members') {
                    setStats({ totalTargeted: data.totalTargeted });
                } else {
                    setChannelStats({ channelId: data.channelId });
                }

                setMessage('');
            } else {
                toast.error(data.message || 'Failed to send message');
            }
        } catch (error) {
            console.error('Broadcast error:', error);
            toast.error('A network error occurred while broadcasting');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-5xl mx-auto pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-400 dark:to-emerald-500">
                        WhatsApp Broadcast
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Send automated WhatsApp messages to all registered members
                    </p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl w-full max-w-sm mb-6">
                <button
                    onClick={() => { setActiveTab('members'); setMessage(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'members'
                        ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                >
                    <Users size={18} />
                    Direct Broadcast
                </button>
                <button
                    onClick={() => { setActiveTab('channel'); setMessage(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'channel'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                >
                    <Megaphone size={18} />
                    Channel Post
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Compose Message */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm ${activeTab === 'channel' ? 'border-blue-200 dark:border-blue-900/50 shadow-blue-500/5' : ''}`}
                    >
                        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                            {activeTab === 'members' ? (
                                <><MessageCircle className="text-emerald-500" size={20} /> Compose Direct Broadcast</>
                            ) : (
                                <><Megaphone className="text-blue-500" size={20} /> Compose Channel Post</>
                            )}
                        </h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Odia Message Content
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                                placeholder={activeTab === 'members'
                                    ? "Write your official update here in Odia. e.g. ପଣ୍ଡରା ସମାଜର ସମସ୍ତ ସଦସ୍ୟଙ୍କୁ ଜଣାଇ ଦିଆଯାଉଛି କି..."
                                    : "Write your public channel update here. Include links and rich text format if supported."}
                                className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 resize-y ${activeTab === 'channel' ? 'focus:ring-blue-500/50' : 'focus:ring-emerald-500/50'}`}
                            />
                            <div className="flex justify-end mt-2">
                                <span className={`text-xs ${message.length > 1000 ? 'text-rose-500' : 'text-slate-500'}`}>
                                    {message.length} characters (Recommended limit: 1000)
                                </span>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-200 dark:border-amber-500/20 mb-6">
                            <AlertCircle className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={18} />
                            <div className="text-sm text-amber-800 dark:text-amber-200">
                                <strong>Note:</strong> {activeTab === 'members'
                                    ? "Currently in testing mode. This will simulate sending to all numbers."
                                    : "Make sure your WhatsApp Channel ID and Provider are configured in the settings table, otherwise this post will fail."}
                            </div>
                        </div>

                        <button
                            onClick={handleBroadcast}
                            disabled={isSending || !message.trim()}
                            className={`w-full py-3.5 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'members'
                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 shadow-emerald-500/20'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 shadow-blue-500/20'
                                }`}
                        >
                            {isSending ? (
                                <>
                                    <Activity className="animate-spin" size={20} />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Send size={20} />
                                    {activeTab === 'members' ? 'Broadcast to All Members' : 'Post to Channel'}
                                </>
                            )}
                        </button>
                    </motion.div>
                </div>

                {/* Right Column: Information/Stats */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        <h3 className="font-bold flex items-center gap-2 mb-4">
                            {activeTab === 'members' ? (
                                <><Users className="text-blue-500" size={18} /> Broadcast Target</>
                            ) : (
                                <><Megaphone className="text-blue-500" size={18} /> Channel Target</>
                            )}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                            {activeTab === 'members'
                                ? "This tool will automatically fetch all registered mobile numbers from both Primary Members and Family Members."
                                : "This tool will post an official update to the configured WhatsApp public channel."}
                        </p>

                        {(activeTab === 'members' && stats) && (
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-200 dark:border-emerald-500/30">
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">
                                    Last Broadcast Target
                                </p>
                                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
                                    {stats.totalTargeted}
                                </p>
                                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                                    Members Reached
                                </p>
                            </div>
                        )}
                        {(activeTab === 'channel' && channelStats) && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/30">
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider mb-1">
                                    Last Channel Post
                                </p>
                                <p className="text-lg font-black text-blue-700 dark:text-blue-300 break-all">
                                    {channelStats.channelId}
                                </p>
                                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                    Successfully Posted
                                </p>
                            </div>
                        )}

                        {((activeTab === 'members' && !stats) || (activeTab === 'channel' && !channelStats)) && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                                <p className="text-sm text-center text-slate-500 italic">
                                    Send a {activeTab === 'members' ? 'broadcast' : 'channel post'} to view targeting statistics.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>

            </div>
        </div>
    );
}
