import mongoose, { Schema, Document } from 'mongoose';
import { VerificationStatus, VerificationMethod } from '../types';

export interface IWebsiteDocument extends Document {
  userId: mongoose.Types.ObjectId;
  url: string;
  domain: string;
  verificationToken: string;
  verificationStatus: VerificationStatus;
  verificationMethod: VerificationMethod;
  verifiedAt?: Date;
  lastScannedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WebsiteSchema = new Schema<IWebsiteDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Website URL is required'],
      trim: true,
    },
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    verificationToken: {
      type: String,
      required: true,
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'FAILED', 'SELF_ATTESTED'],
      default: 'PENDING',
      index: true,
    },
    verificationMethod: {
      type: String,
      enum: ['DNS_TXT', 'HTTP_FILE', 'SELF_ATTESTED'],
      default: 'DNS_TXT',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    lastScannedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness per user per domain
WebsiteSchema.index({ userId: 1, domain: 1 });

export const Website = mongoose.model<IWebsiteDocument>('Website', WebsiteSchema);
