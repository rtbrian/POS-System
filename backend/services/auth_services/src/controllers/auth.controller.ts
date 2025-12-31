import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Call the Service (The Logic)
    const user = await AuthService.registerUser(email, password);

    // Send Response (Hide the password hash!)
    res.status(201).json({
      message: 'User registered successfully!',
      user: { id: user.id, email: user.email, created_at: user.created_at }
    });

  } catch (error: any) {
    // Handle specific errors
    if (error.message === 'User already exists') {
      res.status(400).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const { user, token } = await AuthService.loginUser(email, password);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, role_id: user.role_id }
    });

  } catch (error: any) {
    res.status(401).json({ error: 'Invalid email or password' });
  }
};

export const getProfile = (req: AuthRequest, res: Response) => {
  // We can access req.user because the middleware put it there!
  res.json({ 
    message: 'You have accessed a protected route!', 
    user: req.user 
  });
};