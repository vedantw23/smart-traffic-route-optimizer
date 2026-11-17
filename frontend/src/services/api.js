import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' },
});

export const getApiHealth = () => api.get('/health');
export const getGraphStatus = () => api.get('/graph/status');
export const getGraphStatistics = () => api.get('/graph/statistics');
export const getNearestGraphNode = (lat, lon) => api.get('/graph/nearest-node', { params: { lat, lon } });
export const getDijkstraRoute = (sourceNodeId, destinationNodeId) => api.post('/routes/dijkstra', { sourceNodeId, destinationNodeId });
export const getAstarRoute = (sourceNodeId, destinationNodeId) => api.post('/routes/astar', { sourceNodeId, destinationNodeId });
export const compareRoutes = (sourceNodeId, destinationNodeId) => api.post('/routes/compare', { sourceNodeId, destinationNodeId });
export const getTrafficScenarios = () => api.get('/traffic/scenarios');
export const getTrafficCurrent = () => api.get('/traffic/current');
export const getTrafficStatistics = () => api.get('/traffic/statistics');
export const setTrafficScenario = (scenario) => api.post('/traffic/scenario', { scenario });
export const regenerateTraffic = (seed) => api.post('/traffic/regenerate', seed === undefined ? {} : { seed });
export const getSignalIntersections = () => api.get('/signals/intersections');
export const getSignalStatus = () => api.get('/signals/status');
export const getSignalStatistics = () => api.get('/signals/statistics');
export const simulateSignals = (data = {}) => api.post('/signals/simulate', data);
export const resetSignals = () => api.post('/signals/reset');
export const getRouteTrace = (data) => api.post('/visualizer/route', data);
export const getKruskalTrace = (data) => api.post('/visualizer/kruskal', data);
export const getRouteAnalysis = (data) => api.post('/visualizer/analysis/route-comparison', data);

export default api;
