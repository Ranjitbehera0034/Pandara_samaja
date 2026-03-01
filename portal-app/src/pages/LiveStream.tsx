import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, MessageSquare, Heart, Share2, VideoOff, Video, MicOff, Mic, X, Cast } from 'lucide-react';
import { PORTAL_API_URL } from '../config/apiConfig';

export default function LiveStream() {
    const { member } = useAuth();
    const [isLive, setIsLive] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [micMuted, setMicMuted] = useState(false);
    const [videoMuted, setVideoMuted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [activeStreams, setActiveStreams] = useState<any[]>([]);

    useEffect(() => {
        const fetchStreams = async () => {
            try {
                const res = await fetch(`${PORTAL_API_URL}/live/streams`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('portalToken')}` }
                });
                const data = await res.json();
                if (data.success) {
                    setActiveStreams(data.streams || []);
                }
            } catch (e) {
                console.error("Failed to fetch live streams", e);
            }
        };

        fetchStreams();
        const interval = setInterval(fetchStreams, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const startStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
            setIsLive(true);
            setViewerCount(Math.floor(Math.random() * 50) + 10);

            // Start fake chat
            const interval = setInterval(() => {
                setChatMessages(prev => [...prev, {
                    id: Date.now(),
                    user: `Viewer${Math.floor(Math.random() * 1000)}`,
                    text: ['Hello!', 'Awesome ❤️', 'Where is this?', 'Great stream', 'Nice mask!'][Math.floor(Math.random() * 5)]
                }].slice(-50));
            }, 3000);

            return () => clearInterval(interval);
        } catch (err) {
            console.error("Error accessing media devices.", err);
            alert("Could not access camera/microphone.");
        }
    };

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) videoRef.current.srcObject = null;
        setIsLive(false);
        setViewerCount(0);
        setChatMessages([]);
    };

    const toggleVideo = () => {
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setVideoMuted(!videoMuted);
        }
    };

    const toggleAudio = () => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setMicMuted(!micMuted);
        }
    };

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        setChatMessages(prev => [...prev, {
            id: Date.now(),
            user: member?.name || 'You',
            text: messageInput
        }]);
        setMessageInput('');
    };

    return (
        <div className="h-full max-w-5xl mx-auto flex flex-col md:flex-row gap-4">
            {/* Left: Video Area */}
            <div className={`relative flex-1 bg-black rounded-2xl overflow-hidden shadow-2xl ${!isLive ? 'flex items-center justify-center' : ''}`}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted // mute self to avoid feedback
                    className={`w-full h-full object-cover ${!isLive ? 'hidden' : ''}`}
                />

                {/* Offline State */}
                {!isLive && (
                    <div className="text-center p-8 flex flex-col items-center justify-center h-full">
                        <div className="w-24 h-24 rounded-full bg-slate-800 mx-auto flex items-center justify-center mb-6 border-4 border-slate-700">
                            <Cast size={40} className="text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Start Broadcasting</h2>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">Share your moments live with the Pandara Samaja community. Engage with members in real-time.</p>
                        <button
                            onClick={startStream}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30"
                        >
                            Go Live Now
                        </button>

                        {activeStreams.length > 0 && (
                            <div className="mt-8 overflow-hidden rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 w-full max-w-sm">
                                <h3 className="text-white font-medium mb-3 flex items-center gap-2 justify-center">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    {activeStreams.length} Active Stream(s)
                                </h3>
                                <p className="text-slate-400 text-sm">Join active streams (WebRTC integration coming soon)</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Live Overlays */}
                {isLive && (
                    <>
                        {/* Top Bar */}
                        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-500 text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-lg shadow-red-500/20">
                                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" /> LIVE
                                </div>
                                <div className="bg-black/50 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                    <User size={14} /> {viewerCount}
                                </div>
                            </div>
                            <button onClick={stopStream} className="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-xl backdrop-blur-md transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Bottom Controls */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button onClick={toggleAudio} className={`p-3 rounded-full backdrop-blur-md transition-colors ${micMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                                        {micMuted ? <MicOff size={20} /> : <Mic size={20} />}
                                    </button>
                                    <button onClick={toggleVideo} className={`p-3 rounded-full backdrop-blur-md transition-colors ${videoMuted ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                                        {videoMuted ? <VideoOff size={20} /> : <Video size={20} />}
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="p-3 rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30">
                                        <Share2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Right: Chat Overlay */}
            <div className={`w-full md:w-80 flex flex-col bg-slate-800 rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden transition-all ${isLive ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <div className="p-4 border-b border-slate-700/50 bg-slate-900/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <MessageSquare size={18} className="text-blue-400" /> Live Chat
                    </h3>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {chatMessages.map(msg => (
                        <div key={msg.id} className="text-sm">
                            <span className="font-semibold text-blue-400 mr-2">{msg.user}:</span>
                            <span className="text-slate-200">{msg.text}</span>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-3 border-t border-slate-700/50 bg-slate-900/50">
                    <form onSubmit={sendMessage} className="relative">
                        <input
                            type="text"
                            className="w-full bg-slate-800 border border-slate-700 rounded-full py-2 pl-4 pr-10 text-white text-sm focus:outline-none focus:border-blue-500"
                            placeholder="Type a message..."
                            value={messageInput}
                            onChange={e => setMessageInput(e.target.value)}
                        />
                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-400 hover:text-white transition-colors">
                            <Heart size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
