import {
  Activity, LayoutDashboard, Menu, TrafficCone, X,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard & Route Optimization', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Traffic Simulation', to: '/traffic-simulation', icon: TrafficCone },
  { label: 'Signal Management', to: '/signal-management', icon: Activity },
];

export default function Sidebar({ isOpen, onClose, onOpen }) {
  return (
    <>
      <button type="button" onClick={onOpen} aria-label="Open navigation" className="fixed left-4 top-4 z-30 rounded-lg bg-ink p-2 text-white shadow-lg lg:hidden"><Menu size={21} /></button>
      {isOpen && <button type="button" onClick={onClose} aria-label="Close navigation overlay" className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-ink px-4 py-5 text-slate-200 transition-transform duration-200 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-start justify-between px-3">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-500/20 p-2.5 text-blue-300"><TrafficCone size={23} aria-hidden="true" /></span>
            <div><p className="text-sm font-bold leading-tight text-white">Smart Traffic</p><p className="text-xs text-slate-400">Management System</p></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close navigation" className="rounded-lg p-1 text-slate-400 hover:bg-white/10 lg:hidden"><X size={20} /></button>
        </div>
        <nav aria-label="Main navigation" className="mt-10 space-y-1">
          {navItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={onClose} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
              <Icon size={18} aria-hidden="true" />{label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
