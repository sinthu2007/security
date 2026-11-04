import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback to current working directory .env

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aegisguard_security',
  JWT_SECRET: process.env.JWT_SECRET || 'aegisguard-super-secure-production-jwt-secret-key-998877',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REDIS_URL: process.env.REDIS_URL || '',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@aegisguard.security',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin@Security2025!',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Security Operations Center Admin',
  SCAN_CONCURRENCY: parseInt(process.env.SCAN_CONCURRENCY || '3', 10),
  REQUEST_TIMEOUT_MS: parseInt(process.env.REQUEST_TIMEOUT_MS || '12000', 10),
};
