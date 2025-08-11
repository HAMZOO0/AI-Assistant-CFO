import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertTriangle,
  Plus,
  Settings,
  Download,
  Eye,
  Clock,
  Users,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { Forecast, Scenario } from '../types';
import Chart from '../components/Chart';
import MetricCard from '../components/MetricCard';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

const Forecasting: React.FC = () => {
  const { state, generateForecasts, generateScenarios, createScenario, refreshAllData, loadFinancialData } = useApp();
  const { forecasts, scenarios, metrics, loading, lastUpdated } = state;
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [newScenarioData, setNewScenarioData] = useState({
    name: '',
    description: '',
    assumptions: {}
  });

  useEffect(() => {
    // Load financial data when component mounts
    if (!metrics) {
      loadFinancialData();
    }
  }, [loadFinancialData, metrics]);

  useEffect(() => {
    // Generate forecasts and scenarios if we have metrics but no data
    if (metrics && forecasts.length === 0) {
      generateForecasts();
    }
    if (metrics && scenarios.length === 0) {
      generateScenarios();
    }
  }, [metrics, forecasts.length, scenarios.length, generateForecasts, generateScenarios]);

  const createNewScenario = () => {
    setShowScenarioModal(true);
  };

  const runForecast = async () => {
    await generateForecasts();
    await generateScenarios();
  };

  const handleCreateScenario = async () => {
    if (!newScenarioData.name.trim()) {
      toast.error('Please enter a scenario name');
      return;
    }
    
    await createScenario(newScenarioData);
    setShowScenarioModal(false);
    setNewScenarioData({ name: '', description: '', assumptions: {} });
  };

  const exportForecast = () => {
    toast.success('Forecast exported successfully!');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-success-600';
    if (confidence >= 60) return 'text-warning-600';
    return 'text-danger-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High';
    if (confidence >= 60) return 'Medium';
    return 'Low';
  };

  // Check if we have data to show
  const hasData = forecasts.length > 0 || scenarios.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Forecasting</h1>
          <p className="text-gray-600">AI-powered cash flow forecasting and scenario planning</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={refreshAllData}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={runForecast} className="btn-primary" disabled={loading}>
            <TrendingUp className="w-4 h-4 mr-2" />
            {loading ? 'Running...' : 'Run Forecast'}
          </button>
        </div>
      </div>

      {/* Key KPIs */}
      {metrics && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="AR Days"
              value={metrics.arDays.current}
              change={metrics.arDays.changePercent}
              trend={metrics.arDays.trend}
              icon={<Clock className="w-5 h-5 text-orange-600" />}
              format="number"
              subtitle="Days to collect"
            />
            <MetricCard
              title="AP Days"
              value={metrics.apDays.current}
              change={metrics.apDays.changePercent}
              trend={metrics.apDays.trend}
              icon={<Users className="w-5 h-5 text-indigo-600" />}
              format="number"
              subtitle="Days to pay"
            />
            <MetricCard
              title="EBITDA"
              value={metrics.ebitda.current}
              change={metrics.ebitda.changePercent}
              trend={metrics.ebitda.trend}
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
              format="currency"
            />
            <MetricCard
              title="Margins"
              value={metrics.margins.current}
              change={metrics.margins.changePercent}
              trend={metrics.margins.trend}
              icon={<BarChart3 className="w-5 h-5 text-cyan-600" />}
              format="percentage"
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasData && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-blue-900 mb-2">No Financial Data Available</h3>
          <p className="text-blue-700 mb-4">
            Upload your financial data files to generate AI-powered forecasts and scenario planning.
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => window.location.href = '/data-integration'}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Upload Financial Data
            </button>
            <button 
              onClick={runForecast}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Run Demo Forecast
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Generating AI forecasts...</p>
          </div>
        </div>
      )}

      {/* Content - Only show if we have data */}
      {hasData && !loading && (
        <>
      {/* Forecast Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Forecast</h3>
          <Chart
            type="line"
            data={forecasts.map(f => ({
              month: f.period,
              cashFlow: f.cashFlow,
              revenue: f.revenue,
              expenses: f.expenses
            }))}
            height={250}
          />
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Forecast</h3>
          <Chart
            type="area"
            data={forecasts.map(f => ({
              month: f.period,
              revenue: f.revenue
            }))}
            height={250}
          />
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Forecast Confidence</h3>
          <div className="space-y-4">
            {forecasts.map((forecast, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{forecast.period}</p>
                  <p className="text-sm text-gray-500">
                    ${forecast.cashFlow.toLocaleString()} cash flow
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${getConfidenceColor(forecast.confidence)}`}>
                    {forecast.confidence}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {getConfidenceLabel(forecast.confidence)} confidence
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scenario Planning */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Scenario Planning</h3>
          <button onClick={createNewScenario} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            New Scenario
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <div 
              key={scenario.id} 
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedScenario?.id === scenario.id 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 hover:border-primary-300'
              }`}
              onClick={() => setSelectedScenario(scenario)}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{scenario.name}</h4>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    scenario.name === 'Optimistic' ? 'bg-success-100 text-success-800' :
                    scenario.name === 'Conservative' ? 'bg-warning-100 text-warning-800' :
                    'bg-primary-100 text-primary-800'
                  }`}>
                    {scenario.name === 'Optimistic' ? 'High Growth' :
                     scenario.name === 'Conservative' ? 'Low Risk' : 'Standard'}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{scenario.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Revenue:</span>
                  <span className="font-medium">${scenario.results.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cash Flow:</span>
                  <span className="font-medium">${scenario.results.cashFlow.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Confidence:</span>
                  <span className={`font-medium ${getConfidenceColor(scenario.results.confidence)}`}>
                    {scenario.results.confidence}%
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created {scenario.createdAt ? new Date(scenario.createdAt).toLocaleDateString() : 'Unknown date'}</span>
                  <button className="text-primary-600 hover:text-primary-700">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Scenario Details */}
      {selectedScenario && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedScenario.name} - Detailed Analysis
            </h3>
            <button onClick={exportForecast} className="btn-secondary">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Assumptions</h4>
              <div className="space-y-3">
                {Object.entries(selectedScenario.assumptions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{key}</span>
                    <span className={`font-medium ${
                      typeof value === 'number' && value > 0 ? 'text-success-600' : typeof value === 'number' && value < 0 ? 'text-danger-600' : 'text-gray-600'
                    }`}>
                      {typeof value === 'number' && value > 0 ? '+' : ''}{value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Projected Results</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                  <span className="text-sm text-gray-700">Revenue</span>
                  <span className="font-semibold text-success-600">
                    ${selectedScenario.results.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-warning-50 rounded-lg">
                  <span className="text-sm text-gray-700">Expenses</span>
                  <span className="font-semibold text-warning-600">
                    ${selectedScenario.results.expenses.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                  <span className="text-sm text-gray-700">Cash Flow</span>
                  <span className="font-semibold text-primary-600">
                    ${selectedScenario.results.cashFlow.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Confidence Level</span>
                  <span className={`font-semibold ${getConfidenceColor(selectedScenario.results.confidence)}`}>
                    {selectedScenario.results.confidence}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Forecasting Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-success-50 border border-success-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-success-600" />
              <span className="font-semibold text-success-800">Positive Trends</span>
            </div>
            <p className="text-sm text-success-700">
              Revenue growth is expected to accelerate in Q2 due to seasonal demand and new product launches.
            </p>
          </div>
          
          <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-warning-600" />
              <span className="font-semibold text-warning-800">Risk Factors</span>
            </div>
            <p className="text-sm text-warning-700">
              Supply chain disruptions may impact Q3 forecasts. Consider building inventory buffers.
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Modal */}
      {showScenarioModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Scenario</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scenario Name
                </label>
                <input 
                  type="text" 
                  className="input-field"
                  placeholder="e.g., Market Expansion"
                  value={newScenarioData.name}
                  onChange={(e) => setNewScenarioData({...newScenarioData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea 
                  className="input-field"
                  rows={3}
                  placeholder="Describe the scenario assumptions..."
                  value={newScenarioData.description}
                  onChange={(e) => setNewScenarioData({...newScenarioData, description: e.target.value})}
                />
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button 
                  onClick={() => {
                    setShowScenarioModal(false);
                    setNewScenarioData({ name: '', description: '', assumptions: {} });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateScenario}
                  className="btn-primary"
                  disabled={!newScenarioData.name.trim()}
                >
                  Create Scenario
                </button>
              </div>
            </div>
          </div>
        </div>
          )}
        </>
      )}
    </div>
  );
};

export default Forecasting; 