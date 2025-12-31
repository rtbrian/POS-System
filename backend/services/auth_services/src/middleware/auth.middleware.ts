import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.config';

// Define what a "Logged In Request" looks like
export interface AuthRequest extends Request {
  user?: any;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 1. Get the token from the header (Authorization: Bearer <token>)
  console.log('🔍 Headers Received:', req.headers);
  
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'Access Denied: No Token Provided' });
    return;
  }

  const token = authHeader.split(' ')[1]; // Remove "Bearer "

  try {
    // 2. Verify the token
    const verified = jwt.verify(token, config.jwtSecret);
    req.user = verified; // Attach user info to the request
    next(); // Pass to the next function
  } catch (error) {
    res.status(400).json({ error: 'Invalid Token' });
  }
};