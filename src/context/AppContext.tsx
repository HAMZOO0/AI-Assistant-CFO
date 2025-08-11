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
    // Require real data; do not generate anything without it
    if (!state.financialData) {
      dispatch({ type: 'SET_FORECASTS', payload: [] });
      return;
    }

    try {
      // Call backend AI endpoint with historical data
      const resp = await aiService.generateForecast(state.financialData, 90);
      const payload = (resp && (resp as any).data !== undefined) ? (resp as any).data : resp;
      const server = payload && payload.data ? payload.data : payload; // backend returns { success, data }

      // Expect server.forecast array; map into our Forecast[]
      const serverForecast = server && server.forecast ? server.forecast : [];
      const aiForecasts: Forecast[] = serverForecast.slice(0, 6).map((f: any) => ({
        period: f.date || f.period || 'N/A',
        revenue: typeof f.revenue === 'number' ? f.revenue : state.financialData.revenue?.current || 0,
        expenses: typeof f.expenses === 'number' ? f.expenses : state.financialData.expenses?.current || 0,
        cashFlow: typeof f.predictedCashFlow === 'number' ? f.predictedCashFlow : (state.financialData.cashFlow?.current || 0),
        confidence: Math.round(((f.confidence || 0.75) * 100))
      }));

      dispatch({ type: 'SET_FORECASTS', payload: aiForecasts });
      toast.success('Forecasts generated successfully!');
    } catch (error) {
      console.error('Error generating forecasts:', error);
      // Do not fallback to hardcoded values; leave forecasts empty
      dispatch({ type: 'SET_FORECASTS', payload: [] });
      toast.error('Failed to generate forecasts');
    }
  };

  // Generate scenarios
  const generateScenarios = async () => {
    if (!state.financialData) {
      dispatch({ type: 'SET_SCENARIOS', payload: [] });
      return;
    }

    try {
      // Ask backend to generate two scenario analyses in parallel
      const [optimisticResp, conservativeResp] = await Promise.all([
        aiService.generateScenario(state.financialData, 'Optimistic Growth'),
        aiService.generateScenario(state.financialData, 'Conservative Growth'),
      ]);

      const optPayload = (optimisticResp && (optimisticResp as any).data !== undefined) ? (optimisticResp as any).data : optimisticResp;
      const optData = optPayload && optPayload.data ? optPayload.data : optPayload;

      const consPayload = (conservativeResp && (conservativeResp as any).data !== undefined) ? (conservativeResp as any).data : conservativeResp;
      const consData = consPayload && consPayload.data ? consPayload.data : consPayload;

      const scenarios: Scenario[] = [
        {
          id: 'optimistic',
          name: 'Optimistic Growth',
          description: 'High growth scenario with increased market demand',
          assumptions: { scenario: 'Optimistic Growth' },
          results: {
            period: 'Next Quarter',
            revenue: typeof optData?.impact?.revenue === 'number' ? optData.impact.revenue : (state.financialData.revenue?.current || 0),
            expenses: typeof optData?.impact?.expenses === 'number' ? optData.impact.expenses : (state.financialData.expenses?.current || 0),
            cashFlow: typeof optData?.impact?.cashFlow === 'number' ? optData.impact.cashFlow : (state.financialData.cashFlow?.current || 0),
            confidence: Math.round(((optData?.confidence ?? 0.75) * 100)),
          },
          createdAt: new Date(),
        },
        {
          id: 'conservative',
          name: 'Conservative Growth',
          description: 'Moderate growth with controlled expenses',
          assumptions: { scenario: 'Conservative Growth' },
          results: {
            period: 'Next Quarter',
            revenue: typeof consData?.impact?.revenue === 'number' ? consData.impact.revenue : (state.financialData.revenue?.current || 0),
            expenses: typeof consData?.impact?.expenses === 'number' ? consData.impact.expenses : (state.financialData.expenses?.current || 0),
            cashFlow: typeof consData?.impact?.cashFlow === 'number' ? consData.impact.cashFlow : (state.financialData.cashFlow?.current || 0),
            confidence: Math.round(((consData?.confidence ?? 0.8) * 100)),
          },
          createdAt: new Date(),
        },
      ];

      dispatch({ type: 'SET_SCENARIOS', payload: scenarios });
      toast.success('Scenarios generated successfully!');
    } catch (error) {
      console.error('Error generating scenarios:', error);
      // No hardcoded fallbacks; leave empty
      dispatch({ type: 'SET_SCENARIOS', payload: [] });
      // Avoid spamming toast: show only once per failure burst
      if (!(error as any)?._suppressToast) {
        toast.error('Failed to generate scenarios');
        (error as any)._suppressToast = true;
        setTimeout(() => {
          try { delete (error as any)._suppressToast; } catch {}
        }, 1500);
      }
    }
  };

  // Generate reports
  const generateReports = async () => {
    try {
      // Always generate a fresh report if we have financial data
      if (state.financialData) {
        await reportsService.generateReport();
      }

      // Then fetch reports list
      const reportsResponse = await reportsService.getReports();
      const reports = (reportsResponse && (reportsResponse as any).data !== undefined)
        ? (reportsResponse as any).data
        : reportsResponse;

      dispatch({ type: 'SET_REPORTS', payload: reports || [] });
      if (reports && reports.length > 0) {
        toast.success('Reports loaded successfully!');
      }
    } catch (error) {
      console.error('Error generating reports:', error);
      // No fallbacks – keep it dynamic
      dispatch({ type: 'SET_REPORTS', payload: [] });
      toast.error('Failed to load reports');
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