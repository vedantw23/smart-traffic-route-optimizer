import { env } from '../config/env.js';

export const getHealth = (_request, response) => {
  response.status(200).json({
    success: true,
    message: 'Smart Traffic Management API is running',
    project: 'Smart Traffic Management and Route Optimization',
    environment: env.nodeEnv,
  });
};
