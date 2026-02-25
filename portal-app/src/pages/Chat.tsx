import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSearchParams } from 'react-router-dom';
import {
    Send, MoreVertical, Search, ArrowLeft, Image as ImageIcon,
    Smile, Signal, UserPlus, MessageCircle, Loader2, Check, CheckCheck,
    Phone, Video, Mic, PhoneOff, Users, Plus, X, Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000/api/portal' : 'https://pandara-samaja-backend.onrender.com/api/portal') + '' : 'https://pandara-samaja-backend.onrender.com/api/portal';
const SOCKET_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) ? 'http://localhost:5000' : 'https://pandara-samaja-backend.onrender.com';

// ─── Types ───────────────────────────────────────────
interface ChatContact {
    contact_id: string;
    contact_name: string;
    contact_avatar: string | null;
    last_message: string;
    last_message_time: string;
    unread_count: number;
}

interface ChatMessage {
    id: string;
    sender_id: string;
    sender_name: string;
    sender_avatar: string | null;
    receiver_id: string;
    receiver_name?: string;
    content: string;
    created_at: string;
    read: boolean;
    type: string; // 'text' | 'image' | 'voice' | 'file'
    reactions?: Record<string, string[]>; // emoji -> userIds
    voiceDuration?: number; // seconds
}

interface GroupChat {
    id: string;
    name: string;
    avatar?: string;
    members: string[];
    memberNames: string[];
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    isGroup: true;
}

interface MemberOption {
    membership_no: string;
    name: string;
    profile_photo_url: string | null;
    village?: string;
}

