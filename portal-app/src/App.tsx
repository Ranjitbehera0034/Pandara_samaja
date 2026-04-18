import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import {
  Home, Users, Image as ImageIcon, MessageSquare, Menu, Bell, Loader2, LogOut,
  User, Search, Compass, Settings, X, ChevronsLeft, ChevronsRight, Globe,
  UsersRound, Calendar, Radio, Megaphone, Heart, Crown, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';

import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Login from './pages/Login';
import Feed from './pages/Feed';
import Chat from './pages/Chat';
import Members from './pages/Members';
import Gallery from './pages/Gallery';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import SettingsPage from './pages/Settings';
import Explore from './pages/Explore';
import Groups from './pages/Groups';
import Events from './pages/Events';
import MemberProfile from './pages/MemberProfile';
import LiveStream from './pages/LiveStream';
import FamilyTree from './pages/FamilyTree';
import FamilyAlbums from './pages/FamilyAlbums';
import FamilyEvents from './pages/FamilyEvents';
import FamilyLogin from './pages/FamilyLogin';
import Matrimony from './pages/Matrimony';
import Announcements from './pages/Announcements';
import Leaders from './pages/Leaders';
import { GlobalSearch } from './components/GlobalSearch';

import { PORTAL_API_URL } from './config/apiConfig';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ScrollToTop } from './components/ScrollToTop';

