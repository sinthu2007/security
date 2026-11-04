import { Request, Response } from 'express';
import fs from 'fs';
import { Report } from '../models/Report';
import { Scan } from '../models/Scan';
import { PdfGenerator } from '../services/pdfGenerator';
import { sendSuccess, sendError } from '../utils/responseFormatter';

export class ReportController {
  public static async generateReport(req: Request, res: Response): Promise<void> {
    try {
      const { scanId } = req.params;
      const userId = req.user?._id;
      const isAdmin = req.user?.role === 'ADMIN';

      const scan = await Scan.findById(scanId);
      if (!scan) {
        sendError(res, 'Scan not found', 404);
        return;
      }

      if (!isAdmin && scan.userId.toString() !== userId?.toString()) {
        sendError(res, 'Unauthorized access to scan report', 403);
        return;
      }

      if (scan.scanStatus !== 'COMPLETED') {
        sendError(res, 'PDF reports can only be generated for completed scans', 400);
        return;
      }

      const filePath = await PdfGenerator.generate(scan);
      const report = await Report.findOne({ scanId: scan._id });

      sendSuccess(res, report, 'Security PDF report generated successfully', 201);
    } catch (err: any) {
      sendError(res, `Report generation failed: ${err.message}`, 500);
    }
  }

  public static async getUserReports(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const reports = await Report.find({ userId }).populate('scanId', 'targetUrl domain securityGrade riskScore completedAt').sort({ generatedAt: -1 });

      sendSuccess(res, reports);
    } catch (err: any) {
      sendError(res, `Failed to retrieve reports: ${err.message}`, 500);
    }
  }

  public static async downloadReport(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;
      const isAdmin = req.user?.role === 'ADMIN';

      // Find by report id or scanId
      let report = await Report.findById(id);
      if (!report) {
        report = await Report.findOne({ scanId: id });
      }

      if (!report) {
        // Try generating if scan exists and is completed
        const scan = await Scan.findById(id);
        if (scan && scan.scanStatus === 'COMPLETED' && (isAdmin || scan.userId.toString() === userId?.toString())) {
          await PdfGenerator.generate(scan);
          report = await Report.findOne({ scanId: scan._id });
        }
      }

      if (!report) {
        sendError(res, 'Report not found or not yet generated.', 404);
        return;
      }

      if (!isAdmin && report.userId.toString() !== userId?.toString()) {
        sendError(res, 'Unauthorized to download this report', 403);
        return;
      }

      if (!fs.existsSync(report.filePath)) {
        // Re-generate if file missing on disk
        const scan = await Scan.findById(report.scanId);
        if (scan) {
          await PdfGenerator.generate(scan);
        } else {
          sendError(res, 'Report file missing and source scan unavailable', 404);
          return;
        }
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${report.reportTitle.replace(/[^a-zA-Z0-9-_\.]/g, '_')}.pdf"`);
      
      const fileStream = fs.createReadStream(report.filePath);
      fileStream.pipe(res);
    } catch (err: any) {
      sendError(res, `Failed to download report: ${err.message}`, 500);
    }
  }
}
