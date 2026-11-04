import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { IScanDocument } from '../models/Scan';
import { Report } from '../models/Report';
import { logger } from '../utils/logger';

export class PdfGenerator {
  public static async generate(scan: IScanDocument): Promise<string> {
    const reportsDir = path.resolve(__dirname, '../../storage/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `aegis-security-report-${scan._id}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 40,
          info: {
            Title: `AegisGuard Security Assessment - ${scan.domain}`,
            Author: 'AegisGuard AI Security Engine',
            Subject: 'Web Application Security Posture Report',
          },
        });

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // -------------------------------------------------------------
        // HEADER BANNER
        // -------------------------------------------------------------
        doc.rect(40, 40, 515, 65).fill('#0A101F');
        
        doc.fillColor('#00F2FE').fontSize(18).font('Helvetica-Bold')
           .text('AEGISGUARD AI', 55, 52);
        doc.fillColor('#94A3B8').fontSize(9).font('Helvetica')
           .text('ENTERPRISE WEB APPLICATION SECURITY ASSESSMENT PLATFORM', 55, 75);

        doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold')
           .text('CONFIDENTIAL SECURITY REPORT', 320, 52, { align: 'right', width: 220 });
        doc.fillColor('#64748B').fontSize(8).font('Helvetica')
           .text(`Report Ref: #${scan._id.toString().substring(0, 12)}`, 320, 68, { align: 'right', width: 220 });

        doc.moveDown(4);

        // -------------------------------------------------------------
        // EXECUTIVE SUMMARY & METRICS CARD
        // -------------------------------------------------------------
        const startY = 125;
        doc.rect(40, startY, 515, 120).fill('#0E172C');
        doc.rect(40, startY, 515, 120).stroke('#1E293B');

        // Score Badge
        const gradeColor = 
          scan.securityGrade === 'A+' || scan.securityGrade === 'A' ? '#10B981' :
          scan.securityGrade === 'B' ? '#06B6D4' :
          scan.securityGrade === 'C' ? '#F59E0B' : '#F43F5E';

        doc.roundedRect(60, startY + 15, 90, 90, 8).fill('#13203C');
        doc.fillColor(gradeColor).fontSize(34).font('Helvetica-Bold')
           .text(scan.securityGrade, 60, startY + 30, { align: 'center', width: 90 });
        doc.fillColor('#94A3B8').fontSize(10).font('Helvetica')
           .text(`${scan.riskScore} / 100`, 60, startY + 75, { align: 'center', width: 90 });

        // Target Details
        doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('TARGET DOMAIN:', 170, startY + 18);
        doc.fillColor('#FFFFFF').fontSize(12).font('Helvetica-Bold').text(scan.domain, 255, startY + 16);

        doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('ASSESSMENT URL:', 170, startY + 36);
        doc.fillColor('#00F2FE').fontSize(9).font('Helvetica').text(scan.targetUrl.substring(0, 48), 255, startY + 36);

        doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('RESOLVED IP:', 170, startY + 54);
        doc.fillColor('#E2E8F0').fontSize(9).font('Helvetica').text(scan.resolvedIp || 'N/A', 255, startY + 54);

        doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('SCAN DATE:', 170, startY + 72);
        doc.fillColor('#E2E8F0').fontSize(9).font('Helvetica').text(new Date(scan.startedAt).toUTCString(), 255, startY + 72);

        doc.fillColor('#94A3B8').fontSize(9).font('Helvetica').text('DURATION:', 170, startY + 90);
        doc.fillColor('#E2E8F0').fontSize(9).font('Helvetica').text(`${scan.durationSeconds || 1} seconds`, 255, startY + 90);

        // Severity Distribution Bar
        const barY = startY + 135;
        doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold').text('FINDINGS SEVERITY OVERVIEW', 40, barY);

        const badgeWidth = 95;
        const severities = [
          { label: 'CRITICAL', count: scan.summary.critical, color: '#F43F5E' },
          { label: 'HIGH', count: scan.summary.high, color: '#FB7185' },
          { label: 'MEDIUM', count: scan.summary.medium, color: '#F59E0B' },
          { label: 'LOW', count: scan.summary.low, color: '#38BDF8' },
          { label: 'INFORMATIONAL', count: scan.summary.informational, color: '#94A3B8' },
        ];

        severities.forEach((sev, idx) => {
          const bx = 40 + idx * (badgeWidth + 10);
          doc.roundedRect(bx, barY + 18, badgeWidth, 38, 4).fill('#0E172C');
          doc.fillColor(sev.color).fontSize(14).font('Helvetica-Bold')
             .text(String(sev.count), bx, barY + 24, { align: 'center', width: badgeWidth });
          doc.fillColor('#64748B').fontSize(7).font('Helvetica-Bold')
             .text(sev.label, bx, barY + 42, { align: 'center', width: badgeWidth });
        });

        // -------------------------------------------------------------
        // AI EXECUTIVE SUMMARY
        // -------------------------------------------------------------
        const aiY = barY + 70;
        doc.rect(40, aiY, 515, 95).fill('#0A101F');
        doc.rect(40, aiY, 515, 95).stroke('#1E293B');

