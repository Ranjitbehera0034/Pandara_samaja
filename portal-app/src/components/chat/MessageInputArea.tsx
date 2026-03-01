// src/components/chat/MessageInputArea.tsx
import React, { useRef } from 'react';
import { Send, Mic, Smile, Image as ImageIcon, X, Square } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface MessageInputAreaProps {
    inputMessage: string;
    setInputMessage: (msg: string) => void;
    handleSendMessage: () => void;
    handleInputChange: (val: string) => void;
    isRecording: boolean;
    recordingDuration: number;
    startRecording: () => void;
    stopRecording: () => void;
    cancelRecording: () => void;
    formatDuration: (seconds: number) => string;
}

export const MessageInputArea: React.FC<MessageInputAreaProps> = ({
    inputMessage,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setInputMessage: _setInputMessage,
    handleSendMessage,
    handleInputChange,
    isRecording,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    formatDuration,
}) => {
    const { t } = useLanguage();
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="p-3 border-t border-slate-700/50 bg-slate-800/30 backdrop-blur-sm shrink-0">
            {isRecording ? (
                <div className="flex items-center justify-between bg-red-500/10 p-2 rounded-xl border border-red-500/30 transition-colors">
                    <div className="flex items-center gap-3 pl-3">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-red-400 font-medium font-mono text-sm">
                            {formatDuration(recordingDuration)}
                        </span>
                        <span className="text-red-400/70 text-sm ml-2">Recording...</span>
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
    );
};
