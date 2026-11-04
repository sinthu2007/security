import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', false);
    logger.info(`Attempting to connect to MongoDB at: ${env.MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@')}`);
    
    // Set a 5-second timeout for initial connection attempt
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    logger.info('MongoDB connected successfully to primary database');
  } catch (err: any) {
    logger.warn(`Primary MongoDB connection failed: ${err.message}`);
    
    if (env.NODE_ENV !== 'production') {
      logger.info('Development mode detected: Initializing in-memory MongoDB fallback...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        const memoryUri = mongod.getUri();
        logger.info(`In-memory MongoDB started at: ${memoryUri}`);
        await mongoose.connect(memoryUri);
        logger.info('Connected to In-memory MongoDB for zero-configuration local development');
      } catch (memErr: any) {
        logger.error(`Failed to start in-memory MongoDB fallback: ${memErr.message}`);
        throw err;
      }
    } else {
      logger.error('Production MongoDB connection failed. Terminating process.');
      throw err;
    }
  }

  mongoose.connection.on('error', (err) => {
    logger.error(`MongoDB connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
};
