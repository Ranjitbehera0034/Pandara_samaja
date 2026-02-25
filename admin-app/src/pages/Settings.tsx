import { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings as SettingsIcon, ToggleLeft, ToggleRight, Save, Globe, Lock, ShieldAlert, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

export default function Settings() {
    const { t, i18n } = useTranslation();
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/settings');
            if (res.data.success) {
                setSettings(res.data.settings);
            }
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleFeatureToggle = (feature: string) => {
        setSettings({
            ...settings,
            features: {
                ...settings.features,
                [feature]: !settings.features?.[feature]
            }
        });
    };

    const handleRegistrationChange = (type: string) => {
        setSettings({
            ...settings,
            registration: {
                ...settings.registration,
                type
            }
        });
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            for (const key in settings) {
                await api.put(`/admin/settings/${key}`, { value: settings[key] });
            }
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save some settings');
        } finally {
            setSaving(false);
        }
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'or' : 'en';
        i18n.changeLanguage(newLang);
    };

    const toggleDarkMode = () => {
        const root = document.documentElement;
        if (root.classList.contains('dark')) {
            root.classList.remove('dark');
            setIsDark(false);
        } else {
            root.classList.add('dark');
            setIsDark(true);
        }
    };

    return (
        <div className="p-8 pb-32 max-w-5xl mx-auto dark:text-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <SettingsIcon className="text-gray-600 dark:text-gray-400" size={32} />
                        {t('global_settings')}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{t('configure_features')}</p>
                </div>
                <button
                    onClick={saveSettings}
                    disabled={saving || loading}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-lg disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? t('saving') : t('save_configuration')}
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-500">Loading system settings...</p>
                </div>
            ) : (
                <div className="space-y-6">

                    {/* Personalization */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
                            <Languages className="text-indigo-500" />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Localization & Theme</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Change your personal viewing preferences for the Administrator panel.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50/30 dark:bg-slate-700/20">
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white">Admin Language</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Render the UI in English or Odia.</p>
                                    </div>
                                    <button
                                        onClick={toggleLanguage}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors font-medium text-sm"
                                    >
                                        <Languages size={18} />
                                        {i18n.language === 'en' ? 'ଓଡ଼ିଆ' : 'English'}
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50/30 dark:bg-slate-700/20">
                                    <div>
                                        <h4 className="font-semibold text-slate-900 dark:text-white">Dark Mode</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Switch to dark interface.</p>
                                    </div>
                                    <button
                                        onClick={toggleDarkMode}
                                        className={`transition-colors ${isDark ? 'text-indigo-500' : 'text-slate-300 dark:text-slate-600'}`}
                                    >
                                        {isDark ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feature Toggles */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
                            <Globe className="text-blue-500" />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('feature_toggles')}</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('enable_disable_modules')}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['matrimony', 'reels', 'stories', 'chat', 'directory'].map(feat => (
                                    <div key={feat} className="flex items-center justify-between p-4 border border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50/30 dark:bg-slate-700/20">
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white capitalize">{feat} Module</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Controls access to {feat} globally.</p>
                                        </div>
                                        <button
                                            onClick={() => handleFeatureToggle(feat)}
                                            className={`transition-colors ${settings.features?.[feat] ? 'text-green-500' : 'text-slate-300 dark:text-slate-600'}`}
                                        >
                                            {settings.features?.[feat] ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Registration Settings */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-3">
                            <Lock className="text-amber-500" />
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('registration_flow')}</h2>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('determine_join')}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div
                                    onClick={() => handleRegistrationChange('open')}
                                    className={`p-5 rounded-xl border-2 cursor-pointer transition-colors ${settings.registration?.type === 'open' ? 'border-amber-500 bg-amber-50/10 dark:bg-amber-900/10' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600'}`}
                                >
                                    <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1">{t('open_registration')}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('anyone_can_join')}</p>
                                </div>

                                <div
                                    onClick={() => handleRegistrationChange('approval')}
                                    className={`p-5 rounded-xl border-2 cursor-pointer transition-colors ${settings.registration?.type === 'approval' ? 'border-amber-500 bg-amber-50/10 dark:bg-amber-900/10' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600'}`}
                                >
                                    <h4 className="font-bold text-slate-900 dark:text-white text-base mb-1">{t('approval_based')}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('new_accounts_pending')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Danger Zone */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-red-200 dark:border-red-900/50 overflow-hidden">
                        <div className="p-5 border-b border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 flex items-center gap-3">
                            <ShieldAlert className="text-red-600 dark:text-red-500" />
                            <h2 className="text-lg font-bold text-red-900 dark:text-red-400">{t('security_zone')}</h2>
                        </div>
                        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">{t('global_system_lockdown')}</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">Immediately cuts off all non-admin access to the portal. Members will be logged out and unable to reconnect. Use only in absolute emergencies.</p>
                            </div>
                            <button className="px-5 py-2.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white font-semibold rounded-lg transition-colors border border-red-200 dark:border-red-800 whitespace-nowrap">
                                {t('engage_lockdown')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
