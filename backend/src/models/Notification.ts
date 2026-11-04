import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: 'SCAN_COMPLETE' | 'SCAN_FAILED' | 'WEBSITE_VERIFIED' | 'SECURITY_ALERT' | 'SYSTEM';
  readStatus: boolean;
  relatedScanId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['SCAN_COMPLETE', 'SCAN_FAILED', 'WEBSITE_VERIFIED', 'SECURITY_ALERT', 'SYSTEM'],
      default: 'SYSTEM',
    },
    readStatus: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedScanId: {
      type: Schema.Types.ObjectId,
      ref: 'Scan',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification = mongoose.model<INotificationDocument>('Notification', NotificationSchema);
