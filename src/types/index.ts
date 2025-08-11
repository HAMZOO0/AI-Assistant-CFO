// Financial Data Types
export interface FinancialData {
  id: string;
  type: 'pl' | 'balance_sheet' | 'cash_flow' | 'ar_aging' | 'ap_aging';
  period: string;
  data: any;
  uploadedAt: Date;
  processed: boolean;
}

export interface PnLData {
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  operatingExpenses: number;
  operatingIncome: number;
  netIncome: number;
  period: string;
}

export interface BalanceSheetData {
  assets: {
    current: number;
    nonCurrent: number;
    total: number;
  };
  liabilities: {
    current: number;
    nonCurrent: number;
    total: number;
  };
  equity: number;
  period: string;
}

export interface CashFlowData {
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  netCashFlow: number;
  period: string;
}

// Dashboard Metrics
export interface DashboardMetrics {
  revenue: MetricData;
  expenses: MetricData;
  profit: MetricData;
  cashFlow: MetricData;
  arDays: MetricData;
  apDays: MetricData;
  ebitda: MetricData;
  margins: MetricData;
}

export interface MetricData {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable' | 'neutral';
}

// AI Insights
export interface AIInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'recommendation' | 'alert';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'revenue' | 'expenses' | 'cash_flow' | 'compliance' | 'efficiency';
  timestamp: Date;
  actionable: boolean;
  action?: string;
}

// Forecasting
export interface Forecast {
  period: string;
  revenue: number;
  expenses: number;
  cashFlow: number;
  confidence: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  assumptions: Record<string, string | number>;
  results: Forecast;
  createdAt: Date;
}

// Reports
export interface FinancialReport {
  id: string;
  type: 'monthly' | 'quarterly' | 'annual';
  period: string;
  summary: string;
  keyInsights: string[];
  metrics: DashboardMetrics;
  generatedAt: Date;
  downloadUrl?: string;
}

// User and Organization
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'cfo' | 'finance_manager' | 'business_owner';
  organization: string;
}

export interface Organization {
  id: string;
  name: string;
  industry: string;
  size: 'small' | 'medium' | 'large';
  fiscalYearEnd: string;
}

// File Upload
export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

// Budget Variance Analysis
export interface BudgetData {
  id: string;
  period: string;
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercent: number;
  type: 'revenue' | 'expense' | 'capital';
  department?: string;
  lastUpdated: Date;
}

export interface BudgetVarianceMetrics {
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  totalVariancePercent: number;
  favorableVariances: number;
  unfavorableVariances: number;
  largestVariance: BudgetData;
  bestPerformingCategory: BudgetData;
  worstPerformingCategory: BudgetData;
}

export interface BudgetVarianceAnalysis {
  period: string;
  metrics: BudgetVarianceMetrics;
  categoryBreakdown: BudgetData[];
  departmentBreakdown: Record<string, BudgetData[]>;
  trends: {
    period: string;
    variance: number;
    variancePercent: number;
  }[];
  generatedAt: Date;
}

// Navigation
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  badge?: number;
} 