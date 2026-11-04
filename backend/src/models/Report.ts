import mongoose, { Schema, Document } from 'mongoose';

export interface IReportDocument extends Document {
  userId: mongoose.Types.ObjectId;
  scanId: mongoose.Types.ObjectId;
  reportTitle: string;
  filePath: string;
  fileSize: number;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReportDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    scanId: {
      type: Schema.Types.ObjectId,
      ref: 'Scan',
      required: true,
      index: true,
    },
    reportTitle: {
      type: String,
      required: true,
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const Report = mongoose.model<IReportDocument>('Report', ReportSchema);
