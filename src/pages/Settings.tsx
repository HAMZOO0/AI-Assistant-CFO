import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon,
  User, 
  Database,
  Bell,
  Shield,
  Download,
  Upload,
  Trash2,
  Save,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';

interface SettingsState {
  profile: {
    name: string;
    email: string;
    role: string;
    company: string;
    phone: string;
  };
  preferences: {
    theme: string;
    language: string;
    timezone: string;
    currency: string;
    dateFormat: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
      weeklyReports: boolean;
      monthlyReports: boolean;
      alerts: boolean;
    };
  };
  data: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionPeriod: string;
    exportFormat: string;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
    loginAttempts: number;
  };
}

const Settings: React.FC = () => {
  const { clearAllData, getCleanupStatus } = useApp();
  const [activeTab, setActiveTab] = useState('profile');
  const [cleanupStatus, setCleanupStatus] = useState<any>(null);

  const [settings, setSettings] = useState<SettingsState>({
    profile: {
      name: 'John Doe',
      email: 'john.doe@company.com',
      role: 'CFO',
      company: 'TechCorp Inc.',
      phone: '+1 (555) 123-4567'
    },
    preferences: {
      theme: 'light',
      language: 'en',
      timezone: 'UTC-5',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
    notifications: {
      email: true,
      push: true,
        sms: false,
        weeklyReports: true,
        monthlyReports: true,
        alerts: true
      }
    },
    data: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionPeriod: '1 year',
      exportFormat: 'excel'
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginAttempts: 5
    }
  });

  const handleSettingChange = (section: keyof SettingsState, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleNestedSettingChange = (section: keyof SettingsState, parentKey: string, childKey: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [parentKey]: {
          ...(prev[section] as any)[parentKey],
          [childKey]: value
        }
      }
    }));
  };

  const saveSettings = () => {
    toast.success('Settings saved successfully!');
  };

  const exportData = () => {
    toast.success('Data export started. You will receive an email when ready.');
  };

  const importData = () => {
    toast.success('Data import completed successfully!');
  };

  const clearData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      await clearAllData();
    }
  };

  const checkCleanupStatus = async () => {
    const status = await getCleanupStatus();
    setCleanupStatus(status);
  };

  // Check cleanup status on mount
  useEffect(() => {
    checkCleanupStatus();
  }, []);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and system configuration</p>
        </div>
        <button onClick={saveSettings} className="btn-primary">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={settings.profile.name}
                    onChange={(e) => handleSettingChange('profile', 'name', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={settings.profile.email}
                    onChange={(e) => handleSettingChange('profile', 'email', e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <input
                    type="text"
                  value={settings.profile.role}
                    onChange={(e) => handleSettingChange('profile', 'role', e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={settings.profile.company}
                    onChange={(e) => handleSettingChange('profile', 'company', e.target.value)}
                  className="input-field"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={settings.profile.phone}
                    onChange={(e) => handleSettingChange('profile', 'phone', e.target.value)}
                  className="input-field"
                />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Settings */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Display & Language</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <select
                    value={settings.preferences.theme}
                    onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                  className="input-field"
                >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                    value={settings.preferences.language}
                    onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                  className="input-field"
                >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select
                    value={settings.preferences.timezone}
                    onChange={(e) => handleSettingChange('preferences', 'timezone', e.target.value)}
                  className="input-field"
                >
                    <option value="UTC-5">Eastern Time (UTC-5)</option>
                    <option value="UTC-6">Central Time (UTC-6)</option>
                    <option value="UTC-7">Mountain Time (UTC-7)</option>
                    <option value="UTC-8">Pacific Time (UTC-8)</option>
                </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                <select
                    value={settings.preferences.currency}
                    onChange={(e) => handleSettingChange('preferences', 'currency', e.target.value)}
                  className="input-field"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Management Settings */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Auto Backup</label>
                    <select
                      value={settings.data.backupFrequency}
                      onChange={(e) => handleSettingChange('data', 'backupFrequency', e.target.value)}
                      className="input-field"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Retention Period</label>
                    <select
                      value={settings.data.retentionPeriod}
                      onChange={(e) => handleSettingChange('data', 'retentionPeriod', e.target.value)}
                      className="input-field"
                    >
                      <option value="30 days">30 days</option>
                      <option value="6 months">6 months</option>
                      <option value="1 year">1 year</option>
                      <option value="2 years">2 years</option>
                    </select>
                  </div>
                </div>
                
                {/* Data Status */}
                {cleanupStatus && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Current Data Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Database Records:</span>
                        <span className="ml-2 text-gray-600">
                          {cleanupStatus.status?.database?.uploadedFiles || 0} files
                        </span>
              </div>
                <div>
                        <span className="font-medium">Uploaded Files:</span>
                        <span className="ml-2 text-gray-600">
                          {cleanupStatus.status?.files?.uploadedFiles || 0} files
                        </span>
                </div>
                      <div>
                        <span className="font-medium">Total Data:</span>
                        <span className="ml-2 text-gray-600">
                          {cleanupStatus.status?.totalData || 0} items
                        </span>
              </div>
                <div>
                        <span className="font-medium">Status:</span>
                        <span className={`ml-2 ${cleanupStatus.status?.totalData > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                          {cleanupStatus.status?.totalData > 0 ? 'Has Data' : 'No Data'}
                        </span>
                      </div>
                </div>
              </div>
                )}
                
                <div className="flex items-center space-x-4">
                  <button onClick={exportData} className="btn-secondary">
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </button>
                  <button onClick={importData} className="btn-secondary">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </button>
                  <button onClick={clearData} className="btn-danger">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                  </button>
                  <button onClick={checkCleanupStatus} className="btn-secondary">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                </div>
                  <button className="btn-primary">
                    {settings.security.twoFactorAuth ? 'Disable' : 'Enable'} 2FA
                  </button>
              </div>
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                    <input
                      type="number"
                  value={settings.security.sessionTimeout}
                      onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  className="input-field"
                      min="5"
                      max="480"
                    />
              </div>
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Password Expiry (days)</label>
                    <input
                      type="number"
                  value={settings.security.passwordExpiry}
                      onChange={(e) => handleSettingChange('security', 'passwordExpiry', parseInt(e.target.value))}
                  className="input-field"
                      min="30"
                      max="365"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                      checked={settings.preferences.notifications.email}
                      onChange={(e) => handleNestedSettingChange('preferences', 'notifications', 'email', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
                <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium text-gray-900">Push Notifications</h4>
                    <p className="text-sm text-gray-600">Receive push notifications in browser</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                      checked={settings.preferences.notifications.push}
                      onChange={(e) => handleNestedSettingChange('preferences', 'notifications', 'push', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
                <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-medium text-gray-900">Weekly Reports</h4>
                    <p className="text-sm text-gray-600">Receive weekly financial reports</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.preferences.notifications.weeklyReports}
                      onChange={(e) => handleNestedSettingChange('preferences', 'notifications', 'weeklyReports', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Monthly Reports</h4>
                    <p className="text-sm text-gray-600">Receive monthly financial reports</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                      checked={settings.preferences.notifications.monthlyReports}
                      onChange={(e) => handleNestedSettingChange('preferences', 'notifications', 'monthlyReports', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              
                <div className="flex items-center justify-between">
              <div>
                    <h4 className="font-medium text-gray-900">Financial Alerts</h4>
                    <p className="text-sm text-gray-600">Receive alerts for important financial events</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.preferences.notifications.alerts}
                      onChange={(e) => handleNestedSettingChange('preferences', 'notifications', 'alerts', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings; 