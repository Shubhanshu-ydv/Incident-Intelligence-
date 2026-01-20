import { Incident } from '../types';
import { MapPin, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'motion/react';

interface IncidentCardProps {
  incident: Incident;
  onClick: () => void;
  isSelected?: boolean;
}

export function IncidentCard({ incident, onClick, isSelected }: IncidentCardProps) {
  const severityColors = {
    critical: 'bg-red-100 text-red-700 border-red-300',
    high: 'bg-orange-100 text-orange-700 border-orange-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    low: 'bg-blue-100 text-blue-700 border-blue-300'
  };

  const statusColors = {
    active: 'bg-slate-100 text-slate-700',
    investigating: 'bg-purple-100 text-purple-700',
    resolved: 'bg-green-100 text-green-700'
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
    >
      {/* Top row: ID and SEVERITY */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-medium text-slate-600">{incident.id}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase border ${severityColors[incident.severity]}`}>
          {incident.severity}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2">{incident.title}</h3>

      {/* Bottom row: status, location, timestamp */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className={`px-1.5 py-0.5 rounded text-xs ${statusColors[incident.status as keyof typeof statusColors] || 'bg-slate-100 text-slate-700'}`}>
          {incident.status}
        </span>
        <span className="text-slate-300">•</span>
        <span>{incident.location}</span>
        <span className="text-slate-300">•</span>
        <span>{formatDistanceToNow(incident.updatedAt, { addSuffix: true })}</span>
      </div>
    </motion.button>
  );
}