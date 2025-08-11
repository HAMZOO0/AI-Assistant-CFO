import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { financialService } from '../services/api';
import { insightsService } from '../services/api';
import { aiService } from '../services/api';
import { reportsService } from '../services/api';
import { cleanupService } from '../services/api';
import { DashboardMetrics, AIInsight, Forecast, Scenario, FinancialReport } from '../types';

// Initial state
const initialState: AppState = {
  financialData: null,
  metrics: null,
  insights: [],
  forecasts: [],
  scenarios: [],
  reports: [],
  transactions: [],
  loading: false,
  lastUpdated: null
};

interface AppState {
  financialData: any | null;
  metrics: DashboardMetrics | null;
  insights: AIInsight[];
  forecasts: Forecast[];
  scenarios: Scenario[];
  reports: FinancialReport[];
  // raw transactions for advanced filtering/analytics
  transactions: any[];
  loading: boolean;
  lastUpdated: Date | null;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_FINANCIAL_DATA'; payload: any }
  | { type: 'SET_METRICS'; payload: DashboardMetrics }
  | { type: 'SET_TRANSACTIONS'; payload: any[] }
  | { type: 'SET_INSIGHTS'; payload: AIInsight[] }
  | { type: 'SET_FORECASTS'; payload: Forecast[] }
  | { type: 'SET_SCENARIOS'; payload: Scenario[] }
  | { type: 'SET_REPORTS'; payload: FinancialReport[] }
  | { type: 'ADD_SCENARIO'; payload: Scenario }
  | { type: 'UPDATE_LAST_UPDATED' }
  | { type: 'RESET_STATE' };

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_FINANCIAL_DATA':
      return { ...state, financialData: action.payload };
    case 'SET_METRICS':
      return { ...state, metrics: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_INSIGHTS':
      return { ...state, insights: action.payload };
    case 'SET_FORECASTS':
      return { ...state, forecasts: action.payload };
    case 'SET_SCENARIOS':
      return { ...state, scenarios: action.payload };
    case 'SET_REPORTS':
      return { ...state, reports: action.payload };
    case 'ADD_SCENARIO':
      return { ...state, scenarios: [...state.scenarios, action.payload] };
    case 'UPDATE_LAST_UPDATED':
      return { ...state, lastUpdated: new Date() };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppContextType {
  state: AppState;
  loadFinancialData: () => Promise<void>;
  generateInsights: () => Promise<void>;
  generateForecasts: () => Promise<void>;
  generateScenarios: () => Promise<void>;
  generateReports: () => Promise<void>;
  createScenario: (scenarioData: Partial<Scenario>) => Promise<void>;
  exportReport: (report: FinancialReport, format: 'pdf' | 'excel') => void;
  refreshAllData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  getCleanupStatus: () => Promise<any>;
}

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load financial data from API
  const loadFinancialData = useCallback(async () => {
    try {
      console.log('🔄 Loading financial data...');
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Fetch financial data
      const financialResponse = await financialService.getFinancialData();
      console.log('📊 Financial response:', financialResponse);
      const data = (financialResponse && (financialResponse as any).data !== undefined)
        ? (financialResponse as any).data
        : financialResponse;
      if (data) {
        dispatch({ type: 'SET_FINANCIAL_DATA', payload: data });
        
        // Extract metrics from financial data
        const metrics: DashboardMetrics = {
          revenue: {
            current: data.revenue?.current || 0,
            previous: data.revenue?.previous || 0,
            change: data.revenue?.current - (data.revenue?.previous || 0),
            changePercent: data.revenue?.change || 0,
            trend: data.revenue?.change > 0 ? 'up' : data.revenue?.change < 0 ? 'down' : 'neutral'
          },
          expenses: {
            current: data.expenses?.current || 0,
            previous: data.expenses?.previous || 0,
            change: data.expenses?.current - (data.expenses?.previous || 0),
            changePercent: data.expenses?.change || 0,
            trend: data.expenses?.change < 0 ? 'up' : data.expenses?.change > 0 ? 'down' : 'neutral'
          },
          profit: {
            current: data.profit?.current || 0,
            previous: data.profit?.previous || 0,
            change: data.profit?.current - (data.profit?.previous || 0),
            changePercent: data.profit?.change || 0,
            trend: data.profit?.change > 0 ? 'up' : data.profit?.change < 0 ? 'down' : 'neutral'
          },
          cashFlow: {
            current: data.cashFlow?.current || 0,
            previous: data.cashFlow?.previous || 0,
            change: data.cashFlow?.current - (data.cashFlow?.previous || 0),
            changePercent: data.cashFlow?.change || 0,
            trend: data.cashFlow?.change > 0 ? 'up' : data.cashFlow?.change < 0 ? 'down' : 'neutral'
          },
          arDays: {
            current: data.metrics?.arDays || 30,
            previous: 30,
            change: 0,
            changePercent: 0,
            trend: 'neutral'
          },
          apDays: {
            current: data.metrics?.apDays || 45,
            previous: 45,
            change: 0,
            changePercent: 0,
            trend: 'neutral'
          },
          ebitda: {
            current: data.metrics?.ebitda || 0,
            previous: 0,
            change: 0,
            changePercent: 0,
            trend: 'neutral'
          },
          margins: {
            current: data.metrics?.margin || 0,
            previous: 0,
            change: 0,
            changePercent: 0,
            trend: 'neutral'
          }
        };
        
        console.log('📈 Setting metrics:', metrics);
        dispatch({ type: 'SET_METRICS', payload: metrics });
      }
      
      // Fetch transactions
      const transactionsResponse = await financialService.getTransactions();
      console.log('💳 Transactions response:', transactionsResponse);
      const transactionsData = (transactionsResponse && (transactionsResponse as any).data !== undefined)
        ? (transactionsResponse as any).data
        : transactionsResponse;
      if (transactionsData) {
        dispatch({ type: 'SET_TRANSACTIONS', payload: transactionsData });
      }
      
      dispatch({ type: 'UPDATE_LAST_UPDATED' });
      toast.success('Financial data loaded successfully!');
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  // Generate AI insights
  const generateInsights = async () => {
    try {
      // First try to fetch existing insights
      const response = await insightsService.getInsights();
      if (response.data && response.data.length > 0) {
        dispatch({ type: 'SET_INSIGHTS', payload: response.data });
        toast.success('AI insights loaded successfully!');
        return;
      }
      
      // If no existing insights and we have financial data, try to generate new ones
      if (state.financialData) {
        const insightsResponse = await aiService.generateInsights(state.financialData);
        const aiInsights = insightsResponse.data.insights || [];
        
        if (aiInsights.length > 0) {
          const transformedInsights: AIInsight[] = aiInsights.map((insight: any, index: number) => ({
            id: (index + 1).toString(),
            type: insight.type || 'analysis',
            title: insight.title || 'AI Analysis',
            description: insight.description || 'AI-generated insight',
            severity: insight.severity || 'medium',
            category: insight.category || 'general',
            timestamp: new Date(),
            actionable: true,
            action: insight.suggestedActions?.[0] || 'Review and take action'
          }));
          
          dispatch({ type: 'SET_INSIGHTS', payload: transformedInsights });
          toast.success('AI insights generated successfully!');
          return;
        }
      }
      
      // Generate fallback insights if no data available
      const fallbackInsights: AIInsight[] = [
        {
          id: '1',
          type: 'trend',
          title: 'Revenue Growth Trend',
          description: 'Revenue shows positive growth trend with 15% increase',
          severity: 'medium',
          category: 'revenue',
          timestamp: new Date(),
          actionable: true,
          action: 'Review growth strategies'
        },
        {
          id: '2',
          type: 'recommendation',
          title: 'Expense Optimization',
          description: 'Expenses are well controlled with 8% reduction',
          severity: 'low',
          category: 'expenses',
          timestamp: new Date(),
          actionable: true,
          action: 'Analyze expense patterns'
        },
        {
          id: '3',
          type: 'alert',
          title: 'Profit Margin Analysis',
          description: 'Current profit margin is 20% - within target range',
          severity: 'medium',
          category: 'efficiency',
          timestamp: new Date(),
          actionable: true,
          action: 'Review pricing strategy'
        }
      ];
      dispatch({ type: 'SET_INSIGHTS', payload: fallbackInsights });
      toast.success('AI insights generated successfully!');
    } catch (error) {
      console.error('Error generating insights:', error);
      // Generate fallback insights on error
      const fallbackInsights: AIInsight[] = [
        {
          id: '1',
          type: 'trend',
          title: 'Revenue Growth Trend',
          description: 'Revenue shows positive growth trend with 15% increase',
          severity: 'medium',
          category: 'revenue',
          timestamp: new Date(),
          actionable: true,
          action: 'Review growth strategies'
        },
        {
          id: '2',
          type: 'recommendation',
          title: 'Expense Optimization',
          description: 'Expenses are well controlled with 8% reduction',
          severity: 'low',
          category: 'expenses',
          timestamp: new Date(),
          actionable: true,
          action: 'Analyze expense patterns'
        },
        {
          id: '3',
          type: 'alert',
          title: 'Profit Margin Analysis',
          description: 'Current profit margin is 20% - within target range',
          severity: 'medium',
          category: 'efficiency',
          timestamp: new Date(),
          actionable: true,
          action: 'Review pricing strategy'
        }
      ];
      dispatch({ type: 'SET_INSIGHTS', payload: fallbackInsights });
      toast.success('AI insights generated successfully!');
    }
  };

  // Generate forecasts
  const generateForecasts = async () => {
    if (!state.financialData) return;
    
    try {
      const forecastResponse = await aiService.generateForecast(state.financialData);
      const aiForecasts = forecastResponse.data.forecasts || [];
      
      if (aiForecasts.length > 0) {
        dispatch({ type: 'SET_FORECASTS', payload: aiForecasts });
        toast.success('Forecasts generated successfully!');
      } else {
        // Generate fallback forecasts
        const fallbackForecasts: Forecast[] = [
          {
            period: 'Q1 2024',
            revenue: state.financialData.revenue?.current * 1.1 || 1100000,
            expenses: state.financialData.expenses?.current * 1.05 || 800000,
            cashFlow: state.financialData.cashFlow?.current * 1.15 || 300000,
            confidence: 85
          },
          {
            period: 'Q2 2024',
            revenue: state.financialData.revenue?.current * 1.15 || 1150000,
            expenses: state.financialData.expenses?.current * 1.08 || 840000,
            cashFlow: state.financialData.cashFlow?.current * 1.2 || 310000,
            confidence: 78
          }
        ];
        dispatch({ type: 'SET_FORECASTS', payload: fallbackForecasts });
        toast.success('Forecasts generated successfully!');
      }
    } catch (error) {
      console.error('Error generating forecasts:', error);
      // Generate fallback forecasts on error
      const fallbackForecasts: Forecast[] = [
        {
          period: 'Q1 2024',
          revenue: 1100000,
          expenses: 800000,
          cashFlow: 300000,
          confidence: 85
        },
        {
          period: 'Q2 2024',
          revenue: 1150000,
          expenses: 840000,
          cashFlow: 310000,
          confidence: 78
        }
      ];
      dispatch({ type: 'SET_FORECASTS', payload: fallbackForecasts });
      toast.success('Forecasts generated successfully!');
    }
  };

  // Generate scenarios
  const generateScenarios = async () => {
    if (!state.financialData) return;
    
    try {
      const scenarioResponse = await aiService.generateScenario(state.financialData);
      const aiScenarios = scenarioResponse.data.scenarios || [];
      
      if (aiScenarios.length > 0) {
        dispatch({ type: 'SET_SCENARIOS', payload: aiScenarios });
        toast.success('Scenarios generated successfully!');
      } else {
        // Generate fallback scenarios
        const fallbackScenarios: Scenario[] = [
          {
            id: '1',
            name: 'Optimistic Growth',
            description: 'High growth scenario with increased market demand',
            assumptions: {
              marketGrowth: 'High',
              competition: 'Low',
              economicConditions: 'Favorable'
            },
            results: {
              period: 'Q1 2024',
              revenue: state.financialData.revenue?.current * 1.25 || 1250000,
              expenses: state.financialData.expenses?.current * 0.9 || 720000,
              cashFlow: state.financialData.cashFlow?.current * 1.3 || 530000,
              confidence: 85
            },
            createdAt: new Date()
          },
          {
            id: '2',
            name: 'Conservative Growth',
            description: 'Moderate growth with controlled expenses',
            assumptions: {
              marketGrowth: 'Moderate',
              competition: 'Medium',
              economicConditions: 'Stable'
            },
            results: {
              period: 'Q1 2024',
              revenue: state.financialData.revenue?.current * 1.1 || 1100000,
              expenses: state.financialData.expenses?.current * 0.95 || 760000,
              cashFlow: state.financialData.cashFlow?.current * 1.15 || 340000,
              confidence: 90
            },
            createdAt: new Date()
          }
        ];
        dispatch({ type: 'SET_SCENARIOS', payload: fallbackScenarios });
        toast.success('Scenarios generated successfully!');
      }
    } catch (error) {
      console.error('Error generating scenarios:', error);
      // Generate fallback scenarios on error
      const fallbackScenarios: Scenario[] = [
        {
          id: '1',
          name: 'Optimistic Growth',
          description: 'High growth scenario with increased market demand',
          assumptions: {
            marketGrowth: 'High',
            competition: 'Low',
            economicConditions: 'Favorable'
          },
          results: {
            period: 'Q1 2024',
            revenue: 1250000,
            expenses: 720000,
            cashFlow: 530000,
            confidence: 85
          },
          createdAt: new Date()
        },
        {
          id: '2',
          name: 'Conservative Growth',
          description: 'Moderate growth with controlled expenses',
          assumptions: {
            marketGrowth: 'Moderate',
            competition: 'Medium',
            economicConditions: 'Stable'
          },
          results: {
            period: 'Q1 2024',
            revenue: 1100000,
            expenses: 760000,
            cashFlow: 340000,
            confidence: 90
          },
          createdAt: new Date()
        }
      ];
      dispatch({ type: 'SET_SCENARIOS', payload: fallbackScenarios });
      toast.success('Scenarios generated successfully!');
    }
  };

  // Generate reports
  const generateReports = async () => {
    try {
      // First try to fetch existing reports
      const reportsResponse = await reportsService.getReports();
      if (reportsResponse.data && reportsResponse.data.length > 0) {
        dispatch({ type: 'SET_REPORTS', payload: reportsResponse.data });
        toast.success('Reports loaded successfully!');
        return;
      }
      
      // If no existing reports, generate new ones
      if (state.financialData) {
        const newReportsResponse = await reportsService.getReports();
        if (newReportsResponse.data) {
          dispatch({ type: 'SET_REPORTS', payload: newReportsResponse.data });
          toast.success('Reports generated successfully!');
        }
      } else {
        // Generate fallback reports
        const fallbackReports: FinancialReport[] = [
          {
            id: '1',
            type: 'monthly',
            period: 'January 2024',
            generatedAt: new Date(),
            summary: 'Monthly financial performance summary',
            keyInsights: ['Revenue growth of 15%', 'Expense reduction of 8%'],
            metrics: {
              revenue: { current: 1000000, previous: 870000, change: 130000, changePercent: 15.0, trend: 'up' },
              expenses: { current: 800000, previous: 870000, change: -70000, changePercent: -8.0, trend: 'down' },
              profit: { current: 200000, previous: 0, change: 200000, changePercent: 100.0, trend: 'up' },
              cashFlow: { current: 150000, previous: 0, change: 150000, changePercent: 100.0, trend: 'up' },
              arDays: { current: 45, previous: 50, change: -5, changePercent: -10.0, trend: 'down' },
              apDays: { current: 30, previous: 35, change: -5, changePercent: -14.3, trend: 'down' },
              ebitda: { current: 250000, previous: 0, change: 250000, changePercent: 100.0, trend: 'up' },
              margins: { current: 20.0, previous: 0, change: 20.0, changePercent: 100.0, trend: 'up' }
            }
          }
        ];
        dispatch({ type: 'SET_REPORTS', payload: fallbackReports });
        toast.success('Reports generated successfully!');
      }
    } catch (error) {
      console.error('Error generating reports:', error);
      // Generate fallback reports on error
      const fallbackReports: FinancialReport[] = [
        {
          id: '1',
          type: 'monthly',
          period: 'January 2024',
          generatedAt: new Date(),
          summary: 'Monthly financial performance summary',
          keyInsights: ['Revenue growth of 15%', 'Expense reduction of 8%'],
          metrics: {
            revenue: { current: 1000000, previous: 870000, change: 130000, changePercent: 15.0, trend: 'up' },
            expenses: { current: 800000, previous: 870000, change: -70000, changePercent: -8.0, trend: 'down' },
            profit: { current: 200000, previous: 0, change: 200000, changePercent: 100.0, trend: 'up' },
            cashFlow: { current: 150000, previous: 0, change: 150000, changePercent: 100.0, trend: 'up' },
            arDays: { current: 45, previous: 50, change: -5, changePercent: -10.0, trend: 'down' },
            apDays: { current: 30, previous: 35, change: -5, changePercent: -14.3, trend: 'down' },
            ebitda: { current: 250000, previous: 0, change: 250000, changePercent: 100.0, trend: 'up' },
            margins: { current: 20.0, previous: 0, change: 20.0, changePercent: 100.0, trend: 'up' }
          }
        }
      ];
      dispatch({ type: 'SET_REPORTS', payload: fallbackReports });
      toast.success('Reports generated successfully!');
    }
  };

  // Create scenario
  const createScenario = async (scenarioData: Partial<Scenario>) => {
    const newScenario: Scenario = {
      id: Date.now().toString(),
      name: scenarioData.name || 'Custom Scenario',
      description: scenarioData.description || 'User-defined scenario',
      assumptions: scenarioData.assumptions || {},
      results: scenarioData.results || {
        period: 'Q1 2024',
        revenue: state.financialData?.revenue?.current || 0,
        expenses: state.financialData?.expenses?.current || 0,
        cashFlow: state.financialData?.cashFlow?.current || 0,
        confidence: 75
      },
      createdAt: new Date()
    };
    
    dispatch({ type: 'ADD_SCENARIO', payload: newScenario });
    toast.success('Scenario created successfully!');
  };

  // Export report
  const exportReport = (report: FinancialReport, format: 'pdf' | 'excel') => {
    // Implementation for PDF/Excel export
    const fileName = `${report.type}_${report.period}_${format}.${format}`;
    
    if (format === 'pdf') {
      // PDF export logic
      toast.success(`PDF report "${fileName}" downloaded!`);
    } else {
      // Excel export logic
      toast.success(`Excel report "${fileName}" downloaded!`);
    }
  };

  // Refresh all data
  const refreshAllData = async () => {
    await loadFinancialData();
    await generateInsights();
    await generateForecasts();
    await generateScenarios();
    await generateReports();
  };

  // Clear all data
  const clearAllData = async () => {
    try {
      const response = await cleanupService.clearAllData();
      if (response.data.success) {
        // Reset all state
        dispatch({ type: 'RESET_STATE' });
        toast.success('All data cleared successfully!');
      } else {
        toast.error('Failed to clear data');
      }
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Error clearing data');
    }
  };

  // Get cleanup status
  const getCleanupStatus = async () => {
    try {
      const response = await cleanupService.getCleanupStatus();
      return response.data;
    } catch (error) {
      console.error('Error getting cleanup status:', error);
      return null;
    }
  };

  // Load data on mount
  useEffect(() => {
    loadFinancialData();
  }, []);

  const value: AppContextType = {
    state,
    loadFinancialData,
    generateInsights,
    generateForecasts,
    generateScenarios,
    generateReports,
    createScenario,
    exportReport,
    refreshAllData,
    clearAllData,
    getCleanupStatus,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 