import http from 'http';
import { createApp } from './app';
import { connectDB } from './config/db';
import { initRedis } from './config/redis';
import { initScanQueue } from './jobs/scanQueue';
import { User } from './models/User';
import { env } from './config/env';
import { logger } from './utils/logger';

const startServer = async () => {
  try {
    logger.info('--- AegisGuard AI Security Assessment Platform ---');
    logger.info(`Starting in ${env.NODE_ENV} mode...`);

    // 1. Connect to Database
    await connectDB();

    // 2. Initialize Redis (if available) & Job Queue
    await initRedis();
    await initScanQueue();

    // 3. Seed Default Admin User if no admin exists
    const adminExists = await User.findOne({ role: 'ADMIN' });
    if (!adminExists) {
      logger.info(`No administrator found. Seeding initial admin account: ${env.ADMIN_EMAIL}`);
      await User.create({
        name: env.ADMIN_NAME,
        email: env.ADMIN_EMAIL.toLowerCase(),
        password: env.ADMIN_PASSWORD,
        role: 'ADMIN',
        isActive: true,
      });
      logger.info('Initial administrator account provisioned successfully.');
    }

    // 4. Initialize Express Application
    const app = createApp();
    const server = http.createServer(app);

    // 5. Start Listening
    server.listen(env.PORT, () => {
      logger.info(`Backend API server running on port: ${env.PORT}`);
      logger.info(`Health check available at: http://localhost:${env.PORT}/api/health`);
    });

    // Graceful Shutdown
    const handleShutdown = (signal: string) => {
      logger.info(`Received ${signal}. Gracefully shutting down...`);
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (err: any) {
    logger.error('Fatal error during application startup:', err.stack || err.message);
    process.exit(1);
  }
};

startServer();
