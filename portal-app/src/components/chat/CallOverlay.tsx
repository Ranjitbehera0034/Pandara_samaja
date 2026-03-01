// src/components/chat/CallOverlay.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mic, Video, PhoneOff } from 'lucide-react';
import type { CallState } from '../../types/chat';

interface CallOverlayProps {
    callState: CallState;
    onEndCall: () => void;
    formatDuration: (seconds: number) => string;
    getInitial: (name: string) => string;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({
    callState,
    onEndCall,
    formatDuration,
    getInitial,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-between p-8"
        >
            <div className="w-full flex justify-between items-start">
                <button
                    onClick={onEndCall}
                    className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-xl"
                >
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
                        {callState.status === 'calling' && 'Calling...'}
                        {callState.status === 'connected' && formatDuration(callState.duration)}
                        {callState.status === 'ended' && 'Call ended'}
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
                    onClick={onEndCall}
                    className="p-4 bg-red-600 hover:bg-red-500 rounded-full text-white transition-colors shadow-lg shadow-red-500/20"
                >
                    <PhoneOff size={24} />
                </button>
            </div>
        </motion.div>
    );
};
