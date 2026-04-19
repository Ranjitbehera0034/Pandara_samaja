import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSettings, type PortalSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import {
    Shield, Eye, Bell, Moon, Globe, Lock,
    ChevronRight, ToggleLeft, ToggleRight, AlertTriangle,
    UserX, Volume2, Palette, HelpCircle, FileText, LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import type { ReactNode } from 'react';

export default function SettingsPage() {
    const { logout } = useAuth();
    const { settings, updateSetting } = useSettings();
    const { t, lang, setLang } = useLanguage();

    const ToggleSwitch = ({ settingKey, label }: { settingKey: keyof typeof settings; label?: string }) => {
        const isOn = settings[settingKey];
        return (
            <button
                onClick={() => {
                    updateSetting(settingKey as any, !isOn);
                    toast.success(`${label || String(settingKey)} ${!isOn ? t('settings', 'enabled') : t('settings', 'disabled')}`);
                }}
                className="shrink-0 transition-transform active:scale-95"
                aria-label={`Toggle ${label || String(settingKey)}`}
            >
                {isOn ? (
                    <ToggleRight size={28} className="text-blue-500" />
                ) : (
                    <ToggleLeft size={28} className="text-slate-600" />
                )}
            </button>
        );
    };

    const sections: {
        title: string;
        icon: ReactNode;
        description: string;
        items: { key: keyof PortalSettings; label: string; description: string; icon: ReactNode }[];
    }[] = [
            {
                title: t('settings', 'contentSafety'),
                icon: <Shield size={20} className="text-red-400" />,
                description: t('settings', 'contentSafetyDesc'),
                items: [
                    {
                        key: 'contentFilter',
                        label: t('settings', 'contentFilter'),
                        description: t('settings', 'contentFilterDesc'),
                        icon: <AlertTriangle size={18} className="text-red-400" />,
                    },
                    {
                        key: 'profanityFilter',
                        label: t('settings', 'profanityFilter'),
                        description: t('settings', 'profanityFilterDesc'),
                        icon: <Volume2 size={18} className="text-amber-400" />,
                    },
                ]
            },
            {
                title: t('settings', 'privacy'),
                icon: <Lock size={20} className="text-green-400" />,
                description: t('settings', 'privacyDesc'),
                items: [
                    {
                        key: 'showOnline',
                        label: t('settings', 'showOnline'),
                        description: t('settings', 'showOnlineDesc'),
                        icon: <Eye size={18} className="text-green-400" />,
                    },
                    {
                        key: 'readReceipts',
                        label: t('settings', 'readReceipts'),
                        description: t('settings', 'readReceiptsDesc'),
                        icon: <Eye size={18} className="text-cyan-400" />,
                    },
                    {
                        key: 'showAge',
                        label: t('settings', 'showAge'),
                        description: t('settings', 'showAgeDesc'),
                        icon: <UserX size={18} className="text-violet-400" />,
                    },
                    {
                        key: 'showMobile',
                        label: t('settings', 'showMobile'),
                        description: t('settings', 'showMobileDesc'),
                        icon: <Lock size={18} className="text-orange-400" />,
                    },
                ]
            },
            {
                title: t('settings', 'notificationsTitle'),
                icon: <Bell size={20} className="text-blue-400" />,
                description: t('settings', 'notificationsDesc'),
                items: [
                    { key: 'notifications_likes', label: t('settings', 'likeNotif'), description: t('settings', 'likeNotifDesc'), icon: <Bell size={18} className="text-rose-400" /> },
                    { key: 'notifications_comments', label: t('settings', 'commentNotif'), description: t('settings', 'commentNotifDesc'), icon: <Bell size={18} className="text-blue-400" /> },
                    { key: 'notifications_messages', label: t('settings', 'messageNotif'), description: t('settings', 'messageNotifDesc'), icon: <Bell size={18} className="text-green-400" /> },
                    { key: 'notifications_mentions', label: t('settings', 'mentionNotif'), description: t('settings', 'mentionNotifDesc'), icon: <Bell size={18} className="text-amber-400" /> },
                    { key: 'notifications_community', label: t('settings', 'communityNotif'), description: t('settings', 'communityNotifDesc'), icon: <Bell size={18} className="text-purple-400" /> },
                ]
            },
            {
                title: t('settings', 'appearance'),
                icon: <Palette size={20} className="text-purple-400" />,
                description: t('settings', 'appearanceDesc'),
                items: [
                    {
                        key: 'darkMode',
                        label: t('settings', 'darkMode'),
                        description: t('settings', 'darkModeDesc'),
                        icon: <Moon size={18} className="text-indigo-400" />,
                    },
                    {
                        key: 'compactMode',
                        label: t('settings', 'compactMode'),
                        description: t('settings', 'compactModeDesc'),
                        icon: <Globe size={18} className="text-cyan-400" />,
                    },
                    {
                        key: 'autoplayVideos',
                        label: t('settings', 'autoplayVideos'),
                        description: t('settings', 'autoplayDesc'),
                        icon: <Globe size={18} className="text-green-400" />,
                    },
                ]
            },
        ];

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">{t('settings', 'title')}</h1>
                <p className="text-slate-400 mt-1">{t('settings', 'subtitle')}</p>
            </motion.div>

            <div className="space-y-6">
                {/* ─── Language Selector ─── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                    className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden"
                >
                    <div className="px-6 pt-5 pb-3">
                        <div className="flex items-center gap-3 mb-1">
                            <Globe size={20} className="text-blue-400" />
                            <h2 className="text-lg font-bold text-white">{t('settings', 'languageTitle')}</h2>
                        </div>
                        <p className="text-sm text-slate-500 ml-8">{t('settings', 'languageDesc')}</p>
                    </div>
                    <div className="px-4 pb-4">
                        <div className="flex gap-3">
                            <button
                                onClick={() => setLang('en')}
                                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-medium ${lang === 'en'
                                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                    : 'border-slate-700 bg-slate-900/30 text-slate-400 hover:border-slate-600'
                                    }`}
                            >
                                <span className="text-lg">🇬🇧</span>
                                <span>English</span>
                            </button>
                            <button
                                onClick={() => setLang('od')}
                                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all font-medium ${lang === 'od'
                                    ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                                    : 'border-slate-700 bg-slate-900/30 text-slate-400 hover:border-slate-600'
                                    }`}
                            >
                                <span className="text-lg">🇮🇳</span>
                                <span>ଓଡ଼ିଆ</span>
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* ─── Settings Sections ─── */}
                {sections.map((section, si) => (
                    <motion.div
                        key={si}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (si + 1) * 0.08 }}
                        className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden"
                    >
                        <div className="px-6 pt-5 pb-3">
                            <div className="flex items-center gap-3 mb-1">
                                {section.icon}
                                <h2 className="text-lg font-bold text-white">{section.title}</h2>
                            </div>
                            <p className="text-sm text-slate-500 ml-8">{section.description}</p>
                        </div>
                        <div className="px-4 pb-4 space-y-1">
                            {section.items.map((item) => (
                                <div key={item.key} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-700/30 transition-colors">
                                    <div className="p-2 bg-slate-900/50 rounded-lg shrink-0">{item.icon}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-white text-sm">{item.label}</div>
                                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</div>
                                    </div>
                                    <ToggleSwitch settingKey={item.key} label={item.label} />
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}

                {/* About & Support */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden"
                >
                    <div className="px-6 pt-5 pb-3">
                        <div className="flex items-center gap-3 mb-1">
                            <HelpCircle size={20} className="text-slate-400" />
                            <h2 className="text-lg font-bold text-white">{t('settings', 'aboutSupport')}</h2>
                        </div>
                    </div>
                    <div className="px-4 pb-4 space-y-1">
                        {[
                            { icon: <FileText size={18} className="text-slate-400" />, title: t('settings', 'communityGuidelines'), desc: t('settings', 'communityGuidelinesDesc') },
                            { icon: <HelpCircle size={18} className="text-slate-400" />, title: t('settings', 'helpSupport'), desc: t('settings', 'helpSupportDesc') },
                            { icon: <Shield size={18} className="text-slate-400" />, title: t('settings', 'privacyPolicy'), desc: t('settings', 'privacyPolicyDesc') },
                        ].map((item, idx) => (
                            <button key={idx} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-700/30 transition-colors text-left">
                                <div className="p-2 bg-slate-900/50 rounded-lg">{item.icon}</div>
                                <div className="flex-1">
                                    <div className="font-medium text-white text-sm">{item.title}</div>
                                    <div className="text-xs text-slate-500">{item.desc}</div>
                                </div>
                                <ChevronRight size={16} className="text-slate-600" />
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Danger Zone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6"
                >
                    <h3 className="text-red-400 font-bold mb-4 flex items-center gap-2"><AlertTriangle size={18} /> {t('settings', 'dangerZone')}</h3>
                    <div className="space-y-3">
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                        >
                            <LogOut size={18} />
                            <span className="font-medium">{t('settings', 'logOut')}</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/5 hover:bg-red-500/10 text-red-500/70 rounded-xl transition-colors text-sm">
                            <UserX size={18} />
                            <span>{t('settings', 'deactivateAccount')}</span>
                        </button>
                    </div>
                </motion.div>

                <div className="text-center py-4 text-xs text-slate-600">
                    {t('settings', 'version')}
                </div>
            </div>
        </div>
    );
}
