// 👇 FIXED IMPORT: Point to the central DB client
import { query } from '../../postgres.client';
import { PasswordService } from './password.service';
import { JwtService } from './jwt.services';

export class AuthService {
  
  // 1. REGISTER
  static async registerUser(email: string, password: string) {
    // Check if user exists
    const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      throw new Error('User already exists');
    }

    // Hash Password
    const hashedPassword = await PasswordService.toHash(password);

    // Create User
    const result = await query(
      `INSERT INTO users (email, password, role) 
       VALUES ($1, $2, $3) RETURNING *`,
      [email, hashedPassword, 'staff']
    );

    return result.rows[0];
  }

  // 2. LOGIN
  static async loginUser(email: string, password: string) {
    // Find User
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      console.log("❌ Service: User not found in DB:", email);
      throw new Error('Invalid credentials');
    }

    // Check Password
    const isMatch = await PasswordService.compare(password, user.password); 
    
    if (!isMatch) {
      console.log("❌ Service: Password hash did not match.");
      throw new Error('Invalid credentials');
    }

    // Generate Token
    const token = JwtService.generateToken(user);

    return { user, token };
  }
}