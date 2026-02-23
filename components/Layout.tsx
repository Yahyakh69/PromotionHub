import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Tag, 
  Calculator, 
  Plane,
  Menu,
  X,
  LogOut,
  Shield
} from 'lucide-react';
import { authService } from '../services/authService';

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({ to, icon: Icon, label, onClick }: { to: string; icon: any; label: string; onClick?: () => void }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        isActive 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`
    }
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </NavLink>
);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 px-4 py-3 flex items-center justify-between">
         <div className="flex items-center space-x-2">
          <Plane className="text-blue-600" size={24} />
          <span className="font-bold text-gray-900 text-lg">DJI PromoHub</span>
        </div>
        <button 
          onClick={toggleMobileMenu}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg focus:outline-none"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:block
        `}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center space-x-2 border-b border-gray-100 hidden md:flex">
            <Plane className="text-blue-600" size={28} />
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">PromoHub</h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider">DJI Distributor</p>
            </div>
          </div>

          {/* Mobile Sidebar Header */}
          <div className="p-4 flex items-center justify-between border-b border-gray-100 md:hidden">
             <span className="font-bold text-gray-900">Menu</span>
             <button onClick={closeMobileMenu} className="p-1 text-gray-500"><X size={20} /></button>
          </div>
          
          <nav className="p-4 space-y-2 flex-1 overflow-y-auto mt-2 md:mt-4">
            <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={closeMobileMenu} />
            <NavItem to="/admin/partners" icon={Users} label="Partners" onClick={closeMobileMenu} />
            <NavItem to="/admin/users" icon={Shield} label="User Accounts" onClick={closeMobileMenu} />
            <NavItem to="/admin/inventory" icon={Package} label="Inventory & SKUs" onClick={closeMobileMenu} />
            <NavItem to="/admin/promotions" icon={Tag} label="Promotions" onClick={closeMobileMenu} />
            <NavItem to="/admin/rebates" icon={Calculator} label="Rebates & Reports" onClick={closeMobileMenu} />
          </nav>

          <div className="p-4 border-t border-gray-100">
             <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
             >
                <LogOut size={16} />
                <span>Sign Out</span>
             </button>
             <div className="text-xs text-center text-gray-400 mt-4">
               v1.4.0 &copy; 2024
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full md:ml-64 p-4 md:p-8 pt-20 md:pt-8 min-h-screen">
        {children}
      </main>
    </div>
  );
};