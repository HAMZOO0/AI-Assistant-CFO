import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  Activity,
  Lightbulb,
  Clock,
  Users,
  Download,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import Chart from '../components/Chart';
import InsightCard from '../components/InsightCard';
import { useApp } from '../context/AppContext';

const Dashboard: React.FC = () => {
  const { state, generateInsights, refreshAllData, loadFinancialData } = useApp();
  const { metrics, insights, loading, lastUpdated, transactions } = state;
  const [showAgingReports, setShowAgingReports] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [selectedMonth, setSelectedMonth] = useState<number | ''>('');
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);

  // Widget configuration
  interface WidgetConfig {
    id: string;
    title: string;
    visible: boolean;
    order: number;
  }

  const defaultWidgets: WidgetConfig[] = [
    { id: 'metrics', title: 'Financial Metrics', visible: true, order: 0 },
    { id: 'kpis', title: 'Key Performance Indicators', visible: true, order: 1 },
    { id: 'charts', title: 'Charts & Analytics', visible: true, order: 2 },
    { id: 'aging', title: 'AR & AP Aging Reports', visible: true, order: 3 },
    { id: 'insights', title: 'AI Insights', visible: true, order: 4 }
  ];

  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem('dashboard-widgets');
    return saved ? JSON.parse(saved) : defaultWidgets;
  });

  // Save widget config to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
  }, [widgets]);

  const toggleWidget = (id: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, visible: !w.visible } : w
    ));
  };

  const moveWidget = (id: string, direction: 'up' | 'down') => {
    setWidgets(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex(w => w.id === id);
      
      if ((direction === 'up' && index === 0) || 
          (direction === 'down' && index === sorted.length - 1)) {
        return prev;
      }
      
      const newSorted = [...sorted];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Swap orders
      const temp = newSorted[index].order;
      newSorted[index].order = newSorted[targetIndex].order;
      newSorted[targetIndex].order = temp;
      
      return newSorted;
    });
  };

  const getVisibleWidgets = () => widgets.filter(w => w.visible).sort((a, b) => a.order - b.order);

  // Filter transactions based on selected year and month
  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    return transactions.filter((txn: any) => {
      const date = new Date(txn.date || txn.Date);
      if (isNaN(date.getTime())) return false; // Skip invalid dates
      
      const yearMatch = selectedYear === '' || date.getFullYear() === selectedYear;
      const monthMatch = selectedMonth === '' || (date.getMonth() + 1) === selectedMonth;
      
      return yearMatch && monthMatch;
    });
  }, [transactions, selectedYear, selectedMonth]);

  // Calculate filtered metrics
  const filteredMetrics = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return {
        revenue: { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'neutral' as const },
        expenses: { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'neutral' as const },
        profit: { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'neutral' as const },
        cashFlow: { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'neutral' as const },
        arDays: { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'neutral' as const },
        apDays: { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'neutral' as const },
        ebitda: { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'neutral' as const },
        margins: { current: 0, previous: 0, change: 0, changePercent: 0, trend: 'neutral' as const }
      };
    }

    let totalRevenue = 0;
    let totalExpenses = 0;

    filteredTransactions.forEach((txn: any) => {
      const amount = parseFloat(txn.amount || txn.Amount || 0);
      if (amount > 0) {
        totalRevenue += amount;
      } else {
        totalExpenses += Math.abs(amount);
      }
    });

    const totalProfit = totalRevenue - totalExpenses;
    const cashFlow = totalProfit * 0.8; // Simplified cash flow calculation

    // For comparison, use 10% less as "previous" period (simplified)
    const prevRevenue = totalRevenue * 0.9;
    const prevExpenses = totalExpenses * 1.1;
    const prevProfit = totalProfit * 0.85;
    const prevCashFlow = cashFlow * 0.9;

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const getTrend = (changePercent: number) => {
      if (Math.abs(changePercent) < 1) return 'neutral' as const;
      return changePercent > 0 ? 'up' as const : 'down' as const;
    };

    return {
          revenue: {
        current: totalRevenue,
        previous: prevRevenue,
        change: totalRevenue - prevRevenue,
        changePercent: calculateChange(totalRevenue, prevRevenue),
        trend: getTrend(calculateChange(totalRevenue, prevRevenue))
          },
          expenses: {
        current: totalExpenses,
        previous: prevExpenses,
        change: totalExpenses - prevExpenses,
        changePercent: calculateChange(totalExpenses, prevExpenses),
        trend: getTrend(calculateChange(totalExpenses, prevExpenses))
          },
          profit: {
        current: totalProfit,
        previous: prevProfit,
        change: totalProfit - prevProfit,
        changePercent: calculateChange(totalProfit, prevProfit),
        trend: getTrend(calculateChange(totalProfit, prevProfit))
          },
          cashFlow: {
        current: cashFlow,
        previous: prevCashFlow,
        change: cashFlow - prevCashFlow,
        changePercent: calculateChange(cashFlow, prevCashFlow),
        trend: getTrend(calculateChange(cashFlow, prevCashFlow))
      },
      arDays: { current: 30, previous: 35, change: -5, changePercent: -14.3, trend: 'up' as const },
      apDays: { current: 25, previous: 30, change: -5, changePercent: -16.7, trend: 'up' as const },
          ebitda: {
        current: totalProfit,
        previous: prevProfit,
        change: totalProfit - prevProfit,
        changePercent: calculateChange(totalProfit, prevProfit),
        trend: getTrend(calculateChange(totalProfit, prevProfit))
          },
          margins: {
        current: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        previous: 20.0,
        change: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 - 20.0 : -20.0,
        changePercent: totalRevenue > 0 ? calculateChange((totalProfit / totalRevenue) * 100, 20.0) : -100,
        trend: getTrend(totalRevenue > 0 ? calculateChange((totalProfit / totalRevenue) * 100, 20.0) : -100)
      }
    };
  }, [filteredTransactions]);

  // Use filtered metrics if we have filtered data, otherwise fall back to original metrics
  const displayMetrics = filteredTransactions.length > 0 || (selectedYear === '' && selectedMonth === '') ? filteredMetrics : metrics;

  useEffect(() => {
    // Load financial data when component mounts
    console.log('🏠 Dashboard: metrics =', metrics, 'transactions =', transactions.length);
    if (!metrics && !transactions.length) {
      console.log('🔄 Dashboard: Loading financial data...');
      loadFinancialData();
    }
  }, [loadFinancialData, metrics, transactions.length]);

  useEffect(() => {
    // Generate insights if we have metrics but no insights
    if (metrics && insights.length === 0) {
      generateInsights();
    }
  }, [metrics, insights.length, generateInsights]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI-powered insights...</p>
        </div>
      </div>
    );
  }

  if (!metrics && !transactions.length) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Financial Data Available</h3>
        <p className="text-gray-600 mb-4">
          Upload your financial data to start seeing insights and metrics.
        </p>
        <button 
          onClick={() => window.location.href = '/data-integration'}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
        >
          Upload Financial Data
        </button>
      </div>
    );
  }

  // Check if all metrics are zero (empty state) - use filtered metrics for the check
  const isEmptyState = !displayMetrics || 
                      (displayMetrics.revenue.current === 0 && 
                      displayMetrics.expenses.current === 0 && 
                      displayMetrics.profit.current === 0 && 
                       displayMetrics.cashFlow.current === 0);

  const revenueExpenseData = displayMetrics && (displayMetrics.revenue.current > 0 || displayMetrics.expenses.current > 0) ? [
    { name: 'Revenue', value: displayMetrics.revenue.current, color: '#10B981' },
    { name: 'Expenses', value: displayMetrics.expenses.current, color: '#EF4444' }
  ] : [];

  const cashFlowData = displayMetrics && displayMetrics.cashFlow.current > 0 ? [
    { date: 'Jan', value: 0 },
    { date: 'Feb', value: 0 },
    { date: 'Mar', value: 0 },
    { date: 'Apr', value: 0 },
    { date: 'May', value: 0 },
    { date: 'Jun', value: displayMetrics.cashFlow.current }
  ] : [];

  // AR Aging Data
  const arAgingData = [
    { period: '0-30 days', amount: 450000, percentage: 60 },
    { period: '31-60 days', amount: 225000, percentage: 30 },
    { period: '61-90 days', amount: 75000, percentage: 10 },
    { period: '90+ days', amount: 0, percentage: 0 }
  ];

  // AP Aging Data
  const apAgingData = [
    { period: '0-30 days', amount: 320000, percentage: 70 },
    { period: '31-60 days', amount: 96000, percentage: 21 },
    { period: '61-90 days', amount: 32000, percentage: 7 },
    { period: '90+ days', amount: 16000, percentage: 2 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600">AI-powered insights and real-time metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowWidgetConfig(!showWidgetConfig)}
            className={`btn-primary ${showWidgetConfig ? 'bg-primary-700' : ''}`}
          >
            <Settings className="w-4 h-4 mr-2" />
            {showWidgetConfig ? 'Hide Config' : 'Customize Dashboard'}
          </button>
          <button 
            onClick={refreshAllData}
            className="btn-secondary"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        <div className="text-sm text-gray-500">
            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
          </div>
        </div>
      </div>

      {/* Advanced Date Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Year</label>
            <select
              className="input-field w-40"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">All Years</option>
              {Array.from(new Set(transactions.map((t:any) => new Date(t.date || t.Date).getFullYear())))
                .sort((a:any,b:any)=>a-b)
                .map((y:any) => (
                  <option key={y} value={y}>{y}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Month</label>
            <select
              className="input-field w-40"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">All Months</option>
              {[1,2,3,4,5,6,7,8,9,10,11,12]
                .filter(m => selectedYear === '' || transactions.some((t:any)=>{
                  const d=new Date(t.date||t.Date);return d.getFullYear()===selectedYear && (d.getMonth()+1)===m;
                }))
                .map(m => (
                  <option key={m} value={m}>
                    {new Date(0, m-1).toLocaleString('default',{month:'long'})}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Widget Configuration Panel */}
      {showWidgetConfig && (
        <div className="card border-2 border-primary-200 bg-primary-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">🎛️ Customize Dashboard</h3>
              <p className="text-sm text-gray-600">Show, hide, and reorder dashboard widgets to match your workflow</p>
            </div>
            <button
              onClick={() => setShowWidgetConfig(false)}
              className="text-gray-500 hover:text-gray-700 p-1 rounded text-lg"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3">
            {widgets.sort((a, b) => a.order - b.order).map(widget => (
              <div key={widget.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleWidget(widget.id)}
                    className={`p-1 rounded ${widget.visible ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {widget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <span className={`font-medium ${widget.visible ? 'text-gray-900' : 'text-gray-500'}`}>
                    {widget.title}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => moveWidget(widget.id, 'up')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    disabled={widget.order === 0}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveWidget(widget.id, 'down')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    disabled={widget.order === widgets.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Use the eye icon to show/hide widgets and arrows to reorder them. Changes are saved automatically.
          </div>
        </div>
      )}

      {/* Empty State */}
      {isEmptyState && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Financial Data Available</h3>
          <p className="text-gray-600 mb-6">
            Upload your financial data files to see real-time metrics, charts, and AI insights.
          </p>
          <button className="btn-primary">
            Upload Financial Data
          </button>
        </div>
      )}

      {/* Render widgets in configured order */}
      {!isEmptyState && displayMetrics && getVisibleWidgets().map(widget => {
        switch (widget.id) {
          case 'metrics':
            return (
              <div key={widget.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Revenue"
                  value={displayMetrics.revenue.current}
                  change={displayMetrics.revenue.changePercent}
                  trend={displayMetrics.revenue.trend}
              icon={<DollarSign className="w-5 h-5 text-green-600" />}
              format="currency"
            />
            <MetricCard
              title="Expenses"
                  value={displayMetrics.expenses.current}
                  change={displayMetrics.expenses.changePercent}
                  trend={displayMetrics.expenses.trend}
              icon={<Activity className="w-5 h-5 text-red-600" />}
              format="currency"
            />
            <MetricCard
              title="Profit"
                  value={displayMetrics.profit.current}
                  change={displayMetrics.profit.changePercent}
                  trend={displayMetrics.profit.trend}
              icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
              format="currency"
            />
            <MetricCard
              title="Cash Flow"
                  value={displayMetrics.cashFlow.current}
                  change={displayMetrics.cashFlow.changePercent}
                  trend={displayMetrics.cashFlow.trend}
              icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
              format="currency"
            />
          </div>
            );

          case 'kpis':
            return (
              <div key={widget.id} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="AR Days"
                  value={displayMetrics.arDays.current}
                  change={displayMetrics.arDays.changePercent}
                  trend={displayMetrics.arDays.trend}
                  icon={<Clock className="w-5 h-5 text-orange-600" />}
                  format="number"
                  subtitle="Days to collect"
                />
                <MetricCard
                  title="AP Days"
                  value={displayMetrics.apDays.current}
                  change={displayMetrics.apDays.changePercent}
                  trend={displayMetrics.apDays.trend}
                  icon={<Users className="w-5 h-5 text-indigo-600" />}
                  format="number"
                  subtitle="Days to pay"
                />
                <MetricCard
                  title="EBITDA"
                  value={displayMetrics.ebitda.current}
                  change={displayMetrics.ebitda.changePercent}
                  trend={displayMetrics.ebitda.trend}
                  icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                  format="currency"
                />
                <MetricCard
                  title="Margins"
                  value={displayMetrics.margins.current}
                  change={displayMetrics.margins.changePercent}
                  trend={displayMetrics.margins.trend}
                  icon={<BarChart3 className="w-5 h-5 text-cyan-600" />}
                  format="percentage"
                />
              </div>
            );

          case 'charts':
            return (
              <div key={widget.id} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expenses</h3>
              <Chart data={revenueExpenseData} type="pie" />
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Trend</h3>
              <Chart data={cashFlowData} type="line" />
            </div>
          </div>
            );

          case 'aging':
            return (
              <div key={widget.id} className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">AR & AP Aging Reports</h3>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setShowAgingReports(!showAgingReports)}
                      className="btn-secondary"
                    >
                      {showAgingReports ? 'Hide' : 'Show'} Details
                    </button>
                    <button className="btn-primary">
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* AR Aging */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2 text-orange-600" />
                      Accounts Receivable Aging
                    </h4>
                    <div className="space-y-3">
                      {arAgingData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{item.period}</p>
                            <p className="text-sm text-gray-600">${item.amount.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{item.percentage}%</p>
                            <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-orange-500 h-2 rounded-full" 
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        <strong>Total AR:</strong> ${arAgingData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* AP Aging */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-indigo-600" />
                      Accounts Payable Aging
                    </h4>
                    <div className="space-y-3">
                      {apAgingData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{item.period}</p>
                            <p className="text-sm text-gray-600">${item.amount.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{item.percentage}%</p>
                            <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-indigo-500 h-2 rounded-full" 
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <p className="text-sm text-indigo-800">
                        <strong>Total AP:</strong> ${apAgingData.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detailed Aging Report */}
                {showAgingReports && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">Detailed Aging Analysis</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <h5 className="font-semibold text-orange-800 mb-2">AR Aging Insights</h5>
                        <ul className="text-sm text-orange-700 space-y-1">
                          <li>• 60% of receivables are current (0-30 days)</li>
                          <li>• 30% are moderately aged (31-60 days)</li>
                          <li>• 10% require immediate attention (61-90 days)</li>
                          <li>• Average collection period: {displayMetrics.arDays.current} days</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <h5 className="font-semibold text-indigo-800 mb-2">AP Aging Insights</h5>
                        <ul className="text-sm text-indigo-700 space-y-1">
                          <li>• 70% of payables are current (0-30 days)</li>
                          <li>• 21% are moderately aged (31-60 days)</li>
                          <li>• 7% are overdue (61-90 days)</li>
                          <li>• Average payment period: {displayMetrics.apDays.current} days</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );

          case 'insights':
            return insights.length > 0 ? (
              <div key={widget.id} className="card">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-primary-600" />
                  <span className="text-sm text-gray-600">{insights.length} insights</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.slice(0, 4).map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </div>
            ) : null;

          default:
            return null;
        }
      })}
    </div>
  );
};

export default Dashboard; 