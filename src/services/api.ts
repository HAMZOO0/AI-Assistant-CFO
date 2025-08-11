import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AI Service
export const aiService = {
  generateInsights: (data: any) => api.post('/ai/insights', data),
  // Send historical data to backend forecast endpoint
  generateForecast: (historicalData: any, period: number = 90) =>
    api.post('/ai/forecast-cashflow', { historicalData, period }),
  analyzeReport: (data: any) => api.post('/ai/analyze-report', data),
  // Generate scenario analysis for a named scenario
  generateScenario: (baseData: any, scenario: string) =>
    api.post('/ai/scenario-analysis', { baseData, scenario }),
};

// Financial Service
export const financialService = {
  getFinancialData: () => api.get('/financial/data'),
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/financial/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getUploadedFiles: () => api.get('/financial/files'),
  deleteFile: (id: string) => api.delete(`/financial/files/${id}`),
  getTransactions: () => api.get('/financial/transactions'),
};

// Auth Service
export const authService = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: { name: string; email: string; password: string }) =>
    api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

// Data Cleanup Service
export const cleanupService = {
  clearAllData: () => api.delete('/cleanup/clear-all-data'),
  getCleanupStatus: () => api.get('/cleanup/status'),
};

// Budget Variance Service
export const budgetVarianceService = {
  getBudgetVarianceData: (params?: { period?: string; department?: string; type?: string }) =>
    api.get('/budget-variance', { params }),
  getBudgetVarianceSummary: (params?: { period?: string; department?: string; type?: string }) =>
    api.get('/budget-variance/summary', { params }),
  getBudgetVarianceTrends: (params?: { department?: string; type?: string; limit?: number }) =>
    api.get('/budget-variance/trends', { params }),
  createBudgetVarianceEntry: (data: {
    period: string;
    category: string;
    department?: string;
    type: string;
    budgeted: number;
    actual: number;
  }) => api.post('/budget-variance', data),
  updateBudgetVarianceEntry: (id: string, data: any) =>
    api.put(`/budget-variance/${id}`, data),
  deleteBudgetVarianceEntry: (id: string) =>
    api.delete(`/budget-variance/${id}`),
  bulkUploadBudgetVariance: (entries: any[]) =>
    api.post('/budget-variance/bulk', { entries }),
  getDepartments: () => api.get('/budget-variance/departments'),
  getPeriods: () => api.get('/budget-variance/periods'),
};

// Reports Service
export const reportsService = {
  getReports: () => api.get('/reports'),
  generateReport: () => api.get('/reports/generate'),
  createReport: (data: {
    type: string;
    period: string;
    summary: string;
    keyInsights: string[];
    metrics: any;
  }) => api.post('/reports', data),
  deleteReport: (id: string) => api.delete(`/reports/${id}`),
};

// Insights Service
export const insightsService = {
  getInsights: () => api.get('/insights'),
  generateInsights: () => api.get('/insights/generate'),
  createInsight: (data: {
    type: string;
    title: string;
    description: string;
    severity: string;
    category: string;
    actionable?: boolean;
    action?: string;
  }) => api.post('/insights', data),
  updateInsight: (id: string, data: { actionable: boolean }) =>
    api.put(`/insights/${id}`, data),
  deleteInsight: (id: string) => api.delete(`/insights/${id}`),
};

export default api; 