import dotenv from 'dotenv';

dotenv.config();

const parsePort = (value) => {
  const port = Number.parseInt(value, 10);
  return Number.isInteger(port) && port > 0 ? port : 5000;
};

export const env = Object.freeze({
  port: parsePort(process.env.PORT),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrls: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((url) => url.trim()).filter(Boolean),
});
