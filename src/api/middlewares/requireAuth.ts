import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-fallback-do-not-use-in-prod';

// Extend Express Request type to inject our decoded user data
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // 1. Extract the token from the "Authorization: Bearer <token>" header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token format' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify the signature and expiration
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    
    // 3. Attach the decoded payload to the request object for downstream controllers to use
    req.user = decoded;
    
    // 4. Pass control to the next middleware or controller
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Unauthorized: Token has expired' });
      return;
    }
    res.status(401).json({ error: 'Unauthorized: Invalid token signature' });
    return;
  }
};