// ─── Component ───────────────────────────────────────
export default function Chat() {
    const { member } = useAuth();
    const { t } = useLanguage();
    const [searchParams, setSearchParams] = useSearchParams();
    const myId = member?.membership_no || member?.id || '';

    // Socket
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Contacts
    const [contacts, setContacts] = useState<ChatContact[]>([]);
    const [contactsLoading, setContactsLoading] = useState(true);
    const [contactSearch, setContactSearch] = useState('');

    // Selected conversation
    const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [inputMessage, setInputMessage] = useState('');

    // New chat modal
    const [showNewChat, setShowNewChat] = useState(false);
    const [allMembers, setAllMembers] = useState<MemberOption[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [memberSearch, setMemberSearch] = useState('');

    // Online status & typing
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Phase 3: Group chats
    const [groups, setGroups] = useState<GroupChat[]>([]);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedGroupMembers, setSelectedGroupMembers] = useState<MemberOption[]>([]);
    const [chatTab, setChatTab] = useState<'direct' | 'groups'>('direct');

    // Phase 3: Voice message recording
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Phase 3: Message reactions
    const [reactionMenuMsgId, setReactionMenuMsgId] = useState<string | null>(null);

    // Phase 3: Audio/Video call
    const [callState, setCallState] = useState<{
        active: boolean;
        type: 'audio' | 'video';
        contactName: string;
        contactId: string;
        status: 'calling' | 'connected' | 'ended';
        duration: number;
    } | null>(null);
    const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const getToken = () => localStorage.getItem('portalToken');

    // ─── Socket Setup ──────────────────────────────────
    useEffect(() => {
        const newSocket = io(SOCKET_URL);

        newSocket.on('connect', () => {
            setIsConnected(true);
            if (myId) {
                newSocket.emit('join_chat', { userId: myId });
                newSocket.emit('get_online_users');
            }
        });

        newSocket.on('disconnect', () => {
            setIsConnected(false);
        });

        // Receive message
        newSocket.on('receive_message', (msg: any) => {
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

            // Add to current conversation if it's from/to the selected contact
            setMessages(prev => {
                const isRelevant =
                    (selectedContact && incoming.sender_id === selectedContact.contact_id) ||
                    (selectedContact && incoming.receiver_id === selectedContact.contact_id);
                if (isRelevant) {
                    // Mark as read since user is viewing the conversation
                    newSocket.emit('mark_read', { readerId: myId, senderId: incoming.sender_id });
                    return [...prev, incoming];
                }
                return prev;
            });

            // Update contacts list — move sender to top, update last message
            setContacts(prev => {
                const senderId = incoming.sender_id;
                const existing = prev.find(c => c.contact_id === senderId);
                if (existing) {
                    return [
                        {
                            ...existing,
                            last_message: incoming.content,
                            last_message_time: incoming.created_at,
                            unread_count: selectedContact?.contact_id === senderId
                                ? 0
                                : existing.unread_count + 1,
                        },
                        ...prev.filter(c => c.contact_id !== senderId),
                    ];
                } else {
                    // New contact
                    return [
                        {
                            contact_id: senderId,
                            contact_name: incoming.sender_name,
                            contact_avatar: incoming.sender_avatar,
                            last_message: incoming.content,
                            last_message_time: incoming.created_at,
                            unread_count: 1,
                        },
                        ...prev,
                    ];
                }
            });
        });

        // Sent message confirmation
        newSocket.on('message_sent', (msg: any) => {
            const sent: ChatMessage = {
                id: msg.id,
                sender_id: msg.senderId,
                sender_name: msg.senderName || member?.name || '',
                sender_avatar: msg.senderAvatar || member?.profile_photo_url || null,
                receiver_id: msg.receiverId,
                content: msg.content,
                created_at: msg.timestamp,
                read: false,
                type: msg.type || 'text',
            };

            setMessages(prev => {
                // Replace optimistic message or add
                const hasOptimistic = prev.some(m => m.id === `optimistic-${sent.content}`);
                if (hasOptimistic) {
                    return prev.map(m =>
                        m.id === `optimistic-${sent.content}` ? sent : m
                    );
                }
                return prev;
            });
        });

        // Online/offline
        newSocket.on('online_users', (users: string[]) => {
            setOnlineUsers(new Set(users));
        });

        newSocket.on('user_online', ({ userId }: { userId: string }) => {
            setOnlineUsers(prev => new Set([...prev, userId]));
        });

        newSocket.on('user_offline', ({ userId }: { userId: string }) => {
            setOnlineUsers(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        });

        // Typing
        newSocket.on('typing_start', ({ senderId }: { senderId: string }) => {
            setTypingUsers(prev => new Set([...prev, senderId]));
        });

        newSocket.on('typing_stop', ({ senderId }: { senderId: string }) => {
            setTypingUsers(prev => {
                const next = new Set(prev);
                next.delete(senderId);
                return next;
            });
        });

        // Read receipts
        newSocket.on('messages_read', ({ readerId }: { readerId: string }) => {
            setMessages(prev =>
                prev.map(m =>
                    m.sender_id === myId && m.receiver_id === readerId
                        ? { ...m, read: true }
                        : m
                )
            );
        });

        newSocket.on('message_error', ({ error }: { error: string }) => {
            toast.error(error || 'Failed to send message');
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [myId]);

    // ─── Fetch Contacts ────────────────────────────────
    const fetchContacts = useCallback(async () => {
        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/chat/contacts`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to fetch contacts');
            const data = await res.json();
            if (data.success) {
                setContacts(data.contacts);
            }
        } catch (error) {
            console.error('Fetch contacts error:', error);
        } finally {
            setContactsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    // ─── Handle URL params (open chat with specific member) ──
    useEffect(() => {
        const chatWith = searchParams.get('with');
        const chatWithName = searchParams.get('name');

        if (chatWith && !selectedContact) {
            const existingContact = contacts.find(c => c.contact_id === chatWith);
            if (existingContact) {
                setSelectedContact(existingContact);
            } else if (chatWithName) {
                // Create a temporary contact entry
                setSelectedContact({
                    contact_id: chatWith,
                    contact_name: chatWithName,
                    contact_avatar: null,
                    last_message: '',
                    last_message_time: new Date().toISOString(),
                    unread_count: 0,
                });
            }
            // Clear the params
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, contacts, selectedContact, setSearchParams]);

    // ─── Fetch Conversation ────────────────────────────
    const fetchConversation = useCallback(async (contactId: string) => {
        try {
            setMessagesLoading(true);
            const token = getToken();
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/chat/conversation/${contactId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to fetch conversation');
            const data = await res.json();
            if (data.success) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Fetch conversation error:', error);
            toast.error(t('chat', 'failedLoadMessages'));
        } finally {
            setMessagesLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedContact) {
            fetchConversation(selectedContact.contact_id);

            // Mark messages as read
            if (socket) {
                socket.emit('mark_read', {
                    readerId: myId,
                    senderId: selectedContact.contact_id,
                });
            }

            // Reset unread count locally
            setContacts(prev =>
                prev.map(c =>
                    c.contact_id === selectedContact.contact_id ? { ...c, unread_count: 0 } : c
                )
            );

            // Focus input
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [selectedContact, fetchConversation, myId, socket]);

    // ─── Auto-scroll ───────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ─── Send Message ──────────────────────────────────
    const handleSendMessage = () => {
        if (!inputMessage.trim() || !socket || !myId || !selectedContact) return;

        const content = inputMessage.trim();

        // Optimistic add
        const optimisticMsg: ChatMessage = {
            id: `optimistic-${content}`,
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

        // Update contact list
        setContacts(prev => {
            const existing = prev.find(c => c.contact_id === selectedContact.contact_id);
            const updated: ChatContact = {
                contact_id: selectedContact.contact_id,
                contact_name: selectedContact.contact_name,
                contact_avatar: selectedContact.contact_avatar,
                last_message: content,
                last_message_time: new Date().toISOString(),
                unread_count: 0,
            };

            if (existing) {
                return [updated, ...prev.filter(c => c.contact_id !== selectedContact.contact_id)];
            }
            return [updated, ...prev];
        });

        // Send via socket
        socket.emit('send_message', {
            senderId: myId,
            receiverId: selectedContact.contact_id,
            content,
            type: 'text',
        });

        // Stop typing
        socket.emit('typing_stop', {
            senderId: myId,
            receiverId: selectedContact.contact_id,
        });
    };

    // ─── Typing indicator ──────────────────────────────
    const handleInputChange = (value: string) => {
        setInputMessage(value);
        if (!socket || !selectedContact) return;

        socket.emit('typing_start', {
            senderId: myId,
            receiverId: selectedContact.contact_id,
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_stop', {
                senderId: myId,
                receiverId: selectedContact.contact_id,
            });
        }, 2000);
    };

    // ─── New Chat — fetch all members ──────────────────
    const openNewChat = async () => {
        setShowNewChat(true);
        setMemberSearch('');
        if (allMembers.length > 0) return;

        setMembersLoading(true);
        try {
            const token = getToken();
            if (!token) return;

            const res = await fetch(`${API_BASE_URL}/members`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch members');
            const data = await res.json();
            if (data.success) {
                setAllMembers(data.members);
            }
        } catch (error) {
            console.error(error);
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

        // Add to contacts if not already there
        setContacts(prev => {
            if (prev.find(c => c.contact_id === m.membership_no)) return prev;
            return [newContact, ...prev];
        });

        setSelectedContact(newContact);
        setShowNewChat(false);
    };

    // ─── Phase 3: Group Chat ──────────────────────────
    const createGroup = () => {
        if (!groupName.trim() || selectedGroupMembers.length === 0) return;
        const newGroup: GroupChat = {
            id: `group_${Date.now()}`,
            name: groupName,
            members: [myId, ...selectedGroupMembers.map(m => m.membership_no)],
            memberNames: [member?.name || '', ...selectedGroupMembers.map(m => m.name)],
            lastMessage: `Group created by ${member?.name}`,
            lastMessageTime: new Date().toISOString(),
            unreadCount: 0,
            isGroup: true,
        };
        setGroups(prev => [newGroup, ...prev]);
        setShowCreateGroup(false);
        setGroupName('');
        setSelectedGroupMembers([]);
        toast.success(`Group "${newGroup.name}" created!`);
    };

    const toggleGroupMember = (m: MemberOption) => {
        setSelectedGroupMembers(prev => {
            if (prev.find(p => p.membership_no === m.membership_no)) {
                return prev.filter(p => p.membership_no !== m.membership_no);
            }
            return [...prev, m];
        });
    };

    // ─── Phase 3: Voice Message ───────────────────────
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            audioChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                audioChunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                stream.getTracks().forEach(t => t.stop());

                // Send as voice message
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
                        voiceDuration: recordingDuration,
                    };
                    setMessages(prev => [...prev, voiceMsg]);
                    toast.success(t('chat', 'voiceMessage'));
                }
                setRecordingDuration(0);
            };

            recorder.start();
            mediaRecorderRef.current = recorder;
            setIsRecording(true);

            recordingIntervalRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } catch {
            toast.error('Microphone access denied');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
        }
        setIsRecording(false);
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
        }
        audioChunksRef.current = [];
        setIsRecording(false);
        setRecordingDuration(0);
    };

    // ─── Phase 3: Message Reactions ───────────────────
    const CHAT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

    const addReaction = (msgId: string, emoji: string) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id !== msgId) return msg;
            const reactions = { ...(msg.reactions || {}) };
            Object.keys(reactions).forEach(key => {
                reactions[key] = reactions[key].filter(uid => uid !== myId);
                if (reactions[key].length === 0) delete reactions[key];
            });
            if (!reactions[emoji]) reactions[emoji] = [];
            reactions[emoji] = [...reactions[emoji], myId];
            return { ...msg, reactions };
        }));
        setReactionMenuMsgId(null);
    };

    // ─── Phase 3: Audio/Video Call ────────────────────
    const startCall = (type: 'audio' | 'video') => {
        if (!selectedContact) return;
        setCallState({
            active: true,
            type,
            contactName: selectedContact.contact_name,
            contactId: selectedContact.contact_id,
            status: 'calling',
            duration: 0,
        });
        setTimeout(() => {
            setCallState(prev => prev ? { ...prev, status: 'connected' } : null);
            callTimerRef.current = setInterval(() => {
                setCallState(prev => prev ? { ...prev, duration: prev.duration + 1 } : null);
            }, 1000);
        }, 2000);
    };

    const endCall = () => {
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        setCallState(prev => prev ? { ...prev, status: 'ended', active: false } : null);
        toast.success(t('chat', 'callEnded'));
        setTimeout(() => setCallState(null), 1500);
    };

    const formatCallDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // ─── Phase 3: Push Notifications ─────────────────
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        const handleNotifMessage = (msg: any) => {
            if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                const n = new Notification(msg.senderName || 'New Message', {
                    body: msg.type === 'voice' ? '🎙 Voice message' : msg.content,
                    icon: msg.senderAvatar || undefined,
                    tag: msg.id,
                });
                n.onclick = () => window.focus();
            }
        };
        if (socket) {
            socket.on('receive_message', handleNotifMessage);
            return () => { socket.off('receive_message', handleNotifMessage); };
        }
    }, [socket]);

    // ─── Helpers ───────────────────────────────────────
    const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

    const formatTime = (ts: string) => {
        const d = new Date(ts);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const formatMsgTime = (ts: string) => {
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filteredContacts = contacts.filter(c =>
        c.contact_name.toLowerCase().includes(contactSearch.toLowerCase())
    );

    const filteredMembers = allMembers.filter(m =>
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.membership_no.toLowerCase().includes(memberSearch.toLowerCase())
    );

    const isTyping = selectedContact && typingUsers.has(selectedContact.contact_id);
    const isOnline = selectedContact && onlineUsers.has(selectedContact.contact_id);

    const totalUnread = contacts.reduce((sum, c) => sum + (c.unread_count || 0), 0);

    // ─── Render ────────────────────────────────────────
    return (
        <div className="h-[calc(100vh-100px)] flex bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">

            {/* ═══ Sidebar — Contacts ═══ */}
            <div className={`${selectedContact ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-700/50 bg-slate-800/30`}>
                {/* Header */}
                <div className="p-4 border-b border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                                {t('chat', 'title')}
                            </h2>
                            {totalUnread > 0 && (
                                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                                    {totalUnread}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`}
                                title={isConnected ? 'Connected' : 'Disconnected'}
                            >
                                <Signal size={14} />
                            </div>
                            <button
                                onClick={openNewChat}
                                className="p-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-colors shadow-lg shadow-blue-500/20"
                                title="New conversation"
                            >
                                <UserPlus size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Direct / Groups Tabs */}
                    <div className="flex gap-1 mb-3 bg-slate-900/50 p-1 rounded-xl">
                        <button
                            onClick={() => setChatTab('direct')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${chatTab === 'direct' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <MessageCircle size={13} /> Direct
                        </button>
                        <button
                            onClick={() => setChatTab('groups')}
                            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${chatTab === 'groups' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Users size={13} /> {t('chat', 'groups')}
                            {groups.length > 0 && (
                                <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded-full">{groups.length}</span>
                            )}
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('chat', 'searchConversations')}
                            value={contactSearch}
                            onChange={e => setContactSearch(e.target.value)}
                            className="w-full bg-slate-700/50 text-white pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-400 text-sm"
                        />
                    </div>
                </div>

                {/* Contact / Group List */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                    {chatTab === 'direct' ? (
                        <>
                            {contactsLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 size={24} className="animate-spin text-blue-500" />
                                </div>
                            ) : filteredContacts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-slate-500 px-6 text-center">
                                    <MessageCircle size={40} className="mb-3 opacity-40" />
                                    <p className="text-sm font-medium">{t('chat', 'noConversations')}</p>
                                    <p className="text-xs mt-1">
                                        {t('chat', 'tapToStart')}
                                    </p>
                                </div>
                            ) : (
                                filteredContacts.map(contact => {
                                    const isActive = selectedContact?.contact_id === contact.contact_id;
                                    const online = onlineUsers.has(contact.contact_id);
                                    return (
                                        <div
                                            key={contact.contact_id}
                                            onClick={() => setSelectedContact(contact)}
                                            className={`p-3 flex items-center gap-3 cursor-pointer transition-all border-b border-slate-700/20 ${isActive
                                                ? 'bg-blue-600/10 border-l-2 border-l-blue-500'
                                                : 'hover:bg-slate-700/30'
                                                }`}
                                        >
                                            <div className="relative shrink-0">
                                                {contact.contact_avatar ? (
                                                    <img
                                                        src={contact.contact_avatar}
                                                        alt={contact.contact_name}
                                                        className="w-11 h-11 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                                        {getInitial(contact.contact_name)}
                                                    </div>
                                                )}
                                                {online && (
                                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-blue-400' : 'text-white'}`}>
                                                        {contact.contact_name}
                                                    </h3>
                                                    <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                                                        {formatTime(contact.last_message_time)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <p className="text-xs text-slate-400 truncate">
                                                        {typingUsers.has(contact.contact_id) ? (
                                                            <span className="text-blue-400 italic">{t('chat', 'typing')}</span>
                                                        ) : (
                                                            contact.last_message || t('chat', 'startConversation')
                                                        )}
                                                    </p>
                                                    {contact.unread_count > 0 && (
                                                        <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-blue-500/30 shrink-0 ml-2">
                                                            {contact.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </>
                    ) : (
                        /* ─── Groups Tab ─── */
                        <>
                            <button
                                onClick={async () => { setShowCreateGroup(true); await openNewChat(); setShowNewChat(false); }}
                                className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/30 transition-colors border-b border-slate-700/20"
                            >
                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                                    <Plus size={20} />
                                </div>
                                <span className="font-semibold text-white text-sm">{t('chat', 'createGroup')}</span>
                            </button>
                            {groups.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-500 px-6 text-center">
                                    <Users size={36} className="mb-3 opacity-40" />
                                    <p className="text-sm">No groups yet</p>
                                    <p className="text-xs mt-1">Create a group to start chatting</p>
                                </div>
                            ) : (
                                groups.map(group => (
                                    <div
                                        key={group.id}
                                        className="p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-700/30 border-b border-slate-700/20"
                                    >
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                                            {group.name[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-white text-sm truncate">{group.name}</h3>
                                            <p className="text-xs text-slate-400 truncate">
                                                {group.members.length} {t('chat', 'membersCount')} · {group.lastMessage}
                                            </p>
                                        </div>
                                        {group.unreadCount > 0 && (
                                            <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                                                {group.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ═══ Main Chat Area ═══ */}
            {selectedContact ? (
                <div className="flex-1 flex flex-col bg-slate-900/50 relative">
                    {/* Chat Header */}
                    <div className="p-3 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/30 backdrop-blur-sm z-10 shrink-0">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedContact(null)}
                                className="p-2 text-slate-400 hover:text-white md:hidden rounded-lg hover:bg-slate-700/50"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div className="relative">
                                {selectedContact.contact_avatar ? (
                                    <img
                                        src={selectedContact.contact_avatar}
                                        alt={selectedContact.contact_name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                        {getInitial(selectedContact.contact_name)}
                                    </div>
                                )}
                                {isOnline && (
                                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-800" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">{selectedContact.contact_name}</h3>
                                <p className="text-[11px] flex items-center gap-1">
                                    {isTyping ? (
                                        <span className="text-blue-400 animate-pulse">{t('chat', 'typing')}</span>
                                    ) : isOnline ? (
                                        <span className="text-green-400">{t('common', 'online')}</span>
                                    ) : (
                                        <span className="text-slate-500">{t('common', 'offline')}</span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                            <button
                                onClick={() => startCall('audio')}
                                className="p-2 hover:bg-slate-700/50 rounded-full transition-colors hover:text-green-400"
                                title={t('chat', 'audioCall')}
                            >
                                <Phone size={18} />
                            </button>
                            <button
                                onClick={() => startCall('video')}
                                className="p-2 hover:bg-slate-700/50 rounded-full transition-colors hover:text-blue-400"
                                title={t('chat', 'videoCall')}
                            >
                                <Video size={18} />
                            </button>
                            <button className="p-2 hover:bg-slate-700/50 rounded-full transition-colors hover:text-white">
                                <MoreVertical size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
                        {messagesLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 size={32} className="animate-spin text-blue-500" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <Smile size={40} className="text-slate-600" />
                                </div>
                                <p className="text-lg font-medium text-white mb-1">
                                    {t('chat', 'sayHelloTo')} {selectedContact.contact_name}!
                                </p>
                                <p className="text-sm text-slate-500">
                                    {t('chat', 'startConversation')}
                                </p>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg, idx) => {
                                    const isMe = msg.sender_id === myId;
                                    const prevMsg = messages[idx - 1];
                                    const showTimeSeparator = !prevMsg || (
                                        new Date(msg.created_at).getTime() -
                                        new Date(prevMsg.created_at).getTime() > 3600000
                                    );
                                    const sameSender = prevMsg && prevMsg.sender_id === msg.sender_id && !showTimeSeparator;

                                    return (
                                        <div key={msg.id}>
                                            {showTimeSeparator && (
                                                <div className="flex items-center justify-center my-4">
                                                    <span className="px-3 py-1 bg-slate-800 text-[10px] text-slate-500 rounded-full font-medium">
                                                        {formatTime(msg.created_at)}
                                                    </span>
                                                </div>
                                            )}

                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.15 }}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${sameSender ? 'mt-0.5' : 'mt-3'} group/msg relative`}
                                            >
                                                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} relative`}>
                                                    <div
                                                        className={`rounded-2xl px-4 py-2.5 ${isMe
                                                            ? 'bg-blue-600 text-white rounded-br-md shadow-lg shadow-blue-500/10'
                                                            : 'bg-slate-800 text-slate-200 rounded-bl-md border border-slate-700/50'
                                                            }`}
                                                        onDoubleClick={() => setReactionMenuMsgId(reactionMenuMsgId === msg.id ? null : msg.id)}
                                                    >
                                                        {/* Voice message */}
                                                        {msg.type === 'voice' ? (
                                                            <div className="flex items-center gap-3 min-w-[180px]">
                                                                <Mic size={16} className={isMe ? 'text-blue-200' : 'text-blue-400'} />
                                                                <audio src={msg.content} controls className="h-8 max-w-[200px]" style={{ filter: isMe ? 'invert(1) brightness(2)' : 'none' }} />
                                                                {msg.voiceDuration !== undefined && (
                                                                    <span className={`text-[10px] ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                                                        {formatCallDuration(msg.voiceDuration)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                                        )}
                                                        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? 'text-blue-200/70' : 'text-slate-500'}`}>
                                                            {formatMsgTime(msg.created_at)}
                                                            {isMe && (
                                                                <span className="ml-0.5">
                                                                    {msg.read ? (
                                                                        <CheckCheck size={13} className="text-blue-200" />
                                                                    ) : (
                                                                        <Check size={13} />
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Reaction badges */}
                                                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                        <div className={`flex gap-0.5 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                            {Object.entries(msg.reactions).map(([emoji, users]) => (
                                                                <span
                                                                    key={emoji}
                                                                    className={`text-xs px-1.5 py-0.5 rounded-full border ${users.includes(myId)
                                                                        ? 'bg-blue-600/20 border-blue-500/50'
                                                                        : 'bg-slate-800 border-slate-700/50'
                                                                        } cursor-pointer`}
                                                                    onClick={() => addReaction(msg.id, emoji)}
                                                                >
                                                                    {emoji}{users.length > 1 && <span className="ml-0.5 text-[10px] text-slate-400">{users.length}</span>}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Reaction emoji picker (on hover or double-click) */}
                                                    <AnimatePresence>
                                                        {reactionMenuMsgId === msg.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.8 }}
                                                                className={`absolute ${isMe ? 'right-0' : 'left-0'} -top-8 flex gap-0.5 bg-slate-800 border border-slate-700 rounded-full p-1 shadow-xl z-30`}
                                                            >
                                                                {CHAT_REACTIONS.map(emoji => (
                                                                    <button
                                                                        key={emoji}
                                                                        onClick={() => addReaction(msg.id, emoji)}
                                                                        className="w-7 h-7 flex items-center justify-center text-base hover:bg-slate-700 rounded-full transition-colors"
                                                                    >
                                                                        {emoji}
                                                                    </button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                    {/* Hover reaction trigger */}
                                                    <button
                                                        onClick={() => setReactionMenuMsgId(reactionMenuMsgId === msg.id ? null : msg.id)}
                                                        className={`absolute ${isMe ? '-left-6' : '-right-6'} top-1 opacity-0 group-hover/msg:opacity-100 transition-opacity p-0.5 hover:bg-slate-700/50 rounded text-slate-500 hover:text-white`}
                                                    >
                                                        <Smile size={14} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </div>
                                    );
                                })}

                                {/* Typing indicator bubble */}
                                <AnimatePresence>
                                    {isTyping && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="flex justify-start mt-2"
                                        >
                                            <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-bl-md px-4 py-3">
                                                <div className="flex gap-1.5">
                                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 border-t border-slate-700/50 bg-slate-800/30 backdrop-blur-sm shrink-0">
                        {isRecording ? (
                            <div className="flex items-center justify-between bg-red-500/10 p-2 rounded-xl border border-red-500/30 transition-colors">
                                <div className="flex items-center gap-3 pl-3">
                                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                                    <span className="text-red-400 font-medium font-mono text-sm">
                                        {formatCallDuration(recordingDuration)}
                                    </span>
                                    <span className="text-red-400/70 text-sm ml-2">{t('chat', 'recording')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={cancelRecording}
                                        className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 shrink-0"
                                    >
                                        <X size={18} />
                                    </button>
                                    <button
                                        onClick={stopRecording}
                                        className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg shadow-red-500/20 transition-all shrink-0 flex items-center gap-2 px-4"
                                    >
                                        <Square size={16} fill="currentColor" /> Send
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-xl border border-slate-700 focus-within:border-blue-500/50 transition-colors">
                                <button className="p-2 text-slate-400 hover:text-blue-400 transition-colors shrink-0">
                                    <Smile size={20} />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-blue-400 transition-colors shrink-0">
                                    <ImageIcon size={20} />
                                </button>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputMessage}
                                    onChange={e => handleInputChange(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                    placeholder={t('chat', 'typeMessage')}
                                    className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none px-2 text-sm"
                                />
                                {inputMessage.trim() ? (
                                    <button
                                        onClick={handleSendMessage}
                                        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-500/20 transition-all shrink-0"
                                    >
                                        <Send size={18} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={startRecording}
                                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all shrink-0"
                                    >
                                        <Mic size={20} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Empty state (desktop) */
                <div className="hidden md:flex flex-1 flex-col items-center justify-center text-slate-500 bg-slate-900/50">
                    <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <Send size={40} className="text-slate-600 -rotate-12" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{t('chat', 'yourMessages')}</h3>
                    <p className="max-w-xs text-center text-sm mb-6">
                        {t('chat', 'selectConversation')}
                    </p>
                    <button
                        onClick={openNewChat}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <UserPlus size={18} />
                        {t('chat', 'newConversation')}
                    </button>
                </div>
            )}

            {/* ═══ New Chat Modal ═══ */}
            <AnimatePresence>
                {showNewChat && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowNewChat(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-slate-700/50">
                                <h3 className="text-lg font-bold text-white mb-3">{t('chat', 'newConversation')}</h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder={t('chat', 'searchMembers')}
                                        value={memberSearch}
                                        onChange={e => setMemberSearch(e.target.value)}
                                        autoFocus
                                        className="w-full bg-slate-700/50 text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-400 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {membersLoading ? (
                                    <div className="flex items-center justify-center h-32">
                                        <Loader2 size={24} className="animate-spin text-blue-500" />
                                    </div>
                                ) : filteredMembers.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500 text-sm">
                                        {t('chat', 'noMembersFound')}
                                    </div>
                                ) : (
                                    filteredMembers.map(m => {
                                        const online = onlineUsers.has(m.membership_no);
                                        return (
                                            <button
                                                key={m.membership_no}
                                                onClick={() => startNewChat(m)}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/30 transition-colors text-left"
                                            >
                                                <div className="relative shrink-0">
                                                    {m.profile_photo_url ? (
                                                        <img
                                                            src={m.profile_photo_url} referrerPolicy="no-referrer"
                                                            alt={m.name}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                                            {getInitial(m.name)}
                                                        </div>
                                                    )}
                                                    {online && (
                                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-800" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-semibold text-white text-sm truncate">{m.name}</div>
                                                    <div className="text-xs text-slate-500">
                                                        #{m.membership_no}
                                                        {m.village && ` · ${m.village}`}
                                                    </div>
                                                </div>
                                                <MessageCircle size={16} className="text-blue-400 shrink-0" />
                                            </button>
                                        );
                                    })
                                )}
                            </div>

                            <div className="p-3 border-t border-slate-700/50">
                                <button
                                    onClick={() => setShowNewChat(false)}
                                    className="w-full py-2 text-sm text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-slate-700/30"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ Phase 3: Create Group Modal ═══ */}
            <AnimatePresence>
                {showCreateGroup && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowCreateGroup(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">{t('chat', 'createGroup')}</h3>
                                <button onClick={() => setShowCreateGroup(false)} className="text-slate-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 border-b border-slate-700/50">
                                <label className="block text-sm font-medium text-slate-300 mb-2">{t('chat', 'groupName')}</label>
                                <input
                                    type="text"
                                    value={groupName}
                                    onChange={e => setGroupName(e.target.value)}
                                    placeholder="Family, Friends, etc."
                                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="p-4 border-b border-slate-700/50">
                                <h4 className="text-sm font-medium text-slate-300 mb-2">{t('chat', 'addMembers')}</h4>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder={t('chat', 'searchMembers')}
                                        value={memberSearch}
                                        onChange={e => setMemberSearch(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-600 rounded-xl pl-9 pr-4 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2">
                                {filteredMembers.map(m => {
                                    const isSelected = selectedGroupMembers.some(sm => sm.membership_no === m.membership_no);
                                    return (
                                        <div
                                            key={m.membership_no}
                                            onClick={() => toggleGroupMember(m)}
                                            className="flex items-center gap-3 p-2 hover:bg-slate-700/30 rounded-lg cursor-pointer transition-colors"
                                        >
                                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-500' : 'border-slate-500'}`}>
                                                {isSelected && <Check size={14} className="text-white" />}
                                            </div>
                                            {m.profile_photo_url ? (
                                                <img src={m.profile_photo_url} referrerPolicy="no-referrer" alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">
                                                    {getInitial(m.name)}
                                                </div>
                                            )}
                                            <span className="text-sm text-white flex-1">{m.name}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-4 border-t border-slate-700/50 flex gap-3">
                                <button
                                    onClick={() => setShowCreateGroup(false)}
                                    className="flex-1 py-2 text-sm text-slate-300 hover:text-white font-medium bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createGroup}
                                    disabled={!groupName.trim() || selectedGroupMembers.length === 0}
                                    className="flex-1 py-2 text-sm text-white font-medium bg-blue-600 hover:bg-blue-500 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    {t('chat', 'create')} ({selectedGroupMembers.length})
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ Phase 3: Call Overlay ═══ */}
            <AnimatePresence>
                {callState && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-between p-8"
                    >
                        <div className="w-full flex justify-between items-start">
                            <button onClick={endCall} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-xl">
                                <ArrowLeft size={24} />
                            </button>
                        </div>

                        <div className="flex flex-col items-center flex-1 justify-center relative w-full">
                            {callState.type === 'video' && callState.status === 'connected' ? (
                                <div className="absolute inset-0 bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex items-center justify-center">
                                    <div className="absolute bottom-6 right-6 w-32 h-44 bg-slate-900 rounded-xl border-2 border-slate-600 shadow-xl overflow-hidden">
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                                            <Video size={24} />
                                            <span className="text-[10px] mt-2">You</span>
                                        </div>
                                    </div>
                                    <div className="text-slate-500 flex flex-col items-center">
                                        <Video size={64} className="opacity-20 mb-4" />
                                        <span>Video Stream...</span>
                                    </div>
                                </div>
                            ) : null}

                            <div className={`flex flex-col items-center z-10 ${callState.type === 'video' && callState.status === 'connected' ? 'absolute top-8 bg-black/40 backdrop-blur-md px-6 py-4 rounded-3xl' : ''}`}>
                                <div className="relative mb-6">
                                    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-2xl border-4 border-slate-800 z-10 relative">
                                        {getInitial(callState.contactName)}
                                    </div>
                                    {callState.status === 'calling' && (
                                        <>
                                            <div className="absolute inset-0 rounded-full border border-blue-500 animate-ping opacity-75" />
                                            <div className="absolute -inset-4 rounded-full border border-blue-400/30 animate-pulse" />
                                        </>
                                    )}
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-2">{callState.contactName}</h2>
                                <p className={`text-sm font-medium ${callState.status === 'calling' ? 'text-slate-400 animate-pulse' : callState.status === 'ended' ? 'text-red-400' : 'text-green-400'}`}>
                                    {callState.status === 'calling' && t('chat', 'calling')}
                                    {callState.status === 'connected' && formatCallDuration(callState.duration)}
                                    {callState.status === 'ended' && t('chat', 'callEnded')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-6 mt-10 bg-slate-800/80 backdrop-blur-xl px-10 py-5 rounded-full border border-slate-700 shadow-2xl z-10 w-full max-w-sm">
                            <button className="p-4 bg-slate-700 hover:bg-slate-600 rounded-full text-white transition-colors">
                                <Mic size={24} />
                            </button>
                            {callState.type === 'video' && (
                                <button className="p-4 bg-slate-700 hover:bg-slate-600 rounded-full text-white transition-colors">
                                    <Video size={24} />
                                </button>
                            )}
                            <button
                                onClick={endCall}
                                className="p-4 bg-red-600 hover:bg-red-500 rounded-full text-white transition-colors shadow-lg shadow-red-500/20"
                            >
                                <PhoneOff size={24} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