        doc.fillColor('#00F2FE').fontSize(10).font('Helvetica-Bold')
           .text('AI EXECUTIVE ASSESSMENT & ROADMAP', 52, aiY + 10);

        const summaryText = scan.aiAnalysis?.executiveSummary || 
          `Security evaluation completed with ${scan.findings.length} total observations. Overall posture reflects security grade ${scan.securityGrade}.`;

        doc.fillColor('#CBD5E1').fontSize(8.5).font('Helvetica')
           .text(summaryText, 52, aiY + 28, { width: 490, align: 'justify', lineGap: 3 });

        // -------------------------------------------------------------
        // DETAILED FINDINGS BREAKDOWN
        // -------------------------------------------------------------
        doc.addPage();

        doc.fillColor('#00F2FE').fontSize(14).font('Helvetica-Bold')
           .text('DETAILED SECURITY OBSERVATIONS & FINDINGS', 40, 45);
        doc.fillColor('#64748B').fontSize(8).font('Helvetica')
           .text('Each observation is derived from safe, non-invasive transport, header, and DNS inspection.', 40, 62);

        let currentY = 85;

        scan.findings.forEach((finding, index) => {
          // Check if we need a new page
          if (currentY > 700) {
            doc.addPage();
            currentY = 45;
          }

          const sevColor = 
            finding.severity === 'CRITICAL' ? '#F43F5E' :
            finding.severity === 'HIGH' ? '#FB7185' :
            finding.severity === 'MEDIUM' ? '#F59E0B' :
            finding.severity === 'LOW' ? '#38BDF8' : '#94A3B8';

          // Box container
          doc.rect(40, currentY, 515, 95).fill('#0E172C');
          doc.rect(40, currentY, 515, 95).stroke('#1E293B');

          // Severity Tag
          doc.roundedRect(50, currentY + 10, 65, 16, 3).fill(sevColor);
          doc.fillColor('#FFFFFF').fontSize(7.5).font('Helvetica-Bold')
             .text(finding.severity, 50, currentY + 14, { align: 'center', width: 65 });

          // Title & Category
          doc.fillColor('#FFFFFF').fontSize(9.5).font('Helvetica-Bold')
             .text(`${index + 1}. ${finding.name}`, 125, currentY + 13, { width: 415 });

          // Description
          doc.fillColor('#94A3B8').fontSize(8).font('Helvetica')
             .text(finding.description, 50, currentY + 34, { width: 495, lineGap: 2 });

          // Observed vs Expected
          doc.fillColor('#64748B').fontSize(7.5).font('Helvetica-Bold').text('OBSERVED:', 50, currentY + 58);
          doc.fillColor('#E2E8F0').fontSize(7.5).font('Helvetica').text(finding.observedValue || 'N/A', 110, currentY + 58, { width: 430 });

          // Recommendation
          doc.fillColor('#10B981').fontSize(7.5).font('Helvetica-Bold').text('REMEDY:', 50, currentY + 74);
          doc.fillColor('#A7F3D0').fontSize(7.5).font('Helvetica').text(finding.recommendation, 110, currentY + 74, { width: 430 });

          currentY += 105;
        });

        // -------------------------------------------------------------
        // DISCLAIMER & LIMITATIONS PAGE
        // -------------------------------------------------------------
        if (currentY > 600) {
          doc.addPage();
          currentY = 45;
        } else {
          currentY += 20;
        }

        doc.rect(40, currentY, 515, 90).fill('#060A12');
        doc.rect(40, currentY, 515, 90).stroke('#1E293B');

        doc.fillColor('#F59E0B').fontSize(9).font('Helvetica-Bold')
           .text('ASSESSMENT SCOPE & LEGAL DISCLAIMER', 50, currentY + 10);
        doc.fillColor('#64748B').fontSize(7.5).font('Helvetica')
           .text(
             'AegisGuard conducts purely non-invasive, passive observations targeting standard public transport protocols, DNS records, and response headers. No exploit attempts, intrusion payloads, denial-of-service simulations, or intrusive credential attacks were conducted. A passing grade or high security score confirms adherence to baseline configuration standards but does not guarantee the complete absence of internal code vulnerabilities (e.g. SQLi, business logic flaws). Comprehensive defense requires defense-in-depth, internal code audits, and authorized penetration testing.',
             50, currentY + 25, { width: 495, lineGap: 2 }
           );

        doc.end();

        stream.on('finish', async () => {
          const stats = fs.statSync(filePath);
          
          // Upsert Report record in MongoDB
          await Report.findOneAndUpdate(
            { scanId: scan._id },
            {
              userId: scan.userId,
              scanId: scan._id,
              reportTitle: `Security Assessment Report - ${scan.domain}`,
              filePath,
              fileSize: stats.size,
              generatedAt: new Date(),
            },
            { upsert: true, new: true }
          );

          resolve(filePath);
        });

        stream.on('error', (err) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  }
}
