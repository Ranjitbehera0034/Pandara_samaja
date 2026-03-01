// src/pages/Chat.tsx
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
// import { useSearchParams } from 'react-router-dom';
import { Smile, Loader2, Send, UserPlus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { PORTAL_API_URL } from '../config/apiConfig';
import type { ChatContact, ChatMessage, MemberOption, CallState } from '../types/chat';

// Hooks
import { useChatSocket } from '../hooks/useChatSocket';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

// Components
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageBubble } from '../components/chat/MessageBubble';
import { MessageInputArea } from '../components/chat/MessageInputArea';
import { CallOverlay } from '../components/chat/CallOverlay';
import { NewChatModal } from '../components/chat/NewChatModal';

export default function Chat() {
    const { member } = useAuth();
    const { t } = useLanguage();
    // const [searchParams, setSearchParams] = useSearchParams();
    const myId = member?.membership_no || member?.id || '';

    // State
    const [contacts, setContacts] = useState<ChatContact[]>([]);
    const [contactsLoading, setContactsLoading] = useState(true);
    const [contactSearch, setContactSearch] = useState('');
    const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    const [chatTab, setChatTab] = useState<'direct' | 'groups'>('direct');

    // Modals & Overlays
    const [showNewChat, setShowNewChat] = useState(false);
    const [allMembers, setAllMembers] = useState<MemberOption[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');
    const [reactionMenuMsgId, setReactionMenuMsgId] = useState<string | null>(null);
    const [callState, setCallState] = useState<CallState | null>(null);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Socket Hook
    const { socket, isConnected, onlineUsers, typingUsers } = useChatSocket(myId, member);

    // ─── Socket Event Handler ───────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleReceive = (msg: any) => {
            const incoming: ChatMessage = {
                id: msg.id,
                sender_id: msg.senderId,
                sender_name: msg.senderName || 'Unknown',
                sender_avatar: msg.senderAvatar || null,
                receiver_id: msg.receiverId,
                content: msg.content,
                created_at: msg.timestamp,
                read: false,
                type: msg.type || 'text',
            };

            setMessages(prev => {
                const isRelevant =
                    (selectedContact && incoming.sender_id === selectedContact.contact_id) ||
                    (selectedContact && incoming.receiver_id === selectedContact.contact_id);
                if (isRelevant) {
                    socket.emit('mark_read', { readerId: myId, senderId: incoming.sender_id });
                    return [...prev, incoming];
                }
                return prev;
            });

            setContacts(prev => {
                const senderId = incoming.sender_id;
                const existing = prev.find(c => c.contact_id === senderId);
                const updatedLast = {
                    last_message: incoming.content,
                    last_message_time: incoming.created_at,
                    unread_count: selectedContact?.contact_id === senderId ? 0 : (existing?.unread_count || 0) + 1,
                };

                if (existing) {
                    return [{ ...existing, ...updatedLast }, ...prev.filter(c => c.contact_id !== senderId)];
                } else {
                    return [{
                        contact_id: senderId,
                        contact_name: incoming.sender_name,
                        contact_avatar: incoming.sender_avatar,
                        ...updatedLast
                    } as ChatContact, ...prev];
                }
            });

            // Notification
            if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                const n = new Notification(incoming.sender_name || 'New Message', {
                    body: incoming.type === 'voice' ? '🎙 Voice message' : incoming.content,
                    icon: incoming.sender_avatar || undefined,
                });
                n.onclick = () => window.focus();
            }
        };

        socket.on('receive_message', handleReceive);
        return () => { socket.off('receive_message', handleReceive); };
    }, [socket, selectedContact, myId]);

    // Voice Recorder Hook
    const voiceRecorder = useVoiceRecorder((url, duration) => {
        if (selectedContact && socket) {
            const voiceMsg: ChatMessage = {
                id: `voice_${Date.now()}`,
                sender_id: myId,
                sender_name: member?.name || '',
                sender_avatar: member?.profile_photo_url || null,
                receiver_id: selectedContact.contact_id,
                content: url,
                created_at: new Date().toISOString(),
                read: false,
                type: 'voice',
                voiceDuration: duration,
            };
            setMessages(prev => [...prev, voiceMsg]);
            socket.emit('send_message', { receiverId: selectedContact.contact_id, content: url, type: 'voice' });
            toast.success(t('chat', 'voiceMessage'));
        }
    });

    // ─── Data Fetching ────────────────────────────────
    const fetchContacts = useCallback(async () => {
        try {
            const token = localStorage.getItem('portalToken');
            if (!token) return;
            const res = await fetch(`${PORTAL_API_URL}/chat/contacts`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) setContacts(data.contacts);
            }
        } catch (error) {
            console.error('Fetch contacts error:', error);
        } finally {
            setContactsLoading(false);
        }
    }, []);

    const fetchConversation = useCallback(async (contactId: string) => {
        try {
            setMessagesLoading(true);
            const token = localStorage.getItem('portalToken');
            const res = await fetch(`${PORTAL_API_URL}/chat/conversation/${contactId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) setMessages(data.messages);
            }
        } catch (error) {
            toast.error(t('chat', 'failedLoadMessages'));
        } finally {
            setMessagesLoading(false);
        }
    }, [t]);

    useEffect(() => { fetchContacts(); }, [fetchContacts]);

    useEffect(() => {
        if (selectedContact) {
            fetchConversation(selectedContact.contact_id);
            if (socket) socket.emit('mark_read', { readerId: myId, senderId: selectedContact.contact_id });
            setContacts(prev => prev.map(c => c.contact_id === selectedContact.contact_id ? { ...c, unread_count: 0 } : c));
        }
    }, [selectedContact, fetchConversation, socket, myId]);

    // ─── Event Handlers ───────────────────────────────
    const handleSendMessage = () => {
        if (!inputMessage.trim() || !selectedContact || !socket) return;
        const content = inputMessage.trim();
        const optimisticMsg: ChatMessage = {
            id: `optimistic-${Date.now()}`,
            sender_id: myId,
            sender_name: member?.name || '',
            sender_avatar: member?.profile_photo_url || null,
            receiver_id: selectedContact.contact_id,
            content,
            created_at: new Date().toISOString(),
            read: false,
            type: 'text',
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setInputMessage('');
        socket.emit('send_message', { receiverId: selectedContact.contact_id, content, type: 'text' });
        socket.emit('typing_stop', { senderId: myId, receiverId: selectedContact.contact_id });
    };

    const handleInputChange = (value: string) => {
        setInputMessage(value);
        if (selectedContact && socket) {
            socket.emit('typing_start', { senderId: myId, receiverId: selectedContact.contact_id });
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('typing_stop', { senderId: myId, receiverId: selectedContact.contact_id });
            }, 2000);
        }
    };

    const openAllMembers = async () => {
        setShowNewChat(true);
        if (allMembers.length > 0) return;
        setMembersLoading(true);
        try {
            const token = localStorage.getItem('portalToken');
            const res = await fetch(`${PORTAL_API_URL}/members`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                if (data.success) setAllMembers(data.members);
            }
        } catch (error) {
            toast.error(t('chat', 'failedLoadMembers'));
        } finally {
            setMembersLoading(false);
        }
    };

    const startNewChat = (m: MemberOption) => {
        const newContact: ChatContact = {
            contact_id: m.membership_no,
            contact_name: m.name,
            contact_avatar: m.profile_photo_url,
            last_message: '',
            last_message_time: new Date().toISOString(),
            unread_count: 0,
        };
        setContacts(prev => prev.find(c => c.contact_id === m.membership_no) ? prev : [newContact, ...prev]);
        setSelectedContact(newContact);
        setShowNewChat(false);
    };

    // ─── Helpers ──────────────────────────────────────
    const formatTime = (ts: string) => {
        const d = new Date(ts);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
        if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const startCall = (type: 'audio' | 'video') => {
        if (!selectedContact) return;
        setCallState({ active: true, type, contactName: selectedContact.contact_name, contactId: selectedContact.contact_id, status: 'calling', duration: 0 });
        setTimeout(() => {
            setCallState(prev => prev ? { ...prev, status: 'connected' } : null);
            callTimerRef.current = setInterval(() => setCallState(prev => prev ? { ...prev, duration: prev.duration + 1 } : null), 1000);
        }, 2000);
    };

    const endCall = () => {
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        setCallState(prev => prev ? { ...prev, status: 'ended', active: false } : null);
        setTimeout(() => setCallState(null), 1500);
    };

    // ─── Auto-scroll ──────────────────────────────────
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    // Calculated
    const filteredContacts = useMemo(() => contacts.filter(c => c.contact_name.toLowerCase().includes(contactSearch.toLowerCase())), [contacts, contactSearch]);
    const filteredMembers = useMemo(() => allMembers.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase())), [allMembers, memberSearch]);
    const totalUnread = useMemo(() => contacts.reduce((sum, c) => sum + (c.unread_count || 0), 0), [contacts]);

    return (
        <div className="h-[calc(100vh-100px)] flex bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
            <ChatSidebar
                chatTab={chatTab}
                setChatTab={setChatTab}
                contactSearch={contactSearch}
                setContactSearch={setContactSearch}
                totalUnread={totalUnread}
                isConnected={isConnected}
                openNewChat={openAllMembers}
                contactsLoading={contactsLoading}
                filteredContacts={filteredContacts}
                selectedContact={selectedContact}
                setSelectedContact={setSelectedContact}
                onlineUsers={onlineUsers}
                typingUsers={typingUsers}
                groups={[]}
                setShowCreateGroup={() => { }}
                openNewChatModal={openAllMembers}
                formatTime={formatTime}
            />

            {selectedContact ? (
                <div className="flex-1 flex flex-col bg-slate-900/50 relative">
                    <ChatHeader
                        selectedContact={selectedContact}
                        onBack={() => setSelectedContact(null)}
                        isOnline={onlineUsers.has(selectedContact.contact_id)}
                        isTyping={typingUsers.has(selectedContact.contact_id)}
                        onStartCall={startCall}
                        getInitial={n => n[0]}
                    />

                    <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
                        {messagesLoading ? (
                            <div className="flex items-center justify-center h-full"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4"><Smile size={40} className="text-slate-600" /></div>
                                <p className="text-lg font-medium text-white mb-1">Say hello to {selectedContact.contact_name}!</p>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg) => (
                                    <MessageBubble
                                        key={msg.id}
                                        msg={msg}
                                        isMe={msg.sender_id === myId}
                                        myId={myId}
                                        onReaction={(msgId, emoji) => {
                                            setMessages(prev => prev.map(m => {
                                                if (m.id !== msgId) return m;
                                                const reactions = { ...(m.reactions || {}) };
                                                Object.keys(reactions).forEach(key => {
                                                    reactions[key] = reactions[key].filter(uid => uid !== myId);
                                                    if (reactions[key].length === 0) delete reactions[key];
                                                });
                                                if (!reactions[emoji]) reactions[emoji] = [];
                                                reactions[emoji] = [...reactions[emoji], myId];
                                                return { ...m, reactions };
                                            }));
                                            setReactionMenuMsgId(null);
                                        }}
                                        reactionMenuMsgId={reactionMenuMsgId}
                                        setReactionMenuMsgId={setReactionMenuMsgId}
                                        formatMsgTime={ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        formatDuration={formatDuration}
                                    />
                                ))}
                            </>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <MessageInputArea
                        inputMessage={inputMessage}
                        setInputMessage={setInputMessage}
                        handleSendMessage={handleSendMessage}
                        handleInputChange={handleInputChange}
                        isRecording={voiceRecorder.isRecording}
                        recordingDuration={voiceRecorder.recordingDuration}
                        startRecording={voiceRecorder.startRecording}
                        stopRecording={voiceRecorder.stopRecording}
                        cancelRecording={voiceRecorder.cancelRecording}
                        formatDuration={formatDuration}
                    />
                </div>
            ) : (
                <div className="hidden md:flex flex-1 flex-col items-center justify-center text-slate-500 bg-slate-900/50">
                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner"><Send size={40} className="text-slate-600 -rotate-12" /></div>
                    <h3 className="text-xl font-bold text-white mb-2">{t('chat', 'yourMessages')}</h3>
                    <p className="max-w-xs text-center text-sm mb-6">{t('chat', 'selectConversation')}</p>
                    <button onClick={openAllMembers} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"><UserPlus size={18} /> {t('chat', 'newConversation')}</button>
                </div>
            )}

            <AnimatePresence>
                {showNewChat && (
                    <NewChatModal
                        onClose={() => setShowNewChat(false)}
                        memberSearch={memberSearch}
                        setMemberSearch={setMemberSearch}
                        membersLoading={membersLoading}
                        filteredMembers={filteredMembers}
                        startNewChat={startNewChat}
                        onlineUsers={onlineUsers}
                        getInitial={n => n[0]}
                    />
                )}
                {callState && (
                    <CallOverlay
                        callState={callState}
                        onEndCall={endCall}
                        formatDuration={formatDuration}
                        getInitial={n => n[0]}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
