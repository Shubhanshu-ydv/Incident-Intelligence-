import { useState, useEffect } from 'react';
import { Incident, ChatMessage, LiveUpdate } from '../types';
import { Header } from './Header';
import { IncidentList } from './IncidentList';
import { AIChat } from './AIChat';
import { LiveFeed } from './LiveFeed';
import { IncidentDetailModal } from './IncidentDetailModal';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import IncidentForm, { IncidentFormData } from './IncidentForm';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { apiClient } from '../api/client';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [liveUpdates, setLiveUpdates] = useState<LiveUpdate[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // CRUD state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [deletingIncident, setDeletingIncident] = useState<Incident | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Set up WebSocket for real-time updates
  useEffect(() => {
    apiClient.connectWebSocket((data) => {
      console.log('WebSocket update:', data);
      if (data.type === 'connected') {
        console.log('WebSocket connected to incidents');
      }
      if (data.type === 'incident_created' || data.type === 'incident_updated' || data.type === 'incident_deleted') {
        // Incident changed, trigger refresh after Pathway polls (5s delay)
        setTimeout(() => {
          loadData();
          setIsSyncing(false);
        }, 5500);
      }
    });

    return () => {
      apiClient.disconnectWebSocket();
    };
  }, []);

  const loadData = async () => {
    try {
      const [incidentsData, updatesData] = await Promise.all([
        apiClient.getIncidents(),
        apiClient.getLiveUpdates()
      ]);

      setIncidents(incidentsData);
      setLiveUpdates(updatesData);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data', {
        description: 'Make sure the backend server is running'
      });
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      message,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    try {
      // Get AI response from backend with history
      const aiResponse = await apiClient.sendChatMessage(message, chatMessages);
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to get AI response');
    }
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      handleSendMessage(query);
    }
  };

  const handleMarkResolved = async () => {
    if (!selectedIncident) return;

    try {
      // Update incident status to resolved in database
      const updated = await apiClient.updateIncident(selectedIncident.id, { status: 'resolved' });

      // Update local state
      setIncidents(prev => prev.map(inc => inc.id === updated.id ? updated : inc));

      // Close modal
      setSelectedIncident(null);

      // Show success
      toast.success(`${selectedIncident.id} marked as resolved`);

      // Add to live updates
      const newUpdate: LiveUpdate = {
        id: `lu-${Date.now()}`,
        incidentId: selectedIncident.id,
        message: `${selectedIncident.id} resolved`,
        timestamp: new Date(),
        type: 'resolved'
      };
      setLiveUpdates(prev => [newUpdate, ...prev].slice(0, 10));

      // Refresh data
      loadData();
    } catch (error) {
      console.error('Failed to mark resolved:', error);
      toast.error('Failed to mark incident as resolved');
    }
  };

  // CRUD handlers
  const handleCreateIncident = async (data: IncidentFormData) => {
    try {
      const newIncident = await apiClient.createIncident(data);

      // Optimistic UI: Add with syncing indicator
      const optimisticIncident = {
        ...newIncident,
        _syncing: true // Internal flag for UI
      } as Incident;
      setIncidents(prev => [optimisticIncident, ...prev]);
      setShowCreateModal(false);
      setIsSyncing(true);

      toast.success('Incident created', {
        description: 'Syncing with intelligence layer...'
      });

      // Refresh after Pathway polling cycle (~5s)
      setTimeout(() => {
        loadData();
        setIsSyncing(false);
        toast.success('Incident synced successfully');
      }, 5500);
    } catch (error) {
      console.error('Failed to create incident:', error);
      throw error;
    }
  };

  const handleUpdateIncident = async (data: IncidentFormData) => {
    if (!editingIncident) return;

    try {
      const updated = await apiClient.updateIncident(editingIncident.id, data);
      setIncidents(prev => prev.map(inc => inc.id === updated.id ? updated : inc));
      setEditingIncident(null);
      toast.success('Incident updated successfully');
      loadData(); // Refresh to ensure sync
    } catch (error) {
      console.error('Failed to update incident:', error);
      throw error;
    }
  };

  const handleDeleteIncident = async () => {
    if (!deletingIncident) return;

    try {
      await apiClient.deleteIncident(deletingIncident.id);
      setIncidents(prev => prev.filter(inc => inc.id !== deletingIncident.id));
      setDeletingIncident(null);
      toast.success('Incident deleted successfully');
      loadData(); // Refresh to ensure sync
    } catch (error) {
      console.error('Failed to delete incident:', error);
      toast.error('Failed to delete incident');
    }
  };

  const handleEscalate = async () => {
    if (!selectedIncident) return;

    try {
      // Escalate by upgrading severity to critical
      const updated = await apiClient.updateIncident(selectedIncident.id, { severity: 'critical' });

      // Update local state
      setIncidents(prev => prev.map(inc => inc.id === updated.id ? updated : inc));

      // Update modal if still open
      if (selectedIncident.id === updated.id) {
        setSelectedIncident(updated);
      }

      // Show warning
      toast.warning(`${selectedIncident.id} escalated to CRITICAL severity`);

      // Add to live updates
      const newUpdate: LiveUpdate = {
        id: `lu-${Date.now()}`,
        incidentId: selectedIncident.id,
        message: `${selectedIncident.id} escalated to critical`,
        timestamp: new Date(),
        type: 'escalated'
      };
      setLiveUpdates(prev => [newUpdate, ...prev].slice(0, 10));

      // Refresh data
      loadData();
    } catch (error) {
      console.error('Failed to escalate:', error);
      toast.error('Failed to escalate incident');
    }
  };

  const stats = {
    totalActive: incidents.length,
    criticalCount: incidents.filter(inc => inc.severity === 'critical').length,
    avgResolutionTime: '2.4h'
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-slate-50">
        <Header
          onSearch={handleSearch}
          notificationCount={0}
        />
        <div className="flex-1 flex items-center justify-center">
          <LoadingState />
        </div>
      </div>
    );
  }

  // Show empty state if no incidents
  if (incidents.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      <Header
        onSearch={handleSearch}
        notificationCount={stats.criticalCount}
      />

      <div className="flex-1 flex overflow-hidden">
        <IncidentList
          incidents={incidents}
          onSelectIncident={setSelectedIncident}
          selectedIncidentId={selectedIncident?.id}
          onNewIncident={() => setShowCreateModal(true)}
        />

        <AIChat
          messages={chatMessages}
          onSendMessage={handleSendMessage}
        />

        <LiveFeed
          updates={liveUpdates}
          stats={stats}
          lastAIContext={{
            mode: chatMessages.filter(m => m.sender === 'ai').slice(-1)[0]?.mode || 'Reasoning',
            dataSource: chatMessages.filter(m => m.sender === 'ai').slice(-1)[0]?.dataSource || 'Supabase',
            contextSize: chatMessages.filter(m => m.sender === 'ai').slice(-1)[0]?.contextSize || null
          }}
        />
      </div>

      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onAskAI={handleSendMessage}
          onMarkResolved={handleMarkResolved}
          onEscalate={handleEscalate}
          onEdit={() => {
            setEditingIncident(selectedIncident);
            setSelectedIncident(null);
          }}
          onDelete={() => {
            setDeletingIncident(selectedIncident);
            setSelectedIncident(null);
          }}
        />
      )}

      {/* CRUD Modals */}
      {showCreateModal && (
        <IncidentForm
          onSubmit={handleCreateIncident}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {editingIncident && (
        <IncidentForm
          incident={editingIncident}
          onSubmit={handleUpdateIncident}
          onCancel={() => setEditingIncident(null)}
        />
      )}

      {deletingIncident && (
        <DeleteConfirmDialog
          incidentTitle={deletingIncident.title}
          onConfirm={handleDeleteIncident}
          onCancel={() => setDeletingIncident(null)}
        />
      )}
    </div>
  );
}