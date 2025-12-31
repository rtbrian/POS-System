import { Request, Response, NextFunction } from 'express';

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // 1. Check if fields exist
  if (!email || !password) {
    res.status(400).json({ error: 'Missing email or password' });
    return; // Stop here
  }

  // 2. Simple Email Regex Check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
     res.status(400).json({ error: 'Invalid email format' });
     return; // Stop here
  }

  // 3. Password Strength (Min 6 chars)
  if (password.length < 6) {
     res.status(400).json({ error: 'Password must be at least 6 characters' });
     return; // Stop here
  }

  next(); // If all good, proceed to the controller
};