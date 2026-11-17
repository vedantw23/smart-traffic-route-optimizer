import { signalSimulationService } from '../services/signalSimulationService.js';
export const getIntersections = (_request, response) => response.json({ success: true, data: signalSimulationService.getIntersections() });
export const getSignalStatus = (_request, response) => response.json({ success: true, data: signalSimulationService.getStatus() });
export const getQueues = (_request, response) => response.json({ success: true, data: signalSimulationService.getQueues() });
export const simulate = (request, response, next) => { try { response.json({ success: true, data: signalSimulationService.simulate(request.body?.intersectionId, request.body?.trafficLevel) }); } catch (error) { next(error); } };
export const getStatistics = (_request, response) => response.json({ success: true, data: signalSimulationService.getStatistics() });
export const reset = (_request, response) => response.json({ success: true, data: signalSimulationService.reset() });
