import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PortalLayout } from './components/PortalLayout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Partners } from './pages/Partners';
import { Promotions } from './pages/Promotions';
import { Rebates } from './pages/Rebates';
import { UsersPage } from './pages/Users';
import { Login } from './pages/Login';
import { PartnerDashboard } from './pages/portal/PartnerDashboard';
import { authService } from './services/authService';

interface RouteGuardProps {
  children: React.ReactNode;
}

// Guard for Admin Routes
const AdminRoute: React.FC<RouteGuardProps> = ({ children }) => {
  const user = authService.getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

// Guard for Partner Routes
const PartnerRoute: React.FC<RouteGuardProps> = ({ children }) => {
  const user = authService.getCurrentUser();
  if (!user || user.role !== 'PARTNER') {
    return <Navigate to="/login" replace />;
  }
  return <PortalLayout>{children}</PortalLayout>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="/admin/inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
        <Route path="/admin/partners" element={<AdminRoute><Partners /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
        <Route path="/admin/promotions" element={<AdminRoute><Promotions /></AdminRoute>} />
        <Route path="/admin/rebates" element={<AdminRoute><Rebates /></AdminRoute>} />

        {/* Partner Portal Routes */}
        <Route path="/portal/dashboard" element={<PartnerRoute><PartnerDashboard /></PartnerRoute>} />

        {/* Default Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;