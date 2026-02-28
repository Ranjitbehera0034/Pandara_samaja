import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import Sidebar from './components/Sidebar';
import { Menu } from 'lucide-react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Matrimony from './pages/Matrimony';
import Posts from './pages/Posts';
import Reviews from './pages/Reviews';
import ContentModeration from './pages/ContentModeration';
import Events from './pages/Events';
import Groups from './pages/Groups';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import AuditLog from './pages/AuditLog';
import MakerChecker from './pages/MakerChecker';
import Leaders from './pages/Leaders';
import AdminUsers from './pages/AdminUsers';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="w-20 shrink-0 hidden sm:block"></div>

      <Sidebar isMobileOpen={mobileMenuOpen} setIsMobileOpen={setMobileMenuOpen} />

      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-900 relative h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="sm:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">P</div>
            <h1 className="text-xl font-bold">AdminPanel</h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -mr-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 sm:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <Toaster position="top-right" closeButton richColors />
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Layout><Members /></Layout></ProtectedRoute>} />
          <Route path="/content" element={<ProtectedRoute><Layout><ContentModeration /></Layout></ProtectedRoute>} />
          <Route path="/matrimony" element={<ProtectedRoute><Layout><Matrimony /></Layout></ProtectedRoute>} />
          <Route path="/announcements" element={<ProtectedRoute><Layout><Posts /></Layout></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><Layout><Events /></Layout></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><Layout><Groups /></Layout></ProtectedRoute>} />
          <Route path="/leaders" element={<ProtectedRoute><Layout><Leaders /></Layout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
          <Route path="/maker-checker" element={<ProtectedRoute><Layout><MakerChecker /></Layout></ProtectedRoute>} />
          <Route path="/audit" element={<ProtectedRoute><Layout><AuditLog /></Layout></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><Layout><Reviews /></Layout></ProtectedRoute>} />
          <Route path="/admin-users" element={<ProtectedRoute><Layout><AdminUsers /></Layout></ProtectedRoute>} />
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}
