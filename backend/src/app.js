import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import healthRouter from './routes/healthRoutes.js';
import graphRouter from './routes/graphRoutes.js';
import routeRouter from './routes/routeRoutes.js';
import trafficRouter from './routes/trafficRoutes.js';
import signalRouter from './routes/signalRoutes.js';
import visualizerRouter from './routes/visualizerRoutes.js';

const app = express();

app.use(cors({
  origin(origin, callback) {
    if (!origin || env.frontendUrls.includes(origin) || origin.endsWith('.vercel.app')) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS configuration.'));
  },
}));
app.use(express.json());

app.use('/api', healthRouter);
app.use('/api/graph', graphRouter);
app.use('/api/routes', routeRouter);
app.use('/api/traffic', trafficRouter);
app.use('/api/signals', signalRouter);
app.use('/api/visualizer', visualizerRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
