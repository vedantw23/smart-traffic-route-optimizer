import { CalendarDays, MapPin } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function Header({ title, systemStatus }) {
  const labels = { checking: 'Checking API', connected: 'API Connected', disconnected: 'API Disconnected' };
  const today = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date());

  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-5 sm:px-8 xl:flex-row xl:items-center xl:justify-between">
      <div className="pl-12 lg:pl-0"><h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1><p className="mt-1 text-sm text-slate-500">Smart Traffic Management and Route Optimization</p></div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"><MapPin size={15} className="text-blue-600" />Pune, Maharashtra</span>
        <span className="hidden h-5 w-px bg-slate-200 sm:block" />
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"><CalendarDays size={15} className="text-blue-600" />{today}</span>
        <StatusBadge state={systemStatus}>{labels[systemStatus]}</StatusBadge>
      </div>
    </header>
  );
}
