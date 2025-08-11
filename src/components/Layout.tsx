import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Upload, 
  TrendingUp, 
  FileText, 
  Lightbulb, 
  Settings,
  Menu,
  X,
  User,
  Bell,
  Trash2,
  Target
} from 'lucide-react';
import { NavItem } from '../types';
import { useApp } from '../context/AppContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { clearAllData } = useApp();

  const navigation: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', path: '/', icon: 'BarChart3' },
    { id: 'data-integration', label: 'Data Integration', path: '/data-integration', icon: 'Upload' },
    { id: 'forecasting', label: 'Forecasting', path: '/forecasting', icon: 'TrendingUp' },
    { id: 'reports', label: 'Reports', path: '/reports', icon: 'FileText' },
    { id: 'insights', label: 'AI Insights', path: '/insights', icon: 'Lightbulb' },
    { id: 'budget-variance', label: 'Budget Variance', path: '/budget-variance', icon: 'Target' },
    { id: 'settings', label: 'Settings', path: '/settings', icon: 'Settings' },
  ];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'BarChart3': return <BarChart3 className="w-5 h-5" />;
      case 'Upload': return <Upload className="w-5 h-5" />;
      case 'TrendingUp': return <TrendingUp className="w-5 h-5" />;
      case 'FileText': return <FileText className="w-5 h-5" />;
      case 'Lightbulb': return <Lightbulb className="w-5 h-5" />;
      case 'Target': return <Target className="w-5 h-5" />;
      case 'Settings': return <Settings className="w-5 h-5" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  // Handler for delete all data
  const handleDeleteAllData = async () => {
    if (window.confirm('Are you sure you want to delete ALL data? This will remove all database records and uploaded files. This action cannot be undone!')) {
      await clearAllData();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="ml-3 text-xl font-semibold text-gray-900">AI CFO</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {getIcon(item.icon)}
                  <span className="ml-3">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-4">
              {/* Delete All Data Button */}
              <button
                onClick={handleDeleteAllData}
                className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow transition"
                title="Delete all data from database and uploaded files"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete All Data
              </button>
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-danger-500"></span>
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-sm">
                  <p className="text-gray-900 font-medium">Sarah Johnson</p>
                  <p className="text-gray-500">CFO, TechCorp Inc.</p>
                </div>
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout; 