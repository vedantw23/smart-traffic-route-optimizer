import { Router } from 'express';
import { compareRoutes, getAstarRoute, getDijkstraRoute } from '../controllers/routeController.js';
const routeRouter = Router();
routeRouter.post('/dijkstra', getDijkstraRoute);
routeRouter.post('/astar', getAstarRoute);
routeRouter.post('/compare', compareRoutes);
export default routeRouter;
