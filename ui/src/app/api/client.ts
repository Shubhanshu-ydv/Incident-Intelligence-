// API Client for Incident Intelligence Backend
// Connects React UI to Python FastAPI server

import { Incident, LiveUpdate, ChatMessage } from '../types';

const API_BASE_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000';

// WebSocket endpoint for real-time updates
const WS_INCIDENTS_URL = `${WS_URL}/ws/incidents`;

class APIClient {
    private ws: WebSocket | null = null;
    private wsCallbacks: ((data: any) => void)[] = [];

    // Fetch all incidents from Pathway (via FastAPI proxy)
    async getIncidents(): Promise<Incident[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/incidents`);
            if (!response.ok) return [];
            const data = await response.json();
            return data.map((inc: any) => ({
                ...inc,
                createdAt: new Date(inc.createdAt),
                updatedAt: new Date(inc.updatedAt),
                timeline: inc.timeline || [],
                aiInsights: inc.aiInsights || []
            }));
        } catch (error) {
            console.error('Failed to fetch incidents:', error);
            return [];
        }
    }

    // Fetch a specific incident
    // NOTE: Individual incidents come via AI chat responses now
    async getIncident(id: string): Promise<Incident | null> {
        // Individual incidents are accessed through AI chat
        return null;
    }

    // Send chat message and get AI response
    async sendChatMessage(message: string, history: ChatMessage[] = []): Promise<ChatMessage> {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message, history }),
        });

        if (!response.ok) throw new Error('Failed to send message');
        const data = await response.json();

        return {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            message: data.response,
            timestamp: new Date(data.timestamp),
            incidentRefs: data.incidentRefs,
            mode: data.mode,
            dataSource: data.dataSource,
            contextSize: data.contextSize
        };
    }

    // Get live updates
    async getLiveUpdates(): Promise<LiveUpdate[]> {
        const response = await fetch(`${API_BASE_URL}/api/live-updates`);
        if (!response.ok) throw new Error('Failed to fetch updates');
        const data = await response.json();
        return data.map((update: any) => ({
            ...update,
            timestamp: new Date(update.timestamp)
        }));
    }

    // Connect to WebSocket for real-time updates
    connectWebSocket(onUpdate: (data: any) => void) {
        if (this.ws) {
            this.ws.close();
        }

        this.ws = new WebSocket(WS_INCIDENTS_URL);

        this.ws.onopen = () => {
            console.log('✓ WebSocket connected');
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.wsCallbacks.forEach(cb => cb(data));
            onUpdate(data);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected. Reconnecting in 3s...');
            setTimeout(() => this.connectWebSocket(onUpdate), 3000);
        };
    }

    disconnectWebSocket() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    // Create a new incident
    async createIncident(data: {
        title: string;
        description: string;
        severity: 'critical' | 'high' | 'medium' | 'low';
        status: 'open' | 'investigating' | 'resolved';
        location: string;
    }): Promise<Incident> {
        const response = await fetch(`${API_BASE_URL}/api/incidents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to create incident');
        const incident = await response.json();
        return {
            ...incident,
            createdAt: new Date(incident.createdAt),
            updatedAt: new Date(incident.updatedAt),
            timeline: incident.timeline.map((t: any) => ({
                ...t,
                timestamp: new Date(t.timestamp)
            }))
        };
    }

    // Update an existing incident
    async updateIncident(id: string, data: {
        title?: string;
        description?: string;
        severity?: 'critical' | 'high' | 'medium' | 'low';
        status?: 'open' | 'investigating' | 'resolved';
        location?: string;
    }): Promise<Incident> {
        const response = await fetch(`${API_BASE_URL}/api/incidents/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error('Failed to update incident');
        const incident = await response.json();
        return {
            ...incident,
            createdAt: new Date(incident.createdAt),
            updatedAt: new Date(incident.updatedAt),
            timeline: incident.timeline.map((t: any) => ({
                ...t,
                timestamp: new Date(t.timestamp)
            }))
        };
    }

    // Soft delete an incident
    async deleteIncident(id: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/api/incidents/${id}/soft-delete`, {
            method: 'POST',
        });

        if (!response.ok) throw new Error('Failed to delete incident');
    }

    // Search incidents by keyword
    async searchIncidents(query: string): Promise<Incident[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/incidents/search?q=${encodeURIComponent(query)}`);
            if (!response.ok) return [];
            const data = await response.json();
            return data.map((inc: any) => ({
                ...inc,
                createdAt: new Date(inc.createdAt),
                updatedAt: new Date(inc.updatedAt),
                timeline: inc.timeline || [],
                aiInsights: inc.aiInsights || []
            }));
        } catch (error) {
            console.error('Failed to search incidents:', error);
            return [];
        }
    }
}

export const apiClient = new APIClient();
