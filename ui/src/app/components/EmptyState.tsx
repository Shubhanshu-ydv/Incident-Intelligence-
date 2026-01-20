import { CheckCircle2, Sparkles } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        
        <h2 className="text-2xl text-slate-900 mb-2">All Clear!</h2>
        <p className="text-slate-600 mb-6">
          No active incidents at the moment. The system is operating normally.
        </p>
        
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h3 className="text-slate-900">AI Monitoring Active</h3>
          </div>
          <p className="text-sm text-slate-600">
            Our AI system is continuously monitoring for any anomalies or issues. 
            You'll be notified immediately if anything requires attention.
          </p>
        </div>
        
        <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-2xl text-green-600 mb-1">99.9%</div>
            <div className="text-slate-600">Uptime</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-2xl text-blue-600 mb-1">24/7</div>
            <div className="text-slate-600">Monitoring</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-2xl text-purple-600 mb-1">AI</div>
            <div className="text-slate-600">Powered</div>
          </div>
        </div>
      </div>
    </div>
  );
}
