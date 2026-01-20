import { useState } from 'react';
import { Incident, SeverityLevel } from '../types';
import { IncidentCard } from './IncidentCard';
import { Plus, Activity, CheckCircle2 } from 'lucide-react';

interface IncidentListProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  selectedIncidentId?: string;
  onNewIncident: () => void;
}

type FilterType = 'all' | SeverityLevel;

export function IncidentList({ incidents, onSelectIncident, selectedIncidentId, onNewIncident }: IncidentListProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [filter, setFilter] = useState<FilterType>('all');

  // Filter by tab first
  const tabIncidents = incidents.filter(inc => {
    const status = (inc.status || '').toLowerCase();
    if (activeTab === 'active') {
      return ['open', 'investigating', 'escalated', 'active', 'monitor'].includes(status);
    }
    return ['resolved', 'closed'].includes(status);
  });

  // Then filter by severity
  const filteredIncidents = filter === 'all'
    ? tabIncidents
    : tabIncidents.filter(inc => (inc.severity || '').toLowerCase() === filter);

  // Calculate tab counts
  const activeCount = incidents.filter(inc => {
    const status = (inc.status || '').toLowerCase();
    return ['open', 'investigating', 'escalated', 'active', 'monitor'].includes(status);
  }).length;

  const resolvedCount = incidents.filter(inc => {
    const status = (inc.status || '').toLowerCase();
    return ['resolved', 'closed'].includes(status);
  }).length;

  // Filter button styling helper
  const getFilterStyle = (value: FilterType, isActive: boolean) => {
    if (isActive) {
      switch (value) {
        case 'critical': return 'bg-red-600 text-white';
        case 'high': return 'bg-orange-500 text-white';
        case 'medium': return 'bg-yellow-600 text-white';
        case 'low': return 'bg-blue-600 text-white';
        default: return 'bg-slate-900 text-white';
      }
    }
    return 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50';
  };

  const filterButtons = [
    { label: 'All', value: 'all' as FilterType, count: tabIncidents.length },
    { label: 'Critical', value: 'critical' as FilterType, count: tabIncidents.filter(i => (i.severity || '').toLowerCase() === 'critical').length },
    { label: 'High', value: 'high' as FilterType, count: tabIncidents.filter(i => (i.severity || '').toLowerCase() === 'high').length },
    { label: 'Medium', value: 'medium' as FilterType, count: tabIncidents.filter(i => (i.severity || '').toLowerCase() === 'medium').length },
    { label: 'Low', value: 'low' as FilterType, count: tabIncidents.filter(i => (i.severity || '').toLowerCase() === 'low').length }
  ];

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Incidents</h2>
        <button
          onClick={onNewIncident}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 bg-slate-50 flex gap-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'active'
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <Activity className="w-4 h-4" />
          Active
          <span className={`px-1.5 py-0.5 rounded text-xs ${activeTab === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
            {activeCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('resolved')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'resolved'
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Resolved
          <span className={`px-1.5 py-0.5 rounded text-xs ${activeTab === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
            {resolvedCount}
          </span>
        </button>
      </div>

      {/* Filter pills */}
      <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap gap-2">
        {filterButtons.map(btn => (
          <button
            key={btn.value}
            onClick={() => setFilter(btn.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${getFilterStyle(btn.value, filter === btn.value)}`}
          >
            {btn.label} {btn.count}
          </button>
        ))}
      </div>

      {/* Incident list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No {activeTab} incidents</p>
          </div>
        ) : (
          filteredIncidents.map(incident => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onClick={() => onSelectIncident(incident)}
              isSelected={selectedIncidentId === incident.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
