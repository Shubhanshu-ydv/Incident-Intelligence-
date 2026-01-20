export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'open' | 'investigating' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  status: IncidentStatus;
  location: string;
  createdAt: Date;
  updatedAt: Date;
  timeline: TimelineEvent[];
  aiInsights: string[];
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  event: string;
  user?: string;
}

export interface LiveUpdate {
  id: string;
  incidentId: string;
  message: string;
  timestamp: Date;
  type: 'status_change' | 'new_incident' | 'resolved' | 'escalated';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  timestamp: Date;
  incidentRefs?: string[];
  mode?: string;  // reasoning, keyword, crud
  dataSource?: string;  // Supabase, etc
  contextSize?: number;  // Number of incidents used as context
}
