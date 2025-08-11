import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Database,
  Link,
  Download,
  Trash2,
  Eye,
  X,
  FileSpreadsheet,
  File,
  HelpCircle,
  RefreshCw,
  PlayCircle,
  PauseCircle,
  Plus
} from 'lucide-react';
import { UploadedFile, FinancialData } from '../types';
import api, { financialService } from '../services/api';
import { toast } from 'react-hot-toast';
import { useApp } from '../context/AppContext';

interface FilePreview {
  file: File;
  id: string;
  preview?: string;
  validated: boolean;
  validationErrors: string[];
}

interface UploadProgress {
  fileId: string;
  progress: number;
  speed: string;
  timeRemaining: string;
}

const DataIntegration: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showFileTemplates, setShowFileTemplates] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const { refreshAllData } = useApp();

  // File validation function
  const validateFile = useCallback((file: File): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB

    // Accept by extension as browsers on Windows may not set a reliable MIME type for CSV
    const nameLower = file.name.toLowerCase();
    const hasCsvExt = nameLower.endsWith('.csv');
    const hasXlsxExt = nameLower.endsWith('.xlsx');
    const hasXlsExt = nameLower.endsWith('.xls');
    const hasPdfExt = nameLower.endsWith('.pdf');

    const allowedMimeTypes = new Set([
      'text/csv',
      'application/vnd.ms-excel', // some browsers label .csv like this
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/pdf',
    ]);

    const typeAllowed = file.type ? allowedMimeTypes.has(file.type) : true; // if missing, fall back to extension
    const extAllowed = hasCsvExt || hasXlsxExt || hasXlsExt || hasPdfExt;

    if (!typeAllowed && !extAllowed) {
      errors.push('File type not supported. Please use Excel (.xlsx/.xls), CSV (.csv), or PDF (.pdf).');
    }

    if (file.size > maxSize) {
      errors.push('File size exceeds 10MB limit.');
    }

    if (file.name.length > 100) {
      errors.push('File name is too long (max 100 characters).');
    }

    return { valid: errors.length === 0, errors };
  }, []);

  // Create file previews
  const createFilePreviews = useCallback((files: File[]) => {
    const previews: FilePreview[] = files.map((file, index) => {
      const validation = validateFile(file);
      return {
        file,
        id: `preview-${Date.now()}-${index}`,
        validated: validation.valid,
        validationErrors: validation.errors
      };
    });
    
    setFilePreviews(prev => [...prev, ...previews]);
  }, [validateFile]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    console.log('📁 Files dropped:', acceptedFiles.length, 'accepted,', rejectedFiles.length, 'rejected');
    
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(rejection => {
        toast.error(`${rejection.file.name}: ${rejection.errors[0]?.message || 'File rejected'}`);
      });
    }

    // Create previews for accepted files
    if (acceptedFiles.length > 0) {
      createFilePreviews(acceptedFiles);
      toast.success(`${acceptedFiles.length} file(s) ready for upload`);
    }
  }, [createFilePreviews]);

  // Upload files with progress tracking
  const uploadFiles = async (fileIds?: string[]) => {
    const filesToUpload = fileIds 
      ? filePreviews.filter(p => fileIds.includes(p.id))
      : filePreviews.filter(p => p.validated);

    if (filesToUpload.length === 0) {
      toast.error('No valid files to upload');
      return;
    }

    const newFiles: UploadedFile[] = filesToUpload.map((preview, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: preview.file.name,
      size: preview.file.size,
      type: preview.file.type,
      uploadedAt: new Date(),
      status: 'uploading'
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload files with progress tracking
    for (let i = 0; i < filesToUpload.length; i++) {
      const preview = filesToUpload[i];
      const file = preview.file;
      const fileId = newFiles[i].id;
      
      try {
        console.log(`📤 Uploading file ${i + 1}/${filesToUpload.length}:`, file.name);
        
        // Update status to processing
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'processing' }
              : f
          )
        );

        // Upload file to backend
        console.log('🌐 Sending file to backend...');
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/financial/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('✅ Upload response:', response.data);
        
        // Update status to completed
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'completed' }
              : f
          )
        );
        
        // Add to financial data
        const dataType = getDataTypeFromFileName(file.name);
        if (dataType) {
          const newData: FinancialData = {
            id: `data-${Date.now()}-${i}`,
            type: dataType,
            period: getPeriodFromFileName(file.name),
            data: {},
            uploadedAt: new Date(),
            processed: true
          };
          setFinancialData(prev => [...prev, newData]);
        }

        toast.success(`${file.name} uploaded and processed successfully!`);
        
        // Refresh uploaded files list from backend
        console.log('🔄 Refreshing uploaded files list...');
        loadUploadedFiles();
        
        // Refresh global app data to show new data in dashboard and other pages
        console.log('🔄 Refreshing global app data...');
        try {
          await refreshAllData();
          console.log('✅ Global app data refreshed successfully');
        } catch (error) {
          console.error('❌ Failed to refresh global app data:', error);
        }
        
      } catch (error) {
        console.error('❌ Upload error for file:', file.name, error);
        
        // Update status to error
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, status: 'error', error: 'Upload failed' }
              : f
          )
        );
        
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    // Clear previews for uploaded files
    if (fileIds) {
      setFilePreviews(prev => prev.filter(p => !fileIds.includes(p.id)));
    } else {
      setFilePreviews([]);
    }
    
    setIsUploading(false);
  };

  // Load uploaded files from backend
  const loadUploadedFiles = async () => {
    try {
      console.log('🔄 Loading uploaded files from backend...');
      
      // Use direct API call to avoid module resolution issues
      console.log('🔍 Available methods:', Object.keys(financialService));
      console.log('⚠️ Using direct API call to avoid module issues...');
      const response = await api.get('/financial/files');
      console.log('✅ Files response:', response.data);
      
      const files = response.data.map((file: any) => ({
        id: file.id.toString(),
        name: file.original_name,
        size: file.file_size,
        type: file.file_type,
        uploadedAt: new Date(file.upload_date),
        status: file.status === 'uploaded' || file.status === 'processed' ? 'completed' : file.status
      }));
      
      console.log('📁 Processed files:', files);
      setUploadedFiles(files);
    } catch (error) {
      console.error('❌ Failed to load uploaded files:', error);
    }
  };

  // Load files on component mount
  useEffect(() => {
    loadUploadedFiles();
  }, []);

  // Remove file preview
  const removeFilePreview = (fileId: string) => {
    setFilePreviews(prev => prev.filter(p => p.id !== fileId));
  };

  // Select/deselect files
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(fileId)) {
        newSelection.delete(fileId);
      } else {
        newSelection.add(fileId);
      }
      return newSelection;
    });
  };

  // Select all valid files
  const selectAllValidFiles = () => {
    const validFileIds = filePreviews.filter(p => p.validated).map(p => p.id);
    setSelectedFiles(new Set(validFileIds));
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  // Download file template
  const downloadTemplate = (type: 'csv' | 'excel') => {
    const csvData = `Date,Description,Category,Amount,Type,Account
2024-01-01,Sales Invoice,Revenue,5000,income,Main
2024-01-02,Office Supplies,Expense,-200,expense,Main
2024-01-03,Client Payment,Revenue,3000,income,Main`;

    if (type === 'csv') {
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'financial_data_template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // For Excel, we'd need a library like xlsx-js-style, but for now just CSV
      toast('Excel template coming soon! Please use CSV template for now.');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      // some environments label CSV as application/vnd.ms-excel; allow both .xls and .csv here
      'application/vnd.ms-excel': ['.xls', '.csv'],
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      // fallback for cases where MIME type is missing or generic
      'text/plain': ['.csv'],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const getDataTypeFromFileName = (filename: string): FinancialData['type'] | null => {
    const lowerName = filename.toLowerCase();
    if (lowerName.includes('pl') || lowerName.includes('profit') || lowerName.includes('income')) {
      return 'pl';
    }
    if (lowerName.includes('balance') || lowerName.includes('bs')) {
      return 'balance_sheet';
    }
    if (lowerName.includes('cash') || lowerName.includes('flow')) {
      return 'cash_flow';
    }
    if (lowerName.includes('ar') || lowerName.includes('receivable')) {
      return 'ar_aging';
    }
    if (lowerName.includes('ap') || lowerName.includes('payable')) {
      return 'ap_aging';
    }
    return null;
  };

  const getPeriodFromFileName = (filename: string): string => {
    // Extract period from filename or use current month
    const match = filename.match(/(\d{4})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setFinancialData(prev => prev.filter(d => d.id !== fileId.replace('file-', 'data-')));
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Clock className="w-4 h-4 text-warning-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-primary-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-danger-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Data Integration</h1>
        <p className="text-gray-600">Connect your financial data sources and upload reports</p>
      </div>

      {/* Platform Connections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="card relative">
           <div className="absolute top-2 right-2">
             <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
               Future Phase
             </span>
           </div>
           <div className="flex items-center space-x-3 mb-4">
             <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
               <Database className="w-5 h-5 text-green-600" />
             </div>
             <div>
               <h3 className="font-semibold text-gray-900">QuickBooks</h3>
               <p className="text-sm text-gray-500">Coming Soon</p>
             </div>
           </div>
           <div className="space-y-2">
             <div className="flex justify-between text-sm">
               <span className="text-gray-600">Last sync:</span>
               <span className="text-gray-500">Not available</span>
             </div>
             <div className="flex justify-between text-sm">
               <span className="text-gray-600">Status:</span>
               <span className="text-gray-500">Inactive</span>
             </div>
           </div>
           <button className="w-full mt-4 btn-secondary text-sm opacity-50 cursor-not-allowed" disabled>
             <Link className="w-4 h-4 mr-2" />
             Coming Soon
           </button>
         </div>

                 <div className="card relative">
           <div className="absolute top-2 right-2">
             <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
               Future Phase
             </span>
           </div>
           <div className="flex items-center space-x-3 mb-4">
             <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
               <Database className="w-5 h-5 text-blue-600" />
             </div>
             <div>
               <h3 className="font-semibold text-gray-900">Xero</h3>
               <p className="text-sm text-gray-500">Coming Soon</p>
             </div>
           </div>
           <div className="space-y-2">
             <div className="flex justify-between text-sm">
               <span className="text-gray-600">Last sync:</span>
               <span className="text-gray-500">Not available</span>
             </div>
             <div className="flex justify-between text-sm">
               <span className="text-gray-600">Status:</span>
               <span className="text-gray-500">Inactive</span>
             </div>
           </div>
           <button className="w-full mt-4 btn-primary text-sm opacity-50 cursor-not-allowed" disabled>
             <Link className="w-4 h-4 mr-2" />
             Coming Soon
           </button>
         </div>

                 <div className="card relative">
           <div className="absolute top-2 right-2">
             <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
               Future Phase
             </span>
           </div>
           <div className="flex items-center space-x-3 mb-4">
             <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
               <Database className="w-5 h-5 text-purple-600" />
             </div>
             <div>
               <h3 className="font-semibold text-gray-900">Sage</h3>
               <p className="text-sm text-gray-500">Coming Soon</p>
             </div>
           </div>
           <div className="space-y-2">
             <div className="flex justify-between text-sm">
               <span className="text-gray-600">Last sync:</span>
               <span className="text-gray-500">Not available</span>
             </div>
             <div className="flex justify-between text-sm">
               <span className="text-gray-600">Status:</span>
               <span className="text-gray-500">Inactive</span>
             </div>
           </div>
           <button className="w-full mt-4 btn-primary text-sm opacity-50 cursor-not-allowed" disabled>
             <Link className="w-4 h-4 mr-2" />
             Coming Soon
           </button>
         </div>
      </div>

      {/* File Upload Section */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Upload Financial Reports</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFileTemplates(!showFileTemplates)}
              className="btn-secondary text-sm"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Templates
            </button>
          </div>
        </div>

        {/* File Templates Panel */}
        {showFileTemplates && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">File Templates & Examples</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-blue-800">Required Columns:</h5>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Date (YYYY-MM-DD format)</li>
                  <li>• Description</li>
                  <li>• Category</li>
                  <li>• Amount (positive for income, negative for expenses)</li>
                  <li>• Type (income/expense)</li>
                  <li>• Account</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-blue-800">Download Templates:</h5>
                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadTemplate('csv')}
                    className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    <FileText className="w-3 h-3 mr-1" />
                    CSV Template
                  </button>
                  <button
                    onClick={() => downloadTemplate('excel')}
                    className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    <FileSpreadsheet className="w-3 h-3 mr-1" />
                    Excel Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-primary-400 bg-primary-50 scale-105'
              : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <Upload className={`w-12 h-12 mx-auto mb-4 transition-colors ${
              isDragActive ? 'text-primary-500' : 'text-gray-400'
            }`} />
          {isDragActive ? (
              <p className="text-primary-600 font-medium text-lg">Drop the files here...</p>
          ) : (
              <div className="space-y-2">
                <p className="text-gray-600 font-medium">
                Drag & drop files here, or click to select files
              </p>
              <p className="text-sm text-gray-500">
                  Supports: Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf) • Max 10MB per file
                </p>
                <button className="mt-2 btn-primary text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Browse Files
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Preview & Validation */}
      {filePreviews.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Files Ready for Upload ({filePreviews.length})
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={selectAllValidFiles}
                className="btn-secondary text-sm"
                disabled={filePreviews.filter(p => p.validated).length === 0}
              >
                Select All Valid
              </button>
              <button
                onClick={clearSelection}
                className="btn-secondary text-sm"
                disabled={selectedFiles.size === 0}
              >
                Clear Selection
              </button>
              <button
                onClick={() => uploadFiles(Array.from(selectedFiles))}
                className="btn-primary text-sm"
                disabled={selectedFiles.size === 0 || isUploading}
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Selected ({selectedFiles.size})
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filePreviews.map((preview) => (
              <div 
                key={preview.id} 
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  selectedFiles.has(preview.id) 
                    ? 'border-primary-300 bg-primary-50' 
                    : preview.validated 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(preview.id)}
                    onChange={() => toggleFileSelection(preview.id)}
                    disabled={!preview.validated}
                    className="h-4 w-4 text-primary-600"
                  />
                  <div className="flex items-center space-x-2">
                    {preview.file.type.includes('spreadsheet') || preview.file.name.endsWith('.xlsx') ? (
                      <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    ) : preview.file.type === 'text/csv' ? (
                      <FileText className="w-5 h-5 text-blue-600" />
                    ) : (
                      <File className="w-5 h-5 text-gray-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{preview.file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(preview.file.size)} • {preview.file.type || 'Unknown type'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {preview.validated ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Valid</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Invalid</span>
                    </div>
                  )}
                  
                  <button
                    onClick={() => removeFilePreview(preview.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Validation Errors */}
          {filePreviews.some(p => !p.validated) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Validation Errors:</h4>
              <div className="space-y-1">
                {filePreviews
                  .filter(p => !p.validated)
                  .map(preview => (
                    <div key={preview.id} className="text-sm text-red-700">
                      <strong>{preview.file.name}:</strong>
                      <ul className="ml-4 mt-1">
                        {preview.validationErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Uploaded Files</h3>
            <button 
              onClick={async () => {
                try {
                  await refreshAllData();
                  toast.success('Data refreshed successfully!');
                } catch (error) {
                  toast.error('Failed to refresh data');
                }
              }}
              className="btn-secondary text-sm"
            >
              <Database className="w-4 h-4 mr-2" />
              Refresh Data
            </button>
          </div>
          <div className="space-y-3">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)} • {file.uploadedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(file.status)}
                    <span className="text-sm text-gray-600">{getStatusText(file.status)}</span>
                  </div>
                  {file.status === 'completed' && (
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => removeFile(file.id)}
                    className="p-1 text-gray-400 hover:text-danger-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processed Data */}
      {financialData.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Processed Financial Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {financialData.map((data) => (
              <div key={data.id} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-800">
                    {data.type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-green-700">Period: {data.period}</p>
                <p className="text-sm text-green-600">
                  Processed: {data.uploadedAt.toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataIntegration; 