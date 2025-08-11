import React from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  Lightbulb, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { AIInsight } from '../types';

interface InsightCardProps {
  insight: AIInsight;
}

const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const getIcon = () => {
    switch (insight.type) {
      case 'anomaly':
        return <AlertTriangle className="w-5 h-5 text-warning-500" />;
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-success-500" />;
      case 'recommendation':
        return <Lightbulb className="w-5 h-5 text-primary-500" />;
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-danger-500" />;
      default:
        return <Lightbulb className="w-5 h-5 text-gray-500" />;
    }
  };

  const getSeverityColor = () => {
    switch (insight.severity) {
      case 'critical':
        return 'border-danger-200 bg-danger-50';
      case 'high':
        return 'border-warning-200 bg-warning-50';
      case 'medium':
        return 'border-warning-200 bg-warning-50';
      case 'low':
        return 'border-success-200 bg-success-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getCategoryColor = () => {
    switch (insight.category) {
      case 'revenue':
        return 'bg-success-100 text-success-800';
      case 'expenses':
        return 'bg-warning-100 text-warning-800';
      case 'cash_flow':
        return 'bg-primary-100 text-primary-800';
      case 'compliance':
        return 'bg-danger-100 text-danger-800';
      case 'efficiency':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (timestamp: Date | undefined) => {
    if (!timestamp || !(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
      return 'Just now';
    }
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className={`border rounded-lg p-4 ${getSeverityColor()}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {insight.title}
            </h4>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor()}`}>
                {insight.category.replace('_', ' ')}
              </span>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {formatTimeAgo(insight.timestamp)}
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {insight.description}
          </p>
          
          {insight.actionable && insight.action && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Suggested action:
              </span>
              <button className="flex items-center text-xs text-primary-600 hover:text-primary-700 font-medium">
                {insight.action}
                <ArrowRight className="w-3 h-3 ml-1" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightCard; 