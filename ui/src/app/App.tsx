import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { AIFlowPanel } from './components/AIFlowPanel';
import { Toaster } from 'sonner';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  // Listen for route changes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Render AI Flow Panel for /flow route
  if (currentRoute === '/flow') {
    return (
      <>
        <AIFlowPanel />
        <Toaster position="top-right" richColors />
      </>
    );
  }

  // Existing Login/Dashboard routing (unchanged behavior)
  return (
    <>
      <Dashboard />
      <Toaster position="top-right" richColors />
    </>
  );
}
