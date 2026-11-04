import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/tokenUtils';
import { User, IUserDocument } from '../models/User';
import { sendError } from '../utils/responseFormatter';

declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
      tokenPayload?: TokenPayload;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      sendError(res, 'Authentication required. No token provided.', 401);
      return;
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      sendError(res, 'The user associated with this token no longer exists.', 401);
      return;
    }

    if (!user.isActive) {
      sendError(res, 'Account has been deactivated. Please contact support.', 403);
      return;
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      sendError(res, 'Session expired. Please log in again.', 401);
      return;
    }
    sendError(res, 'Invalid authentication token.', 401);
  }
};
