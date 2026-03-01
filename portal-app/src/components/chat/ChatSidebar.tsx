// src/components/chat/ChatSidebar.tsx
import React from 'react';
import { Search, Signal, UserPlus, MessageCircle, Users, Loader2, Plus } from 'lucide-react';
import type { ChatContact, GroupChat } from '../../types/chat';
import { useLanguage } from '../../context/LanguageContext';

interface ChatSidebarProps {
    chatTab: 'direct' | 'groups';
    setChatTab: (tab: 'direct' | 'groups') => void;
    contactSearch: string;
    setContactSearch: (search: string) => void;
    totalUnread: number;
    isConnected: boolean;
    openNewChat: () => void;
    contactsLoading: boolean;
    filteredContacts: ChatContact[];
    selectedContact: ChatContact | null;
    setSelectedContact: (contact: ChatContact) => void;
    onlineUsers: Set<string>;
    typingUsers: Set<string>;
    groups: GroupChat[];
    setShowCreateGroup: (show: boolean) => void;
    openNewChatModal: () => void;
    formatTime: (ts: string) => string;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    chatTab,
    setChatTab,
    contactSearch,
    setContactSearch,
    totalUnread,
    isConnected,
    openNewChat,
    contactsLoading,
    filteredContacts,
    selectedContact,
    setSelectedContact,
    onlineUsers,
    typingUsers,
    groups,
    setShowCreateGroup,
    formatTime,
}) => {
    const { t } = useLanguage();

    const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : '?';

    return (
        <div className={`${selectedContact ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-700/50 bg-slate-800/30`}>
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            Chat
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

            {/* List */}
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
                                <p className="text-xs mt-1">{t('chat', 'tapToStart')}</p>
                            </div>
                        ) : (
                            filteredContacts.map(contact => {
                                const isActive = selectedContact?.contact_id === contact.contact_id;
                                const online = onlineUsers.has(contact.contact_id);
                                return (
                                    <div
                                        key={contact.contact_id}
                                        onClick={() => setSelectedContact(contact)}
                                        className={`p-3 flex items-center gap-3 cursor-pointer transition-all border-b border-slate-700/20 ${isActive ? 'bg-blue-600/10 border-l-2 border-l-blue-500' : 'hover:bg-slate-700/30'}`}
                                    >
                                        <div className="relative shrink-0">
                                            {contact.contact_avatar ? (
                                                <img src={contact.contact_avatar} alt={contact.contact_name} className="w-11 h-11 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {getInitial(contact.contact_name)}
                                                </div>
                                            )}
                                            {online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-blue-400' : 'text-white'}`}>{contact.contact_name}</h3>
                                                <span className="text-[10px] text-slate-500 shrink-0 ml-2">{formatTime(contact.last_message_time)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-slate-400 truncate">
                                                    {typingUsers.has(contact.contact_id) ? (
                                                        <span className="text-blue-400 italic">typing...</span>
                                                    ) : (
                                                        contact.last_message || 'Start conversation'
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
                    <>
                        <button
                            onClick={() => setShowCreateGroup(true)}
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
                                <div key={group.id} className="p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-700/30 border-b border-slate-700/20">
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
    );
};