// ─── Protected Layout ────────────────────────────────────────────
function ProtectedLayout() {
  const { member, user, logout, isLoading } = useAuth();
  const { settings } = useSettings();
  const { t, lang, setLang } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const location = useLocation();

  const hasAdminAccess = localStorage.getItem('adminToken') !== null;

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Search logic (omitted)

  useEffect(() => {
    if (member) {
      const fetchUnread = async () => {
        try {
          const token = localStorage.getItem('portalToken');
          const res = await fetch(`${PORTAL_API_URL}/notifications/unread-count`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setUnreadNotifications(data.count);
          }
        } catch (e) {
          console.error("Failed to fetch unread count", e);
        }
      };

      fetchUnread();
      const interval = setInterval(fetchUnread, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [member]);

  // Persist collapse state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  }, [collapsed]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-blue-500">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (!member) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const getInitial = (name?: string | null) => name ? name.charAt(0).toUpperCase() : '?';
  const displayName = user?.name || member?.name || t('nav', 'profile');
  const isFemaleUser = ['female', 'f'].includes((user?.gender || '').toLowerCase());
  const userPhotoUrl = user?.profile_photo_url || null;
  const cleanPhoto = (url?: string | null) => {
    if (!url) return null;
    if (url.includes('drive.google.com/uc?id=')) return url.replace('drive.google.com/uc?id=', 'lh3.googleusercontent.com/d/');
    return url;
  };
  const cleanedUserPhoto = cleanPhoto(userPhotoUrl);

  const navLinks = [
    { to: '/', icon: <Home size={20} />, label: t('nav', 'home') },
    { to: '/announcements', icon: <Megaphone size={20} />, label: 'Updates' },
    { to: '/leaders', icon: <Crown size={20} />, label: 'Leaders' },
    { to: '/explore', icon: <Compass size={20} />, label: t('nav', 'explore') },
    { to: '/matrimony', icon: <Heart size={20} />, label: 'Matrimony' },
    { to: '/live', icon: <Radio size={20} />, label: 'Live' },
    { to: '/groups', icon: <UsersRound size={20} />, label: t('nav', 'groups') },
    { to: '/events', icon: <Calendar size={20} />, label: t('nav', 'events') },
    { to: '/chat', icon: <MessageSquare size={20} />, label: t('nav', 'messages') },
    { to: '/notifications', icon: <Bell size={20} />, label: t('nav', 'notifications'), badge: unreadNotifications > 0 ? unreadNotifications : undefined },
    { to: '/members', icon: <Users size={20} />, label: t('nav', 'members') },
    { to: '/gallery', icon: <ImageIcon size={20} />, label: t('nav', 'gallery') },
    { to: '/profile', icon: <User size={20} />, label: t('nav', 'profile') },
    { to: '/settings', icon: <Settings size={20} />, label: t('nav', 'settings') },
    { to: 'https://nikhilaodishapandarasamaja.in', isExternal: true, icon: <Globe size={20} />, label: 'Website Home' },
  ];

  if (hasAdminAccess) {
    navLinks.push({ to: '/admin', isExternal: true, icon: <Shield size={20} />, label: 'Switch to Admin Panel' });
  }

  const closeMobileSidebar = () => setSidebarOpen(false);

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden font-sans ${settings.compactMode ? 'text-[13px]' : ''}`}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileSidebar}
            className="fixed inset-0 z-20 bg-black/60 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* ─── Sidebar ─── */}
      <aside
        className={`
                    fixed md:static z-30 h-full
                    bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700/80
                    flex flex-col
                    transition-all duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0
                    ${collapsed ? 'w-[68px]' : 'w-64'}
                `}
      >
        {/* Logo row */}
        <div className={`flex items-center border-b border-slate-100 dark:border-slate-700/50 shrink-0 ${collapsed ? 'justify-center p-3' : 'justify-between p-4'}`}>
          {collapsed ? (
            <Link to="/" className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-900/30" onClick={closeMobileSidebar}>
              P
            </Link>
          ) : (
            <>
              <Link to="/" className="flex items-center gap-3" onClick={closeMobileSidebar}>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold shadow-lg shadow-blue-900/30 shrink-0">
                  P
                </div>
                <div className="overflow-hidden">
                  <h1 className="font-bold text-base tracking-tight leading-none whitespace-nowrap">{t('common', 'appName')}</h1>
                  <span className="text-[10px] text-slate-400 font-medium tracking-widest whitespace-nowrap">{t('common', 'appTagline')}</span>
                </div>
              </Link>
              <button onClick={closeMobileSidebar} className="md:hidden p-1 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </>
          )}
        </div>

        {/* Nav links */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden ${collapsed ? 'p-2 space-y-1' : 'p-3 space-y-0.5'}`}>
          {navLinks.map(link => {
            const isActive = location.pathname === link.to;
            const content = (
              <>
                <span className="shrink-0 relative">
                  {link.icon}
                  {link.badge && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold">
                      {link.badge}
                    </span>
                  )}
                </span>
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">{link.label}</span>
                )}
                {/* Tooltip on collapsed hover */}
                {collapsed && (
                  <span className="
                    absolute left-full ml-3 px-2.5 py-1 bg-slate-700 text-white text-xs font-medium rounded-lg shadow-xl
                    opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50
                  ">
                    {link.label}
                  </span>
                )}
              </>
            );

            const className = `
              flex items-center rounded-xl transition-all duration-200 relative group
              ${collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'}
              ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 font-semibold'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }
            `;

            if (link.isExternal) {
              return (
                <a
                  key={link.to}
                  href={link.to}
                  title={collapsed ? link.label : undefined}
                  className={className}
                >
                  {content}
                </a>
              );
            }

            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMobileSidebar}
                title={collapsed ? link.label : undefined}
                className={className}
              >
                {content}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden md:block px-2 py-2 border-t border-slate-700/30">
          <button
            onClick={() => setCollapsed(c => !c)}
            className={`
                            flex items-center gap-2 w-full rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all
                            ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2'}
                        `}
            title={collapsed ? t('common', 'expand') : t('common', 'collapse')}
          >
            {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            {!collapsed && <span className="text-xs font-medium">{t('common', 'collapse')}</span>}
          </button>
        </div>

        {/* Legal links */}
        {!collapsed && (
          <div className="px-6 py-2 flex items-center justify-center gap-4 text-[10px] text-slate-500 border-t border-slate-700/30">
            <a href="https://nikhilaodishapandarasamaja.in/privacy.html" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Privacy</a>
            <span>•</span>
            <a href="https://nikhilaodishapandarasamaja.in/terms.html" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">Terms</a>
          </div>
        )}

        {/* User card */}
        <div className={`border-t border-slate-100 dark:border-slate-700/50 ${collapsed ? 'p-2' : 'p-3'}`}>
          <Link
            to="/profile"
            onClick={closeMobileSidebar}
            className={`flex items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${collapsed ? 'justify-center p-2' : 'gap-2.5 px-2.5 py-2'}`}
            title={collapsed ? displayName : undefined}
          >
            <div className={`relative w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ${isFemaleUser ? 'ring-pink-500/50' : 'ring-blue-500/50'}`}>
              {cleanedUserPhoto ? (
                <img src={cleanedUserPhoto} referrerPolicy="no-referrer" alt={displayName} className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div className={`w-full h-full flex items-center justify-center font-bold text-white text-sm ${isFemaleUser ? 'bg-gradient-to-br from-rose-500 to-pink-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                  {getInitial(displayName)}
                </div>
              )}
              {/* Active session green dot */}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-400 ring-1 ring-slate-800" />
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={displayName}>{displayName}</div>
                <div className="text-[10px] text-slate-500">#{member?.membership_no} {user?.relation ? `• ${user.relation}` : ''}</div>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={logout}
              className="flex items-center gap-2.5 w-full px-3 py-2 mt-1 rounded-xl hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-400 transition-colors"
            >
              <LogOut size={16} />
              <span className="text-xs font-medium">{t('common', 'logout')}</span>
            </button>
          )}
          {collapsed && (
            <button
              onClick={logout}
              className="flex justify-center w-full p-2 mt-1 rounded-xl hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-400 transition-colors"
              title={t('common', 'logout')}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        {/* Header */}
        <header className="h-14 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/80 flex items-center px-4 md:px-6 z-10 shrink-0 transition-colors">
          <button className="md:hidden p-2 -ml-1 text-slate-400 hover:text-white mr-3" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>

          <div className="hidden md:flex items-center flex-1 max-w-lg">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="md:hidden p-2 text-slate-400 hover:text-white">
              <Search size={20} />
            </button>

            <Link to="/notifications" className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </Link>

            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'od' : 'en')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              title={lang === 'en' ? 'Switch to ଓଡ଼ିଆ' : 'Switch to English'}
            >
              <Globe size={16} />
              <span className="text-xs font-semibold">{lang === 'en' ? 'ଓଡ଼ିଆ' : 'EN'}</span>
            </button>

            <div className="hidden sm:block w-px h-6 bg-slate-700"></div>

            <Link to="/profile" className="flex items-center gap-2.5">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-semibold text-white leading-tight">{displayName}</div>
                <div className="text-[11px] text-slate-500">#{member?.membership_no}</div>
              </div>
              <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${isFemaleUser ? 'border-pink-500' : 'border-blue-500'} shrink-0 flex items-center justify-center font-bold text-xs text-white`}>
                {cleanedUserPhoto ? (
                  <img src={cleanedUserPhoto} referrerPolicy="no-referrer" alt={displayName} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${isFemaleUser ? 'bg-gradient-to-br from-rose-500 to-pink-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                    {getInitial(displayName)}
                  </div>
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Page */}
        <main id="main-scroll-container" className={`flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 scroll-smooth ${settings.compactMode ? 'text-sm' : ''}`}>
          <ScrollToTop containerId="main-scroll-container" />
          <div className={`max-w-5xl mx-auto px-4 ${settings.compactMode ? 'py-3' : 'py-6'}`}>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Feed />} />
                <Route path="/feed" element={<Navigate to="/" replace />} />
                <Route path="/dashboard" element={<Navigate to="/" replace />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/leaders" element={<Leaders />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/matrimony" element={<Matrimony />} />
                <Route path="/live" element={<LiveStream />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/events" element={<Events />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/members" element={<Members />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:id" element={<MemberProfile />} />
                <Route path="/family/tree" element={<FamilyTree />} />
                <Route path="/family/albums" element={<FamilyAlbums />} />
                <Route path="/family/events" element={<FamilyEvents />} />
                <Route path="/family/logins" element={<FamilyLogin />} />
                <Route path="/settings" element={<SettingsPage />} />
                {/* Fallback Catch-all -> Redirect to Feed to prevent blank pages on mistyped hashes */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}

import { CookieConsent } from './components/CookieConsent';

// ─── App ─────────────────────────────────────────────────────────
function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <SettingsProvider>
          <LanguageProvider>
            <Toaster position="top-center" theme="dark" richColors closeButton />
            <CookieConsent />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<ProtectedLayout />} />
            </Routes>
          </LanguageProvider>
        </SettingsProvider>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
