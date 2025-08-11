import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BarChart3,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Building2,
  Target,
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { BudgetVarianceAnalysis, BudgetData } from '../types';
import Chart from '../components/Chart';
import MetricCard from '../components/MetricCard';
import { useApp } from '../context/AppContext';
import { budgetVarianceService } from '../services/api';
import toast from 'react-hot-toast';

const BudgetVariance: React.FC = () => {
  const { state, refreshAllData } = useApp();
  const { loading: appLoading } = state;
  
  // State for budget variance data
  const [budgetData, setBudgetData] = useState<BudgetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<string[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);
  
  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState('2024-01');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // Load budget variance data from API
  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const response = await budgetVarianceService.getBudgetVarianceData();
      const data = response.data || [];
      
      // Ensure all data has proper values
      const sanitizedData = data.map((item: BudgetData) => ({
        ...item,
        budgeted: item.budgeted || 0,
        actual: item.actual || 0,
        variance: item.variance || 0,
        variancePercent: item.variancePercent || 0,
        department: item.department || 'Unknown',
        category: item.category || 'Unknown',
        type: item.type || 'expense'
      }));
      
      setBudgetData(sanitizedData);
      
      // Extract unique departments and periods
      const uniqueDepartments = Array.from(new Set(sanitizedData.map((item: BudgetData) => item.department).filter(Boolean))) as string[];
      const uniquePeriods = Array.from(new Set(sanitizedData.map((item: BudgetData) => item.period))) as string[];
      
      setDepartments(uniqueDepartments);
      setPeriods(uniquePeriods.sort().reverse());
      
      if (uniquePeriods.length > 0 && selectedPeriod === '2024-01') {
        setSelectedPeriod(uniquePeriods[0]);
      }
    } catch (error) {
      console.error('Error loading budget data:', error);
      toast.error('Failed to load budget variance data');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = budgetData.filter((item: BudgetData) => {
    const matchesPeriod = selectedPeriod === 'all' || item.period === selectedPeriod;
    const matchesDepartment = selectedDepartment === 'all' || (item.department && item.department === selectedDepartment);
    const matchesType = selectedType === 'all' || (item.type && item.type === selectedType);
    return matchesPeriod && matchesDepartment && matchesType;
  });

  // Calculate summary metrics
  const totalBudgeted = filteredData.reduce((sum: number, item: BudgetData) => sum + (item.budgeted || 0), 0);
  const totalActual = filteredData.reduce((sum: number, item: BudgetData) => sum + (item.actual || 0), 0);
  const totalVariance = totalActual - totalBudgeted;
  const totalVariancePercent = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;
  
  const favorableVariances = filteredData.filter((item: BudgetData) => {
    const variance = item.variance || 0;
    return (item.type === 'revenue' && variance > 0) || 
           (item.type !== 'revenue' && variance > 0);
  }).length;
  
  const unfavorableVariances = filteredData.filter((item: BudgetData) => {
    const variance = item.variance || 0;
    return (item.type === 'revenue' && variance < 0) || 
           (item.type !== 'revenue' && variance < 0);
  }).length;

  const types = ['all', 'revenue', 'expense', 'capital'];

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '$0';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (percent: number | undefined) => {
    if (percent === undefined || percent === null || isNaN(percent)) {
      return '0.0%';
    }
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`;
  };

  const getVarianceColor = (variance: number | undefined, type: string) => {
    if (variance === undefined || variance === null || isNaN(variance)) {
      return 'text-gray-600';
    }
    if (type === 'revenue') {
      return variance >= 0 ? 'text-green-600' : 'text-red-600';
    } else {
      return variance >= 0 ? 'text-green-600' : 'text-red-600';
    }
  };

  const getVarianceIcon = (variance: number | undefined, type: string) => {
    if (variance === undefined || variance === null || isNaN(variance)) {
      return <span className="w-4 h-4">-</span>;
    }
    if (type === 'revenue') {
      return variance >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
    } else {
      return variance >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
    }
  };

  // Chart data for variance visualization (convert to recharts format)
  const chartData = filteredData.map(item => ({
    month: (item.category || 'Unknown').length > 15 ? (item.category || 'Unknown').substring(0, 15) + '...' : (item.category || 'Unknown'),
    budgeted: item.budgeted || 0,
    actual: item.actual || 0
  }));

  const exportData = () => {
    const csvContent = [
      ['Category', 'Department', 'Type', 'Budgeted', 'Actual', 'Variance', 'Variance %'],
      ...filteredData.map(item => [
        item.category || 'Unknown',
        item.department || 'Unknown',
        item.type || 'expense',
        item.budgeted || 0,
        item.actual || 0,
        item.variance || 0,
        item.variancePercent || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-variance-analysis-${selectedPeriod}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Budget variance data exported successfully!');
  };

  const refreshData = async () => {
    await loadBudgetData();
    toast.success('Budget variance data refreshed successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Variance Analysis</h1>
          <p className="text-gray-600">Compare actual vs budgeted performance across categories and departments</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={loading || appLoading}
            className="btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading || appLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportData}
            className="btn-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="input"
            >
              <option value="all">All Periods</option>
              {periods.map(period => (
                <option key={period} value={period}>
                  {new Date(period + '-01').toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                  })}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="input"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input"
            >
              <option value="all">All Types</option>
              <option value="revenue">Revenue</option>
              <option value="expense">Expense</option>
              <option value="capital">Capital</option>
            </select>
          </div>

          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
                viewMode === 'table' ? 'bg-primary-50 text-primary-700' : 'text-gray-500'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-3 py-2 text-sm font-medium rounded-r-lg ${
                viewMode === 'chart' ? 'bg-primary-50 text-primary-700' : 'text-gray-500'
              }`}
            >
              Chart
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Budgeted"
          value={totalBudgeted}
          icon={<Target className="w-5 h-5 text-primary-600" />}
          trend="neutral"
          change={0}
          format="currency"
          subtitle="Sum of all budget allocations"
        />
        <MetricCard
          title="Total Actual"
          value={totalActual}
          icon={<Activity className="w-5 h-5 text-primary-600" />}
          trend="neutral"
          change={0}
          format="currency"
          subtitle="Sum of all actual spending/revenue"
        />
        <MetricCard
          title="Total Variance"
          value={Math.abs(totalVariance)}
          icon={totalVariance >= 0 ? <TrendingUp className="w-5 h-5 text-green-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
          trend={totalVariance >= 0 ? "up" : "down"}
          change={totalVariancePercent}
          format="currency"
          subtitle={totalVariance >= 0 ? "Over budget" : "Under budget"}
        />
        <MetricCard
          title="Variance Items"
          value={favorableVariances + unfavorableVariances}
          icon={favorableVariances > unfavorableVariances ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
          trend={favorableVariances > unfavorableVariances ? "up" : "down"}
          change={favorableVariances - unfavorableVariances}
          subtitle={`${favorableVariances} favorable, ${unfavorableVariances} unfavorable`}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading budget variance data...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && budgetData.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-blue-900 mb-2">No Budget Variance Data Available</h3>
          <p className="text-blue-700 mb-4">
            Upload your budget and actual financial data to start analyzing variances.
          </p>
          <button 
            onClick={() => window.location.href = '/data-integration'}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Upload Financial Data
          </button>
        </div>
      )}

      {/* Data Display */}
      {!loading && budgetData.length > 0 && viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budgeted
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actual
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variance %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.category || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.department || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (item.type || 'expense') === 'revenue' ? 'bg-green-100 text-green-800' :
                        (item.type || 'expense') === 'expense' ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {item.type || 'expense'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(item.budgeted)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      {formatCurrency(item.actual)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${getVarianceColor(item.variance, item.type || 'expense')}`}>
                      <div className="flex items-center justify-end space-x-1">
                        {getVarianceIcon(item.variance, item.type || 'expense')}
                        <span>{formatCurrency(item.variance !== undefined ? Math.abs(item.variance) : 0)}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${getVarianceColor(item.variance, item.type || 'expense')}`}>
                      {formatPercent(item.variancePercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !loading && budgetData.length > 0 && viewMode === 'chart' ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Budget vs Actual Comparison</h3>
            <p className="text-gray-600">Visual comparison of budgeted vs actual amounts by category</p>
          </div>
          <Chart
            type="bar"
            data={chartData}
            height={400}
          />
        </div>
      ) : null}

      {/* Insights Section */}
      {!loading && budgetData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(() => {
              const bestPerforming = filteredData
                .filter(item => item.variance > 0)
                .sort((a, b) => b.variancePercent - a.variancePercent)[0];
              
              const worstPerforming = filteredData
                .filter(item => item.variance < 0)
                .sort((a, b) => a.variancePercent - b.variancePercent)[0];
              
              return (
                <>
                  {bestPerforming && (
                    <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <h4 className="font-medium text-green-900">Best Performing</h4>
                      </div>
                      <p className="text-green-800 mt-1">
                        {bestPerforming.category} exceeded budget by {formatCurrency(Math.abs(bestPerforming.variance))} ({formatPercent(bestPerforming.variancePercent)})
                      </p>
                    </div>
                  )}
                  {worstPerforming && (
                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h4 className="font-medium text-red-900">Needs Attention</h4>
                      </div>
                      <p className="text-red-800 mt-1">
                        {worstPerforming.category} over budget by {formatCurrency(Math.abs(worstPerforming.variance))} ({formatPercent(worstPerforming.variancePercent)})
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetVariance;