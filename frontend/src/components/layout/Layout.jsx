import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { getApiHealth } from '../../services/api';
import Header from './Header';
import Sidebar from './Sidebar';

const pageTitles = {
  '/': 'Dashboard & Route Optimization',
  '/route-optimization': 'Route Optimization',
  '/traffic-simulation': 'Traffic Simulation',
  '/signal-management': 'Signal Management',
  '/algorithm-visualizer': 'Algorithm Visualizer',
  '/performance-analysis': 'Performance Analysis',
};

export default function Layout() {
  const [isOpen, setIsOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState('checking');
  const { pathname } = useLocation();

  useEffect(() => {
    let active = true;
    getApiHealth().then(() => active && setSystemStatus('connected')).catch(() => active && setSystemStatus('disconnected'));
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} onOpen={() => setIsOpen(true)} />
      <div className="min-h-screen lg:pl-72"><Header title={pageTitles[pathname] || 'Page Not Found'} systemStatus={systemStatus} /><main className="p-6 sm:p-8"><Outlet /></main></div>
    </div>
  );
}
