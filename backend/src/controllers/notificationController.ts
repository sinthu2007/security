import { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { sendSuccess, sendError } from '../utils/responseFormatter';

export class NotificationController {
  public static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(30);

      const unreadCount = await Notification.countDocuments({ userId, readStatus: false });

      sendSuccess(res, {
        notifications,
        unreadCount,
      });
    } catch (err: any) {
      sendError(res, `Failed to retrieve notifications: ${err.message}`, 500);
    }
  }

  public static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?._id;

      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId },
        { readStatus: true },
        { new: true }
      );

      if (!notification) {
        sendError(res, 'Notification not found', 404);
        return;
      }

      sendSuccess(res, notification, 'Notification marked as read');
    } catch (err: any) {
      sendError(res, `Failed to update notification: ${err.message}`, 500);
    }
  }

  public static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      await Notification.updateMany({ userId, readStatus: false }, { readStatus: true });

      sendSuccess(res, null, 'All notifications marked as read');
    } catch (err: any) {
      sendError(res, `Failed to mark all as read: ${err.message}`, 500);
    }
  }
}
