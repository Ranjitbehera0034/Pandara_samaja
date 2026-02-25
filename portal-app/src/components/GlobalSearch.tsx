import { useState, useRef, useEffect } from 'react';
import { Search, Hash, User, MessageSquare, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

export function GlobalSearch() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        const timer = setTimeout(() => {
            setIsSearching(false);
        }, 500); // UI delay mockup
        return () => clearTimeout(timer);
    }, [query]);

    // Mock results
    const results = [
        { type: 'member', id: 101, name: 'Sasmita Das', match: 'Software Engineer', icon: <User size={14} className="text-blue-400" /> },
        { type: 'hashtag', id: 'culture', name: '#CultureFest', match: '34 posts', icon: <Hash size={14} className="text-purple-400" /> },
        { type: 'post', id: 12, name: 'Annual Meetup Details', match: 'Posted by Admin', icon: <MessageSquare size={14} className="text-green-400" /> },
    ];

    const handleSelect = (item: any) => {
        setIsOpen(false);
        setQuery('');
        if (item.type === 'member') navigate(`/profile/${item.id}`);
        else if (item.type === 'hashtag') navigate(`/explore?tag=${item.id}`);
        else if (item.type === 'post') navigate(`/`);
    };

    return (
        <div className="relative w-full max-w-lg" ref={wrapperRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={t('nav', 'searchPlaceholder')}
                    className="w-full bg-slate-700/40 text-white text-sm pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder-slate-500 border border-slate-700/50 focus:border-blue-500/50 transition-colors"
                />
            </div>

            <AnimatePresence>
                {isOpen && query.trim() && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-12 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[100]"
                    >
                        {isSearching ? (
                            <div className="flex items-center justify-center p-6 text-slate-400">
                                <Loader2 className="animate-spin text-blue-500" size={24} />
                            </div>
                        ) : (
                            <div className="max-h-80 overflow-y-auto">
                                <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-800 flex justify-between sticky top-0">
                                    Top Results
                                    <span className="text-[10px] text-blue-400 cursor-pointer">View All</span>
                                </div>
                                {results.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(item)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors text-left border-b border-slate-700/30 last:border-0"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-900/50 border border-slate-700 flex items-center justify-center shrink-0">
                                            {item.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-white truncate">{item.name}</div>
                                            <div className="text-xs text-slate-400 truncate">{item.match}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
