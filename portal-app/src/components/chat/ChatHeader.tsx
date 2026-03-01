// src/components/chat/ChatHeader.tsx
import React from 'react';
import { ArrowLeft, Phone, Video, MoreVertical } from 'lucide-react';
import type { ChatContact } from '../../types/chat';

interface ChatHeaderProps {
    selectedContact: ChatContact;
    onBack: () => void;
    isOnline: boolean;
    isTyping: boolean;
    onStartCall: (type: 'audio' | 'video') => void;
    getInitial: (name: string) => string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    selectedContact,
    onBack,
    isOnline,
    isTyping,
    onStartCall,
    getInitial,
}) => {
    return (
        <div className="p-3 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/30 backdrop-blur-sm z-10 shrink-0">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
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
                            <span className="text-blue-400 animate-pulse">typing...</span>
                        ) : isOnline ? (
                            <span className="text-green-400">online</span>
                        ) : (
                            <span className="text-slate-500">offline</span>
                        )}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
                <button
                    onClick={() => onStartCall('audio')}
                    className="p-2 hover:bg-slate-700/50 rounded-full transition-colors hover:text-green-400"
                    title="Audio call"
                >
                    <Phone size={18} />
                </button>
                <button
                    onClick={() => onStartCall('video')}
                    className="p-2 hover:bg-slate-700/50 rounded-full transition-colors hover:text-blue-400"
                    title="Video call"
                >
                    <Video size={18} />
                </button>
                <button className="p-2 hover:bg-slate-700/50 rounded-full transition-colors hover:text-white">
                    <MoreVertical size={18} />
                </button>
            </div>
        </div>
    );
};
