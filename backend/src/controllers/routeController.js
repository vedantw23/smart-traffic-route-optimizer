import { routeService } from '../services/routeService.js';

const getIds = (request) => ({ sourceNodeId: request.body?.sourceNodeId, destinationNodeId: request.body?.destinationNodeId });
const execute = (algorithm) => async (request, response, next) => {
  try { const { sourceNodeId, destinationNodeId } = getIds(request); response.status(200).json(await routeService.calculate(algorithm, sourceNodeId, destinationNodeId)); } catch (error) { next(error); }
};
export const getDijkstraRoute = execute('dijkstra');
export const getAstarRoute = execute('astar');
export const compareRoutes = async (request, response, next) => {
  try { const { sourceNodeId, destinationNodeId } = getIds(request); response.status(200).json({ success: true, data: await routeService.compare(sourceNodeId, destinationNodeId) }); } catch (error) { next(error); }
};
