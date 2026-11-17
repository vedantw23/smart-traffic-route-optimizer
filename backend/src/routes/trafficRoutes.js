import { Router } from 'express';
import { getCurrentTraffic, getScenarios, getTrafficStatistics, regenerateTraffic, setTrafficScenario } from '../controllers/trafficController.js';
const trafficRouter = Router();
trafficRouter.get('/scenarios', getScenarios);
trafficRouter.get('/current', getCurrentTraffic);
trafficRouter.post('/scenario', setTrafficScenario);
trafficRouter.get('/statistics', getTrafficStatistics);
trafficRouter.post('/regenerate', regenerateTraffic);
export default trafficRouter;
