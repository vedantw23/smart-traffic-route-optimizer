import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/common/StatusBadge';

export default function PlaceholderPage({ title, description, phase, focus }) {
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
      <span className="inline-flex rounded-2xl bg-blue-50 p-4 text-blue-600"><Construction size={28} aria-hidden="true" /></span>
      <StatusBadge state="pending">Coming in {phase}</StatusBadge>
      <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-3 text-base leading-7 text-slate-600">{description}</p>
      <div className="mt-7 rounded-xl bg-slate-50 p-5"><p className="text-sm font-semibold text-slate-800">Planned focus</p><p className="mt-2 text-sm leading-6 text-slate-600">{focus}</p></div>
      <Link to="/" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"><ArrowLeft size={16} />Return to dashboard</Link>
    </section>
  );
}
