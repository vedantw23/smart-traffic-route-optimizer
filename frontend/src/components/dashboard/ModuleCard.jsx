export default function ModuleCard({ icon: Icon, title, description }) {
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <span className="w-fit rounded-xl bg-blue-50 p-3 text-blue-600"><Icon size={21} aria-hidden="true" /></span>
      <h3 className="mt-4 text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{description}</p>
    </article>
  );
}
