import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmDialogProps {
    incidentTitle: string;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
}

export default function DeleteConfirmDialog({ incidentTitle, onConfirm, onCancel }: DeleteConfirmDialogProps) {
    const [loading, setLoading] = React.useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full border border-gray-800">
                {/* Icon */}
                <div className="p-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">Delete Incident?</h3>
                    <p className="text-gray-400 mb-1">
                        Are you sure you want to delete:
                    </p>
                    <p className="text-white font-medium mb-4">
                        "{incidentTitle}"
                    </p>
                    <p className="text-sm text-gray-500">
                        This action cannot be undone.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 p-6 pt-0">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
