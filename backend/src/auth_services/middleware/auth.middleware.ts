import { NextFunction, Request, Response } from 'express';
import { supabaseAuth } from '../config/supabase.client';
import { AppError } from '../../errors/app-error';

export interface AuthenticatedUser {
  id: string;
  email: string;
  businessId: number;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authorization = req.headers.authorization;
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);

  if (!match) {
    next(new AppError(401, 'UNAUTHORIZED', 'A valid bearer token is required'));
    return;
  }

  try {
    const { data, error } = await supabaseAuth.auth.getUser(match[1]);
    if (error || !data.user?.email) {
      next(new AppError(401, 'UNAUTHORIZED', 'Your session is invalid or expired'));
      return;
    }

    const businessIdValue: unknown = data.user.app_metadata.business_id;
    const businessId =
      typeof businessIdValue === 'number'
        ? businessIdValue
        : typeof businessIdValue === 'string'
          ? Number(businessIdValue)
          : NaN;

    if (!Number.isSafeInteger(businessId) || businessId <= 0) {
      next(new AppError(403, 'BUSINESS_NOT_ASSIGNED', 'Your account is not assigned to a business'));
      return;
    }

    const roleValue: unknown = data.user.app_metadata.role;
    req.user = {
      id: data.user.id,
      email: data.user.email,
      businessId,
      role: typeof roleValue === 'string' ? roleValue : 'staff',
    };
    next();
  } catch {
    next(new AppError(503, 'AUTH_PROVIDER_UNAVAILABLE', 'Authentication service is temporarily unavailable'));
  }
};
