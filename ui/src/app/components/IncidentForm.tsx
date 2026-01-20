import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Incident } from '../types';

interface IncidentFormProps {
    incident?: Incident; // If provided, form is in edit mode
    onSubmit: (data: IncidentFormData) => Promise<void>;
    onCancel: () => void;
}

export interface IncidentFormData {
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'open' | 'investigating' | 'resolved';
    location: string;
}

export default function IncidentForm({ incident, onSubmit, onCancel }: IncidentFormProps) {
    // Map 'active' to 'open' for the form
    const getFormStatus = (status?: string): 'open' | 'investigating' | 'resolved' => {
        if (status === 'active') return 'open';
        if (status === 'investigating' || status === 'resolved') return status;
        return 'open';
    };

    const [formData, setFormData] = useState<IncidentFormData>({
        title: incident?.title || '',
        description: incident?.description || '',
        severity: incident?.severity || 'medium',
        status: getFormStatus(incident?.status),
        location: incident?.location || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await onSubmit(formData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save incident');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <h2 className="text-2xl font-bold text-white">
                        {incident ? 'Edit Incident' : 'Create New Incident'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="Brief description of the incident"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description *
                        </label>
                        <textarea
                            required
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                            placeholder="Detailed description of what happened"
                        />
                    </div>

                    {/* Severity and Status Row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Severity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Severity *
                            </label>
                            <select
                                required
                                value={formData.severity}
                                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Status *
                            </label>
                            <select
                                required
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            >
                                <option value="open">Open</option>
                                <option value="investigating">Investigating</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Location *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="e.g., Data Center A, Block B"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : (incident ? 'Update Incident' : 'Create Incident')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
