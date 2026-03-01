// src/components/chat/MessageBubble.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, CheckCheck, Mic, Smile } from 'lucide-react';
import type { ChatMessage } from '../../types/chat';

interface MessageBubbleProps {
    msg: ChatMessage;
    isMe: boolean;
    myId: string;
    onReaction: (msgId: string, emoji: string) => void;
    reactionMenuMsgId: string | null;
    setReactionMenuMsgId: (id: string | null) => void;
    formatMsgTime: (ts: string) => string;
    formatDuration: (seconds: number) => string;
}

const CHAT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
    msg,
    isMe,
    myId,
    onReaction,
    reactionMenuMsgId,
    setReactionMenuMsgId,
    formatMsgTime,
    formatDuration,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={`flex ${isMe ? 'justify-end' : 'justify-start'} mt-3 group/msg relative`}
        >
            <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} relative flex flex-col`}>
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
                                    {formatDuration(msg.voiceDuration)}
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
                                onClick={() => onReaction(msg.id, emoji)}
                            >
                                {emoji}{users.length > 1 && <span className="ml-0.5 text-[10px] text-slate-400">{users.length}</span>}
                            </span>
                        ))}
                    </div>
                )}

                {/* Reaction emoji picker */}
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
                                    onClick={() => onReaction(msg.id, emoji)}
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
    );
};
