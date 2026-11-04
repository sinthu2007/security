import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

export const initRedis = async (): Promise<boolean> => {
  if (!env.REDIS_URL && env.NODE_ENV === 'development') {
    logger.info('No REDIS_URL configured. Using robust asynchronous in-memory scan processing queue.');
    isRedisAvailable = false;
    return false;
  }

  try {
    const redisUrl = env.REDIS_URL || 'redis://127.0.0.1:6379';
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 3000,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.warn('Redis reconnection limit reached. Falling back to in-memory processing.');
          return null; // Stop retrying
        }
        return Math.min(times * 500, 2000);
      },
    });

    await new Promise<void>((resolve, reject) => {
      redisClient!.once('ready', () => {
        logger.info('Connected to Redis server for BullMQ distributed job processing');
        isRedisAvailable = true;
        resolve();
      });
      redisClient!.once('error', (err) => {
        logger.warn(`Redis connection check failed: ${err.message}. Scan engine will use in-memory queue.`);
        isRedisAvailable = false;
        resolve(); // Don't throw, gracefully fallback
      });
    });

    return isRedisAvailable;
  } catch (err: any) {
    logger.warn(`Redis initialization failed: ${err.message}. Using in-memory scan queue.`);
    isRedisAvailable = false;
    return false;
  }
};

export const getRedisClient = (): Redis | null => redisClient;
export const checkIsRedisAvailable = (): boolean => isRedisAvailable;
