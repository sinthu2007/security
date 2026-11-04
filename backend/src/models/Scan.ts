import mongoose, { Schema, Document } from 'mongoose';
import { 
  ScanStatus, 
  ScanStage, 
  SecurityGrade, 
  ISecurityFinding, 
  IScanSummary, 
  IAiSecurityAnalysis 
} from '../types';

export interface IScanDocument extends Document {
  userId: mongoose.Types.ObjectId;
  websiteId?: mongoose.Types.ObjectId;
  targetUrl: string;
  domain: string;
  resolvedIp?: string;
  scanStatus: ScanStatus;
  currentStage: ScanStage;
  progressPercentage: number;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  durationSeconds?: number;
  riskScore: number;
  securityGrade: SecurityGrade;
  summary: IScanSummary;
  findings: ISecurityFinding[];
  aiAnalysis?: IAiSecurityAnalysis;
  serverInfo?: {
    serverHeader?: string;
    poweredBy?: string;
    httpVersion?: string;
    httpsRedirectSupported?: boolean;
    tlsVersion?: string;
    cipher?: string;
    certificateIssuer?: string;
    certificateValidTo?: string;
    daysUntilCertExpiry?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SecurityFindingSchema = new Schema<ISecurityFinding>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['SSL_TLS', 'SECURITY_HEADERS', 'COOKIE_SECURITY', 'DNS_SECURITY', 'INFORMATION_DISCLOSURE', 'CONFIGURATION'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'],
      required: true,
    },
    evidence: { type: String, default: '' },
    observedValue: { type: String, default: '' },
    expectedValue: { type: String, default: '' },
    description: { type: String, required: true },
    recommendation: { type: String, required: true },
    remediationSnippet: { type: String, default: '' },
    references: [{ type: String }],
    status: {
      type: String,
      enum: ['CONFIRMED', 'POTENTIAL_WEAKNESS', 'INFORMATIONAL', 'INCONCLUSIVE'],
      default: 'CONFIRMED',
    },
  },
  { _id: false }
);

const ScanSchema = new Schema<IScanDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: 'Website',
      default: null,
      index: true,
    },
    targetUrl: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    resolvedIp: {
      type: String,
      default: null,
    },
    scanStatus: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    currentStage: {
      type: String,
      enum: [
        'INITIALIZATION',
        'SSRF_AND_DNS_CHECK',
        'SSL_TLS_ANALYSIS',
        'HTTP_SECURITY_HEADERS',
        'COOKIE_SECURITY_AUDIT',
        'METADATA_AUDIT',
        'RISK_SCORING_AND_AI_ASSESSMENT',
        'COMPLETED',
      ],
      default: 'INITIALIZATION',
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    riskScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    securityGrade: {
      type: String,
      enum: ['A+', 'A', 'B', 'C', 'D', 'F'],
      default: 'A+',
    },
    summary: {
      totalFindings: { type: Number, default: 0 },
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
      informational: { type: Number, default: 0 },
    },
    findings: [SecurityFindingSchema],
    aiAnalysis: {
      executiveSummary: { type: String, default: '' },
      postureAssessment: { type: String, default: '' },
      topPriorityActions: [{ type: String }],
      complianceNotes: { type: String, default: '' },
    },
    serverInfo: {
      serverHeader: { type: String, default: '' },
      poweredBy: { type: String, default: '' },
      httpVersion: { type: String, default: '' },
      httpsRedirectSupported: { type: Boolean, default: false },
      tlsVersion: { type: String, default: '' },
      cipher: { type: String, default: '' },
      certificateIssuer: { type: String, default: '' },
      certificateValidTo: { type: String, default: '' },
      daysUntilCertExpiry: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

ScanSchema.index({ userId: 1, createdAt: -1 });

export const Scan = mongoose.model<IScanDocument>('Scan', ScanSchema);
