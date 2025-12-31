import { query } from 'shared/src/database/postgres.client';
import { PasswordService } from './password.service';
import { User } from '../models/user.model';
import { JwtService } from './jwt.services';

export class AuthService {
  
  static async registerUser(email: string, password: string): Promise<User> {
    // 1. Check if user already exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new Error('User already exists');
    }

    // 2. Hash Password (using our new PasswordService)
    const hashedPassword = await PasswordService.toHash(password);

    // 3. Create User (Defaulting to Role 1, Business 1 for now)
    const result = await query(
      `INSERT INTO users (email, password_hash, role_id, business_id) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [email, hashedPassword, 1, 1]
    );

    return result.rows[0];
  }
  static async loginUser(email: string, password: string) {
    // 1. Find User
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Check Password
    const isMatch = await PasswordService.compare(user.password_hash, password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // 3. Generate Token
    const token = JwtService.generateToken(user);

    return { user, token };
  }
}
