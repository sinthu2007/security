import { Request, Response } from 'express';
import { URL } from 'url';
import { Website } from '../models/Website';
import { Scan } from '../models/Scan';
import { Notification } from '../models/Notification';
import { DomainVerifier } from '../services/scanner/domainVerifier';
import { sendSuccess, sendError } from '../utils/responseFormatter';

export class WebsiteController {
  public static async registerWebsite(req: Request, res: Response): Promise<void> {
    try {
      const { url } = req.body;
      const userId = req.user?._id;

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);
      } catch {
        sendError(res, 'Invalid URL format.', 400);
        return;
      }

      const domain = parsedUrl.hostname.toLowerCase();
      const normalizedUrl = `${parsedUrl.protocol}//${domain}${parsedUrl.port ? `:${parsedUrl.port}` : ''}`;

      // Check if domain already exists for this user
      const existing = await Website.findOne({ userId, domain });
      if (existing) {
        sendError(res, `Domain '${domain}' is already registered in your account.`, 400);
        return;
      }

      const verificationToken = DomainVerifier.generateVerificationToken();

      const website = await Website.create({
        userId,
        url: normalizedUrl,
        domain,
        verificationToken,
        verificationStatus: 'PENDING',
        verificationMethod: 'DNS_TXT',
      });

      sendSuccess(res, website, 'Website registered successfully. Please proceed with authorization verification.', 201);
    } catch (err: any) {
      sendError(res, `Failed to register website: ${err.message}`, 500);
    }
  }

  public static async getWebsites(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const websites = await Website.find({ userId }).sort({ createdAt: -1 });

      // Enrich with scan counts
      const enriched = await Promise.all(
        websites.map(async (web) => {
          const scanCount = await Scan.countDocuments({ websiteId: web._id });
          const latestScan = await Scan.findOne({ websiteId: web._id }).sort({ createdAt: -1 }).select('securityGrade riskScore scanStatus createdAt');
          return {
            ...web.toObject(),
            scanCount,
            latestScan,
          };
        })
      );

      sendSuccess(res, enriched);
    } catch (err: any) {
      sendError(res, `Failed to retrieve websites: ${err.message}`, 500);
    }
  }

  public static async verifyWebsite(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { method, confirmationStatement } = req.body;
      const userId = req.user?._id;

      const website = await Website.findOne({ _id: id, userId });
      if (!website) {
        sendError(res, 'Website not found or unauthorized.', 404);
        return;
      }

      let isVerified = false;
      let verificationMessage = '';

      if (method === 'DNS_TXT') {
        const result = await DomainVerifier.verifyByDnsTxt(website.domain, website.verificationToken);
        isVerified = result.verified;
        verificationMessage = result.message;
      } else if (method === 'HTTP_FILE') {
        const result = await DomainVerifier.verifyByHttpFile(website.domain, website.verificationToken);
        isVerified = result.verified;
        verificationMessage = result.message;
      } else if (method === 'SELF_ATTESTED') {
        if (!confirmationStatement) {
          sendError(res, 'You must provide explicit confirmation statement acknowledging your authorization.', 400);
          return;
        }
        isVerified = true;
        verificationMessage = 'User ownership and assessment authorization electronically confirmed.';
      }

      if (isVerified) {
        website.verificationStatus = method === 'SELF_ATTESTED' ? 'SELF_ATTESTED' : 'VERIFIED';
        website.verificationMethod = method;
        website.verifiedAt = new Date();
        await website.save();

        await Notification.create({
          userId,
          title: 'Domain Ownership Verified',
          message: `Target domain ${website.domain} has been verified successfully via ${method}.`,
          type: 'WEBSITE_VERIFIED',
        });

        sendSuccess(res, website, verificationMessage);
      } else {
        website.verificationStatus = 'FAILED';
        await website.save();
        sendError(res, verificationMessage, 400);
      }
    } catch (err: any) {
      sendError(res, `Verification process failed: ${err.message}`, 500);
    }
  }

  public static async deleteWebsite(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const website = await Website.findOneAndDelete({ _id: id, userId });
      if (!website) {
        sendError(res, 'Website not found or unauthorized', 404);
        return;
      }

      sendSuccess(res, null, 'Website removed from your monitored targets');
    } catch (err: any) {
      sendError(res, `Failed to delete website: ${err.message}`, 500);
    }
  }
}
