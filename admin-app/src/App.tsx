import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import Sidebar from './components/Sidebar';
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
import Leaders from './pages/Leaders';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="w-20 shrink-0 hidden sm:block"></div>
      <Sidebar />
      <main className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900 relative">
        {children}
      </main>
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
          <Route path="/audit" element={<ProtectedRoute><Layout><AuditLog /></Layout></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><Layout><Reviews /></Layout></ProtectedRoute>} />
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}
