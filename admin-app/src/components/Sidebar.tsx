import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useTranslation } from 'react-i18next';
import { LogOut, LayoutDashboard, Users, Heart, Megaphone, Film, ShieldAlert, Calendar, UsersRound, BellRing, Settings, FileClock, Languages, Moon, Sun, X, Shield, Globe, Wallet, Video, BarChart3 } from 'lucide-react';

interface SidebarProps {
    isMobileOpen?: boolean;
    setIsMobileOpen?: (open: boolean) => void;
}

export default function Sidebar({ isMobileOpen = false, setIsMobileOpen }: SidebarProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

    useEffect(() => {
        const handleThemeChange = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };
        window.addEventListener('themeToggle', handleThemeChange);
        return () => window.removeEventListener('themeToggle', handleThemeChange);
    }, []);
    const { logout, user } = useAdminAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'or' : 'en';
        i18n.changeLanguage(newLang);
        localStorage.setItem('pandaraSamaja_lang', newLang);
    };

    const toggleDarkMode = () => {
        const root = document.documentElement;
        if (root.classList.contains('dark')) {
            root.classList.remove('dark');
            localStorage.setItem('admin-theme', 'light');
        } else {
            root.classList.add('dark');
            localStorage.setItem('admin-theme', 'dark');
        }
        window.dispatchEvent(new Event('themeToggle'));
    };

    const sidebarClasses = `
        fixed left-0 top-0 bottom-0 z-50 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shadow-lg
        ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full sm:translate-x-0'}
        ${!isMobileOpen && !isExpanded ? 'sm:w-20' : 'sm:w-64'}
        flex flex-col overflow-hidden
    `;

    // Handle clicks on links in mobile mode -> close the drawer
    const handleLinkClick = () => {
        if (setIsMobileOpen) setIsMobileOpen(false);
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
            className={sidebarClasses}
        >
            <div className={`p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 h-[73px]`}>
                <div className={`flex items-center gap-3 whitespace-nowrap ${!isExpanded && !isMobileOpen ? 'justify-center w-full max-w-[32px] overflow-hidden' : ''}`}>
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 shrink-0">
                        P
                    </div>
                    <div className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                        <h2 className="text-xl text-slate-900 dark:text-white font-bold tracking-tight">Admin<span className="text-blue-600">Panel</span></h2>
                    </div>
                </div>
                {/* Mobile close button */}
                {(isMobileOpen && setIsMobileOpen) && (
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="sm:hidden p-1.5 -mr-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                <nav className="flex flex-col py-4 space-y-1">
                    <NavLink to="/" end className={linkClasses} onClick={handleLinkClick}>
                        <div className="shrink-0 px-2 flex justify-center w-10"><LayoutDashboard size={20} /></div>
                        <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{t('dashboard')}</span>
                    </NavLink>
                    <NavLink to="/members" className={linkClasses} onClick={handleLinkClick}>
                        <div className="shrink-0 px-2 flex justify-center w-10"><Users size={20} /></div>
                        <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{t('members')}</span>
                    </NavLink>
                    <NavLink to="/leaders" className={linkClasses} onClick={handleLinkClick}>
                        <div className="shrink-0 px-2 flex justify-center w-10"><UsersRound size={20} /></div>
                        <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{t('leaders')}</span>
                    </NavLink>
                    <NavLink to="/content" className={linkClasses} onClick={handleLinkClick}>
                        <div className="shrink-0 px-2 flex justify-center w-10"><ShieldAlert size={20} /></div>
                        <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{t('content_moderation')}</span>
                    </NavLink>
                    <NavLink to="/matrimony" className={linkClasses} onClick={handleLinkClick}>
                        <div className="shrink-0 px-2 flex justify-center w-10"><Heart size={20} /></div>
                        <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{t('matrimony')}</span>
                    </NavLink>
                    <NavLink to="/announcements" className={linkClasses} onClick={handleLinkClick}>
                        <div className="shrink-0 px-2 flex justify-center w-10"><Megaphone size={20} /></div>
                        <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{t('announcements')}</span>
                    </NavLink>
                    <NavLink to="/reels" className={linkClasses} onClick={handleLinkClick}>
                        <div className="shrink-0 px-2 flex justify-center w-10"><Film size={20} /></div>
                        <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>Reels</span>
                    </NavLink>
                    <NavLink to="/live-streams" className={linkClasses} onClick={handleLinkClick}>
                        <div className="shrink-0 px-2 flex justify-center w-10"><Video size={20} /></div>
                        <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>Live Streams</span>
                    </NavLink>
                    <NavLink to="/video-analytics" className={linkClasses} onClick={handleLinkClick}>
                        <div className="shrink-0 px-2 flex justify-center w-10"><BarChart3 size={20} /></div>
                        <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>Video Analytics</span>
                    </NavLink>
                    <NavLink to="/events" className={linkClasses} onClick={handleLinkClick}>
                        <div className="shrink-0 px-2 flex justify-center w-10"><Calendar size={20} /></div>
                        <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{t('events')}</span>
                    </NavLink>
                    <NavLink to="/groups" className={linkClasses} onClick={handleLinkClick}>
                        <div className="shrink-0 px-2 flex justify-center w-10"><UsersRound size={20} /></div>
                        <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{t('groups')}</span>
                    </NavLink>
                    <NavLink to="/notifications" className={linkClasses} onClick={handleLinkClick}>
                        <div className="shrink-0 px-2 flex justify-center w-10"><BellRing size={20} /></div>
                        <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{t('notifications')}</span>
                    </NavLink>
                    <NavLink to="/broadcasts" className={linkClasses} onClick={handleLinkClick}>
                        <div className="shrink-0 px-2 flex justify-center w-10"><Megaphone size={20} /></div>
                        <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>Broadcasts</span>
                    </NavLink>
                    {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin' || user?.role?.toLowerCase() === 'super_admin') && (
                        <NavLink to="/expenses" className={linkClasses} onClick={handleLinkClick}>
                            <div className="shrink-0 px-2 flex justify-center w-10"><Wallet size={20} /></div>
                            <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{t('expense_tracker')}</span>
                        </NavLink>
                    )}
                    <NavLink to="/documents" className={linkClasses} onClick={handleLinkClick}>
                        <div className="shrink-0 px-2 flex justify-center w-10"><FileClock size={20} /></div>
                        <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{t('documents')}</span>
                    </NavLink>
                    <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
                        <NavLink to="/settings" className={linkClasses} onClick={handleLinkClick}>
                            <div className="shrink-0 px-2 flex justify-center w-10"><Settings size={20} /></div>
                            <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{t('settings')}</span>
                        </NavLink>
                        {user?.role === 'super_admin' && (
                            <>
                                <NavLink to="/maker-checker" className={linkClasses} onClick={handleLinkClick}>
                                    <div className="shrink-0 px-2 flex justify-center w-10"><FileClock size={20} /></div>
                                    <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>Approvals</span>
                                </NavLink>
                                <NavLink to="/audit" className={linkClasses} onClick={handleLinkClick}>
                                    <div className="shrink-0 px-2 flex justify-center w-10"><FileClock size={20} /></div>
                                    <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>{t('audit_log')}</span>
                                </NavLink>
                                <NavLink to="/admin-users" className={linkClasses} onClick={handleLinkClick}>
                                    <div className="shrink-0 px-2 flex justify-center w-10"><Shield size={20} /></div>
                                    <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>Admin Users</span>
                                </NavLink>
                            </>
                        )}
                        <a
                            href="https://nikhilaodishapandarasamaja.in"
                            className={`flex items-center gap-3 px-4 py-3.5 transition-colors text-sm font-medium whitespace-nowrap overflow-hidden text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white`}
                        >
                            <div className="shrink-0 px-2 flex justify-center w-10"><Globe size={20} /></div>
                            <span className={`transition-opacity duration-300 ${(isExpanded || isMobileOpen) ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>Website Home</span>
                        </a>
                    </div>
                </nav>
            </div>
            
            {/* Legal Links */}
            {(isExpanded || isMobileOpen) && (
                <div className="px-6 py-2 flex items-center justify-center gap-4 text-[10px] text-slate-500 border-t border-slate-100 dark:border-slate-800">
                    <a href="https://nikhilaodishapandarasamaja.in/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">Privacy Policy</a>
                    <span>•</span>
                    <a href="https://nikhilaodishapandarasamaja.in/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500">Terms of Service</a>
                </div>
            )}

            <div className={`p-4 border-t border-slate-100 dark:border-slate-800 space-y-2 flex flex-col ${(isExpanded || isMobileOpen) ? '' : 'items-center'}`}>
                <a
                    href="/portal"
                    className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl transition-colors ${(isExpanded || isMobileOpen) ? 'px-4 w-full' : 'w-10 h-10 px-0'}`}
                    title="Switch to Member Portal"
                >
                    <Globe size={18} />
                    {(isExpanded || isMobileOpen) && <span>Member Portal</span>}
                </a>
                <button
                    onClick={toggleDarkMode}
                    className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-colors ${(isExpanded || isMobileOpen) ? 'px-4 w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700' : 'w-10 h-10 px-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    title="Toggle Dark Mode"
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    {(isExpanded || isMobileOpen) && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
                </button>
                <button
                    onClick={toggleLanguage}
                    className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl transition-colors ${(isExpanded || isMobileOpen) ? 'px-4 w-full' : 'w-10 h-10 px-0'}`}
                    title="Toggle Language"
                >
                    <Languages size={18} />
                    {(isExpanded || isMobileOpen) && <span>{i18n.language === 'en' ? 'ଓଡ଼ିଆ' : 'English'}</span>}
                </button>
                <button
                    onClick={handleLogout}
                    className={`flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-colors ${(isExpanded || isMobileOpen) ? 'px-4 w-full' : 'w-10 h-10 px-0'}`}
                    title="Sign Out"
                >
                    <LogOut size={18} />
                    {(isExpanded || isMobileOpen) && <span>Sign Out</span>}
                </button>
            </div>
        </aside >
    );
}
