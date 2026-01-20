import { LiveUpdate } from '../types';
import { Activity, TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LiveFeedProps {
  updates: LiveUpdate[];
  stats: {
    totalActive: number;
    criticalCount: number;
    avgResolutionTime: string;
  };
  lastAIContext?: {
    mode: string;
    dataSource: string;
    contextSize: number | null;
  };
}

export function LiveFeed({ updates, stats, lastAIContext }: LiveFeedProps) {
  const updateIcons = {
    status_change: Activity,
    new_incident: AlertTriangle,
    resolved: CheckCircle2,
    escalated: TrendingUp
  };

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto">
      {/* Live System State */}
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Live System State</h2>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Active Incidents:</span>
            <span className="font-semibold text-slate-900">{stats.totalActive}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Critical:</span>
            <span className="font-semibold text-red-600">{stats.criticalCount}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Avg Resolution:</span>
            <span className="font-semibold text-green-600">{stats.avgResolutionTime}</span>
          </div>
        </div>
      </div>

      {/* AI Context */}
      <div className="p-4 border-b border-slate-200 bg-purple-50/30">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">AI Context</h2>

        {lastAIContext ? (
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-500">Last AI Query:</span>
            </div>
            <div className="pl-3 space-y-1.5 text-slate-600">
              <div>• Mode: <span className="text-slate-900 font-medium">{lastAIContext.mode}</span></div>
              <div>• Data Source: <span className="text-slate-900 font-medium">{lastAIContext.dataSource}</span></div>
              <div>• Incidents Referenced: <span className="text-slate-900 font-medium">
                {lastAIContext.contextSize !== null ? lastAIContext.contextSize : 'N/A'}
              </span></div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">
            No AI queries yet
          </div>
        )}
      </div>

      {/* Live updates section */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-slate-600 animate-pulse" />
          <h3 className="text-slate-900">Live Updates</h3>
        </div>

        {/* Max height for ~5 updates, rest scrollable */}
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {updates.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No recent updates</p>
          ) : (
            updates.map(update => {
              const Icon = updateIcons[update.type];
              return (
                <div key={update.id} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Icon className="w-4 h-4 text-slate-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 mb-1">{update.message}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="text-blue-600">{update.incidentId}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(update.timestamp, { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* System health */}
      <div className="p-4 border-t border-slate-200 mt-auto">
        <h3 className="text-sm text-slate-700 mb-3">System Health</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">API Response</span>
            <span className="text-sm text-green-600">98ms</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '95%' }}></div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-slate-600">Database</span>
            <span className="text-sm text-green-600">Healthy</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-slate-600">AI Engine</span>
            <span className="text-sm text-green-600">Online</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
