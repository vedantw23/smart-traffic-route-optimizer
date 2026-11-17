import { Route, Routes } from 'react-router-dom';
import Layout from './components/layout/Layout';
import NotFound from './pages/NotFound';
import RouteOptimization from './pages/RouteOptimization';
import SignalManagement from './pages/SignalManagement';
import TrafficSimulation from './pages/TrafficSimulation';

export default function App() {
  return <Routes><Route element={<Layout />}><Route index element={<RouteOptimization />} /><Route path="route-optimization" element={<RouteOptimization />} /><Route path="traffic-simulation" element={<TrafficSimulation />} /><Route path="signal-management" element={<SignalManagement />} /><Route path="*" element={<NotFound />} /></Route></Routes>;
}
