import { Router } from 'express';
import { getIntersections, getQueues, getSignalStatus, getStatistics, reset, simulate } from '../controllers/signalController.js';
const signalRouter = Router();
signalRouter.get('/intersections', getIntersections); signalRouter.get('/status', getSignalStatus); signalRouter.get('/queues', getQueues); signalRouter.post('/simulate', simulate); signalRouter.get('/statistics', getStatistics); signalRouter.post('/reset', reset);
export default signalRouter;
