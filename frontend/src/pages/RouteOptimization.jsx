import { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart3, RotateCcw, Route as RouteIcon } from 'lucide-react';
import LocationDetails from '../components/map/LocationDetails';
import PuneMap from '../components/map/PuneMap';
import { compareRoutes, getAstarRoute, getDijkstraRoute, getGraphStatus, getNearestGraphNode } from '../services/api';

const ROUTE_STATE_KEY = 'smart-traffic-route-state';
const readSavedState = () => {
  try { return JSON.parse(sessionStorage.getItem(ROUTE_STATE_KEY)) || {}; } catch { return {}; }
};

const toRadians = (degrees) => degrees * Math.PI / 180;
const straightLineDistance = (first, second) => {
  if (!first || !second) return null;
  const radius = 6_371_008.8;
  const latDelta = toRadians(second.lat - first.lat);
  const lonDelta = toRadians(second.lon - first.lon);
  const a = Math.sin(latDelta / 2) ** 2 + Math.cos(toRadians(first.lat)) * Math.cos(toRadians(second.lat)) * Math.sin(lonDelta / 2) ** 2;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(a)));
};
const isInsideCoverage = (selection, bounds) => !selection || !bounds || (selection.lat >= bounds[0][0] && selection.lat <= bounds[1][0] && selection.lon >= bounds[0][1] && selection.lon <= bounds[1][1]);

