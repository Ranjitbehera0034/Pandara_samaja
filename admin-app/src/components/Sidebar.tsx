import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useTranslation } from 'react-i18next';
import { LogOut, LayoutDashboard, Users, Heart, Megaphone, ShieldAlert, Calendar, UsersRound, BellRing, Settings, FileClock, Languages, Moon, Sun } from 'lucide-react';

export default function Sidebar() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const handleThemeChange = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        window.addEventListener('themeToggle', handleThemeChange);
        return () => window.removeEventListener('themeToggle', handleThemeChange);
    }, []);
    const { logout } = useAdminAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'or' : 'en';
        i18n.changeLanguage(newLang);
    };

    const toggleDarkMode = () => {
        const root = document.documentElement;
        if (root.classList.contains('dark')) {
            root.classList.remove('dark');
        } else {
            root.classList.add('dark');
        }
        window.dispatchEvent(new Event('themeToggle'));
    };

    const linkClasses = ({ isActive }: { isActive: boolean }) =>
        `flex items-center gap-3 px-4 py-3.5 transition-colors text-sm font-medium whitespace-nowrap overflow-hidden ${isActive
            ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 border-r-4 border-blue-600'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
        }`;

    return (
        <aside
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            className={`${isExpanded ? 'w-64' : 'w-20'} hidden sm:flex fixed left-0 top-0 bottom-0 transition-all duration-300 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col z-50 overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none`}
        >
            <div className={`p-6 border-b border-slate-100 dark:border-slate-800 mb-4 flex items-center ${isExpanded ? '' : 'justify-center px-0'}`}>
                <div className="flex items-center gap-3 whitespace-nowrap">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 shrink-0">
                        P
                    </div>
                    {isExpanded && <h2 className="text-xl text-slate-900 dark:text-white font-bold tracking-tight">Admin<span className="text-blue-600">Panel</span></h2>}
                </div>
            </div>

            <nav className="flex-1 space-y-1">
                <NavLink to="/" end className={linkClasses}>
                    <div className="shrink-0 pl-1"><LayoutDashboard size={20} /></div>
                    <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>{t('dashboard')}</span>
                </NavLink>
                <NavLink to="/members" className={linkClasses}>
                    <div className="shrink-0 pl-1"><Users size={20} /></div>
                    <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>{t('members')}</span>
                </NavLink>
                <NavLink to="/leaders" className={linkClasses}>
                    <div className="shrink-0 pl-1"><UsersRound size={20} /></div>
                    <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>{t('leaders')}</span>
                </NavLink>
                <NavLink to="/content" className={linkClasses}>
                    <div className="shrink-0 pl-1"><ShieldAlert size={20} /></div>
                    <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>{t('content_moderation')}</span>
                </NavLink>
                <NavLink to="/matrimony" className={linkClasses}>
                    <div className="shrink-0 pl-1"><Heart size={20} /></div>
                    <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>{t('matrimony')}</span>
                </NavLink>
                <NavLink to="/announcements" className={linkClasses}>
                    <div className="shrink-0 pl-1"><Megaphone size={20} /></div>
                    <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>{t('announcements')}</span>
                </NavLink>
                <NavLink to="/events" className={linkClasses}>
                    <div className="shrink-0 pl-1"><Calendar size={20} /></div>
                    <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>{t('events')}</span>
                </NavLink>
                <NavLink to="/groups" className={linkClasses}>
                    <div className="shrink-0 pl-1"><UsersRound size={20} /></div>
                    <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>{t('groups')}</span>
                </NavLink>
                <NavLink to="/notifications" className={linkClasses}>
                    <div className="shrink-0 pl-1"><BellRing size={20} /></div>
                    <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>{t('notifications')}</span>
                </NavLink>
                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                    <NavLink to="/settings" className={linkClasses}>
                        <div className="shrink-0 pl-1"><Settings size={20} /></div>
                        <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>{t('settings')}</span>
                    </NavLink>
                    <NavLink to="/audit-log" className={linkClasses}>
                        <div className="shrink-0 pl-1"><FileClock size={20} /></div>
                        <span className={`transition-opacity duration-300 ${isExpanded ? 'opacity-100 block' : 'opacity-0 hidden'}`}>{t('audit_log')}</span>
                    </NavLink>
                </div>
            </nav>

            <div className={`p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 flex flex-col ${isExpanded ? '' : 'items-center'}`}>
                <button
                    onClick={toggleDarkMode}
                    className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-colors ${isExpanded ? 'px-4 w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700' : 'w-10 h-10 px-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    title="Toggle Dark Mode"
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    {isExpanded && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
                </button>
                <button
                    onClick={toggleLanguage}
                    className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors ${isExpanded ? 'px-4 w-full' : 'w-10 h-10 px-0'}`}
                    title="Toggle Language"
                >
                    <Languages size={18} />
                    {isExpanded && <span>{i18n.language === 'en' ? 'ଓଡ଼ିଆ' : 'English'}</span>}
                </button>
                <button
                    onClick={handleLogout}
                    className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-colors ${isExpanded ? 'px-4 w-full' : 'w-10 h-10 px-0'}`}
                    title="Sign Out"
                >
                    <LogOut size={18} />
                    {isExpanded && <span>Sign Out</span>}
                </button>
            </div>
        </aside>
    );
}
