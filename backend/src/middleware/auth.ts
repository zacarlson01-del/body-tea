import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/auth';

export interface AuthRequest extends Request {
  user?: TokenPayload;
  userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    req.userId = decoded.userId;
    next();
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Invalid token' });
  }
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      req.userId = decoded.userId;
    } catch (error) {
      // Token is invalid, but we don't fail - user is just not authenticated
      console.warn('Optional auth token verification failed');
    }
  }

  next();
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', err);

  if (err.message.includes('token')) {
    return res.status(401).json({ error: 'Authentication failed' });
  }

  if (err.message.includes('File')) {
    return res.status(400).json({ error: err.message });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}

export function validationErrorHandler(errors: any[]) {
  if (errors.length === 0) return null;
  return errors
    .map(e => `${e.param}: ${e.msg}`)
    .join('; ');
}
