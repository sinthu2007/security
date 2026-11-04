import { Request, Response } from 'express';
import crypto from 'crypto';
import { User } from '../models/User';
import { signToken } from '../utils/tokenUtils';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { env } from '../config/env';

const setAuthCookie = (res: Response, token: string) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        sendError(res, 'An account with this email address already exists.', 400);
        return;
      }

      // Check if this is the configured default admin email
      const isDefaultAdmin = email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: isDefaultAdmin ? 'ADMIN' : 'USER',
        isActive: true,
      });

      const token = signToken({
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
      });

      setAuthCookie(res, token);

      sendSuccess(
        res,
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        },
        'Registration successful',
        201
      );
    } catch (err: any) {
      sendError(res, `Registration failed: ${err.message}`, 500);
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) {
        sendError(res, 'Invalid email or password', 401);
        return;
      }

      if (!user.isActive) {
        sendError(res, 'This account has been disabled by an administrator.', 403);
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        sendError(res, 'Invalid email or password', 401);
        return;
      }

      const token = signToken({
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
      });

      setAuthCookie(res, token);

      sendSuccess(
        res,
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token,
        },
        'Login successful'
      );
    } catch (err: any) {
      sendError(res, `Login failed: ${err.message}`, 500);
    }
  }

  public static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('token');
    sendSuccess(res, null, 'Logged out successfully');
  }

  public static async getMe(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    sendSuccess(res, {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
      },
    });
  }

  public static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        // Return generic success to prevent email enumeration
        sendSuccess(res, null, 'If this email is registered, a password reset instruction has been generated.');
        return;
      }

      const resetToken = crypto.randomBytes(24).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity
      await user.save();

      // Return the token in response payload so users can test password reset locally without an SMTP server configured
      sendSuccess(
        res,
        { resetToken },
        'Password reset token generated. Use this token on the reset password screen.'
      );
    } catch (err: any) {
      sendError(res, `Forgot password request failed: ${err.message}`, 500);
    }
  }

  public static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, password } = req.body;
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        sendError(res, 'Invalid or expired password reset token.', 400);
        return;
      }

      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      const newToken = signToken({
        userId: user._id.toString(),
        role: user.role,
        email: user.email,
      });

      setAuthCookie(res, newToken);

      sendSuccess(
        res,
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          token: newToken,
        },
        'Password has been reset successfully.'
      );
    } catch (err: any) {
      sendError(res, `Password reset failed: ${err.message}`, 500);
    }
  }

  public static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.user?._id).select('+password');
      if (!user) {
        sendError(res, 'User not found', 404);
        return;
      }

      const { name, currentPassword, newPassword } = req.body;

      if (name) {
        user.name = name;
      }

      if (newPassword) {
        if (!currentPassword) {
          sendError(res, 'Current password is required to change password.', 400);
          return;
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
          sendError(res, 'Incorrect current password.', 400);
          return;
        }

        user.password = newPassword;
      }

      await user.save();

      sendSuccess(
        res,
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        'Profile updated successfully.'
      );
    } catch (err: any) {
      sendError(res, `Failed to update profile: ${err.message}`, 500);
    }
  }
}
