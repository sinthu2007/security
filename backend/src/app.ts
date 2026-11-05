
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorMiddleware';

// Route imports
import authRoutes from './routes/authRoutes';
import websiteRoutes from './routes/websiteRoutes';
import scanRoutes from './routes/scanRoutes';
import reportRoutes from './routes/reportRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';

export const createApp = (): Application => {
  const app: Application = express();

  // 1. Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: {
        policy: 'cross-origin',
      },
    })
  );

  // 2. CORS Configuration
  const allowedOrigins = [
    env.CLIENT_URL,
    'https://frontend-blush-ten-5d5zif4lfg.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ].filter((origin): origin is string => Boolean(origin));

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests without an origin (Postman, curl, etc.)
        if (!origin) {
          return callback(null, true);
        }

        // Allow only trusted frontend origins
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        // Reject unknown origins
        return callback(new Error('Not allowed by CORS'));
      },

      credentials: true,

      methods: [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS',
      ],

      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
      ],
    })
  );

  // 3. Request Parsing and Cookies
  app.use(express.json({ limit: '2mb' }));

  app.use(
    express.urlencoded({
      extended: true,
      limit: '2mb',
    })
  );

  app.use(cookieParser());

  // 4. Global API Rate Limiter
  app.use('/api', apiRateLimiter);

  // 5. Health Check Endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'AegisGuard Security Assessment Engine',
      environment: env.NODE_ENV,
    });
  });

  // 6. API Routes
  app.use('/api/auth', authRoutes);

  app.use('/api/websites', websiteRoutes);

  app.use('/api/scans', scanRoutes);

  app.use('/api/reports', reportRoutes);

  app.use('/api/notifications', notificationRoutes);

  app.use('/api/admin', adminRoutes);

  // 7. 404 API Route Handler
  app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `API endpoint '${req.originalUrl}' does not exist.`,
    });
  });

  // 8. Centralized Error Handling
  app.use(errorHandler);

  return app;
};
