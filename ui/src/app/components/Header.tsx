import { Search, Bell, ChevronDown, Shield, Activity, GitBranch } from 'lucide-react';

interface HeaderProps {
  onSearch: (query: string) => void;
  notificationCount: number;
}

export function Header({ onSearch, notificationCount }: HeaderProps) {
  const navigateToFlow = () => {
    window.location.href = '/flow';
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl text-slate-900">Incident Intelligence</h1>
            <p className="text-xs text-slate-500">AI Monitoring System</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Ask AI about incidents, trends, or root causes…"
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* System indicators grouped */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-sm">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-slate-700">Live</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">API: Healthy</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-600">AI: Online</span>
          </div>

          {/* AI Mode indicator */}
          <button
            onClick={navigateToFlow}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full hover:bg-slate-100 transition-colors"
            title="View AI Flow Explanation"
          >
            <GitBranch className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-slate-700">AI Mode: <span className="text-slate-500">OFF</span></span>
          </button>

          {/* User menu */}
          <button className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm text-white">A</span>
            </div>
            <span className="text-sm text-slate-700">ALISS</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
