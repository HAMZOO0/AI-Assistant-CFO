import React, { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  AlertTriangle, 
  TrendingUp, 
  Bell,
  Search,
  CheckCircle,
  ArrowRight,
  Settings
} from 'lucide-react';
import { AIInsight } from '../types';
import InsightCard from '../components/InsightCard';
import api, { aiService, financialService, insightsService } from '../services/api';
import toast from 'react-hot-toast';

const Insights: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      // Load insights from database
      const response = await insightsService.getInsights();
      if (response.data) {
        setInsights(response.data);
      } else {
        setInsights([]);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
      setInsights([]);
    }
  };

  const markAsRead = (insightId: string) => {
    setInsights(prev => 
      prev.map(insight => 
        insight.id === insightId 
          ? { ...insight, actionable: false }
          : insight
      )
    );
    toast.success('Insight marked as read');
  };

  const getFilteredInsights = () => {
    let filtered = insights;

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(insight => insight.type === filter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(insight => 
        insight.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        insight.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getInsightStats = () => {
    const total = insights.length;
    const critical = insights.filter(i => i.severity === 'critical').length;
    const high = insights.filter(i => i.severity === 'high').length;
    const actionable = insights.filter(i => i.actionable).length;

    return { total, critical, high, actionable };
  };

  const stats = getInsightStats();
  const filteredInsights = getFilteredInsights();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-gray-600">Real-time AI-powered financial insights and alerts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowSettings(true)}
            className="btn-secondary"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
          <button className="btn-primary">
            <Bell className="w-4 h-4 mr-2" />
            Configure Alerts
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Insights</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-danger-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Critical Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.critical}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">{stats.high}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Actionable</p>
              <p className="text-2xl font-bold text-gray-900">{stats.actionable}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Insights & Alerts</h3>
          <div className="flex items-center space-x-3">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="all">All Types</option>
              <option value="anomaly">Anomalies</option>
              <option value="trend">Trends</option>
              <option value="recommendation">Recommendations</option>
              <option value="alert">Alerts</option>
            </select>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search insights..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredInsights.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No insights match your current filters</p>
            </div>
          ) : (
            filteredInsights.map((insight) => (
              <div key={insight.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <InsightCard insight={insight} />
                  {insight.actionable && (
                    <div className="flex items-center space-x-2 ml-4">
                      <button 
                        onClick={() => markAsRead(insight.id)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Mark as Read
                      </button>
                      <button className="text-xs text-gray-400 hover:text-gray-600">
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Analysis Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent AI Analysis</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Data Processing Complete</p>
                <p className="text-sm text-green-700">All financial data analyzed for patterns</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Trend Analysis Updated</p>
                <p className="text-sm text-blue-700">Revenue and expense trends recalculated</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-warning-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-warning-600" />
              <div>
                <p className="font-medium text-warning-800">Anomaly Detection Active</p>
                <p className="text-sm text-warning-700">Monitoring for unusual patterns</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insight Categories</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Revenue Insights</span>
              <span className="text-sm text-gray-500">2 active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Expense Alerts</span>
              <span className="text-sm text-gray-500">1 active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Cash Flow Warnings</span>
              <span className="text-sm text-gray-500">1 active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Efficiency Tips</span>
              <span className="text-sm text-gray-500">1 active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Compliance Issues</span>
              <span className="text-sm text-gray-500">1 active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Alert Settings</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700">Critical alerts</span>
                </label>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700">High priority alerts</span>
                </label>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700">Trend notifications</span>
                </label>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">Weekly summaries</span>
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button 
                onClick={() => setShowSettings(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button className="btn-primary">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Insights; 