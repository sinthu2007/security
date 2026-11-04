import { Request, Response } from 'express';
import { User } from '../models/User';
import { Scan } from '../models/Scan';
import { Website } from '../models/Website';
import { getQueueStats } from '../jobs/scanQueue';
import { sendSuccess, sendError } from '../utils/responseFormatter';

export class AdminController {
  public static async getAdminDashboard(req: Request, res: Response): Promise<void> {
    try {
      const [
        totalUsers,
        activeUsers,
        totalScans,
        completedScans,
        failedScans,
        totalWebsites,
        queueStats,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        Scan.countDocuments(),
        Scan.countDocuments({ scanStatus: 'COMPLETED' }),
        Scan.countDocuments({ scanStatus: 'FAILED' }),
        Website.countDocuments(),
        getQueueStats(),
      ]);

      // Calculate aggregate vulnerability statistics
      const completedScansList = await Scan.find({ scanStatus: 'COMPLETED' }).select('summary securityGrade riskScore');
      let criticalTotal = 0;
      let highTotal = 0;
      let mediumTotal = 0;
      let lowTotal = 0;
      let informationalTotal = 0;

      for (const s of completedScansList) {
        criticalTotal += s.summary?.critical || 0;
        highTotal += s.summary?.high || 0;
        mediumTotal += s.summary?.medium || 0;
        lowTotal += s.summary?.low || 0;
        informationalTotal += s.summary?.informational || 0;
      }

      // Recent 10 scans across system
      const recentScans = await Scan.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .select('targetUrl domain scanStatus securityGrade riskScore startedAt durationSeconds');

      sendSuccess(res, {
        metrics: {
          totalUsers,
          activeUsers,
          totalScans,
          completedScans,
          failedScans,
          totalWebsites,
        },
        queue: queueStats,
        vulnerabilities: {
          criticalTotal,
          highTotal,
          mediumTotal,
          lowTotal,
          informationalTotal,
          totalVulnerabilities: criticalTotal + highTotal + mediumTotal + lowTotal,
        },
        recentScans,
      });
    } catch (err: any) {
      sendError(res, `Failed to load admin dashboard: ${err.message}`, 500);
    }
  }

  public static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { q, role, status, page = 1, limit = 20 } = req.query;
      const filter: any = {};

      if (q) {
        filter.$or = [
          { name: { $regex: q as string, $options: 'i' } },
          { email: { $regex: q as string, $options: 'i' } },
        ];
      }

      if (role) {
        filter.role = role;
      }

      if (status !== undefined && status !== '') {
        filter.isActive = status === 'true';
      }

      const skip = (Number(page) - 1) * Number(limit);
      const total = await User.countDocuments(filter);
      const users = await User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

      // Enrich users with scan counts
      const enrichedUsers = await Promise.all(
        users.map(async (u) => {
          const scanCount = await Scan.countDocuments({ userId: u._id });
          const websiteCount = await Website.countDocuments({ userId: u._id });
          return {
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            isActive: u.isActive,
            scanCount,
            websiteCount,
            createdAt: u.createdAt,
          };
        })
      );

      sendSuccess(res, {
        users: enrichedUsers,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit),
        },
      });
    } catch (err: any) {
      sendError(res, `Failed to retrieve users: ${err.message}`, 500);
    }
  }

  public static async toggleUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const currentAdminId = req.user?._id;

      if (id === currentAdminId?.toString()) {
        sendError(res, 'Administrators cannot deactivate their own account.', 400);
        return;
      }

      const user = await User.findById(id);
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      user.isActive = !user.isActive;
      await user.save();

      sendSuccess(
        res,
        { id: user._id, isActive: user.isActive },
        `User account ${user.isActive ? 'activated' : 'deactivated'} successfully.`
      );
    } catch (err: any) {
      sendError(res, `Failed to update user status: ${err.message}`, 500);
    }
  }

  public static async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const currentAdminId = req.user?._id;

      if (id === currentAdminId?.toString() && role !== 'ADMIN') {
        sendError(res, 'You cannot remove your own administrator status.', 400);
        return;
      }

      if (role !== 'USER' && role !== 'ADMIN') {
        sendError(res, 'Invalid role specified. Must be USER or ADMIN.', 400);
        return;
      }

      const user = await User.findByIdAndUpdate(id, { role }, { new: true });
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      sendSuccess(res, { id: user._id, role: user.role }, `User role updated to ${role}.`);
    } catch (err: any) {
      sendError(res, `Failed to update role: ${err.message}`, 500);
    }
  }

  public static async getSystemScans(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 30 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const total = await Scan.countDocuments();
      const scans = await Scan.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'name email')
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
      sendError(res, `Failed to retrieve system scans: ${err.message}`, 500);
    }
  }
}
