import { graphService } from '../services/graphService.js';

export const getGraphStatus = async (_request, response, next) => {
  try { response.status(200).json({ success: true, data: await graphService.getStatus() }); } catch (error) { next(error); }
};
export const getGraphMetadata = async (_request, response, next) => {
  try { response.status(200).json({ success: true, data: await graphService.getMetadata() }); } catch (error) { next(error); }
};
export const getGraphStatistics = async (_request, response, next) => {
  try { response.status(200).json({ success: true, data: await graphService.getStatistics() }); } catch (error) { next(error); }
};
export const getGraphNode = async (request, response, next) => {
  try {
    const node = await graphService.getNode(request.params.id);
    if (!node) return response.status(404).json({ success: false, message: `Graph node '${request.params.id}' was not found.` });
    const outgoingEdges = await graphService.getOutgoingEdges(node.id);
    return response.status(200).json({ success: true, data: { ...node, outgoingEdgeCount: outgoingEdges.length, outgoingEdges } });
  } catch (error) { return next(error); }
};

export const getNearestGraphNode = async (request, response, next) => {
  const latitude = Number(request.query.lat);
  const longitude = Number(request.query.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return response.status(400).json({ success: false, message: 'Query parameters lat and lon must be valid coordinates.' });
  }
  try {
    return response.status(200).json({ success: true, data: await graphService.findNearestNode(latitude, longitude) });
  } catch (error) { return next(error); }
};
