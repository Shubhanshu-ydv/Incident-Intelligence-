import { Incident } from '../types';
import { X, MapPin, Clock, TrendingUp, MessageSquare, CheckCircle2, AlertTriangle, Lightbulb, Edit, Trash2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { motion } from 'motion/react';

interface IncidentDetailModalProps {
  incident: Incident;
  onClose: () => void;
  onAskAI: (question: string) => void;
  onMarkResolved: () => void;
  onEscalate: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function IncidentDetailModal({
  incident,
  onClose,
  onAskAI,
  onMarkResolved,
  onEscalate,
  onEdit,
  onDelete
}: IncidentDetailModalProps) {
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-slate-600">{incident.id}</span>
            <span className={`px-3 py-1 rounded text-sm uppercase border ${severityColors[incident.severity]}`}>
              {incident.severity}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${statusColors[incident.status]}`}>
              {incident.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Title and metadata */}
          <h2 className="text-2xl text-slate-900 mb-4">{incident.title}</h2>

          <div className="flex items-center gap-6 mb-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{incident.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Updated {formatDistanceToNow(incident.updatedAt, { addSuffix: true })}</span>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-slate-900 mb-2">Description</h3>
            <p className="text-slate-600">{incident.description}</p>
          </div>

          {/* AI Insights */}
          <div className="mb-6 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              <h3 className="text-slate-900">AI Insights</h3>
            </div>
            <ul className="space-y-2">
              {incident.aiInsights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Timeline */}
          <div className="mb-6">
            <h3 className="text-slate-900 mb-4">Timeline</h3>
            <div className="space-y-4">
              {incident.timeline.map((event, idx) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    {idx < incident.timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-slate-200 flex-1 mt-1"></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-slate-900">{event.event}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                      <span>{format(event.timestamp, 'MMM d, yyyy HH:mm')}</span>
                      {event.user && (
                        <>
                          <span>•</span>
                          <span>{event.user}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Log */}
          <div>
            <h3 className="text-slate-900 mb-3">Activity Log</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-700">System monitoring detected anomaly</p>
                    <p className="text-slate-500">{format(incident.createdAt, 'MMM d, yyyy HH:mm')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-700">AI analysis completed</p>
                    <p className="text-slate-500">3 insights generated</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onAskAI(`Tell me more about ${incident.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Ask AI
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onEscalate}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Escalate
            </button>
            <button
              onClick={onMarkResolved}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Resolved
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}