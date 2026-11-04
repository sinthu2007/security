export type UserRole = 'USER' | 'ADMIN';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'SELF_ATTESTED';

export type VerificationMethod = 'DNS_TXT' | 'HTTP_FILE' | 'SELF_ATTESTED';

export type ScanStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';

export type SecurityGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export type ScanStage = 
  | 'INITIALIZATION'
  | 'SSRF_AND_DNS_CHECK'
  | 'SSL_TLS_ANALYSIS'
  | 'HTTP_SECURITY_HEADERS'
  | 'COOKIE_SECURITY_AUDIT'
  | 'METADATA_AUDIT'
  | 'RISK_SCORING_AND_AI_ASSESSMENT'
  | 'COMPLETED';

export interface ISecurityFinding {
  id: string;
  name: string;
  category: 'SSL_TLS' | 'SECURITY_HEADERS' | 'COOKIE_SECURITY' | 'DNS_SECURITY' | 'INFORMATION_DISCLOSURE' | 'CONFIGURATION';
  severity: SeverityLevel;
  evidence: string;
  observedValue: string;
  expectedValue: string;
  description: string;
  recommendation: string;
  remediationSnippet?: string;
  references: string[];
  status: 'CONFIRMED' | 'POTENTIAL_WEAKNESS' | 'INFORMATIONAL' | 'INCONCLUSIVE';
}

export interface IScanSummary {
  totalFindings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
}

export interface IAiSecurityAnalysis {
  executiveSummary: string;
  postureAssessment: string;
  topPriorityActions: string[];
  complianceNotes: string;
}

export interface IScan {
  _id: string;
  userId: string;
  websiteId?: string;
  targetUrl: string;
  domain: string;
  resolvedIp?: string;
  scanStatus: ScanStatus;
  currentStage: ScanStage;
  progressPercentage: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
}

export interface IWebsite {
  _id: string;
  userId: string;
  url: string;
  domain: string;
  verificationToken: string;
  verificationStatus: VerificationStatus;
  verificationMethod: VerificationMethod;
  verifiedAt?: string;
  lastScannedAt?: string;
  scanCount?: number;
  latestScan?: {
    securityGrade: SecurityGrade;
    riskScore: number;
    scanStatus: ScanStatus;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IReport {
  _id: string;
  userId: string;
  scanId: string | IScan;
  reportTitle: string;
  filePath: string;
  fileSize: number;
  generatedAt: string;
}

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'SCAN_COMPLETE' | 'SCAN_FAILED' | 'WEBSITE_VERIFIED' | 'SECURITY_ALERT' | 'SYSTEM';
  readStatus: boolean;
  relatedScanId?: string;
  createdAt: string;
}

export interface IDashboardStats {
  totalScans: number;
  completedScans: number;
  failedScans: number;
  monitoredTargetsCount: number;
  secureWebsites: number;
  totalVulnerabilitiesFound: number;
  criticalTotal: number;
  highTotal: number;
  mediumTotal: number;
  lowTotal: number;
  informationalTotal: number;
  averageScore: number;
  gradeCounts: Record<SecurityGrade, number>;
  recentScans: Array<{
    id: string;
    targetUrl: string;
    domain: string;
    scanStatus: ScanStatus;
    riskScore: number;
    securityGrade: SecurityGrade;
    startedAt: string;
    durationSeconds?: number;
    summary: IScanSummary;
  }>;
  activityChart: Array<{
    date: string;
    scans: number;
  }>;
  vulnerabilityDistribution: Array<{
    name: string;
    count: number;
    color: string;
  }>;
}
