import { kruskalTrace, routeComparison, routeTrace } from '../services/visualizerService.js';
export const visualizeRoute = async (request, response, next) => { try { response.json({ success: true, data: await routeTrace(request.body || {}) }); } catch (error) { next(error); } };
export const visualizeKruskal = async (request, response, next) => { try { response.json({ success: true, data: await kruskalTrace(request.body || {}) }); } catch (error) { next(error); } };
export const analyzeRoute = async (request, response, next) => { try { response.json({ success: true, data: await routeComparison(request.body || {}) }); } catch (error) { next(error); } };
