import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, BarChart } from 'lucide-react';
import type { Poll, PollOption } from '../../types';

// ─── Poll Creator (inside CreatePost) ────────────────
interface PollCreatorProps {
    onCreatePoll: (poll: Poll) => void;
    onCancel: () => void;
}

export function PollCreator({ onCreatePoll, onCancel }: PollCreatorProps) {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);

    const addOption = () => {
        if (options.length < 6) setOptions([...options, '']);
    };

    const removeOption = (index: number) => {
        if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
    };

    const updateOption = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleCreate = () => {
        if (!question.trim()) return;
        const validOptions = options.filter(o => o.trim());
        if (validOptions.length < 2) return;

        const pollOptions: PollOption[] = validOptions.map((text, i) => ({
            id: `opt_${Date.now()}_${i}`,
            text,
            votes: 0,
        }));

        onCreatePoll({
            question,
            options: pollOptions,
            totalVotes: 0,
        });
    };

    const isValid = question.trim() && options.filter(o => o.trim()).length >= 2;

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 mt-3"
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-400">
                    <BarChart size={16} />
                    <span>Create Poll</span>
                </div>
                <button onClick={onCancel} className="p-1 text-slate-400 hover:text-white">
                    <X size={16} />
                </button>
            </div>

            <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="w-full bg-slate-800/50 text-white rounded-lg px-3 py-2 text-sm mb-3 border border-slate-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                autoFocus
            />

            <div className="space-y-2 mb-3">
                {options.map((opt, index) => (
                    <div key={index} className="flex gap-2">
                        <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1 bg-slate-800/50 text-white rounded-lg px-3 py-1.5 text-sm border border-slate-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-500"
                        />
                        {options.length > 2 && (
                            <button onClick={() => removeOption(index)} className="p-1 text-slate-500 hover:text-red-400">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between">
                {options.length < 6 && (
                    <button
                        onClick={addOption}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                    >
                        <Plus size={14} /> Add option
                    </button>
                )}
                <button
                    onClick={handleCreate}
                    disabled={!isValid}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors ml-auto"
                >
                    Add Poll
                </button>
            </div>
        </motion.div>
    );
}

// ─── Poll Display (inside PostCard) ──────────────────
interface PollDisplayProps {
    poll: Poll;
    onVote: (optionId: string) => void;
}

export function PollDisplay({ poll, onVote }: PollDisplayProps) {
    const [voted, setVoted] = useState(!!poll.myVote);
    const [myVote, setMyVote] = useState(poll.myVote);
    const [localPoll, setLocalPoll] = useState(poll);

    const handleVote = (optionId: string) => {
        if (voted) return;
        setVoted(true);
        setMyVote(optionId);

        const updatedOptions = localPoll.options.map(opt =>
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        );
        setLocalPoll({
            ...localPoll,
            options: updatedOptions,
            totalVotes: localPoll.totalVotes + 1,
            myVote: optionId,
        });
        onVote(optionId);
    };

    return (
        <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-4 mt-3">
            <div className="flex items-center gap-2 mb-3">
                <BarChart size={16} className="text-blue-400" />
                <span className="text-sm font-semibold text-white">{localPoll.question}</span>
            </div>

            <div className="space-y-2">
                {localPoll.options.map(option => {
                    const percentage = localPoll.totalVotes > 0 ? Math.round((option.votes / localPoll.totalVotes) * 100) : 0;
                    const isMyVote = myVote === option.id;

                    return (
                        <motion.button
                            key={option.id}
                            whileTap={!voted ? { scale: 0.98 } : undefined}
                            onClick={() => handleVote(option.id)}
                            disabled={voted}
                            className={`w-full relative overflow-hidden rounded-xl text-left transition-all ${voted
                                    ? 'cursor-default'
                                    : 'hover:bg-blue-500/10 cursor-pointer'
                                } ${isMyVote
                                    ? 'border-2 border-blue-500/50'
                                    : 'border border-slate-700/50'
                                }`}
                        >
                            {/* Background bar */}
                            {voted && (
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentage}%` }}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                    className={`absolute inset-y-0 left-0 ${isMyVote ? 'bg-blue-500/20' : 'bg-slate-700/30'} rounded-xl`}
                                />
                            )}
                            <div className="relative flex items-center justify-between px-4 py-2.5">
                                <span className={`text-sm ${isMyVote ? 'font-semibold text-blue-300' : 'text-slate-300'}`}>
                                    {isMyVote && '✓ '}{option.text}
                                </span>
                                {voted && (
                                    <span className={`text-sm font-semibold ${isMyVote ? 'text-blue-400' : 'text-slate-500'}`}>
                                        {percentage}%
                                    </span>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            <p className="text-xs text-slate-500 mt-3">
                {localPoll.totalVotes} {localPoll.totalVotes === 1 ? 'vote' : 'votes'}
                {localPoll.endsAt && ` · Ends ${new Date(localPoll.endsAt).toLocaleDateString()}`}
            </p>
        </div>
    );
}
