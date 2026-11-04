import { Request, Response } from 'express';
import { URL } from 'url';
import { Scan } from '../models/Scan';
import { Website } from '../models/Website';
import { enqueueScan } from '../jobs/scanQueue';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { ISecurityFinding } from '../types';

export class ScanController {
  public static async startScan(req: Request, res: Response): Promise<void> {
    try {
      const { url, websiteId, authorizationConfirmed } = req.body;
      const userId = req.user?._id;

      if (!authorizationConfirmed) {
        sendError(res, 'You must explicitly confirm that you own or are authorized to assess this target.', 400);
        return;
      }

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        sendError(res, 'Invalid URL format.', 400);
        return;
      }

      const domain = parsedUrl.hostname.toLowerCase();
      const normalizedUrl = `${parsedUrl.protocol}//${domain}${parsedUrl.port ? `:${parsedUrl.port}` : ''}${parsedUrl.pathname === '/' ? '' : parsedUrl.pathname}`;

      // Check if user has an associated registered website
      let targetWebsiteId = websiteId;
      if (!targetWebsiteId) {
        const foundWebsite = await Website.findOne({ userId, domain });
        if (foundWebsite) {
          targetWebsiteId = foundWebsite._id;
        }
      }

      // Create scan record in PENDING state
      const scan = await Scan.create({
        userId,
        websiteId: targetWebsiteId || null,
        targetUrl: normalizedUrl,
        domain,
        scanStatus: 'PENDING',
        currentStage: 'INITIALIZATION',
        progressPercentage: 5,
        startedAt: new Date(),
        riskScore: 100,
        securityGrade: 'A+',
        summary: {
          totalFindings: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          informational: 0,
        },
        findings: [],
      });

      // Enqueue scan to background job processing queue
      await enqueueScan(scan._id.toString());

      sendSuccess(
        res,
        {
          scanId: scan._id,
          targetUrl: scan.targetUrl,
          domain: scan.domain,
          scanStatus: scan.scanStatus,
          currentStage: scan.currentStage,
          progressPercentage: scan.progressPercentage,
        },
        'Security assessment initialized and enqueued successfully.',
        202
      );
    } catch (err: any) {
      sendError(res, `Failed to initialize scan: ${err.message}`, 500);
    }
  }

  public static async getUserScans(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const { q, status, grade, limit = 50, page = 1 } = req.query;

      const filter: any = { userId };

      if (q) {
        filter.$or = [
          { domain: { $regex: q as string, $options: 'i' } },
          { targetUrl: { $regex: q as string, $options: 'i' } },
        ];
      }

      if (status) {
        filter.scanStatus = status;
      }

      if (grade) {
        filter.securityGrade = grade;
      }

      const skip = (Number(page) - 1) * Number(limit);
      const total = await Scan.countDocuments(filter);

      const scans = await Scan.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-findings');

      sendSuccess(res, {
        scans,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit),
        },
      });
    } catch (err: any) {
      sendError(res, `Failed to retrieve scans: ${err.message}`, 500);
    }
  }

  public static async getScanById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;
      const isAdmin = req.user?.role === 'ADMIN';

      const scan = await Scan.findById(id);
      if (!scan) {
        sendError(res, 'Scan not found', 404);
        return;
      }

      // Check user isolation
      if (!isAdmin && scan.userId.toString() !== userId?.toString()) {
        sendError(res, 'Unauthorized access to scan report', 403);
        return;
      }

      sendSuccess(res, scan);
    } catch (err: any) {
      sendError(res, `Failed to retrieve scan: ${err.message}`, 500);
    }
  }

  public static async getScanStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;
      const isAdmin = req.user?.role === 'ADMIN';

      const scan = await Scan.findById(id).select(
        'userId scanStatus currentStage progressPercentage errorMessage riskScore securityGrade completedAt durationSeconds'
      );

      if (!scan) {
        sendError(res, 'Scan not found', 404);
        return;
      }

      if (!isAdmin && scan.userId.toString() !== userId?.toString()) {
        sendError(res, 'Unauthorized access', 403);
        return;
      }

      sendSuccess(res, {
        scanId: scan._id,
        scanStatus: scan.scanStatus,
        currentStage: scan.currentStage,
        progressPercentage: scan.progressPercentage,
        errorMessage: scan.errorMessage,
        riskScore: scan.riskScore,
        securityGrade: scan.securityGrade,
        completedAt: scan.completedAt,
        durationSeconds: scan.durationSeconds,
      });
    } catch (err: any) {
      sendError(res, `Failed to retrieve scan status: ${err.message}`, 500);
    }
  }

  public static async getScanFindings(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { severity, category, q } = req.query;
      const userId = req.user?._id;
      const isAdmin = req.user?.role === 'ADMIN';

      const scan = await Scan.findById(id);
      if (!scan) {
        sendError(res, 'Scan not found', 404);
        return;
      }

      if (!isAdmin && scan.userId.toString() !== userId?.toString()) {
        sendError(res, 'Unauthorized access', 403);
        return;
      }

      let findings = scan.findings;

      if (severity) {
        findings = findings.filter(f => f.severity === severity);
      }

      if (category) {
        findings = findings.filter(f => f.category === category);
      }

      if (q) {
        const query = (q as string).toLowerCase();
        findings = findings.filter(
          f => f.name.toLowerCase().includes(query) ||
               f.description.toLowerCase().includes(query) ||
               f.recommendation.toLowerCase().includes(query)
        );
      }

      sendSuccess(res, {
        total: findings.length,
        findings,
      });
    } catch (err: any) {
      sendError(res, `Failed to retrieve findings: ${err.message}`, 500);
    }
  }

  public static async deleteScan(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;
      const isAdmin = req.user?.role === 'ADMIN';

      const scan = await Scan.findById(id);
      if (!scan) {
        sendError(res, 'Scan not found', 404);
        return;
      }

      if (!isAdmin && scan.userId.toString() !== userId?.toString()) {
        sendError(res, 'Unauthorized to delete this scan', 403);
        return;
      }

      await Scan.findByIdAndDelete(id);
      sendSuccess(res, null, 'Scan record deleted successfully');
    } catch (err: any) {
      sendError(res, `Failed to delete scan: ${err.message}`, 500);
    }
  }

  public static async compareScans(req: Request, res: Response): Promise<void> {
    try {
      const { scanId1, scanId2 } = req.body;
      const userId = req.user?._id;
      const isAdmin = req.user?.role === 'ADMIN';

      const [scan1, scan2] = await Promise.all([
        Scan.findById(scanId1),
        Scan.findById(scanId2),
      ]);

      if (!scan1 || !scan2) {
        sendError(res, 'One or both scan records not found', 404);
        return;
      }

      if (!isAdmin && (scan1.userId.toString() !== userId?.toString() || scan2.userId.toString() !== userId?.toString())) {
        sendError(res, 'Unauthorized access to scan comparison', 403);
        return;
      }

      const scoreDelta = scan2.riskScore - scan1.riskScore;

      // Map findings by ID
      const scan1Ids = new Set(scan1.findings.map(f => f.id));
      const scan2Ids = new Set(scan2.findings.map(f => f.id));

      const newFindings = scan2.findings.filter(f => !scan1Ids.has(f.id));
      const resolvedFindings = scan1.findings.filter(f => !scan2Ids.has(f.id));
      const persistentFindings = scan2.findings.filter(f => scan1Ids.has(f.id));

      sendSuccess(res, {
        baseScan: {
          id: scan1._id,
          targetUrl: scan1.targetUrl,
          date: scan1.startedAt,
          score: scan1.riskScore,
          grade: scan1.securityGrade,
          summary: scan1.summary,
        },
        comparisonScan: {
          id: scan2._id,
          targetUrl: scan2.targetUrl,
          date: scan2.startedAt,
          score: scan2.riskScore,
          grade: scan2.securityGrade,
          summary: scan2.summary,
        },
        scoreDelta,
        status: scoreDelta > 0 ? 'IMPROVED' : scoreDelta < 0 ? 'REGRESSED' : 'UNCHANGED',
        newFindings,
        resolvedFindings,
        persistentFindings,
      });
    } catch (err: any) {
      sendError(res, `Comparison failed: ${err.message}`, 500);
    }
  }

  public static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;

      // Retrieve all user scans
      const allUserScans = await Scan.find({ userId }).sort({ createdAt: -1 });

      const totalScans = allUserScans.length;
      const completedScans = allUserScans.filter(s => s.scanStatus === 'COMPLETED').length;
      const failedScans = allUserScans.filter(s => s.scanStatus === 'FAILED').length;

      // Calculate distinct domains and secure websites
      const domainLatestScanMap = new Map<string, any>();
      for (const scan of allUserScans) {
        if (!domainLatestScanMap.has(scan.domain)) {
          domainLatestScanMap.set(scan.domain, scan);
        }
      }

      let secureWebsites = 0;
      let totalVulnerabilitiesFound = 0;
      let criticalTotal = 0;
      let highTotal = 0;
      let mediumTotal = 0;
      let lowTotal = 0;
      let informationalTotal = 0;
      let totalScoreSum = 0;
      let scoredScansCount = 0;

      domainLatestScanMap.forEach((latestScan) => {
        if (latestScan.scanStatus === 'COMPLETED') {
          if (latestScan.securityGrade === 'A+' || latestScan.securityGrade === 'A') {
            secureWebsites++;
          }
          criticalTotal += latestScan.summary?.critical || 0;
          highTotal += latestScan.summary?.high || 0;
          mediumTotal += latestScan.summary?.medium || 0;
          lowTotal += latestScan.summary?.low || 0;
          informationalTotal += latestScan.summary?.informational || 0;
          totalVulnerabilitiesFound +=
            (latestScan.summary?.critical || 0) +
            (latestScan.summary?.high || 0) +
            (latestScan.summary?.medium || 0) +
            (latestScan.summary?.low || 0);

          totalScoreSum += latestScan.riskScore;
          scoredScansCount++;
        }
      });

      const averageScore = scoredScansCount > 0 ? Math.round(totalScoreSum / scoredScansCount) : 100;

      // Grade distribution
      const gradeCounts = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
      domainLatestScanMap.forEach((scan) => {
        if (scan.scanStatus === 'COMPLETED' && gradeCounts[scan.securityGrade as keyof typeof gradeCounts] !== undefined) {
          gradeCounts[scan.securityGrade as keyof typeof gradeCounts]++;
        }
      });

      // Recent 5 scans
      const recentScans = allUserScans.slice(0, 5).map(s => ({
        id: s._id,
        targetUrl: s.targetUrl,
        domain: s.domain,
        scanStatus: s.scanStatus,
        riskScore: s.riskScore,
        securityGrade: s.securityGrade,
        startedAt: s.startedAt,
        durationSeconds: s.durationSeconds,
        summary: s.summary,
      }));

      // Scan activity for the last 7 days
      const activityDays: Record<string, number> = {};
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayKey = d.toISOString().split('T')[0];
        activityDays[dayKey] = 0;
      }

      allUserScans.forEach((scan) => {
        const scanDay = new Date(scan.startedAt).toISOString().split('T')[0];
        if (activityDays[scanDay] !== undefined) {
          activityDays[scanDay]++;
        }
      });

      const activityChart = Object.keys(activityDays).map(date => ({
        date,
        scans: activityDays[date],
      }));

      // Vulnerability chart
      const vulnerabilityDistribution = [
        { name: 'Critical', count: criticalTotal, color: '#F43F5E' },
        { name: 'High', count: highTotal, color: '#FB7185' },
        { name: 'Medium', count: mediumTotal, color: '#F59E0B' },
        { name: 'Low', count: lowTotal, color: '#38BDF8' },
        { name: 'Informational', count: informationalTotal, color: '#94A3B8' },
      ];

      sendSuccess(res, {
        totalScans,
        completedScans,
        failedScans,
        monitoredTargetsCount: domainLatestScanMap.size,
        secureWebsites,
        totalVulnerabilitiesFound,
        criticalTotal,
        highTotal,
        mediumTotal,
        lowTotal,
        informationalTotal,
        averageScore,
        gradeCounts,
        recentScans,
        activityChart,
        vulnerabilityDistribution,
      });
    } catch (err: any) {
      sendError(res, `Failed to retrieve dashboard stats: ${err.message}`, 500);
    }
  }
}
