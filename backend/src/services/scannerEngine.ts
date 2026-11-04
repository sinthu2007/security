import { Scan, IScanDocument } from '../models/Scan';
import { Website } from '../models/Website';
import { Notification } from '../models/Notification';
import { SsrfValidator } from './scanner/ssrfValidator';
import { SslChecker } from './scanner/sslChecker';
import { HeaderChecker } from './scanner/headerChecker';
import { CookieChecker } from './scanner/cookieChecker';
import { DnsChecker } from './scanner/dnsChecker';
import { ConfigChecker } from './scanner/configChecker';
import { RiskScorer } from './scanner/riskScorer';
import { AiAdvisor } from './scanner/aiAdvisor';
import { PdfGenerator } from './pdfGenerator';
import { ISecurityFinding, ScanStage } from '../types';
import { logger } from '../utils/logger';

export class ScannerEngine {
  /**
   * Executes the full non-invasive security scan workflow
   */
  public static async executeScan(scanId: string): Promise<IScanDocument | null> {
    const scan = await Scan.findById(scanId);
    if (!scan) {
      logger.error(`Scan record not found for id: ${scanId}`);
      return null;
    }

    const startTime = Date.now();
    scan.scanStatus = 'RUNNING';
    scan.startedAt = new Date();
    await scan.save();

    const allFindings: ISecurityFinding[] = [];

    try {
      // ---------------------------------------------------------
      // STAGE 1: INITIALIZATION (10%)
      // ---------------------------------------------------------
      await this.updateStage(scan, 'INITIALIZATION', 10);
      logger.info(`Starting scan ${scanId} for target: ${scan.targetUrl}`);

      // ---------------------------------------------------------
      // STAGE 2: SSRF & DNS VALIDATION (25%)
      // ---------------------------------------------------------
      await this.updateStage(scan, 'SSRF_AND_DNS_CHECK', 25);
      const ssrfResult = await SsrfValidator.validateUrl(scan.targetUrl);

      if (!ssrfResult.isValid) {
        throw new Error(ssrfResult.error || 'Target URL failed safety and SSRF validation check.');
      }

      scan.resolvedIp = ssrfResult.resolvedIp;
      const domain = ssrfResult.hostname || scan.domain;
      const port = ssrfResult.port || 443;

      // ---------------------------------------------------------
      // STAGE 3: SSL/TLS ANALYSIS (45%)
      // ---------------------------------------------------------
      await this.updateStage(scan, 'SSL_TLS_ANALYSIS', 45);
      const sslResult = await SslChecker.analyze(domain, port, 8000);
      allFindings.push(...sslResult.findings);

      // Record serverInfo
      scan.serverInfo = {
        ...scan.serverInfo,
        tlsVersion: sslResult.tlsVersion,
        cipher: sslResult.cipher,
        certificateIssuer: sslResult.issuer,
        certificateValidTo: sslResult.validTo,
        daysUntilCertExpiry: sslResult.daysUntilExpiry,
      };

      // ---------------------------------------------------------
      // STAGE 4: HTTP SECURITY HEADERS & REDIRECTS (65%)
      // ---------------------------------------------------------
      await this.updateStage(scan, 'HTTP_SECURITY_HEADERS', 65);
      const headerResult = await HeaderChecker.analyze(scan.targetUrl, 8000);
      allFindings.push(...headerResult.findings);

      scan.serverInfo = {
        ...scan.serverInfo,
        serverHeader: headerResult.serverHeader,
        poweredBy: headerResult.poweredByHeader,
        httpsRedirectSupported: headerResult.httpsRedirectSupported,
      };

      // ---------------------------------------------------------
      // STAGE 5: COOKIE SECURITY AUDIT (75%)
      // ---------------------------------------------------------
      await this.updateStage(scan, 'COOKIE_SECURITY_AUDIT', 75);
      const isHttps = scan.targetUrl.toLowerCase().startsWith('https://') || headerResult.httpsRedirectSupported;
      const setCookie = headerResult.headers['set-cookie'];
      const cookieResult = CookieChecker.analyze(setCookie, isHttps);
      allFindings.push(...cookieResult.findings);

      // ---------------------------------------------------------
      // STAGE 6: METADATA, ROBOTS.TXT & DNS RECORDS (85%)
      // ---------------------------------------------------------
      await this.updateStage(scan, 'METADATA_AUDIT', 85);
      
      // DNS SPF & DMARC
      const dnsResult = await DnsChecker.analyze(domain);
      allFindings.push(...dnsResult.findings);

      // Metadata & robots.txt
      const configResult = await ConfigChecker.analyze(scan.targetUrl, 6000);
      allFindings.push(...configResult.findings);

      // ---------------------------------------------------------
      // STAGE 7: RISK SCORING & AI ASSESSMENT (95%)
      // ---------------------------------------------------------
      await this.updateStage(scan, 'RISK_SCORING_AND_AI_ASSESSMENT', 95);

      // Remove any potential duplicate findings by id
      const uniqueFindingsMap = new Map<string, ISecurityFinding>();
      for (const f of allFindings) {
        uniqueFindingsMap.set(f.id, f);
      }
      const finalFindings = Array.from(uniqueFindingsMap.values());

      const scoreResult = RiskScorer.calculate(finalFindings);
      const aiAnalysis = AiAdvisor.generateAnalysis(
        scan.targetUrl,
        domain,
        scoreResult.riskScore,
        scoreResult.securityGrade,
        scoreResult.summary,
        finalFindings
      );

      // ---------------------------------------------------------
      // STAGE 8: COMPLETION & PERSISTENCE (100%)
      // ---------------------------------------------------------
      const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

      scan.findings = finalFindings;
      scan.riskScore = scoreResult.riskScore;
      scan.securityGrade = scoreResult.securityGrade;
      scan.summary = scoreResult.summary;
      scan.aiAnalysis = aiAnalysis;
      scan.scanStatus = 'COMPLETED';
      scan.currentStage = 'COMPLETED';
      scan.progressPercentage = 100;
      scan.completedAt = new Date();
      scan.durationSeconds = durationSeconds;

      await scan.save();

      // Update associated website if registered
      if (scan.websiteId) {
        await Website.findByIdAndUpdate(scan.websiteId, {
          lastScannedAt: new Date(),
        });
      }

      // Generate PDF Report file asynchronously
      try {
        await PdfGenerator.generate(scan);
      } catch (pdfErr: any) {
        logger.warn(`PDF generation error for scan ${scanId}: ${pdfErr.message}`);
      }

      // Create notification for user
      await Notification.create({
        userId: scan.userId,
        title: 'Security Scan Completed',
        message: `Assessment for ${domain} completed with grade ${scan.securityGrade} (Score: ${scan.riskScore}/100).`,
        type: 'SCAN_COMPLETE',
        relatedScanId: scan._id,
      });

      logger.info(`Scan ${scanId} completed successfully in ${durationSeconds}s. Grade: ${scan.securityGrade}, Score: ${scan.riskScore}`);
      return scan;
    } catch (err: any) {
      logger.error(`Scan ${scanId} failed: ${err.message}`);
      const durationSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

      scan.scanStatus = 'FAILED';
      scan.errorMessage = err.message || 'An unexpected error occurred during security scanning.';
      scan.completedAt = new Date();
      scan.durationSeconds = durationSeconds;
      await scan.save();

      await Notification.create({
        userId: scan.userId,
        title: 'Security Scan Failed',
        message: `Assessment for ${scan.domain} failed: ${scan.errorMessage}`,
        type: 'SCAN_FAILED',
        relatedScanId: scan._id,
      });

      return scan;
    }
  }

  private static async updateStage(scan: IScanDocument, stage: ScanStage, progress: number): Promise<void> {
    scan.currentStage = stage;
    scan.progressPercentage = progress;
    await scan.save();
  }
}
