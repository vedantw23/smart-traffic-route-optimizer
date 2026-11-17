import { Router } from 'express';
import { getGraphMetadata, getGraphNode, getGraphStatistics, getGraphStatus, getNearestGraphNode } from '../controllers/graphController.js';

const graphRouter = Router();
graphRouter.get('/status', getGraphStatus);
graphRouter.get('/statistics', getGraphStatistics);
graphRouter.get('/metadata', getGraphMetadata);
graphRouter.get('/nearest-node', getNearestGraphNode);
graphRouter.get('/node/:id', getGraphNode);
export default graphRouter;
