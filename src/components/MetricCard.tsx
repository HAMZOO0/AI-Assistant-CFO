import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable' | 'neutral';
  icon: React.ReactNode;
  format?: 'currency' | 'number' | 'percentage';
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend,
  icon,
  format = 'number',
  subtitle
}) => {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-success-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-danger-500" />;
      case 'neutral':
        return <Minus className="w-4 h-4 text-gray-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getChangeColor = () => {
    if (format === 'currency' && title.toLowerCase().includes('expense')) {
      return change < 0 ? 'text-success-600' : 'text-danger-600';
    }
    return change >= 0 ? 'text-success-600' : 'text-danger-600';
  };

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-primary-100 rounded-lg">
            {icon}
          </div>
          <div>
            <span className="metric-label">{title}</span>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {getTrendIcon()}
      </div>
      <div className="metric-value">{formatValue(value)}</div>
      <div className="flex items-center space-x-1 mt-1">
        <span className={`metric-change ${getChangeColor()}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </span>
        <span className="text-xs text-gray-500">vs last month</span>
      </div>
    </div>
  );
};

export default MetricCard; 