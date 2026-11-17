import { trafficSimulationService } from '../services/trafficSimulationService.js';

export const getScenarios = (_request, response) => response.status(200).json({ success: true, data: { scenarios: trafficSimulationService.getScenarios(), simulated: true } });
export const getCurrentTraffic = async (_request, response, next) => { try { response.status(200).json({ success: true, data: await trafficSimulationService.getCurrent() }); } catch (error) { next(error); } };
export const setTrafficScenario = async (request, response, next) => { try { response.status(200).json({ success: true, data: await trafficSimulationService.setScenario(request.body?.scenario) }); } catch (error) { next(error); } };
export const getTrafficStatistics = async (_request, response, next) => { try { response.status(200).json({ success: true, data: await trafficSimulationService.getStatistics() }); } catch (error) { next(error); } };
export const regenerateTraffic = async (request, response, next) => { try { response.status(200).json({ success: true, data: await trafficSimulationService.regenerate(request.body?.seed) }); } catch (error) { next(error); } };
