// src/app.ts
import express from 'express';
import type{ Application, Request, Response,NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import authRoutes from './api/routes/auth.routes';
import logRoutes from './api/routes/auth.routes';

// Add this below your auth route (around line 24):

// We will build these custom middlewares next:
// import { errorHandler } from './api/middlewares/errorHandler';
// import { requestLogger } from './api/middlewares/requestLogger';

const app: Application = express();

// 1. Security & Utility Middlewares
app.use(helmet()); // Sets secure HTTP headers
app.use(cors({ origin: process.env.ALLOWED_ORIGINS || '*' }));
app.use(compression()); // Compresses response bodies
app.use(express.json({ limit: '1mb' })); // Prevents large payload DDoS attacks
app.use(express.urlencoded({ extended: true }));

// 2. Logging
// app.use(requestLogger); 

// 3. Health Check (Crucial for Docker/Kubernetes)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', service: 'neuralops-api-gateway', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/logs', logRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  const statusCode = err.statusCode || 400;
  res.status(statusCode).json({ success: false, message: err.message });
});

export default app;