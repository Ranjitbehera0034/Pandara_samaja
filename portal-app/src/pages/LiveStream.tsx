import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Heart, Users, Loader2, Cast } from 'lucide-react';
import { PORTAL_API_URL } from '../config/apiConfig';
import ReactPlayer from 'react-player';
import { useChatSocket } from '../hooks/useChatSocket';

interface StreamMessage {
    id: string;
    user: string;
    text: string;
    timestamp: string;
}

export default function LiveStream() {
    const { member } = useAuth();
    const token = localStorage.getItem('portalToken');
    const myId = member?.membership_no;
    const { socket } = useChatSocket(myId, member);

    const [activeStream, setActiveStream] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [chatMessages, setChatMessages] = useState<StreamMessage[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [viewerCount, setViewerCount] = useState(0);
    
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchStream();
        const interval = setInterval(fetchStream, 30000); // Check for new streams every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchStream = async () => {
        try {
            const res = await fetch(`${PORTAL_API_URL}/live/streams`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.streams && data.streams.length > 0) {
                // Pick the first active stream
                setActiveStream(data.streams[0]); 
            } else {
                setActiveStream(null);
            }
        } catch (e) {
            console.error("Failed to fetch live streams", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Socket IO Events
    useEffect(() => {
        if (!socket || !activeStream) return;

        socket.emit('join_live_stream', { streamId: activeStream.id });

        const handleReceive = (msg: StreamMessage) => {
            setChatMessages(prev => [...prev, msg].slice(-100)); // Keep last 100 messages to prevent lag
        };

        socket.on('receive_live_message', handleReceive);

        // Simulated highly-engaged viewer count
        setViewerCount(Math.floor(Math.random() * 50) + 120);

        return () => {
            socket.off('receive_live_message', handleReceive);
        };
    }, [socket, activeStream?.id]);

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !socket || !activeStream) return;

        socket.emit('live_message', { 
            streamId: activeStream.id, 
            content: messageInput,
            senderName: member?.name || 'Member'
        });

        setMessageInput('');
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col md:flex-row overflow-hidden relative pb-[70px] md:pb-0">
            {/* Left: Video Area - STICKY TOP ON MOBILE */}
            <div className="w-full md:flex-1 bg-black md:relative z-10 shrink-0 border-b border-slate-200 dark:border-slate-800 md:border-none shadow-md">
                {activeStream ? (
                    <div className="w-full h-full aspect-video md:aspect-auto">
                        <ReactPlayer
                            src={activeStream.stream_url}
                            width="100%"
                            height="100%"
                            playing
                            controls
                            className="react-player-wrapper object-contain"
                            style={{ position: 'absolute', top: 0, left: 0 }}
                        />
                        {/* Live Badge Overlay */}
                        <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
                            <div className="bg-red-600 text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg shadow-red-600/30">
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-sm" /> LIVE
                            </div>
                            <div className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg">
                                <Users size={14} /> {viewerCount}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-8">
                        <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
                            <Cast size={40} className="text-slate-500 relative z-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">No Active Broadcast</h2>
                        <p className="text-slate-400 max-w-sm">The community administration has not started a live stream yet. Please check back later.</p>
                    </div>
                )}
            </div>

            {/* Right: Chat Overlay */}
            <div className="flex-1 md:w-[350px] lg:w-[400px] md:flex-none flex flex-col bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-hidden relative pb-16 md:pb-0">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <MessageSquare size={18} className="text-blue-500" /> Community Chat
                    </h3>
                    {activeStream && <p className="text-xs text-slate-500 mt-1 truncate font-medium">{activeStream.title}</p>}
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 pb-8 scroll-smooth">
                    {(!activeStream || chatMessages.length === 0) ? (
                        <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm text-center px-6">
                            {activeStream ? "Be the first to send a message!" : "Chat is paused while broadcast is offline."}
                        </div>
                    ) : (
                        chatMessages.map(msg => (
                            <div key={msg.id} className="text-sm bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 dark:border-slate-700/50 break-words flex flex-col gap-1">
                                <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">{msg.user}</span>
                                <span className="text-slate-700 dark:text-slate-200">{msg.text}</span>
                            </div>
                        ))
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-20">
                    <form onSubmit={sendMessage} className="relative flex items-center">
                        <input
                            type="text"
                            className="w-full bg-slate-100 dark:bg-slate-800 border-transparent rounded-full py-3.5 pl-5 pr-14 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
                            placeholder={activeStream ? "Type a message..." : "Chat offline..."}
                            value={messageInput}
                            onChange={e => setMessageInput(e.target.value)}
                            disabled={!activeStream}
                        />
                        <button 
                            type="submit" 
                            disabled={!activeStream || !messageInput.trim()}
                            className="absolute right-2 p-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed disabled:shadow-none active:scale-95"
                        >
                            <Heart size={16} className={messageInput.trim() ? "animate-pulse" : ""} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
