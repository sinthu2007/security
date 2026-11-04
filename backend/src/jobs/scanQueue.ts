import { Queue, Worker, Job } from 'bullmq';
import { checkIsRedisAvailable, getRedisClient } from '../config/redis';
import { ScannerEngine } from '../services/scannerEngine';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface IScanJobData {
  scanId: string;
}

// In-Memory Queue Fallback implementation
class InMemoryScanQueue {
  private queue: string[] = [];
  private runningCount: number = 0;
  private maxConcurrency: number = env.SCAN_CONCURRENCY;

  public async add(scanId: string): Promise<void> {
    this.queue.push(scanId);
    logger.info(`[InMemoryQueue] Scan ${scanId} enqueued. Queue length: ${this.queue.length}`);
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.runningCount >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const scanId = this.queue.shift();
    if (!scanId) return;

    this.runningCount++;
    logger.info(`[InMemoryQueue] Processing scan ${scanId} (Active workers: ${this.runningCount}/${this.maxConcurrency})`);

    // Process asynchronously without blocking
    (async () => {
      try {
        await ScannerEngine.executeScan(scanId);
      } catch (err: any) {
        logger.error(`[InMemoryQueue] Error processing scan ${scanId}: ${err.message}`);
      } finally {
        this.runningCount--;
        this.processNext();
      }
    })();
  }

  public getStats() {
    return {
      waiting: this.queue.length,
      active: this.runningCount,
      driver: 'in-memory',
    };
  }
}

let bullQueue: Queue<IScanJobData> | null = null;
let bullWorker: Worker<IScanJobData> | null = null;
const inMemoryQueue = new InMemoryScanQueue();

export const initScanQueue = async (): Promise<void> => {
  const isRedis = checkIsRedisAvailable();

  if (isRedis) {
    try {
      const redisUrl = env.REDIS_URL || 'redis://127.0.0.1:6379';
      bullQueue = new Queue<IScanJobData>('security-scans', {
        connection: { url: redisUrl },
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 3000,
          },
          removeOnComplete: 100,
          removeOnFail: 200,
        },
      });

      bullWorker = new Worker<IScanJobData>(
        'security-scans',
        async (job: Job<IScanJobData>) => {
          logger.info(`[BullMQ Worker] Processing job ${job.id} for scanId: ${job.data.scanId}`);
          await ScannerEngine.executeScan(job.data.scanId);
        },
        {
          connection: { url: redisUrl },
          concurrency: env.SCAN_CONCURRENCY,
        }
      );

      bullWorker.on('completed', (job) => {
        logger.info(`[BullMQ Worker] Job ${job.id} completed successfully.`);
      });

      bullWorker.on('failed', (job, err) => {
        logger.error(`[BullMQ Worker] Job ${job?.id} failed with error: ${err.message}`);
      });

      logger.info('BullMQ Distributed Security Scan Queue initialized with Redis.');
    } catch (err: any) {
      logger.warn(`Failed to initialize BullMQ: ${err.message}. Defaulting to in-memory queue.`);
      bullQueue = null;
      bullWorker = null;
    }
  } else {
    logger.info('BullMQ bypassed. In-memory asynchronous scan queue active.');
  }
};

export const enqueueScan = async (scanId: string): Promise<void> => {
  if (bullQueue) {
    await bullQueue.add('execute-scan', { scanId }, { jobId: scanId });
    logger.info(`Scan ${scanId} dispatched to BullMQ distributed queue`);
  } else {
    await inMemoryQueue.add(scanId);
  }
};

export const getQueueStats = async () => {
  if (bullQueue) {
    const [waiting, active, completed, failed] = await Promise.all([
      bullQueue.getWaitingCount(),
      bullQueue.getActiveCount(),
      bullQueue.getCompletedCount(),
      bullQueue.getFailedCount(),
    ]);
    return {
      driver: 'BullMQ / Redis',
      waiting,
      active,
      completed,
      failed,
    };
  }

  const memStats = inMemoryQueue.getStats();
  return {
    driver: 'In-Memory Async Queue',
    waiting: memStats.waiting,
    active: memStats.active,
    completed: 'N/A',
    failed: 'N/A',
  };
};
