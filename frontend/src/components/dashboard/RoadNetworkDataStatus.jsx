import { Database } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function RoadNetworkDataStatus({ loading, status, statistics, error }) {
  const unavailable = !loading && (!status || !status.loaded);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-3"><span className="rounded-xl bg-blue-50 p-3 text-blue-600"><Database size={21} aria-hidden="true" /></span><div><h2 className="text-lg font-bold text-slate-900">Road Network Data</h2><p className="mt-1 text-sm text-slate-500">OpenStreetMap driving-network dataset</p></div></div><StatusBadge state={loading ? 'checking' : status?.loaded ? 'connected' : 'pending'}>{loading ? 'Loading dataset status' : status?.loaded ? 'Dataset loaded' : 'Not available'}</StatusBadge></div>
      {loading && <p className="mt-5 text-sm text-slate-500">Checking the processed Pune road-network dataset…</p>}
      {unavailable && <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-800"><p>Pune road network dataset has not been generated. Run the data preparation scripts to create it.</p>{status?.message && <p className="mt-1 text-xs text-amber-700">{status.message}</p>}</div>}
      {error && <div className="mt-5 rounded-xl bg-rose-50 p-4 text-sm text-rose-700">Could not retrieve road-network data: {error}</div>}
      {status?.loaded && <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">City</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{status.city}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Directed edges</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{status.edgeCount.toLocaleString()}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Nodes</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{status.nodeCount.toLocaleString()}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Source</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{status.source}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Network type</dt><dd className="mt-1 text-sm font-semibold text-slate-800">Driving</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Generated</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{status.generatedAt ? new Date(status.generatedAt).toLocaleDateString('en-IN') : 'Not recorded'}</dd></div></dl>}
    </section>
  );
}
