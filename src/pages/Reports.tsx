import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Plus,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { FinancialReport } from '../types';
import { useApp } from '../context/AppContext';
import toast from 'react-hot-toast';

const Reports: React.FC = () => {
  const { state, generateReports, exportReport, refreshAllData, loadFinancialData } = useApp();
  const { reports, loading, lastUpdated } = state;
  const [selectedReport, setSelectedReport] = useState<FinancialReport | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Load financial data when component mounts
    if (!state.metrics) {
      loadFinancialData();
    }
  }, [loadFinancialData, state.metrics]);

  useEffect(() => {
    // Generate reports if we have metrics but no reports
    if (state.metrics && reports.length === 0) {
      generateReports();
    }
  }, [state.metrics, reports.length, generateReports]);

  const generateReport = async () => {
    await generateReports();
  };

  const downloadReport = (report: FinancialReport) => {
    exportReport(report, 'pdf');
  };

  const exportToExcel = (report: FinancialReport) => {
    exportReport(report, 'excel');
  };

  const viewReport = (report: FinancialReport) => {
    setSelectedReport(report);
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'monthly':
        return 'bg-blue-100 text-blue-800';
      case 'quarterly':
        return 'bg-green-100 text-green-800';
      case 'annual':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.type === filter;
  });

  // Check if we have data to show
  const hasData = reports.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600">Automated financial reports and analysis</p>
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
          <button onClick={generateReport} className="btn-primary" disabled={loading}>
            <Plus className="w-4 h-4 mr-2" />
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Empty State */}
      {!hasData && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-blue-900 mb-2">No Financial Reports Available</h3>
          <p className="text-blue-700 mb-4">
            Upload your financial data files to generate automated reports and analysis.
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={() => window.location.href = '/data-integration'}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Upload Financial Data
            </button>
            <button 
              onClick={generateReport}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Generate Demo Report
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Generating reports...</p>
          </div>
        </div>
      )}

      {/* Content - Only show if we have data */}
      {hasData && !loading && (
        <>
      {/* Filters */}
      <div className="flex items-center space-x-4">
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="all">All Reports</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
        </select>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search reports..."
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => (
          <div key={report.id} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReportTypeColor(report.type)}`}>
                  {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => viewReport(report)}
                  className="p-1 text-gray-400 hover:text-primary-600"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => downloadReport(report)}
                  className="p-1 text-gray-400 hover:text-primary-600"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">
              {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report - {report.period}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {report.summary}
            </p>

            <div className="space-y-2 mb-4">
              {report.keyInsights.slice(0, 2).map((insight, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-xs text-gray-600">{insight}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Generated {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : 'Unknown date'}</span>
              <div className="flex items-center space-x-1">
                <RefreshCw className="w-3 h-3" />
                <span>Auto-generated</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedReport.type.charAt(0).toUpperCase() + selectedReport.type.slice(1)} Report - {selectedReport.period}
                </h3>
                <p className="text-sm text-gray-500">
                  Generated on {selectedReport.generatedAt ? new Date(selectedReport.generatedAt).toLocaleDateString() : 'Unknown date'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                      onClick={() => exportToExcel(selectedReport)}
                  className="btn-secondary"
                >
                  <Download className="w-4 h-4 mr-2" />
                      Export Excel
                    </button>
                    <button 
                      onClick={() => downloadReport(selectedReport)}
                      className="btn-primary"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                </button>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Executive Summary */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Executive Summary</h4>
                <p className="text-gray-700 leading-relaxed">{selectedReport.summary}</p>
              </div>

              {/* Key Metrics */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Key Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="font-semibold text-gray-900">
                      ${selectedReport.metrics.revenue.current.toLocaleString()}
                    </p>
                    <p className={`text-xs ${selectedReport.metrics.revenue.changePercent >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {selectedReport.metrics.revenue.changePercent >= 0 ? '+' : ''}{selectedReport.metrics.revenue.changePercent}%
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Profit</p>
                    <p className="font-semibold text-gray-900">
                      ${selectedReport.metrics.profit.current.toLocaleString()}
                    </p>
                    <p className={`text-xs ${selectedReport.metrics.profit.changePercent >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {selectedReport.metrics.profit.changePercent >= 0 ? '+' : ''}{selectedReport.metrics.profit.changePercent}%
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Cash Flow</p>
                    <p className="font-semibold text-gray-900">
                      ${selectedReport.metrics.cashFlow.current.toLocaleString()}
                    </p>
                    <p className={`text-xs ${selectedReport.metrics.cashFlow.changePercent >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {selectedReport.metrics.cashFlow.changePercent >= 0 ? '+' : ''}{selectedReport.metrics.cashFlow.changePercent}%
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">EBITDA</p>
                    <p className="font-semibold text-gray-900">
                      ${selectedReport.metrics.ebitda.current.toLocaleString()}
                    </p>
                    <p className={`text-xs ${selectedReport.metrics.ebitda.changePercent >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {selectedReport.metrics.ebitda.changePercent >= 0 ? '+' : ''}{selectedReport.metrics.ebitda.changePercent}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Key Insights</h4>
                <div className="space-y-2">
                  {selectedReport.keyInsights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-blue-800">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Analysis */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">AI Analysis</h4>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    This report was automatically generated using AI analysis of your financial data. 
                    The insights highlight key trends and anomalies that require attention.
                  </p>
                </div>
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

export default Reports; 