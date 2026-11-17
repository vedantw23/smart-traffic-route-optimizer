import { MapPin, Navigation } from 'lucide-react';

export default function LocationDetails({ label, selection, loading, error, color, onChange }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><span className={`rounded-lg p-2 ${color}`}><MapPin size={16} aria-hidden="true" /></span><h3 className="text-sm font-bold text-slate-900">{label}</h3></div><button type="button" onClick={onChange} className="text-xs font-semibold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">Change</button></div>
      {!selection && <p className="mt-4 text-sm leading-6 text-slate-500">Click the map to select this location.</p>}
      {selection && <dl className="mt-4 space-y-2 text-xs"><div className="flex justify-between gap-2"><dt className="text-slate-500">Latitude</dt><dd className="font-medium text-slate-800">{selection.lat.toFixed(6)}</dd></div><div className="flex justify-between gap-2"><dt className="text-slate-500">Longitude</dt><dd className="font-medium text-slate-800">{selection.lon.toFixed(6)}</dd></div>{loading && <div className="flex items-center gap-2 pt-1 text-amber-700"><Navigation size={14} className="animate-pulse" />Finding nearest graph node…</div>}{selection.node && <><div className="border-t border-slate-100 pt-2"><dt className="text-slate-500">Nearest graph node</dt><dd className="mt-1 break-all font-mono text-[11px] font-semibold text-slate-800">{selection.node.nodeId}</dd></div><div className="flex justify-between gap-2"><dt className="text-slate-500">Node offset</dt><dd className="font-medium text-slate-800">{selection.node.distanceMeters.toFixed(1)} m</dd></div></>}{error && <p className="pt-1 text-xs leading-5 text-rose-700">{error}</p>}</dl>}
    </section>
  );
}
