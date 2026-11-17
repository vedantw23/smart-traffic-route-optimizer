const stateStyles = {
  connected: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  disconnected: 'bg-rose-50 text-rose-700 ring-rose-200',
  checking: 'bg-amber-50 text-amber-700 ring-amber-200',
  pending: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export default function StatusBadge({ state = 'pending', children }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${stateStyles[state] || stateStyles.pending}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${state === 'connected' ? 'bg-emerald-500' : state === 'disconnected' ? 'bg-rose-500' : state === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
      {children}
    </span>
  );
}
