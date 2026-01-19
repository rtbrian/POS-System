import bcrypt from 'bcryptjs';

export class PasswordService {
  // Turn plain password into hash
  static async toHash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Check if password matches hash (We will use this for Login later)
  static async compare(plainPassword: string, storedHash: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, storedHash);
  }
}