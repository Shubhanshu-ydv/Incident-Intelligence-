import { SeverityLevel } from '../types';

export const getSeverityColor = (severity: SeverityLevel) => {
  const colors = {
    critical: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'blue'
  };
  return colors[severity];
};

export const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};
