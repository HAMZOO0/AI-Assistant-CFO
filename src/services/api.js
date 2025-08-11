import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for AI requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// AI Services
export const aiService = {
  // Generate AI insights
  generateInsights: async (financialData) => {
    const response = await api.post("/ai/generate-insights", { financialData });
    return response.data;
  },

  // Generate cash flow forecast
  generateForecast: async (historicalData, period = 90) => {
    const response = await api.post("/ai/forecast-cashflow", {
      historicalData,
      period,
    });
    return response.data;
  },

  // Analyze uploaded reports
  analyzeReport: async (reportText, reportType) => {
    const response = await api.post("/ai/analyze-report", {
      reportText,
      reportType,
    });
    return response.data;
  },

  // Generate scenario analysis
  generateScenarioAnalysis: async (baseData, scenario) => {
    const response = await api.post("/ai/scenario-analysis", {
      baseData,
      scenario,
    });
    return response.data;
  },

  // Generate executive summary
  generateExecutiveSummary: async (financialData, period = "monthly") => {
    const response = await api.post("/ai/executive-summary", {
      financialData,
      period,
    });
    return response.data;
  },

  // Check AI service health
  checkHealth: async () => {
    const response = await api.get("/ai/health");
    return response.data;
  },
};

// Financial Services
export const financialService = {
  // Get financial data
  getFinancialData: async () => {
    const response = await api.get("/financial/data");
    return response.data;
  },

  // Get metrics
  getMetrics: async () => {
    const response = await api.get("/financial/metrics");
    return response.data;
  },

  // Get cash flow data
  getCashFlowData: async () => {
    const response = await api.get("/financial/cashflow");
    return response.data;
  },

  // Get recent transactions (for charts/dashboard)
  getTransactions: async () => {
    const response = await api.get("/financial/transactions");
    return response.data;
  },

  // Upload file
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/financial/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // Get uploaded files
  getFiles: async () => {
    const response = await api.get("/financial/files");
    return response.data;
  },

  // Delete file
  deleteFile: async (fileId) => {
    const response = await api.delete(`/financial/files/${fileId}`);
    return response.data;
  },
};

// Authentication Services
export const authService = {
  // Register user
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put("/auth/profile", profileData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put("/auth/change-password", passwordData);
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
};

// Utility functions
export const apiUtils = {
  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("authToken");
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem("authToken");
  },

  // Set auth token
  setToken: (token) => {
    localStorage.setItem("authToken", token);
  },

  // Remove auth token
  removeToken: () => {
    localStorage.removeItem("authToken");
  },

  // Handle API errors
  handleError: (error) => {
    if (error.response) {
      // Server responded with error
      return {
        message: error.response.data.error || "An error occurred",
        details: error.response.data.details,
        status: error.response.status,
      };
    } else if (error.request) {
      // Network error
      return {
        message: "Network error. Please check your connection.",
        status: 0,
      };
    } else {
      // Other error
      return {
        message: error.message || "An unexpected error occurred",
        status: 0,
      };
    }
  },
};

// Data Cleanup Service
export const cleanupService = {
  clearAllData: async () => {
    const response = await api.delete("/cleanup/clear-all-data");
    return response.data;
  },
  getCleanupStatus: async () => {
    const response = await api.get("/cleanup/status");
    return response.data;
  },
};

// Budget Variance Service
export const budgetVarianceService = {
  getBudgetVarianceData: async (params) => {
    const response = await api.get("/budget-variance", { params });
    return response;
  },
  getBudgetVarianceSummary: async (params) => {
    const response = await api.get("/budget-variance/summary", { params });
    return response;
  },
  getBudgetVarianceTrends: async (params) => {
    const response = await api.get("/budget-variance/trends", { params });
    return response;
  },
  createBudgetVarianceEntry: async (data) => {
    const response = await api.post("/budget-variance", data);
    return response;
  },
  updateBudgetVarianceEntry: async (id, data) => {
    const response = await api.put(`/budget-variance/${id}`, data);
    return response;
  },
  deleteBudgetVarianceEntry: async (id) => {
    const response = await api.delete(`/budget-variance/${id}`);
    return response;
  },
  bulkUploadBudgetVariance: async (entries) => {
    const response = await api.post("/budget-variance/bulk", { entries });
    return response;
  },
  getDepartments: async () => {
    const response = await api.get("/budget-variance/departments");
    return response;
  },
  getPeriods: async () => {
    const response = await api.get("/budget-variance/periods");
    return response;
  },
};

// Reports Service
export const reportsService = {
  getReports: async () => {
    const response = await api.get("/reports");
    return response;
  },
  generateReport: async () => {
    const response = await api.get("/reports/generate");
    return response;
  },
  createReport: async (data) => {
    const response = await api.post("/reports", data);
    return response;
  },
  deleteReport: async (id) => {
    const response = await api.delete(`/reports/${id}`);
    return response;
  },
};

// Insights Service
export const insightsService = {
  getInsights: async () => {
    const response = await api.get("/insights");
    return response;
  },
  generateInsights: async () => {
    const response = await api.get("/insights/generate");
    return response;
  },
  createInsight: async (data) => {
    const response = await api.post("/insights", data);
    return response;
  },
  updateInsight: async (id, data) => {
    const response = await api.put(`/insights/${id}`, data);
    return response;
  },
  deleteInsight: async (id) => {
    const response = await api.delete(`/insights/${id}`);
    return response;
  },
};

export default api;