export default function RouteOptimization() {
  const saved = readSavedState();
  const [start, setStart] = useState(saved.start || null);
  const [destination, setDestination] = useState(saved.destination || null);
  const [selectionMode, setSelectionMode] = useState(saved.selectionMode || 'start');
  const [loading, setLoading] = useState({ start: false, destination: false });
  const [errors, setErrors] = useState({ start: '', destination: '' });
  const [routes, setRoutes] = useState(saved.routes || { dijkstra: null, astar: null });
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [routeVisibility, setRouteVisibility] = useState({ dijkstra: true, astar: true });
  const [coverageBounds, setCoverageBounds] = useState(null);
  const requestVersions = useRef({ start: 0, destination: 0 });
  const directDistance = straightLineDistance(start, destination);

  useEffect(() => {
    sessionStorage.setItem(ROUTE_STATE_KEY, JSON.stringify({ start, destination, selectionMode, routes }));
  }, [start, destination, selectionMode, routes]);
  useEffect(() => { getGraphStatus().then(({ data }) => { const bounds = data.data?.bounds; if (bounds) setCoverageBounds([[bounds.south, bounds.west], [bounds.north, bounds.east]]); }).catch(() => setCoverageBounds(null)); }, []);
  useEffect(() => {
    if (!coverageBounds) return;
    const invalidStart = !isInsideCoverage(start, coverageBounds);
    const invalidDestination = !isInsideCoverage(destination, coverageBounds);
    if (invalidStart) setStart(null);
    if (invalidDestination) setDestination(null);
    if (invalidStart || invalidDestination) {
      setRoutes({ dijkstra: null, astar: null });
      setErrors({ start: '', destination: '' });
      setRouteError('Previous selections outside the loaded map area were cleared. Choose points inside the displayed coverage.');
      setSelectionMode('start');
    }
  }, [coverageBounds, start, destination]);

  const chooseMode = useCallback((mode) => setSelectionMode(mode), []);
  const reset = useCallback(() => {
    requestVersions.current.start += 1;
    requestVersions.current.destination += 1;
    setStart(null); setDestination(null); setErrors({ start: '', destination: '' }); setLoading({ start: false, destination: false }); setSelectionMode('start'); setRoutes({ dijkstra: null, astar: null }); setRouteError(''); sessionStorage.removeItem(ROUTE_STATE_KEY);
  }, []);
  const resetRoute = useCallback(() => { setRoutes({ dijkstra: null, astar: null }); setRouteError(''); }, []);
  const selectCoordinate = useCallback(async ({ lat, lon }) => {
    const target = selectionMode;
    const version = ++requestVersions.current[target];
    const setter = target === 'start' ? setStart : setDestination;
    setter({ lat, lon, node: null });
    setLoading((current) => ({ ...current, [target]: true }));
    setErrors((current) => ({ ...current, [target]: '' }));
    try {
      const response = await getNearestGraphNode(lat, lon);
      if (requestVersions.current[target] === version) setter({ lat, lon, node: response.data.data });
    } catch (error) {
      if (requestVersions.current[target] === version) setErrors((current) => ({ ...current, [target]: error.response?.data?.message || 'Nearest graph node could not be found.' }));
    } finally {
      if (requestVersions.current[target] === version) setLoading((current) => ({ ...current, [target]: false }));
    }
    if (target === 'start') setSelectionMode('destination');
  }, [selectionMode]);
  const requestRoute = useCallback(async (type) => {
    if (!start?.node || !destination?.node) { setRouteError('Select locations that have resolved graph nodes before calculating a route.'); return; }
    setRouteLoading(true); setRouteError('');
    try {
      if (type === 'compare') {
        const response = await compareRoutes(start.node.nodeId, destination.node.nodeId);
        setRoutes(response.data.data);
      } else {
        const response = await (type === 'dijkstra' ? getDijkstraRoute(start.node.nodeId, destination.node.nodeId) : getAstarRoute(start.node.nodeId, destination.node.nodeId));
        setRoutes((current) => ({ ...current, [type]: response.data }));
      }
    } catch (error) { setRouteError(error.response?.data?.message || 'Route calculation could not be completed.'); }
    finally { setRouteLoading(false); }
  }, [start, destination]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-6"><h2 className="text-2xl font-bold tracking-tight text-slate-900">Find the shortest, least-travel-time route.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Choose a start and destination on the map. The application snaps each click to its nearest loaded road-graph node, then uses Dijkstra or A* to find the shortest route with the lowest simulated travel time.</p></section>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {coverageBounds ? <PuneMap start={start} destination={destination} selectionMode={selectionMode} onCoordinateSelect={selectCoordinate} disabled={false} dijkstraRoute={routes.dijkstra} astarRoute={routes.astar} showDijkstra={routeVisibility.dijkstra} showAstar={routeVisibility.astar} coverageBounds={coverageBounds} /> : <div className="flex h-[520px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 sm:h-[650px]">Loading available road-network map area…</div>}
        <aside className="space-y-4"><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Selection workflow</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => chooseMode('start')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${selectionMode === 'start' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}>1. Start</button><button type="button" onClick={() => chooseMode('destination')} className={`rounded-lg px-3 py-2 text-xs font-semibold ${selectionMode === 'destination' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700'}`}>2. Destination</button></div></div>
          <LocationDetails label="Start location" selection={start} loading={loading.start} error={errors.start} color="bg-emerald-50 text-emerald-600" onChange={() => chooseMode('start')} />
          <LocationDetails label="Destination" selection={destination} loading={loading.destination} error={errors.destination} color="bg-rose-50 text-rose-600" onChange={() => chooseMode('destination')} />
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm font-bold text-slate-900">Route calculation</p><button type="button" disabled={routeLoading} onClick={() => requestRoute('dijkstra')} className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">Find Dijkstra route</button><button type="button" disabled={routeLoading} onClick={() => requestRoute('astar')} className="w-full rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">Find A* route</button><button type="button" disabled={routeLoading} onClick={() => requestRoute('compare')} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"><BarChart3 size={14} />Compare algorithms</button><button type="button" onClick={resetRoute} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">Reset route</button>{routeLoading && <p className="text-xs text-slate-500">Calculating on the directed road graph…</p>}{routeError && <p className="text-xs leading-5 text-rose-700">{routeError}</p>}</div>
          <button type="button" onClick={reset} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"><RotateCcw size={16} />Reset selection</button>
        </aside>
      </div>
      <section><article className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><RouteIcon size={18} className="text-blue-600" /><h3 className="font-bold text-slate-900">Selection summary</h3></div>{directDistance === null ? <p className="mt-3 text-sm text-slate-500">Select both locations to view their straight-line separation.</p> : <p className="mt-3 text-sm leading-6 text-slate-600"><span className="font-semibold text-slate-900">Straight-line distance: {(directDistance / 1000).toFixed(2)} km.</span> This is a geodesic/Haversine measurement between clicks, not a road travel distance.</p>}</article></section>
      {(routes.dijkstra || routes.astar) && <section className="grid gap-4 lg:grid-cols-2">{[['dijkstra', 'Dijkstra', 'text-blue-700'], ['astar', 'A*', 'text-violet-700']].map(([key, label, headingClass]) => { const route = routes[key]; return <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><h3 className={`font-bold ${headingClass}`}>{label}</h3><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={routeVisibility[key]} onChange={(event) => setRouteVisibility((current) => ({ ...current, [key]: event.target.checked }))} />Show line</label></div>{route?.success ? <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Distance</dt><dd className="font-semibold">{(route.totalDistanceMeters / 1000).toFixed(2)} km</dd></div><div><dt className="text-slate-500">Nodes visited</dt><dd className="font-semibold">{route.nodesVisited}</dd></div><div><dt className="text-slate-500">Edges explored</dt><dd className="font-semibold">{route.edgesExplored}</dd></div><div><dt className="text-slate-500">Execution</dt><dd className="font-semibold">{route.executionTimeMs} ms</dd></div></dl> : <p className="mt-4 text-sm text-rose-700">{route?.message || 'No result calculated.'}</p>}</article>; })}</section>}
    </div>
  );
}
