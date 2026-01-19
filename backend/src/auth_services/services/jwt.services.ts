import jwt from 'jsonwebtoken';
import { config } from '../config/env.config';
import { User } from '../models/user.model';

export class JwtService {
  static generateToken(user: User): string {
    return jwt.sign(
      { 
        userId: user.id, 
        roleId: user.role_id, 
        businessId: user.business_id 
      },
      config.jwtSecret,
      { expiresIn: '20m' } // Token expires in 20 minutes
    );
  }
}