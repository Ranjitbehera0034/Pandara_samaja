// src/components/chat/NewChatModal.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, MessageCircle } from 'lucide-react';
import type { MemberOption } from '../../types/chat';

interface NewChatModalProps {
    onClose: () => void;
    memberSearch: string;
    setMemberSearch: (search: string) => void;
    membersLoading: boolean;
    filteredMembers: MemberOption[];
    startNewChat: (m: MemberOption) => void;
    onlineUsers: Set<string>;
    getInitial: (name: string) => string;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({
    onClose,
    memberSearch,
    setMemberSearch,
    membersLoading,
    filteredMembers,
    startNewChat,
    onlineUsers,
    getInitial,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-4 border-b border-slate-700/50">
                    <h3 className="text-lg font-bold text-white mb-3">New Conversation</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search members..."
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
                            No members found.
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

                <div className="p-3 border-t border-slate-700/50 text-center">
                    <button
                        onClick={onClose}
                        className="py-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
