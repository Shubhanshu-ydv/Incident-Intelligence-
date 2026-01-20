import { useState } from 'react';
import { Shield, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-blue-500 p-3 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-3xl text-white text-center mb-2">Incident Intelligence</h1>
          <p className="text-blue-200 text-center mb-8">Real-time AI Monitoring System</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm text-blue-100 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@incident-intel.com"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm text-blue-100 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors duration-200"
            >
              Sign In
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-200">
              Demo mode: Click "Sign In" to access the dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
