import { useCallback, useEffect, useState } from 'react';
import { Activity, GitBranch, Map, Route, TrafficCone } from 'lucide-react';
import ModuleCard from '../components/dashboard/ModuleCard';
import StatCard from '../components/dashboard/StatCard';
import RoadNetworkDataStatus from '../components/dashboard/RoadNetworkDataStatus';
import { getGraphStatistics, getGraphStatus } from '../services/api';

const modules = [
  { title: 'Route Optimization', description: 'Compare Dijkstra and A* to identify efficient journeys across Pune.', icon: Route },
  { title: 'Traffic Simulation', description: 'Model low, medium, and high traffic conditions for realistic experiments.', icon: TrafficCone },
  { title: 'Signal Management', description: 'Explore a greedy approach to traffic signal scheduling at junctions.', icon: Activity },
];

export default function Dashboard() {
  const [networkState, setNetworkState] = useState({ loading: true, status: null, statistics: null, error: '' });
  const loadNetworkStatus = useCallback(async () => {
    setNetworkState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const { data } = await getGraphStatus();
      let statistics = null;
      if (data.data.loaded) {
        const statisticsResponse = await getGraphStatistics();
        statistics = statisticsResponse.data.data;
      }
      setNetworkState({ loading: false, status: data.data, statistics, error: '' });
    } catch (error) {
      setNetworkState({ loading: false, status: null, statistics: null, error: error.response?.data?.message || 'The API could not be reached.' });
    }
  }, []);

  useEffect(() => { loadNetworkStatus(); }, [loadNetworkStatus]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-6 sm:p-8"><p className="text-sm font-semibold text-blue-700">PHASE 2 · ROAD-NETWORK PIPELINE</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Building a real, directed model of Pune&apos;s roads.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">The project now includes an OpenStreetMap-to-graph pipeline. Route algorithms, traffic simulation, and map rendering remain intentionally scheduled for later phases.</p></section>
      <section aria-label="System overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Map} label="Road Network" value={networkState.loading ? 'Checking Dataset' : networkState.status?.loaded ? 'Dataset Loaded' : 'Awaiting Data'} tone="blue" />
        <StatCard icon={TrafficCone} label="Traffic Status" value="Simulation Pending" tone="orange" />
        <StatCard icon={Activity} label="Active Signals" value="Not Configured" tone="green" />
        <StatCard icon={GitBranch} label="Algorithms" value="0 Implemented" tone="slate" />
      </section>
      <RoadNetworkDataStatus {...networkState} onRetry={loadNetworkStatus} />
      <section><div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-lg font-bold text-slate-900">System modules</h2><p className="mt-1 text-sm text-slate-500">Available tools in the current project.</p></div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{modules.map((module) => <ModuleCard key={module.title} {...module} />)}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-lg font-bold text-slate-900">DAA objectives</h2><p className="mt-3 text-sm leading-6 text-slate-600">The project applies core design and analysis techniques to a practical urban-mobility problem.</p><ul className="mt-4 space-y-3 text-sm text-slate-600"><li>• Shortest-path strategies: Dijkstra and A*</li><li>• Greedy signal scheduling decisions</li><li>• Kruskal&apos;s minimum spanning tree</li><li>• Algorithm performance comparison</li></ul></section>
    </div>
  );
}
